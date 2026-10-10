import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  createAdminSessionToken,
  getAdminSecretKey,
  getClientIp,
  timingSafeCompare,
  verifyCsrfOrigin,
} from '@/lib/security';

/**
 * POST /api/admin/auth
 * Xác thực Admin và cấp phát HttpOnly Cookie (Chống XSS đánh cắp Session)
 */
export async function POST(req: NextRequest) {
  try {
    if (!verifyCsrfOrigin(req)) {
      return NextResponse.json({ success: false, error: 'CSRF validation failed' }, { status: 403 });
    }

    const ip = getClientIp(req);
    const rate = checkRateLimit(`admin_login_${ip}`, 10, 300000); // Tối đa 10 lần / 5 phút
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'Quá nhiều lần thử đăng nhập sai. Vui lòng đợi 5 phút!' },
        { status: 429 }
      );
    }

    const { secretKey } = await req.json();
    if (!secretKey || typeof secretKey !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập khóa bảo mật Admin' },
        { status: 400 }
      );
    }

    const expectedSecret = getAdminSecretKey();
    if (!timingSafeCompare(secretKey.trim(), expectedSecret)) {
      return NextResponse.json(
        { success: false, error: 'Mã khóa bảo mật Admin không chính xác!' },
        { status: 401 }
      );
    }

    const sessionToken = createAdminSessionToken(expectedSecret);
    const response = NextResponse.json({
      success: true,
      message: 'Xác thực quản trị viên thành công!',
    });

    const isHttps =
      req.nextUrl.protocol === 'https:' ||
      req.headers.get('x-forwarded-proto') === 'https';

    // Thiết lập HttpOnly Cookie theo chuẩn SKILL.md Section 4 & Section 6
    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 12, // 12 giờ
    });

    return response;
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi xử lý xác thực' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/auth
 * Đăng xuất và xóa HttpOnly Cookie
 */
export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: 'Đã đăng xuất khỏi phiên quản trị',
  });

  response.cookies.delete('admin_session');
  return response;
}
