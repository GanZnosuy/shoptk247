'use client';

import React from 'react';
import { Zap, Bot, ShieldCheck, Flame, Star, ArrowRight, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface ProductVariantData {
  id: string;
  name: string;
  durationDays: number;
  price: number;
  originalPrice?: number | null;
  sourceType: string;
  costPrice?: number | null;
  _count?: { stockItems: number };
}

export interface ProductData {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  badge?: string | null;
  deliveryType: string;
  shortDesc: string;
  warrantyPolicy?: string | null;
  usageGuide?: string | null;
  soldCount: number;
  category: { name: string; slug: string };
  variants: ProductVariantData[];
}

interface ProductCardProps {
  product: ProductData;
  onSelect: (product: ProductData) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  // Tìm gói có giá thấp nhất
  const minPrice = product.variants.length > 0
    ? Math.min(...product.variants.map((v) => v.price))
    : 0;

  const minVariant = product.variants.find((v) => v.price === minPrice);
  const originalPrice = minVariant?.originalPrice;

  // Kiểm tra có gói nào lấy từ bot telegram không
  const hasTelegramDropship = product.variants.some((v) => v.sourceType === 'TELEGRAM_BOT');

  // Tính phần trăm giảm giá nếu có
  const discountPercent = originalPrice && originalPrice > minPrice
    ? Math.round(((originalPrice - minPrice) / originalPrice) * 100)
    : null;

  return (
    <div
      onClick={() => onSelect(product)}
      className="group cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden hover:border-blue-500/50 dark:hover:border-sky-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col justify-between"
    >
      <div>
        {/* Thumbnail & Badges */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
          <img
            src={product.thumbnail}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

          {/* Top Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
            {product.badge && (
              <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-red-500 to-amber-500 text-white font-bold text-[10px] tracking-wide shadow-md flex items-center gap-1">
                <Flame className="w-3 h-3 fill-current" />
                {product.badge}
              </span>
            )}
            {hasTelegramDropship && (
              <span className="px-2 py-0.5 rounded-md bg-sky-500/90 backdrop-blur-md text-white font-bold text-[10px] flex items-center gap-1 shadow-md">
                <Bot className="w-3 h-3" />
                Auto Bot
              </span>
            )}
          </div>

          {/* Discount Badge */}
          {discountPercent && (
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-emerald-500 text-white font-black text-[11px] shadow-md">
              -{discountPercent}%
            </div>
          )}

          {/* Category Tag */}
          <div className="absolute bottom-2.5 left-2.5">
            <span className="text-[11px] font-semibold text-white/90 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md">
              {product.category.name}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors">
            {product.title}
          </h3>

          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {product.shortDesc}
          </p>

          {/* Features highlight */}
          <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Bảo hành 1:1
            </span>
            <span className="flex items-center gap-1 text-amber-500">
              <Star className="w-3.5 h-3.5 fill-current" />
              5.0 ({product.soldCount + 24})
            </span>
          </div>
        </div>
      </div>

      {/* Pricing & CTA Button */}
      <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 dark:border-slate-800/80 mt-2">
        <div className="flex items-center justify-between pt-3">
          <div>
            <div className="text-[11px] text-slate-400">Giá chỉ từ</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-extrabold text-blue-600 dark:text-sky-400">
                {formatCurrency(minPrice)}
              </span>
              {originalPrice && (
                <span className="text-xs text-slate-400 line-through">
                  {formatCurrency(originalPrice)}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 group-hover:bg-blue-500 transition-all"
          >
            <span>Mua Ngay</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
