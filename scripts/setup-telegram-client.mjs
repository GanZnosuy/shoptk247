/**
 * Script hướng dẫn và tự động tạo Telegram Userbot Session (GramJS MTProto)
 * 
 * Mục đích:
 * Kết nối tài khoản Telegram cá nhân/shop để tự động gửi lệnh mua sỉ tới Bot của nhà cung cấp bên thứ 3 (Supplier Bot),
 * tự động nhận kết quả và giao tài khoản cho khách mua trên web.
 * 
 * Cách chạy:
 * node scripts/setup-telegram-client.mjs
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import input from 'input';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('================================================================');
  console.log('🤖 THIẾT LẬP KẾT NỐI TỰ ĐỘNG VỚI BOT TELEGRAM BÁN SỈ CỦA BÊN THỨ 3');
  console.log('================================================================');
  console.log('Lưu ý: Bot bán sỉ không phải bot của bạn, do đó hệ thống sử dụng');
  console.log('tài khoản Telegram Client (MTProto Userbot) để thay bạn gửi lệnh');
  console.log('đặt hàng sang Bot đó và nhận tài khoản về trả cho khách hàng.\n');

  // Lấy API ID & API HASH (có thể lấy từ my.telegram.org)
  let apiIdStr = process.env.TELEGRAM_API_ID;
  let apiHash = process.env.TELEGRAM_API_HASH;

  if (!apiIdStr) {
    console.log('👉 Bạn có thể lấy API ID & API HASH miễn phí tại: https://my.telegram.org');
    apiIdStr = await input.text('Nhập TELEGRAM_API_ID (số nguyên): ');
  } else {
    console.log(`Đã tìm thấy TELEGRAM_API_ID từ môi trường: ${apiIdStr}`);
  }

  if (!apiHash) {
    apiHash = await input.text('Nhập TELEGRAM_API_HASH: ');
  } else {
    console.log(`Đã tìm thấy TELEGRAM_API_HASH từ môi trường: ${apiHash.substring(0, 6)}...`);
  }

  const apiId = parseInt(apiIdStr.trim(), 10);
  apiHash = apiHash.trim();

  if (isNaN(apiId) || !apiHash) {
    console.error('❌ API ID hoặc API Hash không hợp lệ!');
    process.exit(1);
  }

  const stringSession = new StringSession('');
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  console.log('\n🔄 Đang kết nối tới Telegram...');
  await client.start({
    phoneNumber: async () => await input.text('Nhập số điện thoại Telegram của bạn (vd: +84912345678): '),
    password: async () => await input.password('Nhập mật khẩu 2FA (nếu có): '),
    phoneCode: async () => await input.text('Nhập mã OTP gửi về ứng dụng Telegram của bạn: '),
    onError: (err) => console.error('Lỗi xác thực:', err),
  });

  const sessionString = client.session.save();
  console.log('\n✅ ĐĂNG NHẬP THÀNH CÔNG!');
  console.log('Chuỗi Session tạo thành công (độ dài: ' + sessionString.length + ' ký tự).');

  // Lưu vào SQLite Database
  try {
    await prisma.systemSetting.upsert({
      where: { key: 'TELEGRAM_USERBOT_SESSION' },
      update: { value: sessionString },
      create: {
        key: 'TELEGRAM_USERBOT_SESSION',
        value: sessionString,
        description: 'Telegram MTProto Userbot Client session for 3rd-party supplier bots',
      },
    });
    console.log('💾 Đã lưu phiên làm việc vào cơ sở dữ liệu (SystemSetting).');
  } catch (dbErr) {
    console.warn('Không thể lưu trực tiếp vào CSDL:', dbErr.message);
  }

  // Ghi hoặc cập nhật file .env
  const envPath = path.resolve(process.cwd(), '.env');
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  const envLines = envContent.split('\n');
  const updateOrAdd = (key, value) => {
    const idx = envLines.findIndex((line) => line.startsWith(`${key}=`));
    if (idx >= 0) {
      envLines[idx] = `${key}="${value}"`;
    } else {
      envLines.push(`${key}="${value}"`);
    }
  };

  updateOrAdd('TELEGRAM_API_ID', apiId);
  updateOrAdd('TELEGRAM_API_HASH', apiHash);
  updateOrAdd('TELEGRAM_USERBOT_SESSION', sessionString);

  fs.writeFileSync(envPath, envLines.join('\n'));
  console.log('📝 Đã đồng bộ cấu hình vào file .env.');

  console.log('\n🎉 HOÀN TẤT THIẾT LẬP!');
  console.log('Bây giờ khi khách thanh toán đơn hàng có nguồn TELEGRAM_BOT,');
  console.log('backend sẽ tự động dùng phiên này để gửi tin nhắn đặt hàng sang Bot sỉ.');

  await client.disconnect();
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Đã xảy ra lỗi khi thiết lập:', err);
  process.exit(1);
});
