import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updatePrices() {
  console.log('--- 1. Cập nhật giá Google Gemini Pro: 99k, 119k, 159k ---');
  const geminiProd = await prisma.product.findFirst({
    where: { slug: 'gemini-pro-18-thang-5tb' },
    include: { variants: true },
  });

  if (geminiProd && geminiProd.variants.length >= 3) {
    const prices = [99000, 119000, 159000];
    for (let i = 0; i < 3; i++) {
      const v = geminiProd.variants[i];
      await prisma.productVariant.update({
        where: { id: v.id },
        data: { price: prices[i] },
      });
      console.log(`✅ ${v.name}: Vốn ${v.costPrice?.toLocaleString('vi-VN')} đ -> Giá bán chốt: ${prices[i].toLocaleString('vi-VN')} đ (Lãi +${(prices[i] - (v.costPrice || 0)).toLocaleString('vi-VN')} đ)`);
    }
  }

  console.log('\n--- 2. Cập nhật giá CapCut Pro (Tăng 25% - 30% trên giá vốn bot) ---');
  const capcutProd = await prisma.product.findFirst({
    where: { slug: 'capcut-pro-chinh-hang' },
    include: { variants: true },
  });

  if (capcutProd) {
    for (const v of capcutProd.variants) {
      if (v.costPrice) {
        // Tăng 25% đến 30% trên giá vốn bot, làm tròn nghìn chẵn
        let newPrice = Math.round((v.costPrice * 1.28) / 1000) * 1000;
        if (newPrice <= v.costPrice) newPrice = v.costPrice + 1000; // Đảm bảo luôn có lãi

        await prisma.productVariant.update({
          where: { id: v.id },
          data: { price: newPrice },
        });
        const profit = newPrice - v.costPrice;
        console.log(`✅ ${v.name}: Vốn ${v.costPrice.toLocaleString('vi-VN')} đ -> Giá bán: ${newPrice.toLocaleString('vi-VN')} đ (Lãi +${profit.toLocaleString('vi-VN')} đ)`);
      }
    }
  }

  console.log('\n--- 3. Cập nhật các món AI liên quan khác (API Token, Prompt Bypass AI +30% trên vốn) ---');
  const otherAiProducts = await prisma.product.findMany({
    where: {
      slug: { in: ['prompt-extension-bypass-ai', 'api-token-claude-gpt-codex'] },
    },
    include: { variants: true },
  });

  for (const p of otherAiProducts) {
    for (const v of p.variants) {
      if (v.costPrice) {
        const newPrice = Math.round((v.costPrice * 1.30) / 1000) * 1000;
        await prisma.productVariant.update({
          where: { id: v.id },
          data: { price: newPrice },
        });
        const profit = newPrice - v.costPrice;
        console.log(`✅ [${p.title}] ${v.name}: Vốn ${v.costPrice.toLocaleString('vi-VN')} đ -> Giá bán: ${newPrice.toLocaleString('vi-VN')} đ (Lãi +${profit.toLocaleString('vi-VN')} đ)`);
      }
    }
  }

  console.log('\n🎉 Đã cập nhật xong toàn bộ mức giá mới!');
}

updatePrices()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
