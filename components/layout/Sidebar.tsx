'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Warehouse, ShoppingCart, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    href: '/dashboard',
    label: '대시보드',
    icon: LayoutDashboard,
  },
  {
    href: '/products',
    label: '상품관리',
    icon: Package,
  },
  {
    href: '/inventory/daily',
    label: '재고관리(일일)',
    icon: Warehouse,
  },
  {
    href: '/inventory/orders',
    label: '재고관리(주문)',
    icon: ShoppingCart,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col shrink-0">
      {/* 로고 */}
      <div className="flex items-center gap-2 px-5 py-6 border-b border-gray-700">
        <Crown className="w-6 h-6 text-yellow-400" />
        <span className="text-lg font-bold tracking-tight">장사왕</span>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-gray-700',
                isActive ? 'bg-gray-700 text-white font-medium border-l-2 border-blue-500' : 'text-gray-400'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 하단 */}
      <div className="px-5 py-4 border-t border-gray-700 text-xs text-gray-500">
        v1.0.0 MVP
      </div>
    </aside>
  );
}
