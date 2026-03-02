'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockInventoryProducts } from '@/lib/mock-data';

interface GoalData {
  [productId: string]: {
    isSeason: boolean;
    monthlyTarget: number;
    lastUpdated: string;
  };
}

const STORAGE_KEY = 'sellerking_monthly_goals';

const LAST_MONTH_SALES: Record<string, number> = {
  ip1: 550,
  ip2: 80,
  ip3: 280,
  ip4: 45,
  ip5: 90,
};

function calcRecommendedInbound(monthlyTarget: number, totalStock: number): number {
  const dailyTarget = monthlyTarget / 30;
  const neededStock = dailyTarget * 45;
  return Math.max(0, Math.ceil(neededStock - totalStock));
}

export default function MonthlyGoalPage() {
  const products = mockInventoryProducts;
  const [goals, setGoals] = useState<GoalData>({});
  const [editingTargets, setEditingTargets] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setGoals(JSON.parse(stored));
      } else {
        const defaultGoals: GoalData = {};
        mockInventoryProducts.forEach((p) => {
          defaultGoals[p.id] = {
            isSeason: true,
            monthlyTarget: p.monthlyTarget,
            lastUpdated: '2026-03-01',
          };
        });
        setGoals(defaultGoals);
      }
    } catch {
      const defaultGoals: GoalData = {};
      mockInventoryProducts.forEach((p) => {
        defaultGoals[p.id] = {
          isSeason: true,
          monthlyTarget: p.monthlyTarget,
          lastUpdated: '2026-03-01',
        };
      });
      setGoals(defaultGoals);
    }
  }, []);

  useEffect(() => {
    const targets: Record<string, string> = {};
    mockInventoryProducts.forEach((p) => {
      targets[p.id] = String(goals[p.id]?.monthlyTarget ?? p.monthlyTarget);
    });
    setEditingTargets(targets);
  }, [goals]);

  function toggleSeason(productId: string) {
    setGoals((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        isSeason: !prev[productId]?.isSeason,
      },
    }));
  }

  function handleSave(productId: string) {
    const target = Number(editingTargets[productId]);
    if (isNaN(target) || target < 0) return;

    const updated = {
      ...goals,
      [productId]: {
        ...goals[productId],
        monthlyTarget: target,
        lastUpdated: '2026-03-02',
      },
    };
    setGoals(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  function handleSaveAll() {
    const updated = { ...goals };
    mockInventoryProducts.forEach((p) => {
      const target = Number(editingTargets[p.id]);
      if (!isNaN(target) && target >= 0) {
        updated[p.id] = {
          ...updated[p.id],
          monthlyTarget: target,
          lastUpdated: '2026-03-02',
        };
      }
    });
    setGoals(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">월 목표 설정</h1>
          <p className="text-sm text-gray-500 mt-1">
            상품별 월 판매 목표를 설정하고 입고 권장량을 확인하세요.
          </p>
        </div>
        <Button onClick={handleSaveAll}>전체 저장</Button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs text-gray-500">
                <th className="px-4 py-3 text-left whitespace-nowrap">상품명</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">시즌상태</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">지난달 실판매</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">월목표수량</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">목표변경일</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">예상입고권장</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">저장</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const goal = goals[product.id];
                const isSeason = goal?.isSeason ?? true;
                const monthlyTarget = Number(editingTargets[product.id]) || 0;
                const lastUpdated = goal?.lastUpdated ?? '-';
                const recommended = calcRecommendedInbound(
                  monthlyTarget,
                  product.totalStock
                );
                const lastMonthSales = LAST_MONTH_SALES[product.id] ?? 0;

                return (
                  <tr key={product.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleSeason(product.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          isSeason
                            ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                            : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                        }`}
                      >
                        {isSeason ? '🌸 ON' : '❄️ OFF'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {lastMonthSales.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Input
                        type="number"
                        className="h-7 text-right text-sm w-24 ml-auto"
                        value={editingTargets[product.id] ?? ''}
                        onChange={(e) =>
                          setEditingTargets((prev) => ({
                            ...prev,
                            [product.id]: e.target.value,
                          }))
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">
                      {lastUpdated}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        recommended > 0 ? 'text-red-600' : 'text-gray-400'
                      }`}
                    >
                      {recommended > 0 ? recommended.toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleSave(product.id)}
                      >
                        저장
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t">
          <p className="text-xs text-gray-400">
            * 입고권장 = (월목표 ÷ 30일 × 45일) - 현재총재고 / 리드타임 기준 45일 적용
          </p>
        </div>
      </div>
    </div>
  );
}
