'use client';

import React, { useState } from 'react';
import { CheckCircle2, Copy, Check, ShieldCheck, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';

interface OrderSuccessModalProps {
  orderCode: string;
  deliveredData?: string;
  onClose: () => void;
}

export function OrderSuccessModal({
  orderCode,
  deliveredData,
  onClose,
}: OrderSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (deliveredData) {
      navigator.clipboard.writeText(deliveredData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-emerald-500/30 bg-white dark:bg-[#111827] shadow-2xl p-6 sm:p-8 text-slate-900 dark:text-white text-center">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h2 className="mt-4 text-2xl font-black text-slate-900 dark:text-white">
          Thanh Toán Thành Công!
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Mã đơn hàng: <span className="font-mono font-bold text-blue-600 dark:text-sky-400">{orderCode}</span>
        </p>

        {/* Khung chứa thông tin tài khoản */}
        <div className="mt-6 text-left">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            🔑 Thông Tin Tài Khoản / Key Nhận Được:
          </label>
          <div className="relative group rounded-2xl bg-slate-900 text-emerald-400 p-4 font-mono text-xs sm:text-sm border border-slate-800 break-all leading-relaxed shadow-inner">
            {deliveredData || 'Đang chuẩn bị thông tin tài khoản...'}
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-sans font-bold flex items-center gap-1 shadow-md transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã Chép' : 'Sao Chép'}</span>
            </button>
          </div>
        </div>

        {/* Hướng dẫn bảo hành */}
        <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 text-left">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Vui lòng lưu lại thông tin trên. Bạn có thể tra cứu lại bất cứ lúc nào trong mục <b>Tra Cứu Đơn</b>.</span>
        </div>

        {/* Nút hành động */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-colors"
          >
            Tiếp Tục Mua Hàng
          </button>
          <Link
            href={`/orders?code=${orderCode}`}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-colors"
          >
            <span>Xem Đơn Hàng Của Tôi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
