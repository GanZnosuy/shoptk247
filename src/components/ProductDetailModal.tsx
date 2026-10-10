'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, Zap, Bot, CheckCircle2, Clock, Info, Check } from 'lucide-react';
import { ProductData, ProductVariantData } from './ProductCard';
import { formatCurrency } from '@/lib/utils';

interface ProductDetailModalProps {
  product: ProductData | null;
  onClose: () => void;
  onProceedToCheckout: (product: ProductData, selectedVariant: ProductVariantData) => void;
}

export function ProductDetailModal({
  product,
  onClose,
  onProceedToCheckout,
}: ProductDetailModalProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');

  if (!product) return null;

  // Mặc định chọn gói đầu tiên nếu chưa chọn
  const currentVariantId = selectedVariantId || product.variants[0]?.id;
  const currentVariant = product.variants.find((v) => v.id === currentVariantId) || product.variants[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xl text-slate-900 dark:text-white p-6 sm:p-8">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Modal */}
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <img
            src={product.thumbnail}
            alt={product.title}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 shadow-md shrink-0"
          />
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-sky-300 text-xs font-semibold mb-2">
              <span>{product.category.name}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
              {product.title}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {product.shortDesc}
            </p>
          </div>
        </div>

        {/* Chọn biến thể / Gói thời hạn */}
        <div className="mt-6">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
            1. Chọn Gói Thời Hạn & Tính Năng:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {product.variants.map((v) => {
              const isSelected = v.id === currentVariant?.id;
              const inStock = v.sourceType === 'TELEGRAM_BOT' ? 99 : (v._count?.stockItems ?? 1);

              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVariantId(v.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 dark:border-sky-500 bg-blue-50/60 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        {v.name}
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Thời hạn: {v.durationDays >= 3650 ? 'Vĩnh viễn' : `${v.durationDays} ngày`}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800/60">
                    <div>
                      <div className="text-base font-extrabold text-blue-600 dark:text-sky-400">
                        {formatCurrency(v.price)}
                      </div>
                      {v.originalPrice && (
                        <div className="text-[11px] text-slate-400 line-through">
                          {formatCurrency(v.originalPrice)}
                        </div>
                      )}
                    </div>

                    {v.sourceType === 'TELEGRAM_BOT' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded-md">
                        <Zap className="w-3 h-3" /> Tự động 24/7
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                        Kho: {inStock} có sẵn
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chính sách bảo hành & Cam kết */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Cam Kết Bảo Hành & Hỗ Trợ:</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            {product.warrantyPolicy || 'Bảo hành 1 đổi 1 trong suốt thời gian sử dụng. Hỗ trợ kỹ thuật 24/7.'}
          </p>
        </div>

        {/* Nút hành động Mua ngay */}
        <div className="mt-7 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Tổng thanh toán</div>
            <div className="text-2xl font-black text-blue-600 dark:text-sky-400">
              {currentVariant ? formatCurrency(currentVariant.price) : '0 đ'}
            </div>
          </div>

          <button
            onClick={() => {
              if (currentVariant) {
                onProceedToCheckout(product, currentVariant);
              }
            }}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <Zap className="w-4 h-4 fill-current" />
            Tiến Hành Mua Ngay
          </button>
        </div>
      </div>
    </div>
  );
}
