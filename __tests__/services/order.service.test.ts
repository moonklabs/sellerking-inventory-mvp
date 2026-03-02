import {
  getNextStatus,
  canTransition,
  validateOrderData,
} from '../../lib/services/order.service';

describe('발주 상태 전이', () => {
  it('recommend → request 가능', () => {
    expect(canTransition('recommend', 'request')).toBe(true);
  });

  it('recommend → purchase_confirmed 불가', () => {
    expect(canTransition('recommend', 'purchase_confirmed')).toBe(false);
  });

  it('received 이후 전이 불가', () => {
    expect(canTransition('received', 'recommend')).toBe(false);
    expect(canTransition('received', 'request')).toBe(false);
  });

  it('getNextStatus: recommend의 다음은 request', () => {
    expect(getNextStatus('recommend')).toBe('request');
  });

  it('getNextStatus: received는 다음 상태 없음 (null 반환)', () => {
    expect(getNextStatus('received')).toBeNull();
  });

  it('getNextStatus: purchase_complete의 다음은 china_arrived', () => {
    expect(getNextStatus('purchase_complete')).toBe('china_arrived');
  });
});

describe('발주 데이터 검증', () => {
  it('필수 필드 누락 시 에러 반환', () => {
    const result = validateOrderData({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('필수 필드 모두 있으면 유효', () => {
    const result = validateOrderData({
      product_name: '테스트 상품',
      order_qty: 100,
      unit_price: 5000,
    });
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('order_qty가 0 이하이면 에러', () => {
    const result = validateOrderData({
      product_name: '테스트 상품',
      order_qty: 0,
      unit_price: 5000,
    });
    expect(result.valid).toBe(false);
  });

  it('unit_price가 음수이면 에러', () => {
    const result = validateOrderData({
      product_name: '테스트 상품',
      order_qty: 100,
      unit_price: -1000,
    });
    expect(result.valid).toBe(false);
  });
});
