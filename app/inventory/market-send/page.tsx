'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { inventoryApi } from '@/lib/api';
import type { MarketSendHistory } from '@/lib/supabase/types';
import { Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatusItem = {
  product_id: string;
  alias: string;
  name: string;
  option: string | null;
  market_stock: number;
  domestic_stock: number;
  daily_avg_sales: number;
  monthly_target: number;
  remaining_days: number;
  recommended_stock: number;
  risk_level: 'danger' | 'warning' | 'safe';
};

interface SendQty {
  gross: string;
  rocket: string;
}

export default function MarketSendPage() {
  const [statusItems, setStatusItems] = useState<StatusItem[]>([]);
  const [history, setHistory] = useState<MarketSendHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendQty, setSendQty] = useState<Record<string, SendQty>>({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [statusRes, histRes] = await Promise.all([
        inventoryApi.getStatus(),
        inventoryApi.getMarketSendHistory(),
      ]);
      if (statusRes.error) {
        setError(statusRes.error.message);
        setLoading(false);
        return;
      }
      const items = statusRes.data ?? [];
      setStatusItems(items);
      const defaultSend: Record<string, SendQty> = {};
      items.forEach((i) => {
        defaultSend[i.product_id] = { gross: '', rocket: '' };
      });
      setSendQty(defaultSend);
      setHistory(histRes.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">로딩 중...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  function getStock(productId: string) {
    const item = statusItems.find((i) => i.product_id === productId);
    return {
      totalStock: item?.domestic_stock ?? 0,
      grossStock: item?.market_stock ?? 0,
      rocketStock: 0,
    };
  }

  function calcAfterDispatch(productId: string): number {
    const stock = getStock(productId);
    const grossSend = Number(sendQty[productId]?.gross) || 0;
    const rocketSend = Number(sendQty[productId]?.rocket) || 0;
    return stock.totalStock - grossSend - rocketSend;
  }

  async function handleDispatch(productId: string) {
    const grossSend = Number(sendQty[productId]?.gross) || 0;
    const rocketSend = Number(sendQty[productId]?.rocket) || 0;
    if (grossSend === 0 && rocketSend === 0) return;

    const product = statusItems.find((i) => i.product_id === productId);
    const promises: Promise<unknown>[] = [];

    if (grossSend > 0) {
      promises.push(
        inventoryApi.addMarketSend({
          product_id: productId,
          product_name: product?.name ?? null,
          market_type: 'growth',
          quantity: grossSend,
          send_date: '2026-03-02',
          status: 'complete',
        })
      );
    }
    if (rocketSend > 0) {
      promises.push(
        inventoryApi.addMarketSend({
          product_id: productId,
          product_name: product?.name ?? null,
          market_type: 'rocket',
          quantity: rocketSend,
          send_date: '2026-03-02',
          status: 'complete',
        })
      );
    }

    await Promise.all(promises);

    const [statusRes, histRes] = await Promise.all([
      inventoryApi.getStatus(),
      inventoryApi.getMarketSendHistory(),
    ]);
    if (statusRes.data) setStatusItems(statusRes.data);
    if (histRes.data) setHistory(histRes.data);
    setSendQty((prev) => ({ ...prev, [productId]: { gross: '', rocket: '' } }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">마켓별 재고 발송</h1>
        <p className="text-sm text-gray-500 mt-1">
          마켓별 발송 수량을 입력하고 발송 처리하세요.
        </p>
      </div>

      {/* 발송 입력 테이블 */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b">
          <h2 className="font-semibold text-gray-800">마켓별 발송 입력</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs text-gray-500">
                <th className="px-4 py-3 text-left whitespace-nowrap">상품명</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">국내총재고</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">그로스 현재재고</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">로켓 현재재고</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">그로스 발송수량</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">로켓 발송수량</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">발송후총재고</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">발송완료</th>
              </tr>
            </thead>
            <tbody>
              {statusItems.map((product) => {
                const stock = getStock(product.product_id);
                const afterDispatch = calcAfterDispatch(product.product_id);
                const grossSend = Number(sendQty[product.product_id]?.gross) || 0;
                const rocketSend = Number(sendQty[product.product_id]?.rocket) || 0;
                const hasInput = grossSend > 0 || rocketSend > 0;

                return (
                  <tr
                    key={product.product_id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                    <td className="px-4 py-3 text-right">
                      {stock.totalStock.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {stock.grossStock.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {stock.rocketStock.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Input
                        type="number"
                        className="h-7 text-right text-sm w-24 ml-auto"
                        placeholder="0"
                        value={sendQty[product.product_id]?.gross ?? ''}
                        onChange={(e) =>
                          setSendQty((prev) => ({
                            ...prev,
                            [product.product_id]: {
                              ...prev[product.product_id],
                              gross: e.target.value,
                            },
                          }))
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Input
                        type="number"
                        className="h-7 text-right text-sm w-24 ml-auto"
                        placeholder="0"
                        value={sendQty[product.product_id]?.rocket ?? ''}
                        onChange={(e) =>
                          setSendQty((prev) => ({
                            ...prev,
                            [product.product_id]: {
                              ...prev[product.product_id],
                              rocket: e.target.value,
                            },
                          }))
                        }
                      />
                    </td>
                    <td
                      className={cn(
                        'px-4 py-3 text-right font-semibold',
                        hasInput
                          ? afterDispatch >= 0
                            ? 'text-blue-600'
                            : 'text-red-600'
                          : 'text-gray-400'
                      )}
                    >
                      {hasInput ? afterDispatch.toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        disabled={!hasInput || afterDispatch < 0}
                        onClick={() => handleDispatch(product.product_id)}
                      >
                        <Truck className="w-3 h-3 mr-1" />
                        발송완료
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 발송 이력 */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b">
            <h2 className="font-semibold text-gray-800">발송 이력</h2>
          </div>
          <div className="p-5">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-3">
                {history.map((record) => (
                  <div key={record.id} className="relative pl-10">
                    <div className="absolute left-3 top-2 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white ring-2 ring-green-200" />
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-500">{record.send_date}</span>
                        <span className="text-xs font-medium text-gray-700">
                          {record.product_name}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">마켓</span>
                          <div className="font-semibold text-gray-700">
                            {record.market_type === 'growth'
                              ? '그로스'
                              : record.market_type === 'rocket'
                              ? '로켓'
                              : record.market_type}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">발송수량</span>
                          <div className="font-semibold text-gray-700">
                            {record.quantity.toLocaleString()}개
                          </div>
                        </div>
                        {record.note && (
                          <div>
                            <span className="text-gray-400">메모</span>
                            <div className="font-semibold text-gray-700">{record.note}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
