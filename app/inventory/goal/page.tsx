'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { inventoryApi } from '@/lib/api';
import type { InventoryGoal } from '@/lib/supabase/types';

function calcRecommendedInbound(monthlyTarget: number, totalStock: number): number {
  const dailyTarget = monthlyTarget / 30;
  const neededStock = dailyTarget * 45;
  return Math.max(0, Math.ceil(neededStock - totalStock));
}

export default function MonthlyGoalPage() {
  const [goals, setGoals] = useState<InventoryGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTargets, setEditingTargets] = useState<Record<string, string>>({});
  const [isSeason, setIsSeason] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await inventoryApi.getGoals();
      if (res.error) {
        setError(res.error.message);
        setLoading(false);
        return;
      }
      const data = res.data ?? [];
      setGoals(data);
      const targets: Record<string, string> = {};
      const seasons: Record<string, boolean> = {};
      data.forEach((g) => {
        targets[g.product_id] = String(g.monthly_target);
        seasons[g.product_id] = true;
      });
      setEditingTargets(targets);
      setIsSeason(seasons);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">로딩 중...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  function toggleSeason(productId: string) {
    setIsSeason((prev) => ({ ...prev, [productId]: !prev[productId] }));
  }

  async function handleSave(productId: string) {
    const target = Number(editingTargets[productId]);
    if (isNaN(target) || target < 0) return;

    await inventoryApi.upsertGoal({
      product_id: productId,
      monthly_target: target,
    });

    const res = await inventoryApi.getGoals();
    if (res.data) setGoals(res.data);
  }

  async function handleSaveAll() {
    await Promise.all(
      goals.map((g) => {
        const target = Number(editingTargets[g.product_id]);
        if (!isNaN(target) && target >= 0) {
          return inventoryApi.upsertGoal({ product_id: g.product_id, monthly_target: target });
        }
        return Promise.resolve();
      })
    );
    const res = await inventoryApi.getGoals();
    if (res.data) setGoals(res.data);
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
              {goals.map((goal) => {
                const isSeason_val = isSeason[goal.product_id] ?? true;
                const monthlyTarget = Number(editingTargets[goal.product_id]) || 0;
                const lastUpdated = goal.updated_at.split('T')[0];
                const recommended = calcRecommendedInbound(monthlyTarget, goal.total_stock);

                return (
                  <tr key={goal.product_id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {goal.product_name ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleSeason(goal.product_id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          isSeason_val
                            ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                            : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                        }`}
                      >
                        {isSeason_val ? '🌸 ON' : '❄️ OFF'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">-</td>
                    <td className="px-4 py-3 text-right">
                      <Input
                        type="number"
                        className="h-7 text-right text-sm w-24 ml-auto"
                        value={editingTargets[goal.product_id] ?? ''}
                        onChange={(e) =>
                          setEditingTargets((prev) => ({
                            ...prev,
                            [goal.product_id]: e.target.value,
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
                        onClick={() => handleSave(goal.product_id)}
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
