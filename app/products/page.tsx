'use client';

import { useState, useEffect } from 'react';
import { Printer, Plus } from 'lucide-react';
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
import { productsApi } from '@/lib/api';
import type { Product, CostHistory } from '@/lib/supabase/types';
import { calcMargin, calcMarginRate, calcROAS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

type MarketStockAction = 'add' | 'edit';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [costHistoryMap, setCostHistoryMap] = useState<Record<string, CostHistory[]>>({});

  // 원가 이력 팝업 상태
  const [costHistoryDialog, setCostHistoryDialog] = useState<{
    open: boolean;
    product: Product | null;
    newDate: string;
    newCost: string;
    adding: boolean;
    historyLoading: boolean;
  }>({
    open: false,
    product: null,
    newDate: new Date().toISOString().split('T')[0],
    newCost: '',
    adding: false,
    historyLoading: false,
  });

  // 마켓재고 팝업 상태
  const [marketStockDialog, setMarketStockDialog] = useState<{
    open: boolean;
    product: Product | null;
  }>({ open: false, product: null });
  const [stockAction, setStockAction] = useState<MarketStockAction>('add');
  const [stockQty, setStockQty] = useState('');

  // 바코드 인쇄 팝업 상태
  const [barcodeDialog, setBarcodeDialog] = useState(false);
  const [barcodePaper, setBarcodePaper] = useState('A4');
  const [barcodeSelectedProducts, setBarcodeSelectedProducts] = useState<Set<string>>(new Set());
  const [barcodeQty, setBarcodeQty] = useState('1');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await productsApi.list();
      if (res.error) setError(res.error.message);
      else setProducts(res.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  // 원가 이력 팝업 열기
  async function openCostHistory(product: Product) {
    const latest = products.find((p) => p.id === product.id) ?? product;
    setCostHistoryDialog({
      open: true,
      product: latest,
      newDate: new Date().toISOString().split('T')[0],
      newCost: '',
      adding: false,
      historyLoading: true,
    });
    const res = await productsApi.getCostHistory(latest.id);
    if (res.data) {
      setCostHistoryMap((prev) => ({ ...prev, [latest.id]: res.data! }));
    }
    setCostHistoryDialog((prev) => ({ ...prev, historyLoading: false }));
  }

  // 원가 이력 추가
  async function addCostHistory() {
    const { product, newDate, newCost } = costHistoryDialog;
    if (!product || !newDate || !newCost) return;
    const cost = Number(newCost);
    if (isNaN(cost) || cost <= 0) return;

    const res = await productsApi.addCostHistory(product.id, { date: newDate, cost });
    if (res.data) {
      // 제품 목록 새로고침 (current_cost 갱신)
      const productsRes = await productsApi.list();
      if (productsRes.data) setProducts(productsRes.data);
      // 이력 새로고침
      const histRes = await productsApi.getCostHistory(product.id);
      if (histRes.data) {
        setCostHistoryMap((prev) => ({ ...prev, [product.id]: histRes.data! }));
      }
    }
    setCostHistoryDialog((prev) => ({
      ...prev,
      newDate: new Date().toISOString().split('T')[0],
      newCost: '',
      adding: false,
    }));
  }

  // 마켓재고 팝업 열기
  function openMarketStock(product: Product) {
    const latest = products.find((p) => p.id === product.id) ?? product;
    setMarketStockDialog({ open: true, product: latest });
    setStockAction('add');
    setStockQty('');
  }

  // 마켓재고 저장
  async function saveMarketStock() {
    const { product } = marketStockDialog;
    if (!product || !stockQty) return;
    const qty = Number(stockQty);
    if (isNaN(qty)) return;
    const newStock = stockAction === 'add' ? product.market_stock + qty : qty;

    const res = await productsApi.update(product.id, { market_stock: newStock });
    if (res.data) {
      setProducts((prev) => prev.map((p) => p.id === product.id ? res.data! : p));
    }
    setMarketStockDialog({ open: false, product: null });
  }

  function toggleBarcodeProduct(id: string) {
    setBarcodeSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) return <div className="p-8 text-center text-gray-500">로딩 중...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

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
              <th className="w-8 px-2 py-3 text-center">이력</th>
              <th className="px-3 py-3 text-left whitespace-nowrap">별칭</th>
              <th className="px-3 py-3 text-left whitespace-nowrap">상품ID</th>
              <th className="px-3 py-3 text-left whitespace-nowrap">옵션코드</th>
              <th className="px-3 py-3 text-left whitespace-nowrap">바코드</th>
              <th className="px-3 py-3 text-left whitespace-nowrap">상품명</th>
              <th className="px-3 py-3 text-left whitespace-nowrap">옵션명</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">판매가</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">할인가</th>
              <th className="px-3 py-3 text-right whitespace-nowrap">원가</th>
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
            {products.map((p) => {
              const margin = calcMargin(p.price, p.current_cost, p.shipping_fee);
              const marginRate = calcMarginRate(p.price, p.current_cost, p.shipping_fee);
              const roas = calcROAS(p.price, p.current_cost, p.shipping_fee);

              return (
                <tr
                  key={p.id}
                  className="border-b hover:bg-gray-50 transition-colors"
                >
                  {/* 원가 이력 추가 버튼 */}
                  <td className="px-2 py-2.5 text-center">
                    <button
                      onClick={() => openCostHistory(p)}
                      className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-amber-50 hover:border-amber-400 mx-auto"
                      title="원가 이력 보기/추가"
                    >
                      <Plus className="w-3 h-3 text-amber-600" />
                    </button>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <Badge variant="outline" className="text-xs text-gray-600 font-normal">
                      {p.alias}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap font-mono">
                    {p.product_id}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap font-mono">
                    {p.option_code}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap font-mono">
                    {p.barcode}
                  </td>
                  <td className="px-3 py-2.5 font-medium whitespace-nowrap">{p.name}</td>
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{p.option}</td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    {p.price.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap text-orange-600">
                    {p.discount_price.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <div className="text-gray-700 font-medium">{p.current_cost.toLocaleString()}</div>
                    {(costHistoryMap[p.id]?.length ?? 0) > 1 && (
                      <div className="text-[10px] text-gray-400">이력 {costHistoryMap[p.id].length}건</div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap text-gray-500">
                    {p.shipping_fee.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <span className={cn(margin >= 0 ? 'text-blue-600' : 'text-red-600')}>
                      {margin.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <span
                      className={cn(
                        marginRate >= 20
                          ? 'text-green-600'
                          : marginRate >= 10
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      )}
                    >
                      {marginRate}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap text-gray-700">
                    {roas}%
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap text-gray-600">
                    {p.review_count.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <span
                      className={cn(
                        'font-medium',
                        p.review_score >= 4.5
                          ? 'text-green-600'
                          : p.review_score >= 4.0
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      )}
                    >
                      ⭐ {p.review_score}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => openMarketStock(p)}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {p.market_stock.toLocaleString()}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap text-gray-700">
                    {p.domestic_stock.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap text-gray-400 text-xs">
                    {p.updated_at}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 원가 이력 Dialog */}
      <Dialog
        open={costHistoryDialog.open}
        onOpenChange={(open) =>
          setCostHistoryDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>원가 이력</DialogTitle>
          </DialogHeader>
          {costHistoryDialog.product && (
            <div className="space-y-4">
              <div className="text-sm text-gray-500">
                {costHistoryDialog.product.name} · {costHistoryDialog.product.option}
              </div>

              {/* 이력 목록 */}
              <div className="border rounded-lg divide-y">
                {costHistoryDialog.historyLoading ? (
                  <div className="text-sm text-gray-400 text-center py-4">이력 로딩 중...</div>
                ) : (
                  (() => {
                    const history = costHistoryMap[costHistoryDialog.product?.id ?? ''] ?? [];
                    if (history.length === 0) {
                      return (
                        <div className="px-4 py-3 text-sm text-gray-400 text-center">
                          이력 없음
                        </div>
                      );
                    }
                    return history
                      .slice()
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((h, idx) => (
                        <div
                          key={h.id}
                          className={cn(
                            'flex items-center justify-between px-4 py-2.5',
                            idx === 0 && 'bg-amber-50'
                          )}
                        >
                          <span className="text-xs text-gray-500">{h.date}</span>
                          <span
                            className={cn(
                              'font-medium',
                              idx === 0 ? 'text-amber-700' : 'text-gray-700'
                            )}
                          >
                            {h.cost.toLocaleString()}원
                          </span>
                          {idx === 0 && (
                            <Badge className="text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-100 ml-1">
                              현재
                            </Badge>
                          )}
                        </div>
                      ));
                  })()
                )}
              </div>

              {/* 새 이력 추가 */}
              {costHistoryDialog.adding ? (
                <div className="border rounded-lg p-3 bg-blue-50 space-y-3">
                  <div className="text-xs font-semibold text-blue-700">새 원가 추가</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">날짜</Label>
                      <Input
                        type="date"
                        value={costHistoryDialog.newDate}
                        onChange={(e) =>
                          setCostHistoryDialog((prev) => ({
                            ...prev,
                            newDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">원가 (원)</Label>
                      <Input
                        type="number"
                        placeholder="원가 입력"
                        value={costHistoryDialog.newCost}
                        onChange={(e) =>
                          setCostHistoryDialog((prev) => ({
                            ...prev,
                            newCost: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCostHistoryDialog((prev) => ({ ...prev, adding: false, newCost: '' }))
                      }
                    >
                      취소
                    </Button>
                    <Button
                      size="sm"
                      onClick={addCostHistory}
                      disabled={!costHistoryDialog.newCost || !costHistoryDialog.newDate}
                    >
                      추가
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed"
                  onClick={() =>
                    setCostHistoryDialog((prev) => ({ ...prev, adding: true }))
                  }
                >
                  <Plus className="w-3 h-3 mr-1" />
                  새 원가 이력 추가
                </Button>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setCostHistoryDialog((prev) => ({ ...prev, open: false }))
              }
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                현재 마켓재고:{' '}
                <span className="font-semibold">{marketStockDialog.product.market_stock}개</span>
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
                      ? (
                          marketStockDialog.product.market_stock + Number(stockQty)
                        ).toLocaleString()
                      : Number(stockQty).toLocaleString()}
                    개
                  </span>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMarketStockDialog({ open: false, product: null })}
            >
              취소
            </Button>
            <Button onClick={saveMarketStock} disabled={!stockQty}>
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
                  <SelectItem value="label-40">라벨지 40칸 (52.5 × 29.7mm)</SelectItem>
                  <SelectItem value="label-small">라벨지 소형 (40 × 25mm)</SelectItem>
                  <SelectItem value="label-large">라벨지 대형 (60 × 40mm)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 상품 체크 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>상품 선택</Label>
                <button
                  className="text-xs text-blue-600 hover:underline"
                  onClick={() => {
                    if (barcodeSelectedProducts.size === products.length) {
                      setBarcodeSelectedProducts(new Set());
                    } else {
                      setBarcodeSelectedProducts(new Set(products.map((p) => p.id)));
                    }
                  }}
                >
                  {barcodeSelectedProducts.size === products.length ? '전체 해제' : '전체 선택'}
                </button>
              </div>
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {products.map((p) => (
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
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.option}</div>
                    </div>
                    <div className="text-xs text-gray-400 font-mono shrink-0">{p.barcode}</div>
                  </label>
                ))}
              </div>
            </div>

            {/* SKU 미리보기 */}
            {barcodeSelectedProducts.size > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                <div className="text-xs font-semibold text-gray-600">인쇄 미리보기</div>
                {products
                  .filter((p) => barcodeSelectedProducts.has(p.id))
                  .map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 truncate max-w-[200px]">
                        {p.name} ({p.option})
                      </span>
                      <span className="text-gray-400 font-mono">{p.barcode}</span>
                    </div>
                  ))}
              </div>
            )}

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
            <Button variant="outline" disabled={barcodeSelectedProducts.size === 0}>
              PDF 저장
            </Button>
            <Button disabled={barcodeSelectedProducts.size === 0}>
              <Printer className="w-4 h-4 mr-2" />
              인쇄
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
