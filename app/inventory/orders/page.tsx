'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
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
import type { Order } from '@/lib/supabase/types';
import { ORDER_STATUS_LABELS, ENABLED_STATUS_FLOW } from '@/lib/mock-data';
import type { OrderStatus as MockOrderStatus } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

// 탭에서 'all' 포함 상태를 위한 타입
type TabOrderStatus = MockOrderStatus; // mock-data의 OrderStatus는 'all' 포함

const TABS: { value: TabOrderStatus; label: string; phase2?: boolean }[] = [
  { value: 'recommend', label: '입고권장' },
  { value: 'request', label: '발주요청' },
  { value: 'amount_confirmed', label: '발주금액확정' },
  { value: 'purchase_confirmed', label: '구매확정' },
  { value: 'purchase_complete', label: '구매완료' },
  { value: 'china_arrived', label: '중국창고도착' },
  { value: 'china_shipped', label: '중국창고출고' },
  { value: 'korea_arrived', label: '한국입항(입고중)' },
  { value: 'received', label: '상품수령완료' },
  { value: 'all', label: '전체' },
];

interface InboundDialogState {
  open: boolean;
  order: Order | null;
  actualQty: string;
  inboundDate: string;
}

// 활성 흐름에서 다음 상태 계산
function getNextStatus(current: TabOrderStatus): TabOrderStatus | null {
  const idx = ENABLED_STATUS_FLOW.indexOf(current);
  if (idx < 0 || idx >= ENABLED_STATUS_FLOW.length - 1) return null;
  return ENABLED_STATUS_FLOW[idx + 1];
}

