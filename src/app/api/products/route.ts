import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizeProductForPublic } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get('category');
    const search = searchParams.get('search');
    const featuredOnly = searchParams.get('featured') === 'true';

    const where: any = { isActive: true };

    if (categorySlug && categorySlug !== 'all') {
      where.category = { slug: categorySlug };
    }

    if (search && search.trim() !== '') {
      where.OR = [
        { title: { contains: search } },
        { shortDesc: { contains: search } },
      ];
    }

    if (featuredOnly) {
      where.isFeatured = true;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { soldCount: 'desc' }, { createdAt: 'desc' }],
      include: {
        category: true,
        variants: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
          include: {
            _count: {
              select: {
                stockItems: { where: { isSold: false } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: products.map((p) => sanitizeProductForPublic(p)),
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ success: false, error: 'Lỗi khi tải sản phẩm' }, { status: 500 });
  }
}
