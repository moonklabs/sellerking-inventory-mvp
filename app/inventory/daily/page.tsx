'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { inventoryApi } from '@/lib/api';
import type { DailyInventory } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

type DailyInventoryWithChildren = DailyInventory & { children?: DailyInventory[] };

interface OrderDialogState {
  open: boolean;
  item: DailyInventoryWithChildren | null;
  qty: string;
  unitPrice: string;
  memo: string;
  success: boolean;
}

function buildTree(flat: DailyInventory[]): DailyInventoryWithChildren[] {
  const roots = flat.filter((i) => i.parent_id === null);
  return roots.map((root) => ({
    ...root,
    children: flat.filter((i) => i.parent_id === root.id),
  }));
}

// 입고권장 계산 함수 (오늘: 2026-03-02)
function calcRecommendInbound(
  item: DailyInventoryWithChildren,
  dailyTarget: number
): number {
  const today = new Date('2026-03-02');
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysElapsed = dayOfMonth;
  const daysRemaining = daysInMonth - dayOfMonth;

  if (dailyTarget > 0) {
    const recommended =
      dailyTarget * daysRemaining - item.market_stock - item.inbound_in_progress;
    return Math.max(0, recommended);
  } else {
    if (daysElapsed === 0) return 0;
    const dailyAvg = item.month_sales / daysElapsed;
    const recommended =
      Math.ceil(dailyAvg * 30) - item.market_stock - item.inbound_in_progress;
    return Math.max(0, recommended);
  }
}

