import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminRequest } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminRequest(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Yêu cầu quyền quản trị viên' }, { status: 401 });
    }

    const { variantId, stockText } = await req.json();

    if (!variantId || !stockText) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng chọn gói sản phẩm và nhập dữ liệu tài khoản' },
        { status: 400 }
      );
    }

    // Lọc các dòng hợp lệ và loại bỏ dòng trùng lặp ngay từ input
    const uniqueLines: string[] = Array.from(
      new Set(
        String(stockText)
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0)
      )
    );

    if (uniqueLines.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy dòng tài khoản hợp lệ nào' },
        { status: 400 }
      );
    }

    if (uniqueLines.length > 5000) {
      return NextResponse.json(
        { success: false, error: 'Tối đa 5.000 tài khoản mỗi lần nhập kho' },
        { status: 400 }
      );
    }

    // Lọc các tài khoản đã tồn tại trong kho để tránh lỗi Unique Constraint trên SQLite
    const existingItems = await prisma.stockItem.findMany({
      where: {
        variantId,
        data: { in: uniqueLines },
      },
      select: { data: true },
    });

    const existingSet = new Set(existingItems.map((i) => i.data));
    const newLines = uniqueLines.filter((line) => !existingSet.has(line));

    if (newLines.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tất cả các tài khoản nhập vào đều đã tồn tại trong kho!' },
        { status: 400 }
      );
    }

    // Nhập hàng loạt vào bảng StockItem
    const createdItems = await prisma.stockItem.createMany({
      data: newLines.map((line: string) => ({
        variantId,
        data: line,
      })),
    });

    const skippedCount = uniqueLines.length - newLines.length;

    return NextResponse.json({
      success: true,
      count: createdItems.count,
      skippedCount,
      message: `Đã nhập thành công ${createdItems.count} tài khoản mới vào kho!${skippedCount > 0 ? ` (Đã bỏ qua ${skippedCount} tài khoản trùng lặp)` : ''}`,
    });
  } catch (error: any) {
    console.error('Error importing bulk stock:', error);
    return NextResponse.json({ success: false, error: error.message || 'Lỗi nhập kho' }, { status: 500 });
  }
}
