import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { forwardOrderToSupplierBot } from '@/lib/telegram-forwarder';

/**
 * Webhook nhận thông báo biến động số dư từ SePAY / Casso / Ngân hàng tự động
 * 
 * Chuẩn bảo mật:
 * 1. Xác thực Secret Token qua Header hoặc Query Params
 * 2. Chỉ chấp nhận dòng tiền vào (transferType === 'in' hoặc amount > 0)
 * 3. Chống Replay Attack bằng bankTransId duy nhất
 * 4. Giao dịch nguyên tử (Atomic ACID transaction)
 * 5. Tự động chuyển tiếp yêu cầu sang Bot Telegram Sỉ 3rd-Party nếu sản phẩm thuộc dạng TELEGRAM_BOT
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Xác thực Webhook Secret
    const authHeader = req.headers.get('Authorization') || req.headers.get('secure-token') || req.headers.get('x-api-key') || '';
    const urlSecret = req.nextUrl.searchParams.get('secret') || '';
    const token = authHeader.replace(/^Apikey\s+|^Bearer\s+/i, '').trim() || urlSecret;

    const expectedSecret = process.env.PAYMENT_WEBHOOK_SECRET || 'webhook_secret_shopacc247';
    if (expectedSecret && token !== expectedSecret && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, error: 'Unauthorized webhook' }, { status: 401 });
    }

    const payload = await req.json();

    // 2. Chuẩn hóa dữ liệu (Hỗ trợ cả SePAY Object lẫn Casso Array)
    const txData = Array.isArray(payload.data) ? payload.data[0] : payload;
    if (!txData) {
      return NextResponse.json({ success: true, message: 'Payload rỗng' });
    }

    const transferAmount = Number(txData.transferAmount || txData.amount || 0);
    const rawContent = String(txData.content || txData.description || '');
    const referenceCode = String(txData.referenceCode || txData.referenceNumber || txData.tid || txData.id || '');
    const transferType = String(txData.transferType || (transferAmount > 0 ? 'in' : 'out')).toLowerCase();

    // CHỐNG GIAN LẬN: Bắt buộc dòng tiền phải là TIỀN VÀO (INCOMING)
    if (transferType !== 'in' || transferAmount <= 0) {
      return NextResponse.json({ success: true, message: 'Bỏ qua giao dịch chi tiền ra' });
    }

    // 3. Trích xuất mã giao dịch hệ thống
    const orderMatch = rawContent.match(/(?:DH|ORD)[A-Z0-9\-_]+/i);
    const depositMatch = rawContent.match(/(?:NAP|DEP)[A-Z0-9\-_]+/i);

    if (!orderMatch && !depositMatch) {
      return NextResponse.json({ success: true, message: 'Nội dung CK không chứa mã DH hoặc NAP' });
    }

    const targetCode = (orderMatch || depositMatch)![0].toUpperCase();

    // 4. Thực thi giao dịch CSDL nguyên tử
    const result = await prisma.$transaction(async (tx) => {
      // A. Chống Replay Attack
      if (referenceCode) {
        const existingBankTx = await tx.transaction.findFirst({
          where: { bankTransId: referenceCode, status: 'SUCCESS' }
        });
        if (existingBankTx) {
          return { success: true, message: 'Giao dịch ngân hàng đã được xử lý trước đó' };
        }
      }

      // B. Nạp tiền vào Ví người dùng (NAPxxxx)
      if (depositMatch) {
        const trans = await tx.transaction.findUnique({ where: { transCode: targetCode } });
        if (!trans || trans.status === 'SUCCESS') {
          return { success: true, message: 'Giao dịch nạp ví đã xử lý hoặc không tồn tại' };
        }

        const updated = await tx.transaction.updateMany({
          where: { id: trans.id, status: 'PENDING' },
          data: {
            status: 'SUCCESS',
            bankTransId: referenceCode || undefined,
            amountPaid: transferAmount,
            paidAt: new Date()
          }
        });

        if (updated.count === 0) {
          return { success: true, message: 'Giao dịch đã được cập nhật trước' };
        }

        if (trans.userId) {
          await tx.user.update({
            where: { id: trans.userId },
            data: { balance: { increment: transferAmount } }
          });
        }

        return { success: true, message: `Nạp tiền ví thành công +${transferAmount}đ cho mã ${targetCode}` };
      }

      // C. Thanh toán Đơn hàng (DHxxxx)
      const order = await tx.order.findUnique({
        where: { orderCode: targetCode },
        include: { items: { include: { variant: true } } }
      });

      if (!order || order.status === 'COMPLETED') {
        return { success: true, message: 'Đơn hàng đã hoàn tất hoặc không tồn tại' };
      }

      // Kiểm tra trường hợp chuyển thiếu tiền
      if (transferAmount < order.totalAmount) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'PARTIALLY_PAID' }
        });
        await tx.transaction.updateMany({
          where: { transCode: targetCode, status: 'PENDING' },
          data: { status: 'PARTIAL_PAID', amountPaid: transferAmount, bankTransId: referenceCode || undefined }
        });
        return { success: false, message: 'Khách chuyển thiếu tiền, tạm giữ chưa xuất hàng' };
      }

      // Chốt giao dịch thành công nguyên tử
      const updateTransResult = await tx.transaction.updateMany({
        where: { transCode: targetCode, status: 'PENDING' },
        data: {
          status: 'SUCCESS',
          bankTransId: referenceCode || undefined,
          amountPaid: transferAmount,
          paidAt: new Date()
        }
      });

      if (updateTransResult.count === 0) {
        return { success: true, message: 'Đơn hàng đã được xác nhận trước' };
      }

      // Nếu khách chuyển thừa tiền và có tài khoản, hoàn tiền thừa vào ví
      if (transferAmount > order.totalAmount && order.userId) {
        const excess = transferAmount - order.totalAmount;
        await tx.user.update({
          where: { id: order.userId },
          data: { balance: { increment: excess } }
        });
      }

      // PHÂN LUỒNG XUẤT HÀNG
      const firstItem = order.items[0];
      const variant = firstItem?.variant;

      if (!variant) {
        await tx.order.update({ where: { id: order.id }, data: { status: 'PAID' } });
        return { success: true, message: 'Đã nhận tiền, đang đợi cấu hình gói' };
      }

      if (variant.sourceType === 'MANUAL_STOCK') {
        // Xuất trực tiếp từ kho sẵn có
        const stockItem = await tx.stockItem.findFirst({
          where: { variantId: variant.id, isSold: false }
        });

        let deliveredData = '';
        if (stockItem) {
          await tx.stockItem.update({
            where: { id: stockItem.id },
            data: { isSold: true, soldAt: new Date(), orderId: order.id }
          });
          deliveredData = stockItem.data;
        } else {
          deliveredData = 'Tạm hết kho sẵn, CSKH đang cấp bù qua email trong 10 phút.';
        }

        await tx.orderItem.update({
          where: { id: firstItem.id },
          data: { deliveredData }
        });
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'COMPLETED' }
        });

        return {
          success: true,
          type: 'STOCK_DELIVERED',
          orderCode: order.orderCode,
          deliveredData
        };
      } else if (variant.sourceType === 'TELEGRAM_BOT') {
        // Chuyển tiếp đơn sang Bot Telegram Sỉ 3rd-Party
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'PROCESSING_DROPSHIP' }
        });

        return {
          success: true,
          type: 'TELEGRAM_BOT_DROPSHIP',
          orderId: order.id,
          variantId: variant.id,
          orderCode: order.orderCode
        };
      }

      return { success: true, orderCode: order.orderCode };
    });

    // 5. Nếu đơn cần chuyển tiếp sang Bot sỉ, gọi forwarder sau khi DB đã commit
    if (result && 'type' in result && result.type === 'TELEGRAM_BOT_DROPSHIP' && result.orderId && result.variantId) {
      forwardOrderToSupplierBot(result.orderId, result.variantId).catch((err) => {
        console.error('[Payment-Webhook] Lỗi gọi forwardOrderToSupplierBot:', err);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Xử lý webhook thanh toán thành công',
      data: result
    });
  } catch (error: any) {
    console.error('[Payment-Webhook] Ngoại lệ xử lý:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi xử lý webhook' },
      { status: 500 }
    );
  }
}
