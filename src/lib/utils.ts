import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import crypto from 'crypto';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Định dạng tiền tệ VND (VD: 65.000 đ)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

// Định dạng ngày giờ Việt Nam
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(d);
}

// Sinh mã ngẫu nhiên an toàn (Cryptographically Secure) cho đơn hàng / giao dịch
export function generateRandomCode(prefix: string = 'DH'): string {
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}${randomHex}`;
}
