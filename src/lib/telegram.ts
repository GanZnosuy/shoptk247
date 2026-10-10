import { prisma } from './prisma';

interface SendNotificationParams {
  title: string;
  orderCode?: string;
  amount: number;
  customerEmail: string;
  productName: string;
  sourceType: string;
  costPrice?: number | null;
  deliveredData?: string;
}

// 1. Gửi thông báo đơn hàng mới ting ting về Telegram của Admin
export async function notifyAdminOrder(params: SendNotificationParams): Promise<boolean> {
  try {
    const botTokenSetting = await prisma.systemSetting.findUnique({
      where: { key: 'TELEGRAM_NOTIFY_BOT_TOKEN' },
    });
    const chatIdSetting = await prisma.systemSetting.findUnique({
      where: { key: 'TELEGRAM_NOTIFY_CHAT_ID' },
    });

    const botToken = botTokenSetting?.value;
    const chatId = chatIdSetting?.value;

    if (!botToken || !chatId) {
      console.log('ℹ️ Chưa cấu hình TELEGRAM_NOTIFY_BOT_TOKEN hoặc TELEGRAM_NOTIFY_CHAT_ID trong cài đặt hệ thống.');
      return false;
    }

    const profit = params.costPrice ? params.amount - params.costPrice : params.amount;
    const message = `🎉 *ĐƠN HÀNG MỚI THÀNH CÔNG!*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📦 *Sản phẩm:* ${params.productName}\n` +
      `🔖 *Mã đơn:* \`${params.orderCode || 'N/A'}\`\n` +
      `👤 *Khách hàng:* \`${params.customerEmail}\`\n` +
      `💰 *Doanh thu:* ${new Intl.NumberFormat('vi-VN').format(params.amount)} đ\n` +
      (params.costPrice ? `📉 *Giá vốn bot:* ${new Intl.NumberFormat('vi-VN').format(params.costPrice)} đ\n` : '') +
      `💵 *Lợi nhuận ròng:* +${new Intl.NumberFormat('vi-VN').format(profit)} đ\n` +
      `🚀 *Nguồn hàng:* ${params.sourceType === 'TELEGRAM_BOT' ? '🤖 Tự động mua từ Bot Telegram' : '📦 Xuất từ Kho web'}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      (params.deliveredData ? `🔑 *Tài khoản xuất:* \`${params.deliveredData}\`\n` : '');

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    return res.ok;
  } catch (error) {
    console.error('Lỗi khi gửi thông báo Telegram Admin:', error);
    return false;
  }
}

// 2. Logic xử lý mua hàng từ Bot Telegram nguồn (Dropship Execution)
export async function purchaseFromTelegramBot(params: {
  orderId: string;
  botUsername: string;
  command: string;
  costPrice?: number | null;
}): Promise<{ success: boolean; accountData?: string; error?: string }> {
  try {
    console.log(`🤖 Đang thực hiện kết nối tới Bot Telegram [${params.botUsername}] với lệnh: [${params.command}]`);

    // Lưu log bắt đầu gọi bot
    const log = await prisma.telegramOrderLog.create({
      data: {
        orderId: params.orderId,
        botUsername: params.botUsername,
        commandSent: params.command,
        costPrice: params.costPrice,
        status: 'PROCESSING',
      },
    });

    // Mô phỏng kết nối bot nguồn hoặc tích hợp trực tiếp MTProto:
    // Trong môi trường hoạt động thực tế, server sẽ gọi Telegram Client (GramJS / Telethon)
    // để gửi tin nhắn lệnh mua tới bot và lắng nghe tin nhắn phản hồi từ bot nguồn.
    // Để hệ thống sẵn sàng test ngay, chúng tôi tạo luồng tự động trả về định dạng chuẩn:
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    let simulatedAccount = '';

    if (params.command.includes('gemini') || params.command.includes('google')) {
      simulatedAccount = `google_ai_pro_${randomSuffix}@gmail.com|GooglePass_${randomSuffix}!`;
    } else if (params.command.includes('netflix')) {
      simulatedAccount = `netflix_vn_${randomSuffix}@gmail.com|NetPass${randomSuffix}!|Profile 3 - PIN: ${randomSuffix.toString().slice(0, 4)}`;
    } else if (params.command.includes('spotify')) {
      simulatedAccount = `spotify_family_invite_key_${randomSuffix}@gmail.com|MusicPass123`;
    } else if (params.command.includes('chatgpt')) {
      simulatedAccount = `chatgpt_plus_${randomSuffix}@outlook.com|GptPassVip${randomSuffix}#`;
    } else if (params.command.includes('canva')) {
      simulatedAccount = `https://www.canva.com/brand/join?token=INVITE_TOKEN_${randomSuffix}`;
    } else if (params.command.includes('adobe')) {
      simulatedAccount = `adobe_fullapps_${randomSuffix}@creative.com|AdobeVipPass_${randomSuffix}`;
    } else if (params.command.includes('capcut')) {
      simulatedAccount = `capcut_vip_${randomSuffix}@gmail.com|CapCutPass${randomSuffix}`;
    } else if (params.command.includes('office') || params.command.includes('key')) {
      simulatedAccount = `KEY-ONLINE-${randomSuffix}-XXXX-YYYY-ZZZZ`;
    } else if (params.command.includes('nordvpn')) {
      simulatedAccount = `nordvpn_acc_${randomSuffix}@gmail.com|NordPassVip${randomSuffix}`;
    } else {
      simulatedAccount = `account_${randomSuffix}@service.com|Password@${randomSuffix}`;
    }

    const simulatedBotReply = `✅ Đơn hàng thành công từ ${params.botUsername}!\nLệnh: ${params.command}\nTài khoản: ${simulatedAccount}\nBảo hành: Full time`;

    // Cập nhật lại log thành công
    await prisma.telegramOrderLog.update({
      where: { id: log.id },
      data: {
        status: 'SUCCESS',
        botReply: simulatedBotReply,
        accountExtracted: simulatedAccount,
      },
    });

    return {
      success: true,
      accountData: simulatedAccount,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Lỗi không xác định khi gọi bot Telegram';
    console.error('Lỗi purchaseFromTelegramBot:', errMsg);
    return {
      success: false,
      error: errMsg,
    };
  }
}
