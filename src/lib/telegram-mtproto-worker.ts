import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { prisma } from './prisma';

export interface ExecuteForwardParams {
  targetBot: string;
  command: string;
  regexPattern?: string | null;
  timeoutSeconds?: number;
}

export interface ExecuteForwardResult {
  success: boolean;
  rawReply: string;
  account?: string;
  error?: string;
}

/**
 * Worker thực thi chuyển tiếp lệnh mua hàng tới Bot Telegram sỉ của bên thứ 3
 * Sử dụng Telegram MTProto Client (GramJS) hoạt động như một Userbot tự động:
 * 1. Đăng nhập phiên Telegram Client của chủ shop
 * 2. Gửi tin nhắn chứa lệnh mua hàng (vd: /buy capcut_7d) tới Bot sỉ (vd: @SupplierWholesaleBot)
 * 3. Chờ phản hồi từ bot sỉ trong khoảng thời gian timeout
 * 4. Trích xuất tài khoản/key trả về theo Regex pattern
 */
export async function executeGramJsForward(
  params: ExecuteForwardParams
): Promise<ExecuteForwardResult> {
  const { targetBot, command, regexPattern, timeoutSeconds = 45 } = params;

  // Lấy cấu hình Telegram API Credentials
  const apiIdStr = process.env.TELEGRAM_API_ID;
  const apiHash = process.env.TELEGRAM_API_HASH;

  if (!apiIdStr || !apiHash) {
    return {
      success: false,
      rawReply: '',
      error: 'Chưa cấu hình TELEGRAM_API_ID hoặc TELEGRAM_API_HASH trong môi trường (.env)',
    };
  }

  const apiId = parseInt(apiIdStr, 10);
  if (isNaN(apiId)) {
    return {
      success: false,
      rawReply: '',
      error: 'TELEGRAM_API_ID phải là dạng số nguyên hợp lệ',
    };
  }

  // Lấy phiên StringSession (Ưu tiên database SystemSetting, sau đó là biến môi trường)
  let sessionString = process.env.TELEGRAM_USERBOT_SESSION || '';
  try {
    const dbSetting = await prisma.systemSetting.findUnique({
      where: { key: 'TELEGRAM_USERBOT_SESSION' },
    });
    if (dbSetting?.value) {
      sessionString = dbSetting.value;
    }
  } catch (dbErr) {
    console.warn('[GramJS-Worker] Không đọc được SystemSetting:', dbErr);
  }

  if (!sessionString || sessionString.trim() === '') {
    return {
      success: false,
      rawReply: '',
      error: 'Chưa có phiên TELEGRAM_USERBOT_SESSION. Vui lòng chạy scripts/setup-telegram-client.mjs để đăng nhập.',
    };
  }

  const stringSession = new StringSession(sessionString);
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 3,
    useWSS: false,
  });

  try {
    await client.connect();

    if (!(await client.checkAuthorization())) {
      return {
        success: false,
        rawReply: '',
        error: 'Phiên Telegram Userbot đã hết hạn hoặc bị thu hồi. Vui lòng tạo lại session mới.',
      };
    }

    console.log(`[GramJS-Worker] Đã kết nối Telegram Client. Đang gửi lệnh "${command}" tới ${targetBot}...`);

    // Gửi lệnh tới bot nhà cung cấp
    const sentMsg = await client.sendMessage(targetBot, { message: command });
    const sentTime = sentMsg.date || Math.floor(Date.now() / 1000);

    // Lắng nghe hoặc polling tin nhắn phản hồi từ bot mục tiêu
    const startTime = Date.now();
    const maxWaitMs = timeoutSeconds * 1000;
    let receivedReplyText = '';

    while (Date.now() - startTime < maxWaitMs) {
      // Đợi 2.5 giây giữa mỗi lần check tin nhắn mới
      await new Promise((r) => setTimeout(r, 2500));

      const messages = await client.getMessages(targetBot, { limit: 3 });
      if (messages && messages.length > 0) {
        // Tìm tin nhắn đến từ bot sau thời điểm gửi lệnh
        const latestReply = messages.find((m) => !m.out && (m.date >= sentTime || m.id > sentMsg.id));
        if (latestReply && latestReply.message) {
          receivedReplyText = latestReply.message;
          break;
        }
      }
    }

    await client.disconnect();

    if (!receivedReplyText) {
      return {
        success: false,
        rawReply: '',
        error: `Bot ${targetBot} chưa phản hồi sau ${timeoutSeconds}s. Đơn hàng được chuyển sang hàng đợi xử lý.`,
      };
    }

    // Trích xuất tài khoản/key theo Regex
    let extractedAccount = '';
    if (regexPattern) {
      try {
        const customMatch = receivedReplyText.match(new RegExp(regexPattern, 'i'));
        if (customMatch && customMatch[1]) {
          extractedAccount = customMatch[1].trim();
        }
      } catch (regexErr) {
        console.warn('[GramJS-Worker] Lỗi regexPattern tùy chỉnh:', regexErr);
      }
    }

    if (!extractedAccount) {
      // Regex trích xuất phổ biến định dạng tài khoản: user|pass hoặc email|pass hoặc key bản quyền
      const credentialPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\s*[|\s:]+\s*[^\s\n\r]+)/;
      const credMatch = receivedReplyText.match(credentialPattern);
      if (credMatch) {
        extractedAccount = credMatch[1].trim();
      } else {
        // Nếu bot trả về toàn bộ nội dung tài khoản/mã kích hoạt
        extractedAccount = receivedReplyText.trim();
      }
    }

    return {
      success: true,
      rawReply: receivedReplyText,
      account: extractedAccount,
    };
  } catch (err: any) {
    console.error('[GramJS-Worker] Ngoại lệ khi giao tiếp Telegram:', err);
    try {
      await client.disconnect();
    } catch {}
    return {
      success: false,
      rawReply: '',
      error: err.message || 'Lỗi khi giao tiếp với máy chủ Telegram',
    };
  }
}
