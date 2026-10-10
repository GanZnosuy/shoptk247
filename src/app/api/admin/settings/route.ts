import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    if (!verifyAdminRequest(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Yêu cầu quyền quản trị viên' }, { status: 401 });
    }

    const settings = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      // Che giấu một phần chuỗi nhạy cảm khi hiển thị
      if (s.key === 'TELEGRAM_USERBOT_SESSION' && s.value && s.value.length > 12) {
        settingsMap[s.key] = `${s.value.substring(0, 6)}...${s.value.substring(s.value.length - 4)}`;
      } else {
        settingsMap[s.key] = s.value;
      }
    });

    return NextResponse.json({ success: true, data: settingsMap });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ success: false, error: 'Lỗi server' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminRequest(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Yêu cầu quyền quản trị viên' }, { status: 401 });
    }

    const body = await req.json();

    for (const [key, value] of Object.entries(body)) {
      // Bỏ qua giá trị bị mask
      if (typeof value === 'string' && !value.includes('...')) {
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Đã lưu cấu hình hệ thống an toàn!' });
  } catch (error: any) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ success: false, error: error.message || 'Lỗi lưu cấu hình' }, { status: 500 });
  }
}
