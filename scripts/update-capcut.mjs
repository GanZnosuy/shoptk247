import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateCapcut() {
  const capcutProd = await prisma.product.findFirst({
    where: { slug: 'capcut-pro-chinh-hang' },
    include: { variants: true },
  });

  if (!capcutProd) {
    console.error('Không tìm thấy sản phẩm CapCut');
    return;
  }

  const priceMap = {
    'CapCut Pro 7 ngày · KBH (1 ĐT + 1 PC)': 15000,
    'CapCut Pro 7 ngày · BHF (Bảo Hành Full)': 19000,
    'CapCut Pro 7 ngày · BH5D (Bảo Hành 5 Ngày)': 22000,
    'CapCut Pro 5-7 ngày · BHF (Email | Pass)': 25000,
    'Tk CapCut Pro Team 7 ngày · BHF': 45000,
    'CapCut Pro Team / Cá Nhân 6-7 ngày · BHF': 55000,
    'CapCut Pro Team 1 Tháng (Chỉ log 1 ĐT + 1 PC)': 79000,
    'CapCut Pro Team 30 ngày · BHF (Bảo Hành Full)': 89000,
  };

  console.log('--- Cập nhật giá CapCut Pro tối thiểu từ 15.000đ trở lên ---');
  for (const v of capcutProd.variants) {
    const targetPrice = priceMap[v.name] || Math.max(15000, (v.costPrice || 0) + 15000);
    await prisma.productVariant.update({
      where: { id: v.id },
      data: { price: targetPrice },
    });
    const profit = targetPrice - (v.costPrice || 0);
    console.log(`✅ ${v.name}: Vốn ${v.costPrice?.toLocaleString('vi-VN')} đ -> Giá bán chốt: ${targetPrice.toLocaleString('vi-VN')} đ (LÃI RÒNG: +${profit.toLocaleString('vi-VN')} đ)`);
  }
}

updateCapcut()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
