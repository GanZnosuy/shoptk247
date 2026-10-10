export interface VietQRParams {
  bankId?: string;
  accountNo?: string;
  accountName?: string;
  amount: number;
  description: string;
}

export function generateVietQRUrl(params: VietQRParams): string {
  const bankId = params.bankId || process.env.VIETQR_BANK_ID || 'MB';
  const accountNo = params.accountNo || process.env.VIETQR_ACCOUNT_NO || '0399999999';
  const accountName = params.accountName || process.env.VIETQR_ACCOUNT_NAME || 'NGUYEN VAN VUONG';
  const amount = Math.round(params.amount);
  const addInfo = encodeURIComponent(params.description);
  const encAccountName = encodeURIComponent(accountName);

  return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${addInfo}&accountName=${encAccountName}`;
}
