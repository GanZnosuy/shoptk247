import { execSync } from 'child_process';

// Đảm bảo luôn có DATABASE_URL mặc định khi build trên Vercel / Render / Railway mà không cần cấu hình tay
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

function run(cmd) {
  console.log(`\n👉 Running: ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: process.env });
}

try {
  run('npx prisma generate');
  run('npx prisma db push --skip-generate');
  run('node prisma/seed.mjs');
  run('npx next build');
} catch (err) {
  console.error('Build failed:', err.message);
  process.exit(1);
}
