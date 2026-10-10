import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateThumbnails() {
  const mapping = [
    { slug: 'gemini-pro-18-thang-5tb', thumbnail: '/images/products/gemini-pro.svg' },
    { slug: 'capcut-pro-chinh-hang', thumbnail: '/images/products/capcut-pro.svg' },
    { slug: 'netflix-premium-4k-uhd', thumbnail: '/images/products/netflix-4k.svg' },
    { slug: 'canva-pro-edu-ban-quyen', thumbnail: '/images/products/canva-pro.svg' },
    { slug: 'youtube-premium-chinh-chu', thumbnail: '/images/products/youtube-premium.svg' },
    { slug: 'microsoft-365-windows-pro-key', thumbnail: '/images/products/microsoft-windows.svg' },
    { slug: 'adobe-express-all-apps', thumbnail: '/images/products/adobe-express.svg' },
    { slug: 'api-token-claude-gpt-codex', thumbnail: '/images/products/api-token-ai.svg' },
    { slug: 'prompt-extension-bypass-ai', thumbnail: '/images/products/prompt-bypass.svg' },
    { slug: 'bo-cong-cu-security-auditor-reverse', thumbnail: '/images/products/security-tools.svg' },
  ];

  console.log('--- Cập nhật hình ảnh minh họa chuẩn xác cho từng sản phẩm ---');
  for (const item of mapping) {
    const res = await prisma.product.updateMany({
      where: { slug: item.slug },
      data: { thumbnail: item.thumbnail },
    });
    console.log(`✅ [${item.slug}] -> ${item.thumbnail} (${res.count} updated)`);
  }

  console.log('🎉 Hoàn tất cập nhật toàn bộ ảnh minh họa!');
}

updateThumbnails()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
