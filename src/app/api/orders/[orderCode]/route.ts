import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp, sanitizeOrderForPublic, verifyAdminRequest } from '@/lib/security';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderCode: string }> }
) {
  try {
    // Chống Brute-Force dò mã đơn hàng
    const ip = getClientIp(req);
    const rate = checkRateLimit(`order_lookup_${ip}`, 30, 60000);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'Quá nhiều yêu cầu tra cứu. Vui lòng thử lại sau 1 phút.' },
        { status: 429 }
      );
    }

    const { orderCode } = await params;
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
        teleLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    const formattedOrder = {
      ...order,
      transaction: order.transactions[0] || null,
      teleLog: order.teleLogs[0] || null,
    };

    // Nếu không phải Admin, ẩn giá vốn và log nội bộ của Bot sỉ
    const isAdmin = verifyAdminRequest(req);
    const responseData = isAdmin ? formattedOrder : sanitizeOrderForPublic(formattedOrder);

    return NextResponse.json({ success: true, data: responseData });
  } catch (error) {
    console.error('Error fetching order by code:', error);
    return NextResponse.json({ success: false, error: 'Lỗi server' }, { status: 500 });
  }
}
