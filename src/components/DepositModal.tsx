'use client';

import React, { useState } from 'react';
import { X, Wallet, QrCode, Copy, Check, Loader2, AlertCircle, Zap } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface DepositModalProps {
  onClose: () => void;
  onDepositSuccess: (newBalance: number) => void;
}

const PRESET_AMOUNTS = [20000, 50000, 100000, 200000, 500000, 1000000];

export function DepositModal({ onClose, onDepositSuccess }: DepositModalProps) {
  const [amount, setAmount] = useState<number>(100000);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Dữ liệu sau khi tạo mã nạp
  const [depositData, setDepositData] = useState<{
    transCode: string;
    amount: number;
    qrUrl: string;
    bankInfo: {
      bankId: string;
      accountNo: string;
      accountName: string;
      transferContent: string;
    };
  } | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreateDeposit = async () => {
    if (amount < 10000) {
      setErrorMsg('Số tiền nạp tối thiểu là 10.000 đ');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Lỗi khi tạo mã nạp');
      }

      setDepositData(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDeposit = async () => {
    if (!depositData) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/wallet/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transCode: depositData.transCode }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Chưa nhận được giao dịch. Vui lòng thử lại sau vài giây!');
      }

      onDepositSuccess(data.newBalance);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xl p-6 sm:p-8 text-slate-900 dark:text-white">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Nạp Tiền Vào Ví Tự Động
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quét mã VietQR chuyển khoản cộng tiền trong 5-10 giây
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* NẾU ĐÃ TẠO MÃ QR NẠP */}
        {depositData ? (
          <div className="mt-6 text-center space-y-4">
            <div className="p-3 bg-white rounded-2xl border border-slate-200 dark:border-slate-700 inline-block shadow-lg">
              <img
                src={depositData.qrUrl}
                alt="VietQR nạp tiền"
                className="w-56 h-56 mx-auto object-contain"
              />
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-left text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Ngân hàng:</span>
                <span className="font-bold">{depositData.bankInfo.bankId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Số tài khoản:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold">{depositData.bankInfo.accountNo}</span>
                  <button
                    onClick={() => copyToClipboard(depositData.bankInfo.accountNo, 'acc')}
                    className="p-1 text-blue-600 hover:text-blue-700"
                  >
                    {copiedField === 'acc' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Số tiền nạp:</span>
                <div className="flex items-center gap-2">
                  <span className="font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(depositData.amount)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-300 dark:border-amber-800">
                <span className="text-amber-800 dark:text-amber-300 font-bold">Nội dung CK:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-amber-900 dark:text-amber-200">{depositData.bankInfo.transferContent}</span>
                  <button
                    onClick={() => copyToClipboard(depositData.bankInfo.transferContent, 'content')}
                    className="p-1 text-amber-700 hover:text-amber-900"
                  >
                    {copiedField === 'content' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleVerifyDeposit}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Tôi Đã Chuyển Khoản Xong - Kiểm Tra & Cộng Tiền Ngay</span>
            </button>
          </div>
        ) : (
          /* NẾU CHƯA TẠO MÃ - CHỌN MỆNH GIÁ */
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Chọn nhanh số tiền muốn nạp:
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {PRESET_AMOUNTS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      amount === val
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-sky-400 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-slate-300'
                    }`}
                  >
                    {formatCurrency(val)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Hoặc nhập số tiền tùy ý (VND):
              </label>
              <input
                type="number"
                min={10000}
                step={10000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold text-blue-600 dark:text-sky-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleCreateDeposit}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
              <span>Tạo Mã VietQR Nạp {formatCurrency(amount)}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
