import {
  calculateRemainingDays,
  calculateRecommendedStock,
  calculateRiskLevel,
  distributeCost,
} from '../../lib/services/inventory.service';

describe('재고 현황 계산', () => {
  describe('잔여 판매 가능일 계산', () => {
    it('마켓재고 180개, 일평균 20개면 9일 반환', () => {
      expect(calculateRemainingDays(180, 20)).toBe(9);
    });

    it('마켓재고 0이면 0일 반환', () => {
      expect(calculateRemainingDays(0, 20)).toBe(0);
    });

    it('일평균 0이면 Infinity 반환', () => {
      expect(calculateRemainingDays(100, 0)).toBe(Infinity);
    });
  });

  describe('입고권장 수량 계산', () => {
    it('월목표 600, 리드타임 45일, 현재재고 1200이면 음수 반환 (재고충분)', () => {
      // 월목표 600 → 일목표 20개. 45일치 = 900개. 현재재고 1200 > 900 → 음수
      const result = calculateRecommendedStock(600, 45, 1200);
      expect(result).toBeLessThan(0);
    });

    it('월목표 120, 리드타임 45일, 현재재고 0이면 180 반환', () => {
      // 일목표 4개. 45일치 = 180개. 현재재고 0 → 180 필요
      expect(calculateRecommendedStock(120, 45, 0)).toBe(180);
    });
  });

  describe('위험도 계산', () => {
    it('7일 이하면 danger', () => {
      expect(calculateRiskLevel(7)).toBe('danger');
      expect(calculateRiskLevel(0)).toBe('danger');
    });

    it('8~14일이면 warning', () => {
      expect(calculateRiskLevel(8)).toBe('warning');
      expect(calculateRiskLevel(14)).toBe('warning');
    });

    it('15일 이상이면 safe', () => {
      expect(calculateRiskLevel(15)).toBe('safe');
      expect(calculateRiskLevel(100)).toBe('safe');
    });
  });

  describe('LCL 원가 배분', () => {
    it('금액비례: 상품A 500000원, 상품B 500000원이면 1:1 배분', () => {
      const items = [
        { id: 'A', value: 500000, quantity: 10 },
        { id: 'B', value: 500000, quantity: 10 },
      ];
      const result = distributeCost(items, 100000, 'amount');
      expect(result[0].allocated).toBe(50000);
      expect(result[1].allocated).toBe(50000);
    });

    it('N분의1: 3개 상품이면 1/3씩 배분', () => {
      const items = [
        { id: 'A', value: 100000, quantity: 10 },
        { id: 'B', value: 200000, quantity: 20 },
        { id: 'C', value: 300000, quantity: 30 },
      ];
      const result = distributeCost(items, 30000, 'equal');
      expect(result[0].allocated).toBe(10000);
      expect(result[1].allocated).toBe(10000);
      expect(result[2].allocated).toBe(10000);
    });

    it('수량비례: 100개:200개면 1:2 배분', () => {
      const items = [
        { id: 'A', value: 500000, quantity: 100 },
        { id: 'B', value: 500000, quantity: 200 },
      ];
      const result = distributeCost(items, 90000, 'quantity');
      expect(result[0].allocated).toBe(30000);
      expect(result[1].allocated).toBe(60000);
    });
  });
});
