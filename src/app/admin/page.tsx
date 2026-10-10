'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { 
  ShieldCheck, 
  TrendingUp, 
  Package, 
  Bot, 
  ArrowLeft, 
  PlusCircle, 
  Settings, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Copy,
  DollarSign,
  Send,
  Zap
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'overview' | 'import' | 'telegram' | 'settings'>('overview');
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Nhập kho
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [stockText, setStockText] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  // Cài đặt
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Sửa giá & Cấu hình lệnh chuyển tiếp sang Bot sỉ
  const [editingVariant, setEditingVariant] = useState<any | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCostPrice, setEditCostPrice] = useState<number>(0);
  const [editBotTarget, setEditBotTarget] = useState<string>('');
  const [editBotCommand, setEditBotCommand] = useState<string>('');
  const [editSaving, setEditSaving] = useState(false);

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant) return;
    setEditSaving(true);
    try {
      const res = await fetch('/api/admin/variants/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: editingVariant.id,
          price: editPrice,
          costPrice: editCostPrice,
          teleBotTarget: editBotTarget,
          teleBotCommand: editBotCommand,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingVariant(null);
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditSaving(false);
    }
  };

  // Load stats (sử dụng HttpOnly Cookie admin_session tự động đính kèm)
  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/stats');
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        setAuthError('');
        setStats(data.data);
        if (data.data.variants.length > 0 && !selectedVariantId) {
          setSelectedVariantId(data.data.variants[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load settings
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.status === 401) return;
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchSettings();
  }, []);

  const handleLoginAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) {
      setAuthError('Vui lòng nhập khóa bảo mật Admin');
      return;
    }
    setLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: adminKey.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        setAuthError(data.error || 'Khóa quản trị không chính xác!');
        setLoading(false);
        return;
      }
      // Xóa mật khẩu khỏi bộ nhớ JS sau khi đã nhận HttpOnly Cookie
      setAdminKey('');
      await fetchStats();
      await fetchSettings();
    } catch (err: any) {
      setAuthError('Lỗi kết nối xác thực');
      setLoading(false);
    }
  };

  const handleLogoutAdmin = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    setIsAuthenticated(false);
    setAdminKey('');
    setStats(null);
  };

  // Xử lý nhập kho
  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariantId || !stockText.trim()) return;

    setImportLoading(true);
    setImportResult(null);

    try {
      const res = await fetch('/api/admin/stock/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: selectedVariantId,
          stockText,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setImportResult(data.message);
        setStockText('');
        fetchStats();
      } else {
        setImportResult(`Lỗi: ${data.error}`);
      }
    } catch (err: any) {
      setImportResult(`Lỗi: ${err.message}`);
    } finally {
      setImportLoading(false);
    }
  };

  // Lưu cài đặt
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (data.success) {
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--background)]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white">Xác Thực Quản Trị Viên</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Khu vực bảo mật yêu cầu Admin Secret Key</p>
              </div>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLoginAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mã Khóa Bảo Mật (ADMIN_SECRET_KEY):
                </label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Nhập mã khóa quản trị..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Truy Cập Hệ Thống Quản Trị</span>
              </button>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Header Admin */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Bảng Quản Trị Hệ Thống (Admin Panel)
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Quản lý doanh thu, nhập kho hàng loạt và vận hành tự động hóa nguồn hàng.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogoutAdmin}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors"
            >
              <span>Khóa Phiên Admin</span>
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về Cửa Hàng</span>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Tổng Quan & Doanh Thu</span>
          </button>

          <button
            onClick={() => setActiveTab('telegram')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'telegram'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Mô Hình Bot Telegram Sỉ</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'import'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nhập Kho Hàng Loạt</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'settings'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Cài Đặt Bot & Thông Báo</span>
          </button>
        </div>

        {/* TAB 1: TỔNG QUAN DOANH THU */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* 4 Thẻ KPI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-lg">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>Tổng Doanh Thu</span>
                  <DollarSign className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                  {formatCurrency(stats?.totalRevenue || 0)}
                </div>
                <div className="text-[11px] text-emerald-600 mt-1 font-medium">Từ các đơn hàng thành công</div>
              </div>

              <div className="p-5 rounded-3xl border border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20 shadow-lg">
                <div className="flex items-center justify-between text-purple-700 dark:text-purple-300 text-xs font-bold">
                  <span>Lãi Ròng Từ Bot Telegram</span>
                  <Bot className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
                  +{formatCurrency(stats?.dropshipProfit || 0)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Chênh lệch: Doanh thu - Giá vốn bot</div>
              </div>

              <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-lg">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>Đơn Hoàn Tất</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                  {stats?.completedOrders || 0} / {stats?.totalOrders || 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Tỷ lệ thành công cao</div>
              </div>

              <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-lg">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>Tài Khoản Trong Kho Sẵn</span>
                  <Package className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                  {stats?.inStockCount || 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Sẵn sàng xuất tức thì</div>
              </div>
            </div>

            {/* Bảng Đơn Hàng Gần Đây */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl overflow-hidden p-6">
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">
                10 Đơn Hàng Gần Nhất
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <tr>
                      <th className="py-2.5 font-bold">Mã Đơn</th>
                      <th className="py-2.5 font-bold">Sản Phẩm & Gói</th>
                      <th className="py-2.5 font-bold">Khách Hàng</th>
                      <th className="py-2.5 font-bold">Tổng Tiền</th>
                      <th className="py-2.5 font-bold">Nguồn Cấp</th>
                      <th className="py-2.5 font-bold">Trạng Thái</th>
                      <th className="py-2.5 font-bold">Thời Gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {stats?.recentOrders?.map((ord: any) => (
                      <tr key={ord.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                        <td className="py-3 font-mono font-bold text-blue-600 dark:text-sky-400">
                          {ord.orderCode}
                        </td>
                        <td className="py-3">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {ord.items[0]?.variant?.product?.title}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {ord.items[0]?.variant?.name}
                          </div>
                        </td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">
                          {ord.customerEmail}
                        </td>
                        <td className="py-3 font-extrabold text-slate-900 dark:text-white">
                          {formatCurrency(ord.totalAmount)}
                        </td>
                        <td className="py-3">
                          {ord.items[0]?.variant?.sourceType === 'TELEGRAM_BOT' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-[10px]">
                              <Bot className="w-3 h-3" /> Telegram Bot
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[10px]">
                              📦 Kho Nội Bộ
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          {ord.status === 'COMPLETED' ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                              Đã hoàn thành
                            </span>
                          ) : ord.status === 'PROCESSING_DROPSHIP' ? (
                            <span className="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 font-bold text-[10px]">
                              Đã chuyển Bot sỉ
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold text-[10px]">
                              Chờ thanh toán
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-slate-400">
                          {formatDateTime(ord.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: QUẢN LÝ MÔ HÌNH TELEGRAM BOT SỈ */}
        {activeTab === 'telegram' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl border border-sky-500/30 bg-sky-50/50 dark:bg-sky-950/20 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold">
                <Bot className="w-5 h-5" />
                <h3 className="text-base">Cơ Chế Tự Động Chuyển Tiếp Đơn Hàng Sang Bot Sỉ (Bên Thứ 3)</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Khi khách thanh toán thành công trên website, Backend sẽ tự động đóng vai trò Client (MTProto Userbot) chuyển tiếp lệnh mua hàng trực tiếp đến Bot bán sỉ của nhà cung cấp bên thứ 3 mà bạn cấu hình bên dưới. Ngay khi con Bot đó phản hồi tài khoản, hệ thống tự động bóc tách và bàn giao cho khách hàng!
              </p>
            </div>

            {/* Bảng Danh Sách Sản Phẩm Liên Kết Telegram */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl p-6">
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">
                Danh Sách Sản Phẩm & Cấu Hình Lệnh Chuyển Tiếp Tới Bot Nguồn
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <tr>
                      <th className="py-2.5 font-bold">Tên Sản Phẩm & Gói</th>
                      <th className="py-2.5 font-bold">Hình Thức Nguồn</th>
                      <th className="py-2.5 font-bold">Bot Đích (Bên Thứ 3)</th>
                      <th className="py-2.5 font-bold">Lệnh Gửi Tới Bot</th>
                      <th className="py-2.5 font-bold">Giá Vốn Bot</th>
                      <th className="py-2.5 font-bold">Giá Bán Web</th>
                      <th className="py-2.5 font-bold">Lợi Nhuận</th>
                      <th className="py-2.5 font-bold text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {stats?.variants?.map((v: any) => {
                      const profit = v.costPrice ? v.price - v.costPrice : v.price;
                      return (
                        <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="py-3">
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {v.product.title}
                            </div>
                            <div className="text-[11px] text-blue-600 dark:text-sky-400">
                              {v.name}
                            </div>
                          </td>
                          <td className="py-3">
                            {v.sourceType === 'TELEGRAM_BOT' ? (
                              <span className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold text-[10px]">
                                🔄 Forward Tới Bot Sỉ
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 font-medium text-[10px]">
                                📦 Kho: {v._count?.stockItems || 0} acc
                              </span>
                            )}
                          </td>
                          <td className="py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                            {v.teleBotTarget || '@SupplierWholesaleBot'}
                          </td>
                          <td className="py-3 font-mono text-slate-500">
                            {v.teleBotCommand || '—'}
                          </td>
                          <td className="py-3 font-semibold text-slate-500">
                            {v.costPrice ? formatCurrency(v.costPrice) : '0 đ'}
                          </td>
                          <td className="py-3 font-extrabold text-blue-600 dark:text-sky-400">
                            {formatCurrency(v.price)}
                          </td>
                          <td className="py-3 font-black text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(profit)}
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => {
                                setEditingVariant(v);
                                setEditPrice(v.price);
                                setEditCostPrice(v.costPrice || 0);
                                setEditBotTarget(v.teleBotTarget || '@SupplierWholesaleBot');
                                setEditBotCommand(v.teleBotCommand || '');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-sky-400 hover:bg-blue-100 dark:hover:bg-blue-900 text-[11px] font-bold border border-blue-500/20 transition-colors"
                            >
                              Cấu Hình & Giá
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: NHẬP KHO HÀNG LOẠT */}
        {activeTab === 'import' && (
          <div className="max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="font-black text-xl text-slate-900 dark:text-white">
                Nhập Kho Hàng Loạt (Bulk Import)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Dán danh sách tài khoản cần bán vào ô bên dưới, mỗi dòng một tài khoản hoặc key. Hệ thống sẽ tự động bóc tách và cộng vào kho.
              </p>
            </div>

            {importResult && (
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-500/30 text-blue-700 dark:text-sky-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{importResult}</span>
              </div>
            )}

            <form onSubmit={handleBulkImport} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Chọn gói sản phẩm cần nhập kho:
                </label>
                <select
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {stats?.variants?.map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {v.product.title} — {v.name} (Kho hiện tại: {v._count?.stockItems || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dữ liệu tài khoản (Mỗi dòng 1 acc hoặc key):
                </label>
                <textarea
                  rows={8}
                  required
                  value={stockText}
                  onChange={(e) => setStockText(e.target.value)}
                  placeholder={`acc1@gmail.com|pass123\nacc2@gmail.com|pass456\nW269N-WFGWX-YVC9B-4J6C9-T83GX\n103.142.12.89:8080:usr:pwd`}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={importLoading}
                className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {importLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                <span>Tiến Hành Nhập Vào Kho</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: CÀI ĐẶT LIÊN KẾT BOT SỈ & THÔNG TIN HỆ THỐNG */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="font-black text-xl text-slate-900 dark:text-white">
                Cấu Hình Liên Kết Bot Sỉ (Bên Thứ 3) & Hệ Thống
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Cấu hình phiên kết nối Telegram Client (MTProto Userbot) để khi web có đơn hàng mới, Backend tự động chuyển tiếp lệnh mua sang con Bot của bên cung cấp sỉ.
              </p>
            </div>

            {settingsSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Đã lưu toàn bộ cấu hình thành công!</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Username Bot Sỉ Mặc Định (Của bên cung cấp):
                </label>
                <input
                  type="text"
                  value={settings['SUPPLIER_BOT_DEFAULT_USERNAME'] || ''}
                  onChange={(e) => setSettings({ ...settings, SUPPLIER_BOT_DEFAULT_USERNAME: e.target.value })}
                  placeholder="VD: @SupplierWholesaleBot"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Username của con bot bán sỉ mà Backend sẽ tự động nhắn lệnh mua hàng khi khách thanh toán.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phiên Kết Nối Tự Động (TELEGRAM_USERBOT_SESSION):
                </label>
                <input
                  type="text"
                  value={settings['TELEGRAM_USERBOT_SESSION'] || ''}
                  onChange={(e) => setSettings({ ...settings, TELEGRAM_USERBOT_SESSION: e.target.value })}
                  placeholder="Chạy: node scripts/setup-telegram-client.mjs hoặc dán StringSession vào đây"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Chạy lệnh <code className="text-purple-500 font-bold">node scripts/setup-telegram-client.mjs</code> trong Terminal để đăng nhập và tự động đồng bộ phiên gửi lệnh.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên Shop Hiển Thị:
                </label>
                <input
                  type="text"
                  value={settings['STORE_NAME'] || ''}
                  onChange={(e) => setSettings({ ...settings, STORE_NAME: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Hotline / Zalo Hỗ Trợ:
                </label>
                <input
                  type="text"
                  value={settings['HOTLINE'] || ''}
                  onChange={(e) => setSettings({ ...settings, HOTLINE: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Link Hỗ Trợ Khách Hàng:
                </label>
                <input
                  type="text"
                  value={settings['TELEGRAM_SUPPORT'] || ''}
                  onChange={(e) => setSettings({ ...settings, TELEGRAM_SUPPORT: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={settingsLoading}
                className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {settingsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
                <span>Lưu Cấu Hình Hệ Thống</span>
              </button>
            </form>
          </div>
        )}

        {/* MODAL SỬA GIÁ & CẤU HÌNH LỆNH BOT ĐÍCH */}
        {editingVariant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xl p-6 text-slate-900 dark:text-white">
              <h3 className="text-lg font-black mb-1">
                Cấu Hình Gói & Lệnh Gửi Tới Bot Sỉ
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                {editingVariant.product.title} — <span className="text-blue-600 dark:text-sky-400 font-bold">{editingVariant.name}</span>
              </p>

              <form onSubmit={handleSavePrice} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bot Đích Của Nhà Cung Cấp (Username):
                  </label>
                  <input
                    type="text"
                    value={editBotTarget}
                    onChange={(e) => setEditBotTarget(e.target.value)}
                    placeholder="VD: @SupplierWholesaleBot"
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Lệnh Tự Động Gửi Đến Bot Khi Có Đơn:
                  </label>
                  <input
                    type="text"
                    value={editBotCommand}
                    onChange={(e) => setEditBotCommand(e.target.value)}
                    placeholder="VD: /buy gemini_18m_5tb"
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Giá Vốn Bot (VND):
                    </label>
                    <input
                      type="number"
                      step={1000}
                      value={editCostPrice}
                      onChange={(e) => setEditCostPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Giá Bán Web (VND):
                    </label>
                    <input
                      type="number"
                      step={1000}
                      value={editPrice}
                      onChange={(e) => setEditPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-black text-blue-600 dark:text-sky-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Tính nhẩm lãi */}
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-xs flex justify-between items-center font-bold text-emerald-700 dark:text-emerald-400">
                  <span>Lãi chênh lệch ước tính:</span>
                  <span className="text-sm">
                    +{formatCurrency(editPrice - editCostPrice)}
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingVariant(null)}
                    className="w-1/2 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-colors"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={editSaving}
                    className="w-1/2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-colors disabled:opacity-50"
                  >
                    {editSaving ? 'Đang Lưu...' : 'Lưu Cấu Hình'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
