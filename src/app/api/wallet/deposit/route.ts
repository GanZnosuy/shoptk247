import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateRandomCode } from '@/lib/utils';
import { generateVietQRUrl } from '@/lib/vietqr';
import { checkRateLimit, getClientIp, getSafeErrorMessage } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`wallet_deposit_${ip}`, 10, 60000);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'Quá nhiều yêu cầu nạp tiền. Vui lòng thử lại sau 1 phút.' },
        { status: 429 }
      );
    }

    const { amount, userId } = await req.json();
    const parsedAmount = Number(amount);

    if (!Number.isInteger(parsedAmount) || parsedAmount < 10000 || parsedAmount > 100000000) {
      return NextResponse.json(
        { success: false, error: 'Số tiền nạp hợp lệ phải là số nguyên từ 10.000 đ đến 100.000.000 đ' },
        { status: 400 }
      );
    }

    const activeUser = userId
      ? await prisma.user.findUnique({ where: { id: String(userId) } })
      : await prisma.user.findFirst({ where: { role: 'USER' } });

    if (!activeUser) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy tài khoản người dùng' }, { status: 404 });
    }

    const transCode = generateRandomCode('NAP');
    const qrUrl = generateVietQRUrl({
      amount: parsedAmount,
      description: transCode,
    });

    await prisma.transaction.create({
      data: {
        transCode,
        userId: activeUser.id,
        amount: parsedAmount,
        type: 'DEPOSIT_WALLET',
        status: 'PENDING',
        qrUrl,
        paymentGate: 'VIETQR',
      },
    });

    return NextResponse.json({
      success: true,
      transCode,
      amount: parsedAmount,
      qrUrl,
      bankInfo: {
        bankId: process.env.VIETQR_BANK_ID || 'MB',
        accountNo: process.env.VIETQR_ACCOUNT_NO || '0399999999',
        accountName: process.env.VIETQR_ACCOUNT_NAME || 'NGUYEN VAN VUONG',
        transferContent: transCode,
      },
    });
  } catch (error: unknown) {
    console.error('Error creating deposit:', error);
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(error, 'Lỗi tạo giao dịch nạp tiền') },
      { status: 500 }
    );
  }
}
