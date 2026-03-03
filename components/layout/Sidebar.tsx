'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Crown,
  BarChart2,
  History,
  Target,
  Calculator,
  Send,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  label?: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    items: [
      { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
      { href: '/products', label: '상품관리', icon: Package },
    ],
  },
  {
    label: '재고관리',
    items: [
      { href: '/inventory/daily', label: '재고관리(일일)', icon: Warehouse },
      { href: '/inventory/orders', label: '재고관리(주문)', icon: ShoppingCart },
      { href: '/inventory/status', label: '재고 현황', icon: BarChart2 },
      { href: '/inventory/history', label: '입고 이력', icon: History },
      { href: '/inventory/goal', label: '월 목표 설정', icon: Target },
      { href: '/inventory/lcl-calc', label: 'LCL 계산기', icon: Calculator },
      { href: '/inventory/market-send', label: '마켓재고 발송', icon: Send },
    ],
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
      <nav className="flex-1 py-4 overflow-y-auto">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx}>
            {gIdx > 0 && <div className="mx-5 my-2 border-t border-gray-700" />}
            {group.label && (
              <div className="px-5 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-5 py-2.5 text-sm transition-colors hover:bg-gray-700',
                    isActive
                      ? 'bg-gray-700 text-white font-medium border-l-2 border-blue-500'
                      : 'text-gray-400'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* 하단 */}
      <div className="px-5 py-4 border-t border-gray-700 space-y-3">
        <button
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/login';
          }}
          className="flex items-center gap-2 w-full text-xs text-gray-400 hover:text-white transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          로그아웃
        </button>
        <p className="text-xs text-gray-600">v1.0.0 MVP</p>
      </div>
    </aside>
  );
}
