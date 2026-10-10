import { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * MODULE BẢO MẬT & PHÒNG THỦ HỆ THỐNG (OWASP & SECURITY-REVIEW SKILL STANDARDS)
 */

// Lấy khóa bí mật Admin từ biến môi trường
export function getAdminSecretKey(): string {
  const secret = process.env.ADMIN_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[SECURITY WARNING] ADMIN_SECRET_KEY chưa được cấu hình trong .env!');
    }
    return 'admin_super_secret_key_2026';
  }
  return secret;
}

/**
 * Tạo chữ ký HMAC-SHA256 cho HttpOnly Session Cookie của Admin
 * Không lưu trực tiếp raw secret key vào cookie trình duyệt
 */
export function createAdminSessionToken(secretKey: string): string {
  return crypto
    .createHmac('sha256', secretKey)
    .update('admin_session_authenticated_v1')
    .digest('hex');
}

/**
 * So sánh chuỗi an toàn chống Timing Attack
 */
export function timingSafeCompare(a: string, b: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * 1. Xác thực quyền Quản trị viên (Hỗ trợ cả HttpOnly Cookie HMAC và Header x-admin-key)
 */
export function verifyAdminRequest(req: NextRequest): boolean {
  const expectedSecret = getAdminSecretKey();

  // Kiểm tra 1: Header x-admin-key (dành cho API call / CLI)
  const headerKey = req.headers.get('x-admin-key') || '';
  if (headerKey && timingSafeCompare(headerKey, expectedSecret)) {
    return true;
  }

  // Kiểm tra 2: HttpOnly Cookie (chống XSS đánh cắp token trên trình duyệt)
  const cookieToken = req.cookies.get('admin_session')?.value || '';
  const expectedToken = createAdminSessionToken(expectedSecret);
  if (cookieToken && timingSafeCompare(cookieToken, expectedToken)) {
    return true;
  }

  return false;
}

/**
 * 2. Chống tấn công CSRF (Cross-Site Request Forgery) cho các thao tác POST/PUT/DELETE
 */
export function verifyCsrfOrigin(req: NextRequest): boolean {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return true;
  }

  const origin = req.headers.get('origin');
  const host = req.headers.get('host');

  // Nếu request có gửi Origin header (từ trình duyệt), đối chiếu với Host hiện tại
  if (origin && host) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
}

/**
 * 3. Bộ đệm chống tấn công Brute-Force / DoS (In-Memory Rate Limiter)
 */
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

export function checkRateLimit(
  key: string,
  maxRequests: number = 60,
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (rateLimitMap.size > 10000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.resetAt < now) rateLimitMap.delete(k);
    }
  }

  if (!record || record.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: maxRequests - record.count };
}

/**
 * Lấy IP an toàn của Client
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

/**
 * 4. Ẩn chi tiết lỗi hệ thống / Prisma khỏi phản hồi trả về cho người dùng (Chống lộ cấu trúc DB)
 */
export function getSafeErrorMessage(error: unknown, fallbackMessage: string = 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại.'): string {
  if (error instanceof Error) {
    // Chỉ cho phép hiển thị các thông báo nghiệp vụ tiếng Việt an toàn, chặn các lỗi Prisma/SQL/Stack
    const msg = error.message || '';
    if (
      msg.includes('prisma') ||
      msg.includes('Unique constraint') ||
      msg.includes('Foreign key') ||
      msg.includes('Invalid `prisma') ||
      msg.includes('SQLITE_') ||
      msg.includes('ENOENT')
    ) {
      return fallbackMessage;
    }
    return msg;
  }
  return fallbackMessage;
}

/**
 * 5. Chống lộ giá vốn và thông tin nhà cung cấp (Data Sanitization)
 */
export function sanitizeVariantForPublic(v: any) {
  if (!v) return v;
  const { costPrice, teleBotTarget, teleBotCommand, teleBotRegex, ...cleanVariant } = v;
  return cleanVariant;
}

export function sanitizeProductForPublic(p: any) {
  if (!p) return p;
  return {
    ...p,
    variants: Array.isArray(p.variants)
      ? p.variants.map((v: any) => sanitizeVariantForPublic(v))
      : p.variants,
  };
}

export function sanitizeOrderForPublic(order: any) {
  if (!order) return order;
  return {
    ...order,
    teleLogs: undefined,
    teleLog: undefined,
    items: Array.isArray(order.items)
      ? order.items.map((item: any) => ({
          ...item,
          variant: sanitizeVariantForPublic(item.variant),
        }))
      : order.items,
  };
}
