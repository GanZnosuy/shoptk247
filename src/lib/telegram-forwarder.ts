import { prisma } from './prisma';

export interface ForwardResult {
  success: boolean;
  message: string;
  deliveredData?: string;
  costPrice?: number;
  status: 'SUCCESS' | 'PENDING' | 'TIMEOUT' | 'OUT_OF_STOCK' | 'ERROR';
}

/**
 * Service chuyển tiếp yêu cầu mua hàng tự động tới Bot Telegram Sỉ (3rd-Party Wholesale Bot)
 * Bot sỉ là của nhà cung cấp bên ngoài (không phải bot của shop).
 * 
 * Luồng hoạt động:
 * 1. Nhận orderId và thông tin gói cần mua
 * 2. Xác định bot sỉ mục tiêu (teleBotTarget: vd @SupplierBot) và lệnh mua (teleBotCommand: vd /buy capcut_7d)
 * 3. Ghi log chuyển tiếp (TelegramOrderLog) lưu cả costPrice và sellingPrice để thống kê lãi ròng O(1)
 * 4. Nếu có phiên MTProto Client (Telegram Userbot Session) -> Gửi tin nhắn tự động & nhận kết quả
 * 5. Nếu chưa cấu hình Client -> Lưu trạng thái PENDING_FORWARD và thông báo để admin/worker xử lý
 */
export async function forwardOrderToSupplierBot(
  orderId: string,
  variantId: string
): Promise<ForwardResult> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { variant: true } } }
    });

    if (!order) {
      return { success: false, message: 'Đơn hàng không tồn tại', status: 'ERROR' };
    }

    const orderItem = order.items.find((i) => i.variantId === variantId) || order.items[0];
    const variant = orderItem?.variant;

    if (!variant || variant.sourceType !== 'TELEGRAM_BOT') {
      return { success: false, message: 'Gói này không lấy từ Bot sỉ', status: 'ERROR' };
    }

    const targetBot = variant.teleBotTarget || '@SupplierWholesaleBot';
    const commandToSend = variant.teleBotCommand || `/buy ${variant.name.toLowerCase().replace(/\s+/g, '_')}`;
    const costPrice = variant.costPrice || 0;
    const sellingPrice = variant.price || orderItem.unitPrice;

    console.log(`[Telegram-Forwarder] 🚀 Chuyển tiếp đơn ${order.orderCode} sang bot sỉ: ${targetBot} với lệnh: "${commandToSend}"`);

    // Kiểm tra cấu hình Telegram Userbot MTProto Client
    const sessionSetting = await prisma.systemSetting.findUnique({
      where: { key: 'TELEGRAM_USERBOT_SESSION' }
    });
    const sessionString = sessionSetting?.value || process.env.TELEGRAM_USERBOT_SESSION;

    if (sessionString && process.env.TELEGRAM_API_ID && process.env.TELEGRAM_API_HASH) {
      // Đã có phiên đăng nhập Telegram Client tự động (MTProto)
      // Thực hiện gửi lệnh trực tiếp tới bot sỉ
      try {
        const { executeGramJsForward } = await import('./telegram-mtproto-worker');
        const execResult = await executeGramJsForward({
          targetBot,
          command: commandToSend,
          regexPattern: variant.teleBotRegex,
          timeoutSeconds: 60,
        });

        const log = await prisma.telegramOrderLog.create({
          data: {
            orderId: order.id,
            botUsername: targetBot,
            commandSent: commandToSend,
            botReply: execResult.rawReply,
            accountExtracted: execResult.account,
            costPrice,
            sellingPrice,
            status: execResult.success ? 'SUCCESS' : 'FAILED',
            errorMessage: execResult.error,
          }
        });

        if (execResult.success && execResult.account) {
          await prisma.orderItem.update({
            where: { id: orderItem.id },
            data: { deliveredData: execResult.account }
          });
          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'COMPLETED' }
          });
          return {
            success: true,
            message: 'Đã mua thành công từ bot sỉ qua Userbot MTProto',
            deliveredData: execResult.account,
            costPrice,
            status: 'SUCCESS'
          };
        }
      } catch (clientErr: any) {
        console.warn('[Telegram-Forwarder] Lỗi tiến trình Userbot:', clientErr.message);
      }
    }

    // Nếu chưa cấu hình GramJS Session hoặc đang chạy chế độ Simulation:
    // Ghi log chuyển tiếp dạng PENDING_FORWARD
    const log = await prisma.telegramOrderLog.create({
      data: {
        orderId: order.id,
        botUsername: targetBot,
        commandSent: commandToSend,
        costPrice,
        sellingPrice,
        status: 'PENDING',
        botReply: `[FORWARD QUEUE] Lệnh "${commandToSend}" đã được xếp hàng gửi tới ${targetBot}. Đang đợi phản hồi từ bot sỉ.`
      }
    });

    // Cập nhật trạng thái đơn hàng sang PROCESSING_DROPSHIP
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'PROCESSING_DROPSHIP' }
    });

    return {
      success: true,
      message: `Đã chuyển tiếp đơn sang bot sỉ ${targetBot} (Lệnh: ${commandToSend})`,
      costPrice,
      status: 'PENDING'
    };
  } catch (error: any) {
    console.error('[Telegram-Forwarder] Lỗi chuyển tiếp đơn:', error);
    return {
      success: false,
      message: error.message || 'Lỗi xử lý chuyển tiếp đơn',
      status: 'ERROR'
    };
  }
}

/**
 * Xử lý khi nhận được tin nhắn phản hồi từ Bot Sỉ (Webhook hoặc Worker đẩy về)
 */
export async function completeSupplierBotOrder(
  orderId: string,
  botReplyText: string
): Promise<{ success: boolean; account?: string }> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { variant: true } }, teleLogs: true }
    });

    if (!order) return { success: false };

    const firstItem = order.items[0];
    const variant = firstItem?.variant;

    // Trích xuất thông tin tài khoản bằng regex cấu hình hoặc regex mặc định
    let extracted = '';
    if (variant?.teleBotRegex) {
      try {
        const match = botReplyText.match(new RegExp(variant.teleBotRegex, 'i'));
        if (match && match[1]) extracted = match[1];
      } catch (e) {}
    }

    if (!extracted) {
      // Regex trích xuất phổ biến: email|password hoặc key kích hoạt
      const emailPassMatch = botReplyText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\s*[|\s:]+\s*[^\s\n\r]+)/);
      if (emailPassMatch) {
        extracted = emailPassMatch[1];
      } else {
        // Lấy đoạn text chính chứa thông tin tài khoản
        extracted = botReplyText.trim();
      }
    }

    // Cập nhật bàn giao đơn hàng
    await prisma.$transaction([
      prisma.orderItem.update({
        where: { id: firstItem.id },
        data: { deliveredData: extracted }
      }),
      prisma.order.update({
        where: { id: order.id },
        data: { status: 'COMPLETED' }
      }),
      prisma.telegramOrderLog.updateMany({
        where: { orderId: order.id, status: 'PENDING' },
        data: {
          status: 'SUCCESS',
          botReply: botReplyText,
          accountExtracted: extracted
        }
      })
    ]);

    return { success: true, account: extracted };
  } catch (err: any) {
    console.error('[Telegram-Forwarder] Lỗi hoàn tất đơn bot sỉ:', err);
    return { success: false };
  }
}
