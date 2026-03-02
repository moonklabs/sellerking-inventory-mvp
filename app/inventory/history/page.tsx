'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mockInventoryProducts } from '@/lib/mock-data';
import { Plus, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InboundRecord {
  id: string;
  productId: string;
  date: string;
  quantity: number;
  unitPrice: number;
  shippingFee: number;
  customsTax: number;
  actualCostPerUnit: number;
  memo: string;
}

interface DialogState {
  open: boolean;
  date: string;
  quantity: string;
  unitPrice: string;
  shippingFee: string;
  customsTax: string;
  memo: string;
}

const STORAGE_KEY = 'sellerking_inbound_history';

export default function InboundHistoryPage() {
  const products = mockInventoryProducts;
  const [selectedId, setSelectedId] = useState<string>(products[0].id);
  const [history, setHistory] = useState<InboundRecord[]>([]);
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    date: '2026-03-02',
    quantity: '',
    unitPrice: '',
    shippingFee: '',
    customsTax: '',
    memo: '',
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedId);
  const filteredHistory = history.filter((r) => r.productId === selectedId);

  function calcActualCost(
    qty: number,
    unitPrice: number,
    shippingFee: number,
    customsTax: number
  ): number {
    if (qty === 0) return 0;
    return Math.round(unitPrice + (shippingFee + customsTax) / qty);
  }

  function handleSave() {
    const qty = Number(dialog.quantity);
    const unitPrice = Number(dialog.unitPrice);
    const shippingFee = Number(dialog.shippingFee) || 0;
    const customsTax = Number(dialog.customsTax) || 0;

    if (!qty || !unitPrice) return;

    const newRecord: InboundRecord = {
      id: `ih_${Date.now()}`,
      productId: selectedId,
      date: dialog.date,
      quantity: qty,
      unitPrice,
      shippingFee,
      customsTax,
      actualCostPerUnit: calcActualCost(qty, unitPrice, shippingFee, customsTax),
      memo: dialog.memo,
    };

    const updated = [newRecord, ...history];
    setHistory(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    setDialog((prev) => ({
      ...prev,
      open: false,
      quantity: '',
      unitPrice: '',
      shippingFee: '',
      customsTax: '',
      memo: '',
    }));
  }

  const previewActualCost =
    dialog.quantity && dialog.unitPrice
      ? calcActualCost(
          Number(dialog.quantity),
          Number(dialog.unitPrice),
          Number(dialog.shippingFee) || 0,
          Number(dialog.customsTax) || 0
        )
      : null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">입고 이력 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          상품별 입고 이력을 확인하고 신규 입고를 등록하세요.
        </p>
      </div>

      <div className="flex gap-4">
        {/* 좌측: 상품 목록 */}
        <div className="w-64 shrink-0">
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b">
              <h2 className="font-semibold text-sm text-gray-800">상품 목록</h2>
            </div>
            <div className="divide-y">
              {products.map((product) => {
                const count = history.filter((r) => r.productId === product.id).length;
                return (
                  <button
                    key={product.id}
                    onClick={() => setSelectedId(product.id)}
                    className={cn(
                      'w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors',
                      selectedId === product.id
                        ? 'bg-blue-50 border-l-2 border-blue-500'
                        : ''
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <Package className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-gray-800 leading-tight">
                        {product.name}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-400 pl-5">입고 {count}건</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 우측: 입고 이력 */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-800">{selectedProduct?.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  입고 이력 {filteredHistory.length}건
                </p>
              </div>
              <Button size="sm" onClick={() => setDialog((prev) => ({ ...prev, open: true }))}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                신규 입고 등록
              </Button>
            </div>
            <div className="p-5">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Package className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">입고 이력이 없습니다.</p>
                  <p className="text-xs mt-1">신규 입고 등록 버튼을 클릭하세요.</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                  <div className="space-y-4">
                    {filteredHistory.map((record) => (
                      <div key={record.id} className="relative pl-10">
                        <div className="absolute left-3 top-2 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white ring-2 ring-blue-200" />
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-900">
                              {record.date}
                            </span>
                            <span className="text-xs text-gray-500">
                              {record.quantity.toLocaleString()}개 입고
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-xs">
                            <div>
                              <div className="text-gray-400">단가</div>
                              <div className="font-medium text-gray-700">
                                {record.unitPrice.toLocaleString()}원
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400">배송비배분</div>
                              <div className="font-medium text-gray-700">
                                {record.shippingFee.toLocaleString()}원
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400">관부가세배분</div>
                              <div className="font-medium text-gray-700">
                                {record.customsTax.toLocaleString()}원
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between">
                            <span className="text-xs text-gray-400">개당 실원가</span>
                            <span className="text-sm font-bold text-blue-600">
                              {record.actualCostPerUnit.toLocaleString()}원
                            </span>
                          </div>
                          {record.memo && (
                            <div className="mt-1.5 text-xs text-gray-500 italic">
                              &ldquo;{record.memo}&rdquo;
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 신규 입고 등록 Dialog */}
      <Dialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>신규 입고 등록</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              {selectedProduct?.name}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>입고일</Label>
                <Input
                  type="date"
                  value={dialog.date}
                  onChange={(e) => setDialog((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>입고 수량</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={dialog.quantity}
                  onChange={(e) =>
                    setDialog((prev) => ({ ...prev, quantity: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>단가 (원)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={dialog.unitPrice}
                  onChange={(e) =>
                    setDialog((prev) => ({ ...prev, unitPrice: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>배송비 배분 (원)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={dialog.shippingFee}
                  onChange={(e) =>
                    setDialog((prev) => ({ ...prev, shippingFee: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>관부가세 배분 (원)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={dialog.customsTax}
                  onChange={(e) =>
                    setDialog((prev) => ({ ...prev, customsTax: e.target.value }))
                  }
                />
              </div>
            </div>
            {previewActualCost !== null && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm text-blue-700">개당 실제원가 (자동계산)</span>
                <span className="text-lg font-bold text-blue-600">
                  {previewActualCost.toLocaleString()}원
                </span>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>메모</Label>
              <Input
                placeholder="메모 입력 (선택)"
                value={dialog.memo}
                onChange={(e) => setDialog((prev) => ({ ...prev, memo: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialog((prev) => ({ ...prev, open: false }))}
            >
              취소
            </Button>
            <Button onClick={handleSave} disabled={!dialog.quantity || !dialog.unitPrice}>
              입고 완료
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
