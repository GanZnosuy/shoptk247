'use client';

import React from 'react';
import { 
  Bot, 
  Film, 
  Palette, 
  Laptop, 
  Terminal, 
  ShieldCheck, 
  Sparkles, 
  LayoutGrid 
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  _count?: { products: number };
}

interface CategoryNavProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
}

// Map icon string sang Lucide icon component
const iconMap: Record<string, React.ReactNode> = {
  Bot: <Bot className="w-4 h-4" />,
  Film: <Film className="w-4 h-4" />,
  Palette: <Palette className="w-4 h-4" />,
  Laptop: <Laptop className="w-4 h-4" />,
  Terminal: <Terminal className="w-4 h-4" />,
  ShieldCheck: <ShieldCheck className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4" />,
};

export function CategoryNav({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryNavProps) {
  return (
    <div className="py-6 border-b border-slate-200 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {/* Tất cả sản phẩm */}
          <button
            onClick={() => onSelectCategory('all')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 scale-[1.02]'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Tất Cả Sản Phẩm</span>
          </button>

          {/* Các danh mục */}
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.slug)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 scale-[1.02]'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {iconMap[cat.icon] || <Sparkles className="w-4 h-4" />}
                <span>{cat.name}</span>
                {cat._count?.products !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {cat._count.products}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
