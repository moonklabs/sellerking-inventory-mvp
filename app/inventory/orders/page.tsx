'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import { mockInventoryOrders, InventoryOrder, OrderStatus, ORDER_STATUS_LABELS, formatCurrency } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const TABS: { value: OrderStatus; label: string; disabled?: boolean }[] = [
  { value: 'recommend', label: '입고권장' },
  { value: 'request', label: '발주요청', disabled: true },
  { value: 'amount_confirmed', label: '발주금액확정', disabled: true },
  { value: 'purchase_confirmed', label: '구매확정' },
  { value: 'purchase_complete', label: '구매완료' },
  { value: 'china_arrived', label: '중국창고도착' },
  { value: 'china_shipped', label: '중국창고출고' },
  { value: 'korea_arrived', label: '한국입항(입고중)' },
  { value: 'received', label: '상품수령완료' },
  { value: 'all', label: '전체' },
];

const STATUS_FLOW: OrderStatus[] = [
  'recommend',
  'request',
  'amount_confirmed',
  'purchase_confirmed',
  'purchase_complete',
  'china_arrived',
  'china_shipped',
  'korea_arrived',
  'received',
];

interface InboundDialogState {
  open: boolean;
  order: InventoryOrder | null;
  actualQty: string;
  inboundDate: string;
}

function OrdersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialTab = (searchParams.get('tab') as OrderStatus) ?? 'recommend';
  const [activeTab, setActiveTab] = useState<OrderStatus>(initialTab);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [inboundDialog, setInboundDialog] = useState<InboundDialogState>({
    open: false,
    order: null,
    actualQty: '',
    inboundDate: new Date().toISOString().split('T')[0],
  });

  const filteredOrders =
    activeTab === 'all'
      ? mockInventoryOrders
      : mockInventoryOrders.filter((o) => o.status === activeTab);

  function toggleTab(tab: OrderStatus) {
    setActiveTab(tab);
    setSelectedIds(new Set());
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOrders.map((o) => o.id)));
    }
  }

  // 다음 상태로 이동
  function getNextStatus(current: OrderStatus): OrderStatus | null {
    const idx = STATUS_FLOW.indexOf(current);
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[idx + 1];
  }

  const currentNextStatus = activeTab !== 'all' ? getNextStatus(activeTab) : null;

  function getStatusBadge(status: OrderStatus) {
    const colors: Record<string, string> = {
      recommend: 'bg-red-100 text-red-700',
      request: 'bg-orange-100 text-orange-700',
      amount_confirmed: 'bg-yellow-100 text-yellow-700',
      purchase_confirmed: 'bg-blue-100 text-blue-700',
      purchase_complete: 'bg-indigo-100 text-indigo-700',
      china_arrived: 'bg-purple-100 text-purple-700',
      china_shipped: 'bg-pink-100 text-pink-700',
      korea_arrived: 'bg-teal-100 text-teal-700',
      received: 'bg-green-100 text-green-700',
    };
    return colors[status] ?? 'bg-gray-100 text-gray-700';
  }

  return (
    <div className="space-y-4">
      {/* 탭 */}
      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
        <div className="flex border-b min-w-max">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => !tab.disabled && toggleTab(tab.value)}
              className={cn(
                'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                tab.disabled
                  ? 'pointer-events-none text-gray-300 border-transparent'
                  : activeTab === tab.value
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab.label}
              {tab.disabled && (
                <span className="ml-1 text-xs">(준비중)</span>
              )}
              {!tab.disabled && (
                <span className={cn(
                  'ml-1.5 text-xs rounded-full px-1.5 py-0.5',
                  activeTab === tab.value ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                )}>
                  {tab.value === 'all'
                    ? mockInventoryOrders.length
                    : mockInventoryOrders.filter((o) => o.status === tab.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 상단 액션 */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="text-sm text-gray-500">
            {selectedIds.size > 0 ? (
              <span className="text-blue-600 font-medium">{selectedIds.size}건 선택됨</span>
            ) : (
              <span>{filteredOrders.length}건</span>
            )}
          </div>
          <div className="flex gap-2">
            {currentNextStatus && (
              <Button
                variant="default"
                size="sm"
                disabled={selectedIds.size === 0}
              >
                {ORDER_STATUS_LABELS[currentNextStatus]}으로 이동 →
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
              disabled={selectedIds.size === 0}
            >
              주문취소
            </Button>
            {activeTab === 'received' && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                disabled={selectedIds.size === 0}
                onClick={() => {
                  if (selectedIds.size > 0) {
                    const firstOrder = filteredOrders.find((o) => selectedIds.has(o.id));
                    if (firstOrder) {
                      setInboundDialog({
                        open: true,
                        order: firstOrder,
                        actualQty: String(firstOrder.orderQty),
                        inboundDate: new Date().toISOString().split('T')[0],
                      });
                    }
                  }
                }}
              >
                입고처리
              </Button>
            )}
          </div>
        </div>

        {/* 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs text-gray-500">
                <th className="px-3 py-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={filteredOrders.length > 0 && selectedIds.size === filteredOrders.length}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-3 py-3 text-center whitespace-nowrap">NO</th>
                <th className="px-3 py-3 text-left whitespace-nowrap">구매요청일</th>
                <th className="px-3 py-3 text-left whitespace-nowrap">상품명</th>
                <th className="px-3 py-3 text-right whitespace-nowrap">발주량</th>
                <th className="px-3 py-3 text-right whitespace-nowrap">단가</th>
                <th className="px-3 py-3 text-right whitespace-nowrap">총액</th>
                <th className="px-3 py-3 text-center whitespace-nowrap">현재상태</th>
                <th className="px-3 py-3 text-center whitespace-nowrap">공장출고예정일</th>
                <th className="px-3 py-3 text-center whitespace-nowrap">재고도착예정일</th>
                <th className="px-3 py-3 text-left whitespace-nowrap">트래킹번호</th>
                <th className="px-3 py-3 text-right whitespace-nowrap">관부가세</th>
                <th className="px-3 py-3 text-right whitespace-nowrap">국내운임비</th>
                <th className="px-3 py-3 text-left whitespace-nowrap">메모</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-4 py-12 text-center text-gray-400 text-sm">
                    해당 탭에 주문 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, idx) => (
                  <tr
                    key={order.id}
                    className={cn(
                      'border-b hover:bg-gray-50 transition-colors',
                      selectedIds.has(order.id) && 'bg-blue-50'
                    )}
                  >
                    <td className="px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-3 py-2.5 text-center text-gray-500">{idx + 1}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-gray-600">{order.requestDate}</td>
                    <td className="px-3 py-2.5 font-medium whitespace-nowrap">{order.productName}</td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">{order.orderQty.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap text-gray-600">
                      {order.unitPrice.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap font-medium">
                      {order.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <Badge className={cn('text-xs', getStatusBadge(order.status))}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap text-gray-500 text-xs">
                      {order.expectedShipDate || '-'}
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap text-gray-500 text-xs">
                      {order.expectedArrivalDate || '-'}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs text-gray-500">
                      {order.trackingNumber || '-'}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap text-gray-600 text-xs">
                      {order.customsTax > 0 ? order.customsTax.toLocaleString() : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap text-gray-600 text-xs">
                      {order.domesticShipping > 0 ? order.domesticShipping.toLocaleString() : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs max-w-[160px] truncate">
                      {order.memo || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 입고처리 Dialog */}
      <Dialog
        open={inboundDialog.open}
        onOpenChange={(open) => setInboundDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>입고 처리</DialogTitle>
          </DialogHeader>
          {inboundDialog.order && (
            <div className="space-y-4">
              <div className="text-sm text-gray-500">{inboundDialog.order.productName}</div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">발주량</span>
                <span className="font-semibold">{inboundDialog.order.orderQty.toLocaleString()}개</span>
              </div>
              <div className="space-y-1.5">
                <Label>실수량</Label>
                <Input
                  type="number"
                  value={inboundDialog.actualQty}
                  onChange={(e) => setInboundDialog((prev) => ({ ...prev, actualQty: e.target.value }))}
                  placeholder="실제 수령 수량"
                />
              </div>
              <div className="space-y-1.5">
                <Label>입고일</Label>
                <Input
                  type="date"
                  value={inboundDialog.inboundDate}
                  onChange={(e) => setInboundDialog((prev) => ({ ...prev, inboundDate: e.target.value }))}
                />
              </div>
              {inboundDialog.actualQty && inboundDialog.order.orderQty !== Number(inboundDialog.actualQty) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                  발주량({inboundDialog.order.orderQty})과 실수량({inboundDialog.actualQty})이 다릅니다.
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setInboundDialog((prev) => ({ ...prev, open: false }))}>
              취소
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setInboundDialog((prev) => ({ ...prev, open: false }))}
            >
              입고 확정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="text-sm text-gray-500">로딩 중...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
