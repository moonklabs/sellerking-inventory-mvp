// ===== 재고 관련 비즈니스 로직 =====

export type RiskLevel = 'danger' | 'warning' | 'safe';
export type CostDistributionMethod = 'amount' | 'equal' | 'quantity';

export interface CostDistributionItem {
  id: string;
  value: number;
  quantity: number;
}

export interface CostDistributionResult {
  id: string;
  allocated: number;
}

/**
 * 잔여 판매 가능일 계산
 * @param marketStock 마켓 재고
 * @param dailyAvg 일평균 판매량
 */
export function calculateRemainingDays(marketStock: number, dailyAvg: number): number {
  if (marketStock <= 0) return 0;
  if (dailyAvg === 0) return Infinity;
  return Math.floor(marketStock / dailyAvg);
}

/**
 * 입고권장 수량 계산
 * @param monthlyTarget 월 목표 판매량
 * @param leadTime 리드타임 (일)
 * @param currentStock 현재 국내 재고
 */
export function calculateRecommendedStock(
  monthlyTarget: number,
  leadTime: number,
  currentStock: number
): number {
  const dailyTarget = monthlyTarget / 30;
  const requiredStock = Math.ceil(dailyTarget * leadTime);
  return requiredStock - currentStock;
}

/**
 * 재고 위험도 계산
 * @param remainingDays 잔여 판매 가능일
 */
export function calculateRiskLevel(remainingDays: number): RiskLevel {
  if (remainingDays <= 7) return 'danger';
  if (remainingDays <= 14) return 'warning';
  return 'safe';
}

/**
 * LCL 원가 배분
 * @param items 배분 대상 상품 목록
 * @param totalCost 총 배분 비용
 * @param method 배분 방식 (amount: 금액비례, equal: N분의1, quantity: 수량비례)
 */
export function distributeCost(
  items: CostDistributionItem[],
  totalCost: number,
  method: CostDistributionMethod
): CostDistributionResult[] {
  if (items.length === 0) return [];

  switch (method) {
    case 'equal': {
      const perItem = Math.floor(totalCost / items.length);
      return items.map((item) => ({ id: item.id, allocated: perItem }));
    }
    case 'amount': {
      const totalValue = items.reduce((sum, item) => sum + item.value, 0);
      if (totalValue === 0) {
        const perItem = Math.floor(totalCost / items.length);
        return items.map((item) => ({ id: item.id, allocated: perItem }));
      }
      return items.map((item) => ({
        id: item.id,
        allocated: Math.floor((item.value / totalValue) * totalCost),
      }));
    }
    case 'quantity': {
      const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
      if (totalQty === 0) {
        const perItem = Math.floor(totalCost / items.length);
        return items.map((item) => ({ id: item.id, allocated: perItem }));
      }
      return items.map((item) => ({
        id: item.id,
        allocated: Math.floor((item.quantity / totalQty) * totalCost),
      }));
    }
  }
}
