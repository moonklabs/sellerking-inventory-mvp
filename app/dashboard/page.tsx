'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockCalendarData, formatCurrency, CalendarDay } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

type MarketFilter = 'all' | 'rocket' | 'growth' | 'wing';

const MARKET_TABS: { value: MarketFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'rocket', label: '로켓' },
  { value: 'growth', label: '그로스' },
  { value: 'wing', label: '윙' },
];

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function DashboardPage() {
  const router = useRouter();
  const [market, setMarket] = useState<MarketFilter>('all');
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(3); // 1-based

  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const calendarDataMap = new Map<number, CalendarDay>(
    mockCalendarData.map((d) => [d.date, d])
  );

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  // 총 셀 수: offset + days를 7의 배수로 맞춤
  const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;

  return (
    <div className="space-y-4">
      {/* 상단 컨트롤 */}
      <div className="flex items-center justify-between">
        {/* 월 이동 */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xl font-semibold min-w-[120px] text-center">
            {year}년 {month}월
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* 마켓 필터 탭 */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {MARKET_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setMarket(tab.value)}
              className={cn(
                'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                market === tab.value
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 캘린더 */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b">
          {WEEKDAYS.map((day, i) => (
            <div
              key={day}
              className={cn(
                'py-2.5 text-center text-xs font-semibold',
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 셀 */}
        <div className="grid grid-cols-7">
          {Array.from({ length: totalCells }, (_, i) => {
            const date = i - firstDayOfWeek + 1;
            const isValidDate = date >= 1 && date <= daysInMonth;
            const data = isValidDate ? calendarDataMap.get(date) : undefined;
            const dow = i % 7;
            const isToday = isValidDate && year === 2026 && month === 3 && date === 1;

            return (
              <div
                key={i}
                className={cn(
                  'min-h-[120px] p-2 border-b border-r text-xs',
                  !isValidDate && 'bg-gray-50',
                  isToday && 'bg-blue-50',
                  dow === 0 && isValidDate && 'bg-red-50/30',
                  dow === 6 && isValidDate && 'bg-blue-50/30',
                )}
              >
                {isValidDate && (
                  <>
                    {/* 날짜 숫자 */}
                    <div className={cn(
                      'font-semibold mb-1.5 w-6 h-6 flex items-center justify-center rounded-full',
                      isToday ? 'bg-blue-600 text-white' : dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-gray-700'
                    )}>
                      {date}
                    </div>

                    {/* 입고권장 */}
                    {data && data.recommendInbound > 0 && (
                      <button
                        onClick={() => router.push('/inventory/orders?tab=recommend')}
                        className="w-full text-left mb-1"
                      >
                        <Badge variant="destructive" className="text-xs w-full justify-between px-1.5">
                          <span>입고권장</span>
                          <span>{data.recommendInbound}</span>
                        </Badge>
                      </button>
                    )}

                    {/* 재고주문 */}
                    {data && data.stockOrder > 0 && (
                      <div className="w-full mb-1">
                        <Badge variant="outline" className="text-xs w-full justify-between px-1.5 border-orange-300 text-orange-700 bg-orange-50">
                          <span>재고주문</span>
                          <span>{data.stockOrder}</span>
                        </Badge>
                      </div>
                    )}

                    {/* 입고중 */}
                    {data && data.inboundInProgress > 0 && (
                      <button
                        onClick={() => router.push('/inventory/orders?tab=korea_arrived')}
                        className="w-full text-left mb-1"
                      >
                        <Badge className="text-xs w-full justify-between px-1.5 bg-green-100 text-green-800 hover:bg-green-200">
                          <span>입고중</span>
                          <span>{data.inboundInProgress}</span>
                        </Badge>
                      </button>
                    )}

                    {/* 매출 / 순이익 */}
                    {data && (
                      <div className="mt-1.5 space-y-0.5 text-[10px]">
                        <div className="flex justify-between text-gray-500">
                          <span>매출</span>
                          <span className="font-medium text-gray-700">
                            {(data.sales / 10000).toFixed(0)}만
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>순이익</span>
                          <span className="font-medium text-blue-600">
                            {(data.netProfit / 10000).toFixed(0)}만
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-500 inline-block" />
          <span>입고권장 (클릭 가능)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-orange-100 border border-orange-300 inline-block" />
          <span>재고주문</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-100 inline-block" />
          <span>입고중 (클릭 가능)</span>
        </div>
      </div>
    </div>
  );
}
