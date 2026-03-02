// ===== 발주 관련 비즈니스 로직 =====

import type { OrderStatus } from '../supabase/types';

// 상태 전이 순서 (순방향만 허용)
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

/**
 * 다음 상태 반환
 * @param current 현재 상태
 * @returns 다음 상태 또는 null (마지막 상태)
 */
export function getNextStatus(current: OrderStatus): OrderStatus | null {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx === STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

/**
 * 상태 전이 가능 여부 확인 (순방향 1단계만 허용)
 * @param from 현재 상태
 * @param to 전이 목표 상태
 */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  const next = getNextStatus(from);
  return next === to;
}

export interface OrderValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * 발주 데이터 유효성 검증
 */
export function validateOrderData(data: Partial<{
  product_name: string;
  order_qty: number;
  unit_price: number;
}>): OrderValidationResult {
  const errors: string[] = [];

  if (!data.product_name || data.product_name.trim() === '') {
    errors.push('상품명은 필수입니다.');
  }

  if (data.order_qty === undefined || data.order_qty === null) {
    errors.push('주문 수량은 필수입니다.');
  } else if (data.order_qty <= 0) {
    errors.push('주문 수량은 1 이상이어야 합니다.');
  }

  if (data.unit_price === undefined || data.unit_price === null) {
    errors.push('단가는 필수입니다.');
  } else if (data.unit_price < 0) {
    errors.push('단가는 0 이상이어야 합니다.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
