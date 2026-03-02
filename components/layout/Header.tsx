'use client';

import { usePathname } from 'next/navigation';
import { CalendarDays } from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': '대시보드',
  '/products': '상품관리',
  '/inventory/daily': '재고관리 · 일일매출/재고',
  '/inventory/orders': '재고관리 · 주문현황',
};

export default function Header() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? '장사왕';
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <CalendarDays className="w-4 h-4" />
        <span>{today}</span>
      </div>
    </header>
  );
}
