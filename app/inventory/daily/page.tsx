'use client';

import React, { useState } from 'react';
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
import { mockDailyInventory, DailyInventoryItem, formatCurrency } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

interface OrderDialogState {
  open: boolean;
  item: DailyInventoryItem | null;
  qty: string;
  unitPrice: string;
  memo: string;
}

export default function DailyInventoryPage() {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [dailyTargets, setDailyTargets] = useState<Record<string, number>>({});
  const [orderDialog, setOrderDialog] = useState<OrderDialogState>({
    open: false,
    item: null,
    qty: '',
    unitPrice: '',
    memo: '',
  });

  const today = new Date().toLocaleDateString('ko-KR', {
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

  function openOrderDialog(item: DailyInventoryItem) {
    setOrderDialog({ open: true, item, qty: '', unitPrice: '', memo: '' });
  }

  const totalAmount =
    orderDialog.qty && orderDialog.unitPrice
      ? Number(orderDialog.qty) * Number(orderDialog.unitPrice)
      : 0;

  function renderRow(item: DailyInventoryItem, isChild = false): React.ReactNode {
    const isExpanded = expandedRows.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const dailyTarget = dailyTargets[item.id] ?? item.dailyTarget;

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

          {/* 상품명 */}
          <td className="px-3 py-2.5 whitespace-nowrap">
            <div className={cn('font-medium text-sm', isChild && 'text-gray-600 text-xs')}>
              {item.productName}
            </div>
            {isChild && <div className="text-xs text-gray-400">{item.option}</div>}
            {!isChild && hasChildren && (
              <div className="text-xs text-gray-400">전체</div>
            )}
          </td>

          {/* 순이익금 */}
          <td className="px-3 py-2.5 text-right whitespace-nowrap text-blue-600 font-medium text-sm">
            {(item.netProfit / 10000).toFixed(0)}만원
          </td>

          {/* 재고금액 */}
          <td className="px-3 py-2.5 text-right whitespace-nowrap text-gray-600 text-sm">
            {(item.inventoryValue / 10000).toFixed(0)}만원
          </td>

          {/* 월판매수량 */}
          <td className="px-3 py-2.5 text-right whitespace-nowrap text-sm">
            {item.monthSales.toLocaleString()}
          </td>

          {/* 일판매수량 */}
          <td className="px-3 py-2.5 text-right whitespace-nowrap text-sm">
            {item.daySales.toLocaleString()}
          </td>

          {/* 마켓재고 */}
          <td className="px-3 py-2.5 text-right whitespace-nowrap text-sm">
            <span className={cn(item.marketStock < 20 ? 'text-red-600 font-semibold' : 'text-gray-700')}>
              {item.marketStock.toLocaleString()}
            </span>
          </td>

          {/* 국내총재고 */}
          <td className="px-3 py-2.5 text-right whitespace-nowrap text-sm text-gray-700">
            {item.domesticStock.toLocaleString()}
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

          {/* 입고권장 */}
          <td className="px-3 py-2.5 text-center whitespace-nowrap">
            {item.recommendInbound > 0 ? (
              <Badge variant="destructive" className="text-xs">
                {item.recommendInbound}개
              </Badge>
            ) : (
              <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
                충분
              </Badge>
            )}
          </td>

          {/* 입고중 */}
          <td className="px-3 py-2.5 text-right whitespace-nowrap text-sm">
            {item.inboundInProgress > 0 ? (
              <span className="text-orange-600 font-medium">{item.inboundInProgress.toLocaleString()}</span>
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
        {hasChildren && isExpanded &&
          item.children!.map((child) => renderRow(child, true) as React.ReactNode)}
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* 날짜 표시 */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">조회일:</span>
        <span className="text-sm font-semibold text-gray-800">{today} 기준</span>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-xs text-gray-500">
              <th className="w-8 px-3 py-3 text-center">+</th>
              <th className="px-3 py-3 text-left whitespace-nowrap">상품명</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">순이익금</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">재고금액</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">월판매수량</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">일판매수량</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">마켓재고</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">국내총재고</th>
              <th className="px-3 py-3 text-center whitespace-nowrap">일목표수량</th>
              <th className="px-3 py-3 text-center whitespace-nowrap">입고권장</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">입고중</th>
              <th className="px-3 py-3 text-center whitespace-nowrap">재고입고</th>
              <th className="px-3 py-3 text-center whitespace-nowrap">재고주문</th>
            </tr>
          </thead>
          <tbody>
            {mockDailyInventory.map((item) => renderRow(item))}
          </tbody>
        </table>
      </div>

      {/* 발주 Dialog */}
      <Dialog open={orderDialog.open} onOpenChange={(open) => setOrderDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>발주 등록</DialogTitle>
          </DialogHeader>
          {orderDialog.item && (
            <div className="space-y-4">
              <div className="text-sm text-gray-500">
                {orderDialog.item.productName}
                {orderDialog.item.option !== '전체' && ` · ${orderDialog.item.option}`}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>발주수량</Label>
                  <Input
                    type="number"
                    placeholder="수량"
                    value={orderDialog.qty}
                    onChange={(e) => setOrderDialog((prev) => ({ ...prev, qty: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>구매단가 (원)</Label>
                  <Input
                    type="number"
                    placeholder="단가"
                    value={orderDialog.unitPrice}
                    onChange={(e) => setOrderDialog((prev) => ({ ...prev, unitPrice: e.target.value }))}
                  />
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">총액 (자동계산)</span>
                  <span className="font-semibold text-blue-600">
                    {totalAmount > 0 ? formatCurrency(totalAmount) : '-'}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>메모</Label>
                <Input
                  placeholder="메모 (선택)"
                  value={orderDialog.memo}
                  onChange={(e) => setOrderDialog((prev) => ({ ...prev, memo: e.target.value }))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderDialog((prev) => ({ ...prev, open: false }))}>
              취소
            </Button>
            <Button onClick={() => setOrderDialog((prev) => ({ ...prev, open: false }))}>
              발주 등록
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
