import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({ orderBy: { orderIndex: 'asc' } });
  const products = await prisma.product.findMany({
    include: {
      variants: {
        orderBy: { orderIndex: 'asc' },
        include: {
          stockItems: { where: { isSold: false } },
        },
      },
    },
  });
  const users = await prisma.user.findMany();

  const snapshot = {
    categories,
    products,
    users,
  };

  const outPath = path.join(process.cwd(), 'prisma', 'catalog-snapshot.json');
  fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2), 'utf8');
  console.log(`Exported ${categories.length} categories, ${products.length} products to ${outPath}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
