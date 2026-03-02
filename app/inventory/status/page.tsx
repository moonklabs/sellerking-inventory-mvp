'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { inventoryApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ShoppingCart } from 'lucide-react';

type StatusItem = {
  product_id: string;
  alias: string;
  name: string;
  option: string | null;
  market_stock: number;
  domestic_stock: number;
  daily_avg_sales: number;
  monthly_target: number;
  remaining_days: number;
  recommended_stock: number;
  risk_level: 'danger' | 'warning' | 'safe';
};

const RISK_CONFIG = {
  danger: {
    emoji: '🔴',
    label: '발주필요',
    badgeClass: 'bg-red-100 text-red-700',
    textClass: 'text-red-600',
  },
  warning: {
    emoji: '🟡',
    label: '재고주의',
    badgeClass: 'bg-yellow-100 text-yellow-700',
    textClass: 'text-yellow-600',
  },
  safe: {
    emoji: '🟢',
    label: '재고정상',
    badgeClass: 'bg-green-100 text-green-700',
    textClass: 'text-green-600',
  },
};

export default function InventoryStatusPage() {
  const [products, setProducts] = useState<StatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await inventoryApi.getStatus();
      if (res.error) setError(res.error.message);
      else setProducts(res.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">로딩 중...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  const dangerCount = products.filter((p) => p.risk_level === 'danger').length;
  const warningCount = products.filter((p) => p.risk_level === 'warning').length;
  const safeCount = products.filter((p) => p.risk_level === 'safe').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">재고 현황 대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">
          상품별 재고 현황 및 발주 필요 여부를 확인하세요.
        </p>
      </div>

      {/* 요약 카드 3개 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🔴</div>
            <div>
              <div className="text-xs text-gray-500 mb-0.5">발주 필요</div>
              <div className="text-2xl font-bold text-red-600">{dangerCount}개</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-400">잔여 판매가능일 7일 이하</div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🟡</div>
            <div>
              <div className="text-xs text-gray-500 mb-0.5">재고 주의</div>
              <div className="text-2xl font-bold text-yellow-600">{warningCount}개</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-400">잔여 판매가능일 8~14일</div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🟢</div>
            <div>
              <div className="text-xs text-gray-500 mb-0.5">재고 정상</div>
              <div className="text-2xl font-bold text-green-600">{safeCount}개</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-400">잔여 판매가능일 15일 이상</div>
        </div>
      </div>

      {/* 재고 현황 테이블 */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">재고 현황</h2>
          <span className="text-sm text-gray-500">{products.length}개 상품</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs text-gray-500">
                <th className="px-4 py-3 text-left whitespace-nowrap">상품명</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">국내총재고</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">마켓재고(그로스)</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">마켓재고(로켓)</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">월목표</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">일평균판매</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">잔여판매가능일</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">위험도</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">입고권장</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">발주</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const days = product.remaining_days;
                const risk = product.risk_level;
                const config = RISK_CONFIG[risk];
                const recommended = product.recommended_stock;

                return (
                  <tr
                    key={product.product_id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                    <td className="px-4 py-3 text-right">
                      {product.domestic_stock.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {product.market_stock.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400">
                      -
                    </td>
                    <td className="px-4 py-3 text-right">
                      {product.monthly_target.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">{product.daily_avg_sales}</td>
                    <td className={cn('px-4 py-3 text-right font-semibold', config.textClass)}>
                      {days >= 999 ? '∞' : `${days}일`}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                          config.badgeClass
                        )}
                      >
                        {config.emoji} {config.label}
                      </span>
                    </td>
                    <td
                      className={cn(
                        'px-4 py-3 text-right font-semibold',
                        recommended > 0 ? 'text-red-600' : 'text-gray-400'
                      )}
                    >
                      {recommended > 0 ? recommended.toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {recommended > 0 ? (
                        <Link href="/inventory/orders">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            바로발주
                          </Button>
                        </Link>
                      ) : (
                        <span className="text-gray-300 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
