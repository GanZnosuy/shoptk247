'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { HeroBanner } from '@/components/HeroBanner';
import { CategoryNav } from '@/components/CategoryNav';
import { ProductCard, ProductData, ProductVariantData } from '@/components/ProductCard';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { CheckoutModal } from '@/components/CheckoutModal';
import { OrderSuccessModal } from '@/components/OrderSuccessModal';
import { DepositModal } from '@/components/DepositModal';
import { Footer } from '@/components/Footer';
import { Loader2, PackageOpen, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Trạng thái tài khoản người dùng
  const [userBalance, setUserBalance] = useState(500000);

  // Modals
  const [viewProduct, setViewProduct] = useState<ProductData | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<ProductData | null>(null);
  const [checkoutVariant, setCheckoutVariant] = useState<ProductVariantData | null>(null);
  const [successOrder, setSuccessOrder] = useState<{ code: string; data?: string } | null>(null);
  const [isDepositOpen, setIsDepositOpen] = useState(false);

  // Load danh mục & số dư
  useEffect(() => {
    async function initData() {
      try {
        const [catRes, userRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/user/info'),
        ]);

        const catData = await catRes.json();
        if (catData.success) setCategories(catData.data);

        const userData = await userRes.json();
        if (userData.success && userData.data) {
          setUserBalance(userData.data.balance);
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu ban đầu:', err);
      }
    }
    initData();
  }, []);

  // Load sản phẩm theo bộ lọc
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedCategory && selectedCategory !== 'all') {
          queryParams.set('category', selectedCategory);
        }
        if (searchQuery.trim()) {
          queryParams.set('search', searchQuery.trim());
        }

        const res = await fetch(`/api/products?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success) {
          setProducts(data.data);
        }
      } catch (err) {
        console.error('Lỗi tải sản phẩm:', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadProducts();
    }, 200);

    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery]);

  // Mở modal thanh toán từ modal chi tiết
  const handleProceedToCheckout = (product: ProductData, variant: ProductVariantData) => {
    setViewProduct(null);
    setCheckoutProduct(product);
    setCheckoutVariant(variant);
  };

  // Hoàn tất mua hàng
  const handleOrderSuccess = (orderCode: string, deliveredData?: string) => {
    setCheckoutProduct(null);
    setCheckoutVariant(null);
    setSuccessOrder({ code: orderCode, data: deliveredData });

    // Refresh lại số dư người dùng
    fetch('/api/user/info')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) setUserBalance(d.data.balance);
      });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      {/* Navbar */}
      <Navbar
        userBalance={userBalance}
        onOpenDeposit={() => setIsDepositOpen(true)}
      />

      {/* Hero Banner với tìm kiếm tức thì */}
      <HeroBanner
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Thanh chọn Danh mục */}
      <CategoryNav
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Khu vực danh sách sản phẩm */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-sky-400" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              {searchQuery
                ? `Kết quả tìm kiếm cho: "${searchQuery}"`
                : selectedCategory === 'all'
                ? 'Tất Cả Sản Phẩm Có Sẵn'
                : categories.find((c) => c.slug === selectedCategory)?.name || 'Danh Sách Sản Phẩm'}
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {products.length} sản phẩm
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <span className="text-sm">Đang tải sản phẩm và kiểm tra kho...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
            <PackageOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
              Không tìm thấy sản phẩm nào phù hợp
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Hãy thử tìm với từ khóa khác (ví dụ: Google, Netflix, Canva, Key...) hoặc chọn danh mục khác.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(p) => setViewProduct(p)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal Chi tiết sản phẩm */}
      {viewProduct && (
        <ProductDetailModal
          product={viewProduct}
          onClose={() => setViewProduct(null)}
          onProceedToCheckout={handleProceedToCheckout}
        />
      )}

      {/* Modal Thanh toán (VietQR & Ví) */}
      {checkoutProduct && checkoutVariant && (
        <CheckoutModal
          product={checkoutProduct}
          variant={checkoutVariant}
          userBalance={userBalance}
          onClose={() => {
            setCheckoutProduct(null);
            setCheckoutVariant(null);
          }}
          onSuccess={handleOrderSuccess}
        />
      )}

      {/* Modal Thành công (Xem tài khoản & Copy) */}
      {successOrder && (
        <OrderSuccessModal
          orderCode={successOrder.code}
          deliveredData={successOrder.data}
          onClose={() => setSuccessOrder(null)}
        />
      )}

      {/* Modal Nạp tiền vào ví qua VietQR */}
      {isDepositOpen && (
        <DepositModal
          onClose={() => setIsDepositOpen(false)}
          onDepositSuccess={(newBal) => setUserBalance(newBal)}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
