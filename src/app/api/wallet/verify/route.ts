import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const adminKey = req.headers.get('x-admin-key');
    const isDev = process.env.NODE_ENV !== 'production';
    const validAdminKey = process.env.ADMIN_SECRET_KEY || 'admin_super_secret_key_2026';

    // Bảo mật: Trong môi trường Production, cộng tiền ví bắt buộc qua Webhook ngân hàng
    if (!isDev && adminKey !== validAdminKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Thao tác không được phép. Nạp tiền ví phải được đối soát qua Webhook ngân hàng.',
        },
        { status: 403 }
      );
    }

    const { transCode } = await req.json();

    if (!transCode) {
      return NextResponse.json({ success: false, error: 'Thiếu mã giao dịch' }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { transCode },
    });

    if (!transaction) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy giao dịch' }, { status: 404 });
    }

    if (transaction.status === 'SUCCESS') {
      return NextResponse.json({
        success: true,
        message: 'Giao dịch này đã được cộng tiền trước đó!',
      });
    }

    // Cộng tiền vào ví User
    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'SUCCESS', paidAt: new Date() },
      }),
      prisma.user.update({
        where: { id: transaction.userId! },
        data: { balance: { increment: transaction.amount } },
      }),
    ]);

    const updatedUser = await prisma.user.findUnique({
      where: { id: transaction.userId! },
    });

    return NextResponse.json({
      success: true,
      message: `Nạp tiền thành công! Đã cộng ${new Intl.NumberFormat('vi-VN').format(transaction.amount)} đ vào ví.`,
      newBalance: updatedUser?.balance || 0,
    });
  } catch (error: any) {
    console.error('Error verifying deposit:', error);
    return NextResponse.json({ success: false, error: error.message || 'Lỗi xử lý nạp tiền' }, { status: 500 });
  }
}
