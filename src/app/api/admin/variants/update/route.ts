import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSafeErrorMessage, verifyAdminRequest, verifyCsrfOrigin } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    if (!verifyCsrfOrigin(req)) {
      return NextResponse.json({ success: false, error: 'CSRF validation failed' }, { status: 403 });
    }

    if (!verifyAdminRequest(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Yêu cầu quyền quản trị viên' }, { status: 401 });
    }

    const { variantId, price, costPrice, name, teleBotTarget, teleBotCommand, sourceType } = await req.json();

    if (!variantId) {
      return NextResponse.json({ success: false, error: 'Thiếu ID gói sản phẩm' }, { status: 400 });
    }

    if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0)) {
      return NextResponse.json({ success: false, error: 'Giá bán không hợp lệ' }, { status: 400 });
    }

    if (costPrice !== undefined && (isNaN(Number(costPrice)) || Number(costPrice) < 0)) {
      return NextResponse.json({ success: false, error: 'Giá vốn không hợp lệ' }, { status: 400 });
    }

    const updated = await prisma.productVariant.update({
      where: { id: String(variantId) },
      data: {
        ...(price !== undefined && { price: Math.floor(Number(price)) }),
        ...(costPrice !== undefined && { costPrice: Math.floor(Number(costPrice)) }),
        ...(name && { name: String(name).trim() }),
        ...(teleBotTarget !== undefined && { teleBotTarget: teleBotTarget ? String(teleBotTarget).trim() : null }),
        ...(teleBotCommand !== undefined && { teleBotCommand: teleBotCommand ? String(teleBotCommand).trim() : null }),
        ...(sourceType !== undefined && { sourceType: String(sourceType).trim() }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật cấu hình gói sản phẩm thành công!',
      data: updated,
    });
  } catch (error: unknown) {
    console.error('Error updating variant:', error);
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(error, 'Lỗi cập nhật gói sản phẩm') },
      { status: 500 }
    );
  }
}
