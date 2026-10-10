import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const forceReset = process.argv.includes('--force');
  const existingProducts = await prisma.product.count();

  if (existingProducts > 0 && !forceReset) {
    console.log(`[Seed] Cơ sở dữ liệu đã có ${existingProducts} sản phẩm. Bỏ qua seed để giữ nguyên đơn hàng.`);
    return;
  }

  const snapshotPath = path.join(process.cwd(), 'prisma', 'catalog-snapshot.json');
  if (!fs.existsSync(snapshotPath)) {
    console.error('[Seed] Không tìm thấy file prisma/catalog-snapshot.json');
    return;
  }

  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));

  if (forceReset) {
    console.log('[Seed] Đang làm sạch dữ liệu cũ (--force)...');
    await prisma.stockItem.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.telegramOrderLog.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.productVariant.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.user.deleteMany({});
  }

  console.log('[Seed] Khởi tạo tài khoản mẫu...');
  for (const u of snapshot.users || []) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        balance: u.balance,
      },
    });
  }

  console.log('[Seed] Khởi tạo 10 danh mục sản phẩm...');
  for (const cat of snapshot.categories || []) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        icon: cat.icon,
        description: cat.description,
        orderIndex: cat.orderIndex,
      },
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        description: cat.description,
        orderIndex: cat.orderIndex,
      },
    });
  }

  console.log('[Seed] Khởi tạo 10 sản phẩm & 67 gói giá...');
  for (const prod of snapshot.products || []) {
    await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {
        title: prod.title,
        thumbnail: prod.thumbnail,
        deliveryType: prod.deliveryType,
        shortDesc: prod.shortDesc,
        description: prod.description,
        warrantyPolicy: prod.warrantyPolicy,
        usageGuide: prod.usageGuide,
        badge: prod.badge,
        isFeatured: prod.isFeatured,
        isActive: prod.isActive,
        soldCount: prod.soldCount,
      },
      create: {
        id: prod.id,
        categoryId: prod.categoryId,
        title: prod.title,
        slug: prod.slug,
        thumbnail: prod.thumbnail,
        deliveryType: prod.deliveryType,
        shortDesc: prod.shortDesc,
        description: prod.description,
        warrantyPolicy: prod.warrantyPolicy,
        usageGuide: prod.usageGuide,
        badge: prod.badge,
        isFeatured: prod.isFeatured,
        isActive: prod.isActive,
        viewCount: prod.viewCount || 0,
        soldCount: prod.soldCount || 120,
      },
    });

    for (const v of prod.variants || []) {
      await prisma.productVariant.upsert({
        where: { id: v.id },
        update: {
          name: v.name,
          durationDays: v.durationDays,
          price: v.price,
          originalPrice: v.originalPrice,
          costPrice: v.costPrice,
          sourceType: v.sourceType,
          teleBotTarget: v.teleBotTarget,
          teleBotCommand: v.teleBotCommand,
          teleBotRegex: v.teleBotRegex,
          isActive: v.isActive,
        },
        create: {
          id: v.id,
          productId: prod.id,
          name: v.name,
          durationDays: v.durationDays,
          price: v.price,
          originalPrice: v.originalPrice,
          orderIndex: v.orderIndex || 0,
          isActive: v.isActive,
          sourceType: v.sourceType,
          costPrice: v.costPrice,
          teleBotTarget: v.teleBotTarget,
          teleBotCommand: v.teleBotCommand,
          teleBotRegex: v.teleBotRegex,
        },
      });

      for (const s of v.stockItems || []) {
        try {
          await prisma.stockItem.create({
            data: {
              id: s.id,
              variantId: v.id,
              data: s.data,
              isSold: false,
            },
          });
        } catch {}
      }
    }
  }

  console.log('[Seed] Hoàn tất khởi tạo dữ liệu cửa hàng!');
}

main()
  .catch((e) => {
    console.error('[Seed] Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
