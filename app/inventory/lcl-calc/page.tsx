'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mockInventoryProducts } from '@/lib/mock-data';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type DistributionMethod = 'equal' | 'amount' | 'quantity';

interface LclProduct {
  id: string;
  name: string;
  quantity: string;
  unitPrice: string;
}

const METHOD_LABELS: Record<DistributionMethod, string> = {
  equal: 'N분의1',
  amount: '금액비례 (기본)',
  quantity: '수량비례',
};

export default function LclCalcPage() {
  const [method, setMethod] = useState<DistributionMethod>('amount');
  const [lclProducts, setLclProducts] = useState<LclProduct[]>(
    mockInventoryProducts.slice(0, 3).map((p) => ({
      id: p.id,
      name: p.name,
      quantity: '100',
      unitPrice: '5000',
    }))
  );
  const [totalShipping, setTotalShipping] = useState('300000');
  const [totalCustomsTax, setTotalCustomsTax] = useState('150000');
  const [otherCosts, setOtherCosts] = useState('50000');

  function addProduct() {
    setLclProducts((prev) => [
      ...prev,
      { id: `new_${Date.now()}`, name: '', quantity: '', unitPrice: '' },
    ]);
  }

  function removeProduct(id: string) {
    setLclProducts((prev) => prev.filter((p) => p.id !== id));
  }

  function updateProduct(id: string, field: keyof LclProduct, value: string) {
    setLclProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  }

  // 파싱된 상품 목록 (계산용)
  const parsedProducts = lclProducts.map((p) => ({
    ...p,
    qty: Number(p.quantity) || 0,
    price: Number(p.unitPrice) || 0,
    subtotal: (Number(p.quantity) || 0) * (Number(p.unitPrice) || 0),
  }));

  const totalQty = parsedProducts.reduce((sum, p) => sum + p.qty, 0);
  const totalAmount = parsedProducts.reduce((sum, p) => sum + p.subtotal, 0);
  const shipping = Number(totalShipping) || 0;
  const customs = Number(totalCustomsTax) || 0;
  const other = Number(otherCosts) || 0;
  const totalCosts = shipping + customs + other;

  function getDistributionRatio(product: (typeof parsedProducts)[0]): number {
    if (method === 'equal') return parsedProducts.length > 0 ? 1 / parsedProducts.length : 0;
    if (method === 'amount') return totalAmount > 0 ? product.subtotal / totalAmount : 0;
    if (method === 'quantity') return totalQty > 0 ? product.qty / totalQty : 0;
    return 0;
  }

  const results = parsedProducts.map((product) => {
    const ratio = getDistributionRatio(product);
    const shippingAlloc = Math.round(shipping * ratio);
    const customsAlloc = Math.round(customs * ratio);
    const otherAlloc = Math.round(other * ratio);
    const totalAlloc = shippingAlloc + customsAlloc + otherAlloc;
    const costPerUnit =
      product.qty > 0
        ? Math.round(product.price + totalAlloc / product.qty)
        : product.price;

    return {
      ...product,
      shippingAlloc,
      customsAlloc,
      otherAlloc,
      costPerUnit,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">LCL 원가 배분 계산기</h1>
        <p className="text-sm text-gray-500 mt-1">
          혼적 화물의 배송비 및 관부가세를 상품별로 배분하세요.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 왼쪽: 배분 방식 + 상품 목록 */}
        <div className="col-span-2 space-y-4">
          {/* 배분 방식 선택 */}
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-3">배분 방식</h2>
            <div className="flex gap-2">
              {(Object.keys(METHOD_LABELS) as DistributionMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors border',
                    method === m
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  )}
                >
                  {METHOD_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          {/* 입고 상품 목록 */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">입고 상품 목록</h2>
              <Button size="sm" variant="outline" onClick={addProduct}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                상품 추가
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-xs text-gray-500">
                    <th className="px-4 py-3 text-left">상품명</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">입고수량</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">단가 (원)</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">소계 (원)</th>
                    <th className="px-4 py-3 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {parsedProducts.map((product) => (
                    <tr key={product.id} className="border-b">
                      <td className="px-4 py-2">
                        <Input
                          className="h-7 text-sm"
                          value={product.name}
                          onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                          placeholder="상품명"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          className="h-7 text-right text-sm w-24 ml-auto"
                          type="number"
                          value={product.quantity}
                          onChange={(e) =>
                            updateProduct(product.id, 'quantity', e.target.value)
                          }
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          className="h-7 text-right text-sm w-28 ml-auto"
                          type="number"
                          value={product.unitPrice}
                          onChange={(e) =>
                            updateProduct(product.id, 'unitPrice', e.target.value)
                          }
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-gray-700">
                        {product.subtotal.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => removeProduct(product.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 border-t-2 font-semibold text-sm">
                    <td className="px-4 py-2.5 text-gray-700">합계</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">
                      {totalQty.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5" />
                    <td className="px-4 py-2.5 text-right text-gray-700">
                      {totalAmount.toLocaleString()}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 오른쪽: 공통 비용 */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-4">공통 비용</h2>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">총 배송비 (원)</Label>
                <Input
                  type="number"
                  value={totalShipping}
                  onChange={(e) => setTotalShipping(e.target.value)}
                  className="text-right"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">총 관부가세 (원)</Label>
                <Input
                  type="number"
                  value={totalCustomsTax}
                  onChange={(e) => setTotalCustomsTax(e.target.value)}
                  className="text-right"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">기타 비용 (원)</Label>
                <Input
                  type="number"
                  value={otherCosts}
                  onChange={(e) => setOtherCosts(e.target.value)}
                  className="text-right"
                />
              </div>
              <div className="pt-3 border-t">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-gray-600">총 공통비용</span>
                  <span className="text-blue-600">{totalCosts.toLocaleString()}원</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 배분 결과 테이블 */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">배분 결과</h2>
          <span className="text-xs text-gray-400">배분 방식: {METHOD_LABELS[method]}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs text-gray-500">
                <th className="px-4 py-3 text-left">상품명</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">입고수량</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">단가</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">배송비 배분</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">관부가세 배분</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">기타 배분</th>
                <th className="px-4 py-3 text-right whitespace-nowrap bg-blue-50">
                  개당 실제원가
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-800">{result.name || '-'}</td>
                  <td className="px-4 py-3 text-right">{result.qty.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{result.price.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {result.shippingAlloc.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {result.customsAlloc.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {result.otherAlloc.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-blue-600 bg-blue-50">
                    {result.costPerUnit.toLocaleString()}원
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t bg-gray-50 flex justify-end">
          <Button>입고이력 적용</Button>
        </div>
      </div>
    </div>
  );
}