export default function DailyInventoryPage() {
  const [items, setItems] = useState<DailyInventoryWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [dailyTargets, setDailyTargets] = useState<Record<string, number>>({});
  const [orderDialog, setOrderDialog] = useState<OrderDialogState>({
    open: false,
    item: null,
    qty: '',
    unitPrice: '',
    memo: '',
    success: false,
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await inventoryApi.getDailyInventory();
      if (res.error) setError(res.error.message);
      else setItems(buildTree(res.data ?? []));
      setLoading(false);
    }
    load();
  }, []);

  const today = new Date('2026-03-02').toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openOrderDialog(item: DailyInventoryWithChildren) {
    setOrderDialog({ open: true, item, qty: '', unitPrice: '', memo: '', success: false });
  }

  const totalAmount =
    orderDialog.qty && orderDialog.unitPrice
      ? Number(orderDialog.qty) * Number(orderDialog.unitPrice)
      : 0;

  async function handleOrderSubmit() {
    if (!orderDialog.item || !orderDialog.qty || !orderDialog.unitPrice) return;
    const item = orderDialog.item;
    const productName =
      (item.product_name ?? '') +
      (item.option && item.option !== '전체' ? ` (${item.option})` : '');

    await inventoryApi.createOrder({
      order_no: `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      store: '쿠팡',
      sales_type: '그로스',
      request_date: '2026-03-02',
      product_name: productName,
      order_qty: Number(orderDialog.qty),
      unit_price: Number(orderDialog.unitPrice),
      total_amount: totalAmount,
      status: 'purchase_confirmed',
      customs_tax: 0,
      domestic_shipping: 0,
      china_freight: 0,
      memo: orderDialog.memo || null,
    });

    setOrderDialog((prev) => ({ ...prev, success: true }));
  }

  function renderRow(item: DailyInventoryWithChildren, isChild = false): React.ReactNode {
    const isExpanded = expandedRows.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const dailyTarget = dailyTargets[item.id] ?? item.daily_target;
    const recommendInbound = calcRecommendInbound(item, dailyTarget);

    return (
      <>
        <tr
          key={item.id}
          className={cn(
            'border-b hover:bg-gray-50 transition-colors',
            isChild && 'bg-blue-50/30'
          )}
        >
          {/* + 토글 */}
          <td className="px-3 py-2.5 text-center">
            {hasChildren && !isChild && (
              <button
                onClick={() => toggleRow(item.id)}
                className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
              >
                {isExpanded ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              </button>
            )}
            {isChild && <span className="text-gray-300 text-xs">└</span>}
          </td>

          {/* 별칭 */}
          <td className="px-3 py-2.5 whitespace-nowrap">
            {!isChild && (
              <Badge variant="outline" className="text-xs text-gray-600 font-normal">
                {item.alias}
              </Badge>
            )}
          </td>

          {/* 상품ID */}
          <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap font-mono">
            {!isChild && item.product_id}
          </td>

          {/* 상품명 */}
          <td className="px-3 py-2.5 whitespace-nowrap">
            <div className={cn('font-medium text-sm', isChild && 'text-gray-600 text-xs')}>
              {item.product_name ?? ''}
            </div>
            {isChild && <div className="text-xs text-gray-400">{item.option}</div>}
            {!isChild && hasChildren && (
              <div className="text-xs text-gray-400">전체</div>
            )}
          </td>

          {/* 순이익금 */}
          <td className="px-3 py-2.5 text-right whitespace-nowrap text-blue-600 font-medium text-sm">
            {(item.net_profit / 10000).toFixed(0)}만원
          </td>

          {/* 재고금액 */}
          <td className="px-3 py-2.5 text-right whitespace-nowrap text-gray-600 text-sm">
            {(item.inventory_value / 10000).toFixed(0)}만원
          </td>

          {/* 월판매수량 */}
          <td className="px-3 py-2.5 text-right whitespace-nowrap text-sm">
            {item.month_sales.toLocaleString()}
          </td>

          {/* 일판매수량 */}
          <td className="px-3 py-2.5 text-right whitespace-nowrap text-sm">
            {item.day_sales.toLocaleString()}
          </td>

          {/* 광고판매량 */}
          <td className="px-3 py-2.5 text-right whitespace-nowrap text-sm text-gray-400">
            {item.ad_sales > 0 ? item.ad_sales.toLocaleString() : (
              <span className="text-xs text-gray-300">0</span>
            )}
          </td>

          {/* 자연판매량 */}
          <td className="px-3 py-2.5 text-right whitespace-nowrap text-sm text-gray-400">
            {item.natural_sales > 0 ? item.natural_sales.toLocaleString() : (
              <span className="text-xs text-gray-300">0</span>
            )}
          </td>

          {/* 진행광고비 */}
          <td className="px-3 py-2.5 text-right whitespace-nowrap text-sm text-gray-400">
            {item.ad_spend > 0 ? (
              <span className="text-red-500">{item.ad_spend.toLocaleString()}원</span>
            ) : (
              <span className="text-xs text-gray-300">0원</span>
            )}
          </td>

          {/* 마켓재고 */}
          <td className="px-3 py-2.5 text-right whitespace-nowrap text-sm">
            <span
              className={cn(
                item.market_stock < 20 ? 'text-red-600 font-semibold' : 'text-gray-700'
              )}
            >
              {item.market_stock.toLocaleString()}
            </span>
          </td>

          {/* 국내총재고 */}
          <td className="px-3 py-2.5 text-right whitespace-nowrap text-sm text-gray-700">
            {item.domestic_stock.toLocaleString()}
          </td>

          {/* 일목표수량 (편집 가능) */}
          <td className="px-3 py-2.5 text-center whitespace-nowrap">
            <input
              type="number"
              value={dailyTarget}
              onChange={(e) =>
                setDailyTargets((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))
              }
              className="w-16 text-center text-sm border border-gray-200 rounded px-1 py-0.5 hover:border-blue-400 focus:border-blue-500 focus:outline-none"
            />
          </td>

          {/* 입고권장 (동적 계산) */}
          <td className="px-3 py-2.5 text-center whitespace-nowrap">
            {recommendInbound > 0 ? (
              <Badge variant="destructive" className="text-xs">
                {recommendInbound.toLocaleString()}개
              </Badge>
            ) : (
              <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
                재고 충분
              </Badge>
            )}
          </td>

          {/* 입고중 */}
          <td className="px-3 py-2.5 text-right whitespace-nowrap text-sm">
            {item.inbound_in_progress > 0 ? (
              <span className="text-orange-600 font-medium">
                {item.inbound_in_progress.toLocaleString()}
              </span>
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </td>

          {/* 재고입고 */}
          <td className="px-3 py-2.5 text-center whitespace-nowrap">
            <Button variant="outline" size="sm" className="text-xs h-7">
              입고
            </Button>
          </td>

          {/* 재고주문 */}
          <td className="px-3 py-2.5 text-center whitespace-nowrap">
            <Button
              size="sm"
              className="text-xs h-7"
              onClick={() => openOrderDialog(item)}
            >
              발주
            </Button>
          </td>
        </tr>

        {/* 자식 행 렌더링 */}
        {hasChildren &&
          isExpanded &&
          item.children!.map((child) => renderRow(child as DailyInventoryWithChildren, true) as React.ReactNode)}
      </>
    );
  }

  if (loading) return <div className="p-8 text-center text-gray-500">로딩 중...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      {/* 날짜 + 계산 기준 */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">조회일:</span>
        <span className="text-sm font-semibold text-gray-800">{today} 기준</span>
        <Badge variant="outline" className="text-xs text-gray-500">
          경과 2일 | 남은 29일
        </Badge>
        <span className="text-xs text-gray-400">
          * 광고판매량/자연판매량/진행광고비는 Phase 2에서 제공
        </span>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
        <table className="w-full min-w-[1600px] text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-xs text-gray-500">
              <th className="w-8 px-3 py-3 text-center">+</th>
              <th className="px-3 py-3 text-left whitespace-nowrap">별칭</th>
              <th className="px-3 py-3 text-left whitespace-nowrap">상품ID</th>
              <th className="px-3 py-3 text-left whitespace-nowrap">상품명</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">순이익금</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">재고금액</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">월판매수량</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">일판매수량</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">
                <span className="text-gray-400">광고판매량</span>
              </th>
              <th className="px-3 py-3 text-right whitespace-nowrap">
                <span className="text-gray-400">자연판매량</span>
              </th>
              <th className="px-3 py-3 text-right whitespace-nowrap">
                <span className="text-gray-400">진행광고비</span>
              </th>
              <th className="px-3 py-3 text-right whitespace-nowrap">마켓재고</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">국내총재고</th>
              <th className="px-3 py-3 text-center whitespace-nowrap">일목표수량</th>
              <th className="px-3 py-3 text-center whitespace-nowrap">입고권장</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">입고중</th>
              <th className="px-3 py-3 text-center whitespace-nowrap">재고입고</th>
              <th className="px-3 py-3 text-center whitespace-nowrap">재고주문</th>
            </tr>
          </thead>
          <tbody>{items.map((item) => renderRow(item))}</tbody>
        </table>
      </div>

      {/* 발주 Dialog */}
      <Dialog
        open={orderDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setOrderDialog((prev) => ({ ...prev, open: false, success: false }));
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>발주 등록</DialogTitle>
          </DialogHeader>
          {orderDialog.success ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-sm font-semibold text-gray-800">발주가 등록되었습니다</div>
              <div className="text-xs text-gray-500">
                재고관리(주문) &gt; 구매확정 탭에서 확인하세요
              </div>
            </div>
          ) : (
            orderDialog.item && (
              <div className="space-y-4">
                <div className="text-sm text-gray-500">
                  {orderDialog.item.product_name}
                  {orderDialog.item.option && orderDialog.item.option !== '전체' && ` · ${orderDialog.item.option}`}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>발주수량</Label>
                    <Input
                      type="number"
                      placeholder="수량"
                      value={orderDialog.qty}
                      onChange={(e) =>
                        setOrderDialog((prev) => ({ ...prev, qty: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>구매단가 (원)</Label>
                    <Input
                      type="number"
                      placeholder="단가"
                      value={orderDialog.unitPrice}
                      onChange={(e) =>
                        setOrderDialog((prev) => ({ ...prev, unitPrice: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">총액 (자동계산)</span>
                    <span className="font-semibold text-blue-600">
                      {totalAmount > 0 ? `${totalAmount.toLocaleString()}원` : '-'}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>메모</Label>
                  <Input
                    placeholder="메모 (선택)"
                    value={orderDialog.memo}
                    onChange={(e) =>
                      setOrderDialog((prev) => ({ ...prev, memo: e.target.value }))
                    }
                  />
                </div>
              </div>
            )
          )}
          <DialogFooter>
            {orderDialog.success ? (
              <Button
                variant="outline"
                onClick={() =>
                  setOrderDialog((prev) => ({ ...prev, open: false, success: false }))
                }
              >
                닫기
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setOrderDialog((prev) => ({ ...prev, open: false }))}
                >
                  취소
                </Button>
                <Button
                  onClick={handleOrderSubmit}
                  disabled={!orderDialog.qty || !orderDialog.unitPrice}
                >
                  발주 등록
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
