import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Lấy user demo đang đăng nhập (khachhang@gmail.com)
    const user = await prisma.user.findFirst({
      where: { role: 'USER' },
      select: {
        id: true,
        email: true,
        name: true,
        balance: true,
        role: true,
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user info:', error);
    return NextResponse.json({ success: false, error: 'Lỗi server' }, { status: 500 });
  }
}
