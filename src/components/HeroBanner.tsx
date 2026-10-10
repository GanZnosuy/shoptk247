'use client';

import React from 'react';
import { Search, ShieldCheck, Zap, Clock, RefreshCw, CheckCircle2 } from 'lucide-react';

interface HeroBannerProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
}

export function HeroBanner({ searchQuery, onSearchChange }: HeroBannerProps) {
  return (
    <div className="relative overflow-hidden py-12 md:py-16 border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-b from-blue-50/50 via-white to-transparent dark:from-blue-950/20 dark:via-[#090d16] dark:to-[#090d16]">
      {/* Glow background effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-5 shadow-sm">
          <Zap className="w-3.5 h-3.5" />
          <span>Hệ Thống Bán Tài Khoản Tự Động 24/7 • Giao Dịch Trong 5 Giây</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight md:leading-tight">
          Kho Tài Khoản Số, AI, Bản Quyền & Proxy{' '}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-sky-400 dark:via-blue-500 dark:to-purple-400 bg-clip-text text-transparent">
            Giá Tốt Nhất
          </span>
        </h1>

        <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Google AI Pro, Netflix 4K, ChatGPT Plus, Canva Pro, Adobe, Windows/Office Key, API Keys, Proxy & VPN chất lượng cao. Thanh toán VietQR hoặc Ví nhận tài khoản ngay lập tức.
        </p>

        {/* Live Search Bar */}
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm kiếm: Google AI, Netflix, ChatGPT, Canva, Windows Key, Proxy..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm sm:text-base shadow-lg shadow-blue-500/5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Xóa
              </button>
            )}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto text-left">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm">
            <Zap className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Giao Tức Thì</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Xuất tài khoản trong 5s</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Bảo Hành 100%</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">1 đổi 1 full thời gian</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm">
            <Clock className="w-5 h-5 text-sky-500 shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Hỗ Trợ 24/7</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Tự động xử lý tức thì</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm">
            <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Thanh Toán VietQR</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Tự động duyệt 24/7</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
