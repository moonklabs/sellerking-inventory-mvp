'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Printer, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  mockProducts,
  calcMargin,
  calcMarginRate,
  calcROAS,
  formatCurrency,
  Product,
} from '@/lib/mock-data';
import { cn } from '@/lib/utils';

type MarketStockAction = 'add' | 'edit';

export default function ProductsPage() {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [marketStockDialog, setMarketStockDialog] = useState<{
    open: boolean;
    product: Product | null;
  }>({ open: false, product: null });
  const [stockAction, setStockAction] = useState<MarketStockAction>('add');
  const [stockQty, setStockQty] = useState('');

  const [barcodeDialog, setBarcodeDialog] = useState(false);
  const [barcodePaper, setBarcodePaper] = useState('A4');
  const [barcodeSelectedProducts, setBarcodeSelectedProducts] = useState<Set<string>>(new Set());
  const [barcodeQty, setBarcodeQty] = useState('1');

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openMarketStock(product: Product) {
    setMarketStockDialog({ open: true, product });
    setStockAction('add');
    setStockQty('');
  }

  function toggleBarcodeProduct(id: string) {
    setBarcodeSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // 별칭별로 그룹화하여 첫 번째 행에만 + 버튼 표시
  const groupedByAlias = new Map<string, Product[]>();
  mockProducts.forEach((p) => {
    if (!groupedByAlias.has(p.alias)) groupedByAlias.set(p.alias, []);
    groupedByAlias.get(p.alias)!.push(p);
  });

  const rows: { product: Product; isFirstInGroup: boolean; groupSize: number }[] = [];
  groupedByAlias.forEach((products) => {
    products.forEach((p, i) => {
      rows.push({ product: p, isFirstInGroup: i === 0, groupSize: products.length });
    });
  });

  return (
    <div className="space-y-4">
      {/* 상단 액션 */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setBarcodeDialog(true)}>
          <Printer className="w-4 h-4 mr-2" />
          바코드 인쇄
        </Button>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-xs text-gray-500">
              <th className="w-8 px-3 py-3 text-center">+</th>
              <th className="px-3 py-3 text-left whitespace-nowrap">별칭</th>
              <th className="px-3 py-3 text-left whitespace-nowrap">상품명</th>
              <th className="px-3 py-3 text-left whitespace-nowrap">옵션명</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">판매가</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">원가(이력)</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">배송비</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">마진</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">마진율</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">ROAS</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">리뷰수</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">리뷰점수</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">마켓재고</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">국내총재고</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">수정일</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ product: p, isFirstInGroup }) => {
              const isExpanded = expandedRows.has(p.id);
              const margin = calcMargin(p.price, p.currentCost, p.shippingFee);
              const marginRate = calcMarginRate(p.price, p.currentCost, p.shippingFee);
              const roas = calcROAS(p.price, p.currentCost, p.shippingFee);

              return (
                <>
                  <tr
                    key={p.id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    {/* + 버튼 (별칭 그룹 첫 행만) */}
                    <td className="px-3 py-2.5 text-center">
                      {isFirstInGroup && (
                        <button
                          onClick={() => toggleRow(p.id)}
                          className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        >
                          {isExpanded ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{p.alias}</td>
                    <td className="px-3 py-2.5 font-medium whitespace-nowrap">{p.name}</td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{p.option}</td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">{p.price.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <span className="text-gray-700">{p.currentCost.toLocaleString()}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap text-gray-500">
                      {p.shippingFee.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <span className={cn(margin >= 0 ? 'text-blue-600' : 'text-red-600')}>
                        {margin.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <span className={cn(marginRate >= 20 ? 'text-green-600' : marginRate >= 10 ? 'text-yellow-600' : 'text-red-600')}>
                        {marginRate}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap text-gray-700">
                      {roas}%
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap text-gray-600">
                      {p.reviewCount.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <span className={cn(
                        'font-medium',
                        p.reviewScore >= 4.5 ? 'text-green-600' : p.reviewScore >= 4.0 ? 'text-yellow-600' : 'text-red-600'
                      )}>
                        ⭐ {p.reviewScore}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => openMarketStock(p)}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {p.marketStock.toLocaleString()}
                      </button>
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap text-gray-700">
                      {p.domesticStock.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap text-gray-400 text-xs">
                      {p.updatedAt}
                    </td>
                  </tr>

                  {/* 원가 이력 행 토글 */}
                  {isFirstInGroup && isExpanded && (
                    <tr key={`${p.id}-history`} className="bg-amber-50 border-b">
                      <td />
                      <td colSpan={14} className="px-6 py-3">
                        <div className="text-xs font-semibold text-amber-700 mb-2">원가 이력</div>
                        <div className="flex gap-6">
                          {p.costHistory.map((h, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              <span className="text-gray-500">{h.date}</span>
                              <span className="font-medium text-gray-800">{h.cost.toLocaleString()}원</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 마켓재고 Dialog */}
      <Dialog
        open={marketStockDialog.open}
        onOpenChange={(open) => setMarketStockDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>마켓 재고 수정</DialogTitle>
          </DialogHeader>
          {marketStockDialog.product && (
            <div className="space-y-4">
              <div className="text-sm text-gray-500">
                {marketStockDialog.product.name} · {marketStockDialog.product.option}
              </div>
              <div className="text-sm">
                현재 마켓재고: <span className="font-semibold">{marketStockDialog.product.marketStock}개</span>
              </div>
              <RadioGroup
                value={stockAction}
                onValueChange={(v) => setStockAction(v as MarketStockAction)}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="add" id="add" />
                  <Label htmlFor="add">추가</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="edit" id="edit" />
                  <Label htmlFor="edit">수정</Label>
                </div>
              </RadioGroup>
              <div className="space-y-1.5">
                <Label>{stockAction === 'add' ? '추가 수량' : '변경 수량'}</Label>
                <Input
                  type="number"
                  placeholder="수량 입력"
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                />
              </div>
              {stockQty && (
                <div className="text-sm text-gray-500">
                  변경 후:{' '}
                  <span className="font-semibold text-blue-600">
                    {stockAction === 'add'
                      ? (marketStockDialog.product.marketStock + Number(stockQty)).toLocaleString()
                      : Number(stockQty).toLocaleString()}
                    개
                  </span>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarketStockDialog((prev) => ({ ...prev, open: false }))}>
              취소
            </Button>
            <Button onClick={() => setMarketStockDialog((prev) => ({ ...prev, open: false }))}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 바코드 인쇄 Dialog */}
      <Dialog open={barcodeDialog} onOpenChange={setBarcodeDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>바코드 인쇄</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* 용지 선택 */}
            <div className="space-y-1.5">
              <Label>용지 선택</Label>
              <Select value={barcodePaper} onValueChange={setBarcodePaper}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4 (210 × 297mm)</SelectItem>
                  <SelectItem value="A5">A5 (148 × 210mm)</SelectItem>
                  <SelectItem value="label-small">라벨지 소형 (40 × 25mm)</SelectItem>
                  <SelectItem value="label-large">라벨지 대형 (60 × 40mm)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 상품 체크 */}
            <div className="space-y-1.5">
              <Label>상품 선택</Label>
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {mockProducts.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={barcodeSelectedProducts.has(p.id)}
                      onChange={() => toggleBarcodeProduct(p.id)}
                      className="rounded"
                    />
                    <span className="text-sm">{p.name}</span>
                    <span className="text-xs text-gray-400">{p.option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 수량 */}
            <div className="space-y-1.5">
              <Label>인쇄 수량 (개/상품)</Label>
              <Input
                type="number"
                value={barcodeQty}
                onChange={(e) => setBarcodeQty(e.target.value)}
                min="1"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBarcodeDialog(false)}>
              취소
            </Button>
            <Button variant="outline">
              PDF 저장
            </Button>
            <Button>
              <Printer className="w-4 h-4 mr-2" />
              인쇄
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
