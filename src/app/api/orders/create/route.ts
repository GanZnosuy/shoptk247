import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateRandomCode } from '@/lib/utils';
import { generateVietQRUrl } from '@/lib/vietqr';
import { forwardOrderToSupplierBot } from '@/lib/telegram-forwarder';
import { checkRateLimit, getClientIp } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    // 1. Chống spam / Rate limiting tạo đơn hàng
    const ip = getClientIp(req);
    const rate = checkRateLimit(`order_create_${ip}`, 20, 60000);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau 1 phút.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { variantId, quantity = 1, customerEmail, paymentMethod = 'VIETQR', customerNote, userId } = body;

    if (!variantId || !customerEmail) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin gói sản phẩm hoặc email' },
        { status: 400 }
      );
    }

    // 2. Kiểm tra định dạng Email
    const cleanEmail = String(customerEmail).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: 'Địa chỉ email không đúng định dạng' },
        { status: 400 }
      );
    }

    // 3. Chống lỗi số lượng âm / số thực (Integer Overflow / Negative Quantity Attack)
    const parsedQty = Number(quantity);
    if (!Number.isInteger(parsedQty) || parsedQty < 1 || parsedQty > 100) {
      return NextResponse.json(
        { success: false, error: 'Số lượng đặt mua phải là số nguyên từ 1 đến 100' },
        { status: 400 }
      );
    }
    const safeQuantity = parsedQty;

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: true,
      },
    });

    if (!variant || !variant.isActive) {
      return NextResponse.json(
        { success: false, error: 'Gói sản phẩm không tồn tại hoặc đã tạm ngưng bán' },
        { status: 400 }
      );
    }

    const totalAmount = variant.price * safeQuantity;
    const orderCode = generateRandomCode('DH');

    // 4. THANH TOÁN BẰNG SỐ DƯ VÍ
    if (paymentMethod === 'WALLET') {
      let activeUserId = userId;
      if (!activeUserId) {
        const defaultUser = await prisma.user.findUnique({ where: { email: 'customer@demo.com' } });
        activeUserId = defaultUser?.id;
      }

      if (!activeUserId) {
        return NextResponse.json(
          { success: false, error: 'Vui lòng đăng nhập để thanh toán bằng số dư ví' },
          { status: 401 }
        );
      }

      // Xử lý thanh toán và xuất kho trong Prisma transaction với Atomic Update chống Race Condition
      const result = await prisma.$transaction(async (tx) => {
        // Trừ tiền ví với điều kiện số dư >= totalAmount (Chống double-spend khi gọi song song)
        const deductResult = await tx.user.updateMany({
          where: { id: activeUserId, balance: { gte: totalAmount } },
          data: { balance: { decrement: totalAmount } },
        });

        if (deductResult.count === 0) {
          throw new Error('Số dư ví không đủ để thanh toán đơn hàng này');
        }

        // Tạo Order
        const order = await tx.order.create({
          data: {
            orderCode,
            userId: activeUserId,
            customerEmail: cleanEmail,
            totalAmount,
            status: variant.sourceType === 'TELEGRAM_BOT' ? 'PROCESSING_DROPSHIP' : 'COMPLETED',
            paymentMethod: 'WALLET',
            customerNote: customerNote ? String(customerNote).slice(0, 500) : null,
          },
        });

        // Tạo Transaction
        await tx.transaction.create({
          data: {
            transCode: orderCode,
            userId: activeUserId,
            orderId: order.id,
            amount: totalAmount,
            amountPaid: totalAmount,
            type: 'WALLET_PAYMENT',
            status: 'SUCCESS',
            paymentGate: 'WALLET',
            paidAt: new Date(),
          },
        });

        let deliveredData = '';

        if (variant.sourceType === 'MANUAL_STOCK') {
          // Lấy hàng từ kho sẵn có
          const stock = await tx.stockItem.findFirst({
            where: { variantId: variant.id, isSold: false },
          });

          if (stock) {
            await tx.stockItem.update({
              where: { id: stock.id },
              data: { isSold: true, soldAt: new Date(), orderId: order.id },
            });
            deliveredData = stock.data;
          } else {
            deliveredData = 'Đã hết hàng sẵn trong kho. Đang liên hệ bộ phận hỗ trợ cấp tài khoản trong 10 phút.';
          }
        } else if (variant.sourceType === 'MANUAL_ORDER') {
          deliveredData = `Đơn hàng đang được kỹ thuật viên xử lý theo thông tin: ${customerNote || cleanEmail}. Thời gian hoàn tất từ 15-30 phút.`;
        }

        // Tạo OrderItem
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            variantId: variant.id,
            quantity: safeQuantity,
            unitPrice: variant.price,
            totalPrice: totalAmount,
            deliveredData: deliveredData || null,
          },
        });

        // Tăng lượt bán sản phẩm
        await tx.product.update({
          where: { id: variant.productId },
          data: { soldCount: { increment: safeQuantity } },
        });

        return { order, orderItem, deliveredData };
      });

      let finalDeliveredData = result.deliveredData;

      // Xử lý chuyển tiếp sang Bot Telegram Sỉ sau khi Order đã được commit an toàn vào DB
      if (variant.sourceType === 'TELEGRAM_BOT') {
        const forwardRes = await forwardOrderToSupplierBot(result.order.id, variant.id);
        if (forwardRes.success && forwardRes.deliveredData) {
          finalDeliveredData = forwardRes.deliveredData;
        } else {
          finalDeliveredData = 'Hệ thống đã tự động chuyển tiếp đơn sang Bot sỉ. Đang chờ phản hồi tài khoản, bạn có thể theo dõi tại mục Tra cứu đơn!';
        }
      }

      return NextResponse.json({
        success: true,
        orderCode: result.order.orderCode,
        status: variant.sourceType === 'TELEGRAM_BOT' ? 'PROCESSING_DROPSHIP' : 'COMPLETED',
        deliveredData: finalDeliveredData,
        message: 'Thanh toán thành công qua số dư ví!',
      });
    }

    // 5. THANH TOÁN BẰNG VIETQR
    const qrUrl = generateVietQRUrl({
      amount: totalAmount,
      description: orderCode,
    });

    const order = await prisma.order.create({
      data: {
        orderCode,
        userId: userId || null,
        customerEmail: cleanEmail,
        totalAmount,
        status: 'PENDING',
        paymentMethod: 'VIETQR',
        customerNote: customerNote ? String(customerNote).slice(0, 500) : null,
        items: {
          create: {
            variantId: variant.id,
            quantity: safeQuantity,
            unitPrice: variant.price,
            totalPrice: totalAmount,
          },
        },
        transactions: {
          create: {
            transCode: orderCode,
            userId: userId || null,
            amount: totalAmount,
            type: 'DIRECT_ORDER',
            status: 'PENDING',
            qrUrl,
            paymentGate: 'VIETQR',
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      orderCode: order.orderCode,
      status: 'PENDING',
      totalAmount,
      qrUrl,
      bankInfo: {
        bankId: process.env.VIETQR_BANK_ID || 'MB',
        accountNo: process.env.VIETQR_ACCOUNT_NO || '0399999999',
        accountName: process.env.VIETQR_ACCOUNT_NAME || 'NGUYEN VAN VUONG',
        transferContent: orderCode,
      },
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json({ success: false, error: error.message || 'Lỗi khi tạo đơn hàng' }, { status: 500 });
  }
}
