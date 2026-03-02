'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockInventoryProducts } from '@/lib/mock-data';
import { Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

const STOCK_KEY = 'sellerking_market_stocks';
const HISTORY_KEY = 'sellerking_dispatch_history';

interface StockState {
  [productId: string]: {
    totalStock: number;
    grossStock: number;
    rocketStock: number;
  };
}

interface DispatchRecord {
  id: string;
  date: string;
  productId: string;
  productName: string;
  grossSent: number;
  rocketSent: number;
  totalBefore: number;
  totalAfter: number;
}

interface SendQty {
  gross: string;
  rocket: string;
}

export default function MarketSendPage() {
  const products = mockInventoryProducts;
  const [stocks, setStocks] = useState<StockState>({});
  const [sendQty, setSendQty] = useState<Record<string, SendQty>>(() => {
    const defaultSend: Record<string, SendQty> = {};
    mockInventoryProducts.forEach((p) => {
      defaultSend[p.id] = { gross: '', rocket: '' };
    });
    return defaultSend;
  });
  const [history, setHistory] = useState<DispatchRecord[]>([]);

  useEffect(() => {
    try {
      const storedStocks = localStorage.getItem(STOCK_KEY);
      if (storedStocks) {
        setStocks(JSON.parse(storedStocks));
      } else {
        const defaultStocks: StockState = {};
        mockInventoryProducts.forEach((p) => {
          defaultStocks[p.id] = {
            totalStock: p.totalStock,
            grossStock: p.grossStock,
            rocketStock: p.rocketStock,
          };
        });
        setStocks(defaultStocks);
      }

      const storedHistory = localStorage.getItem(HISTORY_KEY);
      if (storedHistory) setHistory(JSON.parse(storedHistory));
    } catch {
      const defaultStocks: StockState = {};
      mockInventoryProducts.forEach((p) => {
        defaultStocks[p.id] = {
          totalStock: p.totalStock,
          grossStock: p.grossStock,
          rocketStock: p.rocketStock,
        };
      });
      setStocks(defaultStocks);
    }
  }, []);

  function getStock(productId: string) {
    const product = mockInventoryProducts.find((p) => p.id === productId);
    return (
      stocks[productId] ?? {
        totalStock: product?.totalStock ?? 0,
        grossStock: product?.grossStock ?? 0,
        rocketStock: product?.rocketStock ?? 0,
      }
    );
  }

  function calcAfterDispatch(productId: string): number {
    const stock = getStock(productId);
    const grossSend = Number(sendQty[productId]?.gross) || 0;
    const rocketSend = Number(sendQty[productId]?.rocket) || 0;
    return stock.totalStock - grossSend - rocketSend;
  }

  function handleDispatch(productId: string) {
    const grossSend = Number(sendQty[productId]?.gross) || 0;
    const rocketSend = Number(sendQty[productId]?.rocket) || 0;
    if (grossSend === 0 && rocketSend === 0) return;

    const stock = getStock(productId);
    const productName = products.find((p) => p.id === productId)?.name ?? '';
    const totalBefore = stock.totalStock;
    const totalAfter = totalBefore - grossSend - rocketSend;

    const newStocks: StockState = {
      ...stocks,
      [productId]: {
        totalStock: totalAfter,
        grossStock: stock.grossStock + grossSend,
        rocketStock: stock.rocketStock + rocketSend,
      },
    };

    const newRecord: DispatchRecord = {
      id: `dispatch_${Date.now()}`,
      date: '2026-03-02',
      productId,
      productName,
      grossSent: grossSend,
      rocketSent: rocketSend,
      totalBefore,
      totalAfter,
    };

    const newHistory = [newRecord, ...history];

    setStocks(newStocks);
    setHistory(newHistory);
    setSendQty((prev) => ({ ...prev, [productId]: { gross: '', rocket: '' } }));

    try {
      localStorage.setItem(STOCK_KEY, JSON.stringify(newStocks));
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    } catch {
      // ignore
    }
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
              {products.map((product) => {
                const stock = getStock(product.id);
                const afterDispatch = calcAfterDispatch(product.id);
                const grossSend = Number(sendQty[product.id]?.gross) || 0;
                const rocketSend = Number(sendQty[product.id]?.rocket) || 0;
                const hasInput = grossSend > 0 || rocketSend > 0;

                return (
                  <tr
                    key={product.id}
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
                        value={sendQty[product.id]?.gross ?? ''}
                        onChange={(e) =>
                          setSendQty((prev) => ({
                            ...prev,
                            [product.id]: { ...prev[product.id], gross: e.target.value },
                          }))
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Input
                        type="number"
                        className="h-7 text-right text-sm w-24 ml-auto"
                        placeholder="0"
                        value={sendQty[product.id]?.rocket ?? ''}
                        onChange={(e) =>
                          setSendQty((prev) => ({
                            ...prev,
                            [product.id]: { ...prev[product.id], rocket: e.target.value },
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
                        onClick={() => handleDispatch(product.id)}
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
                        <span className="text-xs text-gray-500">{record.date}</span>
                        <span className="text-xs font-medium text-gray-700">
                          {record.productName}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        {record.grossSent > 0 && (
                          <div>
                            <span className="text-gray-400">그로스 발송</span>
                            <div className="font-semibold text-gray-700">
                              {record.grossSent.toLocaleString()}개
                            </div>
                          </div>
                        )}
                        {record.rocketSent > 0 && (
                          <div>
                            <span className="text-gray-400">로켓 발송</span>
                            <div className="font-semibold text-gray-700">
                              {record.rocketSent.toLocaleString()}개
                            </div>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-400">발송 전 재고</span>
                          <div className="font-semibold text-gray-700">
                            {record.totalBefore.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">발송 후 재고</span>
                          <div className="font-semibold text-green-600">
                            {record.totalAfter.toLocaleString()}
                          </div>
                        </div>
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