// 인라인 메모 편집 셀
function MemoCell({ order, onSave }: { order: Order; onSave: (id: string, memo: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(order.memo || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(order.id, value);
    setSaving(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1 min-w-[160px]">
        <input
          autoFocus
          className="border rounded px-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
        />
        <button onClick={handleSave} disabled={saving} className="text-blue-500 hover:text-blue-700 font-bold text-xs whitespace-nowrap">
          {saving ? '...' : '저장'}
        </button>
        <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1 group cursor-pointer truncate"
      onClick={() => { setValue(order.memo || ''); setEditing(true); }}
      title="클릭하여 메모 편집"
    >
      <span className="truncate">{order.memo || <span className="text-gray-300 italic">메모 없음</span>}</span>
      <span className="opacity-0 group-hover:opacity-100 text-gray-400 text-xs shrink-0">✏️</span>
    </div>
  );
}

function getStatusBadge(status: string) {
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

function OrdersContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabOrderStatus) ?? 'recommend';

  const [activeTab, setActiveTab] = useState<TabOrderStatus>(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [moving, setMoving] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [editDialog, setEditDialog] = useState<{ open: boolean; order: Order | null }>({ open: false, order: null });
  const [editForm, setEditForm] = useState({ memo: '', tracking_number: '', customs_tax: '', domestic_shipping: '', china_freight: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [inboundDialog, setInboundDialog] = useState<InboundDialogState>({
    open: false,
    order: null,
    actualQty: '',
    inboundDate: '2026-03-02',
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await inventoryApi.getOrders();
      if (res.error) setError(res.error.message);
      else setOrders(res.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  // URL 파라미터로 탭 초기화
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as TabOrderStatus | null;
    if (tabFromUrl && TABS.some((t) => t.value === tabFromUrl && !t.phase2)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  if (loading) return <div className="p-8 text-center text-gray-500">로딩 중...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  const filteredOrders =
    activeTab === 'all' ? orders : orders.filter((o) => o.status === activeTab);

  function toggleTab(tab: TabOrderStatus) {
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

  // 선택된 주문을 다음 상태로 이동
  async function moveToNextStatus() {
    if (selectedIds.size === 0 || activeTab === 'all') return;
    const nextStatus = getNextStatus(activeTab);
    if (!nextStatus) return;

    setMoving(true);
    const ids = Array.from(selectedIds);
    const res = await inventoryApi.bulkUpdateOrders(ids, nextStatus as Exclude<TabOrderStatus, 'all'>);
    if (res.error) {
      alert(`이동 실패: ${res.error.message}`);
    } else {
      const ordersRes = await inventoryApi.getOrders();
      if (ordersRes.data) setOrders(ordersRes.data);
      setActiveTab(nextStatus);
    }
    setSelectedIds(new Set());
    setMoving(false);
  }

  // 주문취소 확인 후 삭제
  async function cancelOrders() {
    if (selectedIds.size === 0) return;
    setCancelConfirm(true);
  }

  async function confirmCancel() {
    setCancelConfirm(false);
    setMoving(true);
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map((id) => inventoryApi.deleteOrder(id)));
    const ordersRes = await inventoryApi.getOrders();
    if (ordersRes.data) setOrders(ordersRes.data);
    setSelectedIds(new Set());
    setMoving(false);
  }

  function openEditDialog(order: Order) {
    setEditForm({
      memo: order.memo || '',
      tracking_number: order.tracking_number || '',
      customs_tax: order.customs_tax ? String(order.customs_tax) : '',
      domestic_shipping: order.domestic_shipping ? String(order.domestic_shipping) : '',
      china_freight: order.china_freight ? String(order.china_freight) : '',
    });
    setEditDialog({ open: true, order });
  }

  async function saveEdit() {
    if (!editDialog.order) return;
    setEditSaving(true);
    await inventoryApi.updateOrder(editDialog.order.id, {
      memo: editForm.memo,
      tracking_number: editForm.tracking_number,
      customs_tax: Number(editForm.customs_tax) || 0,
      domestic_shipping: Number(editForm.domestic_shipping) || 0,
      china_freight: Number(editForm.china_freight) || 0,
    });
    const res = await inventoryApi.getOrders();
    if (res.data) setOrders(res.data);
    setEditSaving(false);
    setEditDialog({ open: false, order: null });
  }

  const currentNextStatus = activeTab !== 'all' ? getNextStatus(activeTab) : null;

  function getOrderCount(tab: TabOrderStatus) {
    if (tab === 'all') return orders.length;
    return orders.filter((o) => o.status === tab).length;
  }

  return (
    <div className="space-y-4 relative">
      {/* 이동 중 로딩 오버레이 */}
      {moving && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl px-10 py-8 flex flex-col items-center gap-4 min-w-[280px]">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-700 font-medium">처리 중...</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        </div>
      )}

      {/* 주문취소 확인 다이얼로그 */}
      <Dialog open={cancelConfirm} onOpenChange={setCancelConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>주문 취소 확인</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 py-2">
            선택한 <span className="font-bold text-red-600">{selectedIds.size}건</span>의 발주를 취소(삭제)합니다.<br />
            이 작업은 되돌릴 수 없습니다.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelConfirm(false)}>돌아가기</Button>
            <Button variant="destructive" onClick={confirmCancel}>취소 확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 발주 수정 다이얼로그 */}
      <Dialog open={editDialog.open} onOpenChange={(o) => !o && setEditDialog({ open: false, order: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>발주 수정</DialogTitle>
            {editDialog.order && (
              <p className="text-sm text-gray-500 mt-1">{editDialog.order.product_name} · {editDialog.order.order_no}</p>
            )}
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium">트래킹번호</Label>
              <Input className="mt-1" placeholder="트래킹번호 입력" value={editForm.tracking_number} onChange={(e) => setEditForm(f => ({ ...f, tracking_number: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-sm font-medium">관부가세</Label>
                <Input className="mt-1" type="number" placeholder="0" value={editForm.customs_tax} onChange={(e) => setEditForm(f => ({ ...f, customs_tax: e.target.value }))} />
              </div>
              <div>
                <Label className="text-sm font-medium">국내운임비</Label>
                <Input className="mt-1" type="number" placeholder="0" value={editForm.domestic_shipping} onChange={(e) => setEditForm(f => ({ ...f, domestic_shipping: e.target.value }))} />
              </div>
              <div>
                <Label className="text-sm font-medium">중국운임비</Label>
                <Input className="mt-1" type="number" placeholder="0" value={editForm.china_freight} onChange={(e) => setEditForm(f => ({ ...f, china_freight: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">메모</Label>
              <textarea
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                rows={3}
                placeholder="메모 입력"
                value={editForm.memo}
                onChange={(e) => setEditForm(f => ({ ...f, memo: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditDialog({ open: false, order: null })}>취소</Button>
            <Button onClick={saveEdit} disabled={editSaving}>{editSaving ? '저장 중...' : '저장'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 탭 */}
      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
        <div className="flex border-b min-w-max">
          {TABS.map((tab) => {
            const count = getOrderCount(tab.value);
            return (
              <button
                key={tab.value}
                onClick={() => !tab.phase2 && toggleTab(tab.value)}
                className={cn(
                  'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors relative',
                  tab.phase2
                    ? 'pointer-events-none text-gray-300 border-transparent bg-gray-50'
                    : activeTab === tab.value
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <span className={tab.phase2 ? 'text-gray-400' : ''}>{tab.label}</span>
                {tab.phase2 && (
                  <Badge className="ml-1.5 text-[10px] bg-gray-200 text-gray-500 hover:bg-gray-200 px-1 py-0">
                    준비중
                  </Badge>
                )}
                {!tab.phase2 && (
                  <span
                    className={cn(
                      'ml-1.5 text-xs rounded-full px-1.5 py-0.5',
                      activeTab === tab.value
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
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
                onClick={moveToNextStatus}
              >
                {ORDER_STATUS_LABELS[currentNextStatus]}으로 이동 →
              </Button>
            )}
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
                        actualQty: String(firstOrder.order_qty),
                        inboundDate: '2026-03-02',
                      });
                    }
                  }
                }}
              >
                입고처리
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
              disabled={selectedIds.size === 0}
              onClick={cancelOrders}
            >
              주문취소
            </Button>
          </div>
        </div>

        {/* 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1800px] text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs text-gray-500">
                <th className="px-3 py-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredOrders.length > 0 &&
                      selectedIds.size === filteredOrders.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-3 py-3 text-center whitespace-nowrap">NO</th>
                <th className="px-3 py-3 text-left whitespace-nowrap">구매요청일</th>
                <th className="px-3 py-3 text-left whitespace-nowrap">현재상태</th>
                <th className="px-3 py-3 text-left whitespace-nowrap">발주번호</th>
                <th className="px-3 py-3 text-left whitespace-nowrap">스토어</th>
                <th className="px-3 py-3 text-left whitespace-nowrap">판매방식</th>
                <th className="px-3 py-3 text-center whitespace-nowrap">이미지</th>
                <th className="px-3 py-3 text-left whitespace-nowrap min-w-[160px]">상품명</th>
                <th className="px-3 py-3 text-left whitespace-nowrap">바코드</th>
                <th className="px-3 py-3 text-center whitespace-nowrap">링크</th>
                <th className="px-3 py-3 text-right whitespace-nowrap">발주량</th>
                <th className="px-3 py-3 text-right whitespace-nowrap">단가</th>
                <th className="px-3 py-3 text-right whitespace-nowrap">총액</th>
                <th className="px-3 py-3 text-center whitespace-nowrap">공장출고예정일</th>
                <th className="px-3 py-3 text-center whitespace-nowrap">재고도착예정일</th>
                <th className="px-3 py-3 text-left whitespace-nowrap">트래킹번호</th>
                <th className="px-3 py-3 text-right whitespace-nowrap">관부가세</th>
                <th className="px-3 py-3 text-right whitespace-nowrap">국내운임비</th>
                <th className="px-3 py-3 text-right whitespace-nowrap">중국내운임비</th>
                <th className="px-3 py-3 text-left whitespace-nowrap min-w-[120px]">메모</th>
                <th className="px-3 py-3 text-center whitespace-nowrap sticky right-0 bg-gray-50 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.05)]">수정</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={21}
                    className="px-4 py-12 text-center text-gray-400 text-sm"
                  >
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
                    <td className="px-3 py-2.5 whitespace-nowrap text-gray-600 text-xs">
                      {order.request_date}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <Badge className={cn('text-xs', getStatusBadge(order.status))}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs text-gray-500 font-mono">
                      {order.order_no}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs text-gray-600">
                      {order.store}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          order.sales_type === '로켓'
                            ? 'border-blue-300 text-blue-700'
                            : order.sales_type === '그로스'
                            ? 'border-green-300 text-green-700'
                            : 'border-gray-300 text-gray-600'
                        )}
                      >
                        {order.sales_type}
                      </Badge>
                    </td>
                    {/* 이미지 */}
                    <td className="px-3 py-2.5 text-center">
                      <div className="w-10 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center mx-auto">
                        <span className="text-[9px] text-gray-400">이미지</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-medium">
                      <div className="max-w-[200px]">{order.product_name}</div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs text-gray-400 font-mono">
                      {order.barcode || '-'}
                    </td>
                    {/* 상품링크 */}
                    <td className="px-3 py-2.5 text-center">
                      {order.product_link ? (
                        <a
                          href={order.product_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mx-auto" />
                        </a>
                      ) : (
                        <span className="text-gray-300 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      {order.order_qty.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap text-gray-600">
                      {order.unit_price.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap font-medium">
                      {order.total_amount.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap text-gray-500 text-xs">
                      {order.expected_ship_date || '-'}
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap text-gray-500 text-xs">
                      {order.expected_arrival_date || '-'}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs text-gray-500">
                      {order.tracking_number || '-'}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap text-gray-600 text-xs">
                      {order.customs_tax > 0 ? order.customs_tax.toLocaleString() : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap text-gray-600 text-xs">
                      {order.domestic_shipping > 0
                        ? order.domestic_shipping.toLocaleString()
                        : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap text-gray-600 text-xs">
                      {order.china_freight > 0 ? order.china_freight.toLocaleString() : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs max-w-[160px]">
                      <MemoCell order={order} onSave={async (id, memo) => {
                        await inventoryApi.updateOrder(id, { memo });
                        const res = await inventoryApi.getOrders();
                        if (res.data) setOrders(res.data);
                      }} />
                    </td>
                    <td className="px-3 py-2.5 text-center sticky right-0 bg-white shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.05)]">
                      <button
                        onClick={() => openEditDialog(order)}
                        className="text-gray-400 hover:text-blue-500 transition-colors p-1 rounded hover:bg-blue-50"
                        title="수정"
                      >
                        ✏️
                      </button>
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
              <div className="text-sm text-gray-500">{inboundDialog.order.product_name}</div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">발주량</span>
                <span className="font-semibold">
                  {inboundDialog.order.order_qty.toLocaleString()}개
                </span>
              </div>
              <div className="space-y-1.5">
                <Label>실수량</Label>
                <Input
                  type="number"
                  value={inboundDialog.actualQty}
                  onChange={(e) =>
                    setInboundDialog((prev) => ({ ...prev, actualQty: e.target.value }))
                  }
                  placeholder="실제 수령 수량"
                />
              </div>
              <div className="space-y-1.5">
                <Label>입고일</Label>
                <Input
                  type="date"
                  value={inboundDialog.inboundDate}
                  onChange={(e) =>
                    setInboundDialog((prev) => ({ ...prev, inboundDate: e.target.value }))
                  }
                />
              </div>
              {inboundDialog.actualQty &&
                inboundDialog.order.order_qty !== Number(inboundDialog.actualQty) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                    발주량({inboundDialog.order.order_qty})과 실수량(
                    {inboundDialog.actualQty})이 다릅니다.
                  </div>
                )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInboundDialog((prev) => ({ ...prev, open: false }))}
            >
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
