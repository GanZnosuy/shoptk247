import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyAdminOrder } from '@/lib/telegram';
import { forwardOrderToSupplierBot } from '@/lib/telegram-forwarder';

export async function POST(req: NextRequest) {
  try {
    const adminKey = req.headers.get('x-admin-key');
    const isDev = process.env.NODE_ENV !== 'production';
    const validAdminKey = process.env.ADMIN_SECRET_KEY || 'admin_super_secret_key_2026';

    // Bảo mật: Trong môi trường production, API này chỉ dành cho Admin thủ công duyệt đơn
    // Khách hàng thông thường bắt buộc phải xác nhận qua Webhook ngân hàng (/api/payment/webhook)
    if (!isDev && adminKey !== validAdminKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Thao tác không được phép. Trong chế độ Production, thanh toán bắt buộc phải xác nhận qua Webhook ngân hàng tự động.',
        },
        { status: 403 }
      );
    }

    const { orderCode } = await req.json();

    if (!orderCode) {
      return NextResponse.json({ success: false, error: 'Thiếu mã đơn hàng' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { orderCode },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    if (order.status === 'COMPLETED') {
      const deliveredData = order.items[0]?.deliveredData || '';
      return NextResponse.json({
        success: true,
        status: 'COMPLETED',
        deliveredData,
        message: 'Đơn hàng này đã được thanh toán và bàn giao tài khoản trước đó!',
      });
    }

    const firstItem = order.items[0];
    const variant = firstItem?.variant;

    if (!variant) {
      return NextResponse.json({ success: false, error: 'Dữ liệu gói sản phẩm không hợp lệ' }, { status: 400 });
    }

    let deliveredData = '';

    // Xử lý lấy tài khoản tùy theo nguồn
    if (variant.sourceType === 'TELEGRAM_BOT') {
      // Chuyển tiếp đơn sang Bot sỉ của bên thứ 3
      const forwardRes = await forwardOrderToSupplierBot(order.id, variant.id);
      if (forwardRes.success && forwardRes.deliveredData) {
        deliveredData = forwardRes.deliveredData;
      } else {
        deliveredData = 'Hệ thống đã chuyển đơn sang Bot sỉ của nhà cung cấp. Đang chờ phản hồi tài khoản!';
      }
    } else if (variant.sourceType === 'MANUAL_STOCK') {
      const stock = await prisma.stockItem.findFirst({
        where: { variantId: variant.id, isSold: false },
      });

      if (stock) {
        await prisma.stockItem.update({
          where: { id: stock.id },
          data: { isSold: true, soldAt: new Date(), orderId: order.id },
        });
        deliveredData = stock.data;
      } else {
        deliveredData = 'Mặt hàng trong kho đã hết, CSKH sẽ cấp bù tài khoản trực tiếp qua email trong 10-15 phút.';
      }
    } else {
      deliveredData = `Đang xử lý nâng cấp vào thông tin: ${order.customerNote || order.customerEmail}`;
    }

    // Cập nhật trạng thái đơn hàng và lưu dữ liệu giao cho khách
    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: {
          status: variant.sourceType === 'TELEGRAM_BOT' && !deliveredData.includes(':') && !deliveredData.includes('|')
            ? 'PROCESSING_DROPSHIP'
            : 'COMPLETED',
        },
      }),
      prisma.orderItem.update({
        where: { id: firstItem.id },
        data: { deliveredData },
      }),
      prisma.transaction.updateMany({
        where: { orderId: order.id },
        data: { status: 'SUCCESS', paidAt: new Date() },
      }),
      prisma.product.update({
        where: { id: variant.productId },
        data: { soldCount: { increment: 1 } },
      }),
    ]);

    // Gửi thông báo admin
    try {
      notifyAdminOrder({
        title: 'Đơn hàng quét VietQR đã duyệt',
        orderCode: order.orderCode,
        amount: order.totalAmount,
        customerEmail: order.customerEmail,
        productName: `${variant.product.title} - ${variant.name}`,
        sourceType: variant.sourceType,
        costPrice: variant.costPrice,
        deliveredData,
      });
    } catch {}

    return NextResponse.json({
      success: true,
      status: 'COMPLETED',
      deliveredData,
      message: 'Xác nhận thanh toán thành công! Đã cập nhật trạng thái đơn hàng.',
    });
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    return NextResponse.json({ success: false, error: error.message || 'Lỗi xử lý thanh toán' }, { status: 500 });
  }
}
