import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Zap, Send, Mail, Phone, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#090d16] text-slate-600 dark:text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Cột 1: Thông tin thương hiệu */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <span className="font-extrabold text-base text-slate-900 dark:text-white">
                SHOP ACC 24/7
              </span>
            </div>
            <p className="leading-relaxed">
              Hệ thống cung cấp tài khoản số, tài khoản AI (Google AI Pro, ChatGPT, Claude), dịch vụ giải trí (Netflix, Spotify), bản quyền Office, Windows Key và Proxy uy tín hàng đầu.
            </p>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Giao dịch an toàn • Bảo hành trọn gói</span>
            </div>
          </div>

          {/* Cột 2: Danh mục phổ biến */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-sm">Sản Phẩm Nổi Bật</h4>
            <ul className="space-y-2">
              <li><Link href="/?category=ai-tri-tue-nhan-tao" className="hover:text-blue-600">Google AI Pro & Gemini</Link></li>
              <li><Link href="/?category=ai-tri-tue-nhan-tao" className="hover:text-blue-600">ChatGPT Plus & Claude Pro</Link></li>
              <li><Link href="/?category=giai-tri-phim-anh" className="hover:text-blue-600">Netflix Premium 4K</Link></li>
              <li><Link href="/?category=do-hoa-sang-tao" className="hover:text-blue-600">Canva Pro & Adobe CC</Link></li>
              <li><Link href="/?category=ban-quyen-os-office" className="hover:text-blue-600">Key Windows 10/11 & Office 365</Link></li>
            </ul>
          </div>

          {/* Cột 3: Chính sách & Hỗ trợ */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-sm">Chính Sách & Hỗ Trợ</h4>
            <ul className="space-y-2">
              <li><Link href="/orders" className="hover:text-blue-600">Tra cứu đơn hàng</Link></li>
              <li><span className="cursor-pointer hover:text-blue-600">Chính sách bảo hành 1 đổi 1</span></li>
              <li><span className="cursor-pointer hover:text-blue-600">Quy định hoàn tiền</span></li>
              <li><span className="cursor-pointer hover:text-blue-600">Hướng dẫn thanh toán VietQR</span></li>
              <li><Link href="/admin" className="text-purple-600 hover:text-purple-700">Trang quản trị (Admin)</Link></li>
            </ul>
          </div>

          {/* Cột 4: Kênh liên hệ */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-sm">Kênh Liên Hệ 24/7</h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-500 shrink-0" />
                <a href="https://t.me" target="_blank" rel="noreferrer" className="hover:text-sky-500 font-medium">
                  Telegram: @Admin_ShopAcc
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Hotline / Zalo: 0988.888.888</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Email: support@shopacc.vn</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-slate-500 text-[11px] flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>© {new Date().getFullYear()} SHOP ACC 24/7. All rights reserved. Vận hành tự động.</div>
          <div className="flex items-center gap-1">
            <span>Thiết kế & phát triển cho các mô hình kinh doanh tài khoản số</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
