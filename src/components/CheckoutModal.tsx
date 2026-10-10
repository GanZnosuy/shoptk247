'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Wallet, 
  QrCode, 
  Copy, 
  Check, 
  Loader2, 
  AlertCircle, 
  ShieldCheck, 
  Zap, 
  Bot 
} from 'lucide-react';
import { ProductData, ProductVariantData } from './ProductCard';
import { formatCurrency } from '@/lib/utils';

interface CheckoutModalProps {
  product: ProductData;
  variant: ProductVariantData;
  userBalance: number;
  onClose: () => void;
  onSuccess: (orderCode: string, deliveredData?: string) => void;
}

export function CheckoutModal({
  product,
  variant,
  userBalance,
  onClose,
  onSuccess,
}: CheckoutModalProps) {
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'VIETQR'>('VIETQR');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Trạng thái đơn QR sau khi tạo
  const [qrData, setQrData] = useState<{
    orderCode: string;
    qrUrl: string;
    totalAmount: number;
    bankInfo: {
      bankId: string;
      accountNo: string;
      accountName: string;
      transferContent: string;
    };
  } | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // 1. Xử lý tạo đơn hàng
  const handleCreateOrder = async () => {
    if (!customerEmail.trim()) {
      setErrorMsg('Vui lòng nhập email nhận tài khoản');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: variant.id,
          customerEmail,
          paymentMethod,
          customerNote,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Có lỗi xảy ra khi tạo đơn hàng');
      }

      if (paymentMethod === 'WALLET') {
        // Thanh toán ví thành công tức thì
        onSuccess(data.orderCode, data.deliveredData);
      } else {
        // Chuyển sang hiển thị mã VietQR để khách quét
        setQrData(data);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Tự động kiểm tra trạng thái thanh toán từ ngân hàng (Webhook / Polling)
  useEffect(() => {
    if (!qrData?.orderCode) return;

    let isSubscribed = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${qrData.orderCode}`);
        const result = await res.json();
        if (result.success && result.data) {
          const order = result.data;
          if (order.status === 'COMPLETED' || order.status === 'PROCESSING_DROPSHIP') {
            const deliveredData = order.items?.[0]?.deliveredData || '';
            if (isSubscribed) {
              clearInterval(interval);
              onSuccess(qrData.orderCode, deliveredData);
            }
          }
        }
      } catch (e) {
        // Lỗi mạng tạm thời, tiếp tục thử vòng lặp sau
      }
    }, 2500);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [qrData?.orderCode, onSuccess]);

  // 2. Xác nhận đã chuyển khoản quét QR
  const handleConfirmQrPayment = async () => {
    if (!qrData) return;
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Kiểm tra trạng thái hiện tại qua API đơn hàng
      const checkRes = await fetch(`/api/orders/${qrData.orderCode}`);
      const checkData = await checkRes.json();
      if (checkData.success && checkData.data) {
        const order = checkData.data;
        if (order.status === 'COMPLETED' || order.status === 'PROCESSING_DROPSHIP') {
          onSuccess(qrData.orderCode, order.items?.[0]?.deliveredData);
          return;
        }
      }

      // 2. Thử gọi API duyệt thanh toán (dành cho môi trường dev hoặc hỗ trợ duyệt nhanh)
      const payRes = await fetch('/api/orders/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderCode: qrData.orderCode }),
      });

      const payData = await payRes.json();
      if (payData.success) {
        onSuccess(qrData.orderCode, payData.deliveredData);
        return;
      }

      setErrorMsg('Đang chờ ngân hàng xác nhận giao dịch (thường 3-10s). Hệ thống đang kiểm tra tự động...');
    } catch (err: any) {
      setErrorMsg(err.message || 'Chưa nhận được giao dịch. Vui lòng chờ trong giây lát!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xl p-6 sm:p-8 text-slate-900 dark:text-white">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          Thanh Toán Đơn Hàng
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Hệ thống xuất tài khoản tự động 24/7 ngay sau khi nhận được thanh toán.
        </p>

        {/* Tóm tắt món hàng */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="font-bold text-sm text-slate-900 dark:text-white">{product.title}</div>
            <div className="text-xs text-blue-600 dark:text-sky-400 font-medium">{variant.name}</div>
          </div>
          <div className="text-lg font-black text-blue-600 dark:text-sky-400">
            {formatCurrency(variant.price)}
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* NẾU ĐANG CHỜ QUÉT MÃ VIETQR */}
        {qrData ? (
          <div className="mt-6 text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>Quét QR Chuyển Khoản Nhận Tài Khoản Trong 5s</span>
            </div>

            {/* Ảnh mã VietQR */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200 dark:border-slate-700 inline-block shadow-lg">
              <img
                src={qrData.qrUrl}
                alt="VietQR Code"
                className="w-56 h-56 mx-auto object-contain"
              />
            </div>

            {/* Chi tiết chuyển khoản */}
            <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-left text-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Ngân hàng:</span>
                <span className="font-bold">{qrData.bankInfo.bankId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Số tài khoản:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold">{qrData.bankInfo.accountNo}</span>
                  <button
                    onClick={() => copyToClipboard(qrData.bankInfo.accountNo, 'acc')}
                    className="p-1 text-blue-600 hover:text-blue-700"
                    title="Sao chép"
                  >
                    {copiedField === 'acc' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Chủ tài khoản:</span>
                <span className="font-bold">{qrData.bankInfo.accountName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Số tiền:</span>
                <div className="flex items-center gap-2">
                  <span className="font-black text-blue-600 dark:text-sky-400">{formatCurrency(qrData.totalAmount)}</span>
                  <button
                    onClick={() => copyToClipboard(qrData.totalAmount.toString(), 'amount')}
                    className="p-1 text-blue-600 hover:text-blue-700"
                    title="Sao chép số tiền"
                  >
                    {copiedField === 'amount' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-300 dark:border-amber-800">
                <span className="text-amber-800 dark:text-amber-300 font-bold">Nội dung CK:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-amber-900 dark:text-amber-200">{qrData.bankInfo.transferContent}</span>
                  <button
                    onClick={() => copyToClipboard(qrData.bankInfo.transferContent, 'content')}
                    className="p-1 text-amber-700 hover:text-amber-900"
                    title="Sao chép nội dung"
                  >
                    {copiedField === 'content' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Trạng thái lắng nghe tự động */}
            <div className="flex items-center justify-center gap-2 py-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>Đang tự động kiểm tra giao dịch từ ngân hàng mỗi 2.5s...</span>
            </div>

            {/* Nút xác nhận thanh toán */}
            <div className="pt-1">
              <button
                onClick={handleConfirmQrPayment}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Tôi Đã Chuyển Khoản Xong - Kiểm Tra Ngay</span>
              </button>
            </div>
          </div>
        ) : (
          /* NẾU CHƯA TẠO ĐƠN - NHẬP THÔNG TIN VÀ CHỌN PHƯƠNG THỨC */
          <div className="mt-6 space-y-4">
            {/* Nhập email nhận tài khoản */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email nhận tài khoản & bảo hành: <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="vd: tenban@gmail.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Ghi chú hoặc email cần nâng cấp */}
            {product.deliveryType === 'MANUAL_UPGRADE' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email / Tài khoản cần nâng cấp chính chủ:
                </label>
                <input
                  type="text"
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="Nhập email Adobe / Canva / Spotify của bạn..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Chọn phương thức thanh toán */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Phương thức thanh toán:
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Cách 1: Quét VietQR */}
                <div
                  onClick={() => setPaymentMethod('VIETQR')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'VIETQR'
                      ? 'border-blue-600 dark:border-sky-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                    <span className="font-bold text-xs sm:text-sm">Quét VietQR</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Mở app ngân hàng / Momo quét mã thanh toán ngay
                  </p>
                </div>

                {/* Cách 2: Trừ tiền Ví */}
                <div
                  onClick={() => setPaymentMethod('WALLET')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'WALLET'
                      ? 'border-blue-600 dark:border-sky-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-bold text-xs sm:text-sm">Số Dư Ví</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                    Ví hiện có: {formatCurrency(userBalance)}
                  </div>
                </div>
              </div>
            </div>

            {/* Nút Thanh Toán */}
            <div className="pt-4">
              <button
                onClick={handleCreateOrder}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 fill-current" />
                )}
                <span>
                  {paymentMethod === 'WALLET'
                    ? `Thanh Toán Bằng Ví (${formatCurrency(variant.price)})`
                    : `Tạo Mã VietQR Thanh Toán (${formatCurrency(variant.price)})`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
