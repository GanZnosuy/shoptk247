'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { 
  Zap, 
  Wallet, 
  Search, 
  FileText, 
  ShieldCheck, 
  PlusCircle, 
  Send,
  Sparkles
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface NavbarProps {
  onOpenDeposit?: () => void;
  userBalance?: number;
}

export function Navbar({ onOpenDeposit, userBalance = 0 }: NavbarProps) {
  const [balance, setBalance] = useState(userBalance);

  useEffect(() => {
    setBalance(userBalance);
  }, [userBalance]);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-[#090d16]/85 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400 bg-clip-text text-transparent">
                SHOP ACC 24/7
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-none">
              Tài Khoản AI • Phim • Key Bản Quyền
            </p>
          </div>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Số dư ví */}
          <button
            onClick={onOpenDeposit}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
            title="Bấm để nạp thêm tiền vào ví"
          >
            <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div className="text-left hidden xs:block">
              <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 leading-none">Số dư ví</div>
              <div className="text-xs font-bold">{formatCurrency(balance)}</div>
            </div>
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ml-0.5" />
          </button>

          {/* Nút Nạp tiền VietQR */}
          <button
            onClick={onOpenDeposit}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all hover:shadow-blue-600/30"
          >
            <Zap className="w-3.5 h-3.5" />
            Nạp Tiền VietQR
          </button>

          {/* Tra cứu đơn hàng */}
          <Link
            href="/orders"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
          >
            <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="hidden md:inline">Tra Cứu Đơn</span>
          </Link>

          {/* Admin Panel */}
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-purple-500/30 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-medium transition-colors"
            title="Trang quản trị hệ thống"
          >
            <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="hidden lg:inline">Quản Trị</span>
          </Link>

          {/* Dark / Light Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
