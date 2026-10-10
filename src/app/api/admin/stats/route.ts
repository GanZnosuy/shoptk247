import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    if (!verifyAdminRequest(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Yêu cầu quyền quản trị viên' }, { status: 401 });
    }
    const totalOrders = await prisma.order.count();
    const completedOrders = await prisma.order.count({ where: { status: 'COMPLETED' } });
    const processingOrders = await prisma.order.count({ where: { status: 'PROCESSING_DROPSHIP' } });
    
    // Tổng doanh thu từ các đơn hàng đã thanh toán thành công hoặc đang dropship
    const revenueAgg = await prisma.order.aggregate({
      where: { status: { in: ['COMPLETED', 'PROCESSING_DROPSHIP'] } },
      _sum: { totalAmount: true },
    });
    const totalRevenue = revenueAgg._sum.totalAmount || 0;

    // Tổng số lượng hàng còn tồn trong kho
    const inStockCount = await prisma.stockItem.count({ where: { isSold: false } });

    // Thống kê lợi nhuận từ Telegram Bot Dropship (O(1) database aggregation)
    const dropshipStats = await prisma.telegramOrderLog.aggregate({
      where: { status: { in: ['SUCCESS', 'PENDING'] } },
      _sum: {
        sellingPrice: true,
        costPrice: true,
      },
    });

    const dropshipRevenue = dropshipStats._sum.sellingPrice || 0;
    const dropshipCost = dropshipStats._sum.costPrice || 0;
    const dropshipProfit = dropshipRevenue - dropshipCost;

    // Danh sách 10 đơn hàng mới nhất
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
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
        teleLogs: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Toàn bộ các gói sản phẩm để quản lý tồn kho và cấu hình Telegram
    const allVariants = await prisma.productVariant.findMany({
      include: {
        product: true,
        _count: {
          select: {
            stockItems: { where: { isSold: false } },
          },
        },
      },
      orderBy: { product: { title: 'asc' } },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalOrders,
        completedOrders,
        processingOrders,
        totalRevenue,
        inStockCount,
        dropshipRevenue,
        dropshipCost,
        dropshipProfit,
        totalProfit: dropshipProfit,
        recentOrders,
        variants: allVariants,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ success: false, error: 'Lỗi server' }, { status: 500 });
  }
}
