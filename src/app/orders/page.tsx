'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { 
  Search, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  ShieldCheck, 
  Send, 
  Loader2, 
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDateTime } from '@/lib/utils';

function OrderLookupContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const [orderCodeInput, setOrderCodeInput] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialCode) {
      handleLookup(initialCode);
    }
  }, [initialCode]);

  const handleLookup = async (codeToSearch?: string) => {
    const code = (codeToSearch || orderCodeInput).trim();
    if (!code) {
      setErrorMsg('Vui lòng nhập mã đơn hàng (VD: DH123456)');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    setOrder(null);

    try {
      const res = await fetch(`/api/orders/${code}`);
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Không tìm thấy đơn hàng với mã này');
      }
      setOrder(data.data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại trang chủ</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Tra Cứu Đơn Hàng & Lấy Lại Tài Khoản
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Nhập mã đơn hàng của bạn để kiểm tra trạng thái và lấy lại thông tin tài khoản, mật khẩu hoặc key đã mua.
        </p>
      </div>

      {/* Thanh tìm kiếm mã đơn */}
      <div className="p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={orderCodeInput}
              onChange={(e) => setOrderCodeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              placeholder="Nhập mã đơn hàng (Ví dụ: DH982143)..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => handleLookup()}
            disabled={loading}
            className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            <span>Tra Cứu</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Kết quả đơn hàng */}
      {order && (
        <div className="mt-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
          {/* Header đơn */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-black text-blue-600 dark:text-sky-400">
                  {order.orderCode}
                </span>
                {order.status === 'COMPLETED' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn thành
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                    <Clock className="w-3.5 h-3.5" /> Chờ thanh toán
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Thời gian đặt: {formatDateTime(order.createdAt)} • Email: <span className="font-semibold text-slate-700 dark:text-slate-300">{order.customerEmail}</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-500">Tổng tiền</div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {formatCurrency(order.totalAmount)}
              </div>
            </div>
          </div>

          {/* Chi tiết từng món & Dữ liệu tài khoản đã nhận */}
          <div className="space-y-4">
            {order.items.map((item: any) => (
              <div key={item.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {item.variant.product.title}
                    </h4>
                    <span className="text-xs text-blue-600 dark:text-sky-400 font-medium">
                      Gói: {item.variant.name} (Số lượng: {item.quantity})
                    </span>
                  </div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {formatCurrency(item.totalPrice)}
                  </span>
                </div>

                {/* Hộp tài khoản bàn giao */}
                {item.deliveredData ? (
                  <div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>🔑 Tài khoản / Bản quyền được cấp:</span>
                      <button
                        onClick={() => handleCopy(item.deliveredData)}
                        className="text-xs text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                      </button>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs sm:text-sm border border-slate-800 break-all select-all shadow-inner">
                      {item.deliveredData}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-500/20">
                    Đơn hàng chưa thanh toán hoặc đang trong quá trình xuất tài khoản.
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Nút hỗ trợ bảo hành */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Bảo hành 1 đổi 1. Nếu cần hỗ trợ đổi mật khẩu/PIN hãy báo ngay cho CSKH.</span>
            </div>
            <a
              href="https://t.me"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Báo Lỗi / Yêu Cầu Hỗ Trợ Qua Telegram</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderLookupPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<div className="py-20 text-center">Đang tải trang tra cứu...</div>}>
          <OrderLookupContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
