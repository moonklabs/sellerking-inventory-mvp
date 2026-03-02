// ===== 타입 정의 =====

export type MarketType = 'all' | 'rocket' | 'growth' | 'wing';
export type OrderStatus =
  | 'recommend'
  | 'request'
  | 'amount_confirmed'
  | 'purchase_confirmed'
  | 'purchase_complete'
  | 'china_arrived'
  | 'china_shipped'
  | 'korea_arrived'
  | 'received'
  | 'all';

export interface CostHistory {
  date: string;
  cost: number;
}

export interface Product {
  id: string;
  alias: string;
  name: string;
  option: string;
  price: number;
  currentCost: number;
  costHistory: CostHistory[];
  shippingFee: number;
  reviewCount: number;
  reviewScore: number;
  marketStock: number;
  domesticStock: number;
  updatedAt: string;
}

export interface DailyInventoryItem {
  id: string;
  productName: string;
  option: string;
  netProfit: number;
  inventoryValue: number;
  monthSales: number;
  daySales: number;
  marketStock: number;
  domesticStock: number;
  dailyTarget: number;
  recommendInbound: number;
  inboundInProgress: number;
  children?: DailyInventoryItem[];
}

export interface InventoryOrder {
  id: string;
  requestDate: string;
  productName: string;
  orderQty: number;
  unitPrice: number;
  totalAmount: number;
  status: OrderStatus;
  expectedShipDate: string;
  expectedArrivalDate: string;
  trackingNumber: string;
  customsTax: number;
  domesticShipping: number;
  memo: string;
}

export interface CalendarDay {
  date: number;
  recommendInbound: number;
  stockOrder: number;
  inboundInProgress: number;
  sales: number;
  netProfit: number;
}

// ===== 상품 Mock 데이터 =====

export const mockProducts: Product[] = [
  {
    id: 'p1',
    alias: '스포츠양말B',
    name: '프리미엄 스포츠양말',
    option: '블랙 M',
    price: 12000,
    currentCost: 3500,
    costHistory: [
      { date: '2024-01-15', cost: 3200 },
      { date: '2024-03-01', cost: 3500 },
    ],
    shippingFee: 2500,
    reviewCount: 1243,
    reviewScore: 4.8,
    marketStock: 85,
    domesticStock: 320,
    updatedAt: '2026-03-01',
  },
  {
    id: 'p2',
    alias: '스포츠양말B',
    name: '프리미엄 스포츠양말',
    option: '블랙 L',
    price: 12000,
    currentCost: 3500,
    costHistory: [
      { date: '2024-01-15', cost: 3200 },
      { date: '2024-03-01', cost: 3500 },
    ],
    shippingFee: 2500,
    reviewCount: 1243,
    reviewScore: 4.8,
    marketStock: 42,
    domesticStock: 180,
    updatedAt: '2026-03-01',
  },
  {
    id: 'p3',
    alias: '런닝화A',
    name: '경량 런닝화',
    option: '230',
    price: 65000,
    currentCost: 22000,
    costHistory: [
      { date: '2023-11-01', cost: 20000 },
      { date: '2024-02-01', cost: 22000 },
    ],
    shippingFee: 3000,
    reviewCount: 432,
    reviewScore: 4.6,
    marketStock: 15,
    domesticStock: 90,
    updatedAt: '2026-03-01',
  },
  {
    id: 'p4',
    alias: '런닝화A',
    name: '경량 런닝화',
    option: '240',
    price: 65000,
    currentCost: 22000,
    costHistory: [
      { date: '2023-11-01', cost: 20000 },
      { date: '2024-02-01', cost: 22000 },
    ],
    shippingFee: 3000,
    reviewCount: 432,
    reviewScore: 4.6,
    marketStock: 28,
    domesticStock: 140,
    updatedAt: '2026-03-01',
  },
  {
    id: 'p5',
    alias: '런닝화A',
    name: '경량 런닝화',
    option: '250',
    price: 65000,
    currentCost: 22000,
    costHistory: [
      { date: '2023-11-01', cost: 20000 },
      { date: '2024-02-01', cost: 22000 },
    ],
    shippingFee: 3000,
    reviewCount: 432,
    reviewScore: 4.6,
    marketStock: 8,
    domesticStock: 55,
    updatedAt: '2026-03-01',
  },
  {
    id: 'p6',
    alias: '기능성티',
    name: '기능성 티셔츠',
    option: 'S',
    price: 28000,
    currentCost: 8500,
    costHistory: [
      { date: '2024-02-01', cost: 8000 },
      { date: '2024-03-01', cost: 8500 },
    ],
    shippingFee: 2500,
    reviewCount: 87,
    reviewScore: 4.3,
    marketStock: 62,
    domesticStock: 210,
    updatedAt: '2026-03-01',
  },
  {
    id: 'p7',
    alias: '기능성티',
    name: '기능성 티셔츠',
    option: 'M',
    price: 28000,
    currentCost: 8500,
    costHistory: [
      { date: '2024-02-01', cost: 8000 },
      { date: '2024-03-01', cost: 8500 },
    ],
    shippingFee: 2500,
    reviewCount: 87,
    reviewScore: 4.3,
    marketStock: 95,
    domesticStock: 285,
    updatedAt: '2026-03-01',
  },
  {
    id: 'p8',
    alias: '기능성티',
    name: '기능성 티셔츠',
    option: 'L',
    price: 28000,
    currentCost: 8500,
    costHistory: [
      { date: '2024-02-01', cost: 8000 },
      { date: '2024-03-01', cost: 8500 },
    ],
    shippingFee: 2500,
    reviewCount: 87,
    reviewScore: 4.3,
    marketStock: 38,
    domesticStock: 155,
    updatedAt: '2026-03-01',
  },
];

// ===== 일일 재고 Mock 데이터 =====

export const mockDailyInventory: DailyInventoryItem[] = [
  {
    id: 'di1',
    productName: '프리미엄 스포츠양말',
    option: '전체',
    netProfit: 4820000,
    inventoryValue: 6020000,
    monthSales: 620,
    daySales: 24,
    marketStock: 127,
    domesticStock: 500,
    dailyTarget: 30,
    recommendInbound: 90,
    inboundInProgress: 200,
    children: [
      {
        id: 'di1-1',
        productName: '프리미엄 스포츠양말',
        option: '블랙 M',
        netProfit: 2980000,
        inventoryValue: 3680000,
        monthSales: 380,
        daySales: 15,
        marketStock: 85,
        domesticStock: 320,
        dailyTarget: 18,
        recommendInbound: 54,
        inboundInProgress: 120,
      },
      {
        id: 'di1-2',
        productName: '프리미엄 스포츠양말',
        option: '블랙 L',
        netProfit: 1840000,
        inventoryValue: 2340000,
        monthSales: 240,
        daySales: 9,
        marketStock: 42,
        domesticStock: 180,
        dailyTarget: 12,
        recommendInbound: 36,
        inboundInProgress: 80,
      },
    ],
  },
  {
    id: 'di2',
    productName: '경량 런닝화',
    option: '전체',
    netProfit: 8650000,
    inventoryValue: 18600000,
    monthSales: 218,
    daySales: 8,
    marketStock: 51,
    domesticStock: 285,
    dailyTarget: 10,
    recommendInbound: 30,
    inboundInProgress: 0,
    children: [
      {
        id: 'di2-1',
        productName: '경량 런닝화',
        option: '230',
        netProfit: 2100000,
        inventoryValue: 4320000,
        monthSales: 52,
        daySales: 2,
        marketStock: 15,
        domesticStock: 90,
        dailyTarget: 3,
        recommendInbound: 15,
        inboundInProgress: 0,
      },
      {
        id: 'di2-2',
        productName: '경량 런닝화',
        option: '240',
        netProfit: 3850000,
        inventoryValue: 8640000,
        monthSales: 96,
        daySales: 4,
        marketStock: 28,
        domesticStock: 140,
        dailyTarget: 4,
        recommendInbound: 0,
        inboundInProgress: 0,
      },
      {
        id: 'di2-3',
        productName: '경량 런닝화',
        option: '250',
        netProfit: 2700000,
        inventoryValue: 5640000,
        monthSales: 70,
        daySales: 2,
        marketStock: 8,
        domesticStock: 55,
        dailyTarget: 3,
        recommendInbound: 15,
        inboundInProgress: 0,
      },
    ],
  },
  {
    id: 'di3',
    productName: '기능성 티셔츠',
    option: '전체',
    netProfit: 2990000,
    inventoryValue: 17340000,
    monthSales: 175,
    daySales: 7,
    marketStock: 195,
    domesticStock: 650,
    dailyTarget: 8,
    recommendInbound: 0,
    inboundInProgress: 300,
    children: [
      {
        id: 'di3-1',
        productName: '기능성 티셔츠',
        option: 'S',
        netProfit: 850000,
        inventoryValue: 5185000,
        monthSales: 50,
        daySales: 2,
        marketStock: 62,
        domesticStock: 210,
        dailyTarget: 2,
        recommendInbound: 0,
        inboundInProgress: 100,
      },
      {
        id: 'di3-2',
        productName: '기능성 티셔츠',
        option: 'M',
        netProfit: 1360000,
        inventoryValue: 6885000,
        monthSales: 80,
        daySales: 3,
        marketStock: 95,
        domesticStock: 285,
        dailyTarget: 4,
        recommendInbound: 0,
        inboundInProgress: 120,
      },
      {
        id: 'di3-3',
        productName: '기능성 티셔츠',
        option: 'L',
        netProfit: 780000,
        inventoryValue: 5270000,
        monthSales: 45,
        daySales: 2,
        marketStock: 38,
        domesticStock: 155,
        dailyTarget: 2,
        recommendInbound: 0,
        inboundInProgress: 80,
      },
    ],
  },
];

// ===== 재고 주문 Mock 데이터 =====

export const mockInventoryOrders: InventoryOrder[] = [
  {
    id: 'o1',
    requestDate: '2026-03-01',
    productName: '프리미엄 스포츠양말 (블랙 M)',
    orderQty: 500,
    unitPrice: 3500,
    totalAmount: 1750000,
    status: 'recommend',
    expectedShipDate: '',
    expectedArrivalDate: '',
    trackingNumber: '',
    customsTax: 0,
    domesticShipping: 0,
    memo: '월말 재고 부족 예상',
  },
  {
    id: 'o2',
    requestDate: '2026-03-01',
    productName: '경량 런닝화 (250)',
    orderQty: 100,
    unitPrice: 22000,
    totalAmount: 2200000,
    status: 'recommend',
    expectedShipDate: '',
    expectedArrivalDate: '',
    trackingNumber: '',
    customsTax: 0,
    domesticShipping: 0,
    memo: '빠른 소진 예상',
  },
  {
    id: 'o3',
    requestDate: '2026-02-15',
    productName: '기능성 티셔츠 (S, M, L)',
    orderQty: 600,
    unitPrice: 8500,
    totalAmount: 5100000,
    status: 'purchase_confirmed',
    expectedShipDate: '2026-03-10',
    expectedArrivalDate: '2026-03-25',
    trackingNumber: '',
    customsTax: 280000,
    domesticShipping: 150000,
    memo: '',
  },
  {
    id: 'o4',
    requestDate: '2026-02-10',
    productName: '프리미엄 스포츠양말 (블랙 L)',
    orderQty: 400,
    unitPrice: 3500,
    totalAmount: 1400000,
    status: 'purchase_complete',
    expectedShipDate: '2026-03-05',
    expectedArrivalDate: '2026-03-20',
    trackingNumber: 'SH2024031001',
    customsTax: 70000,
    domesticShipping: 80000,
    memo: '긴급 주문',
  },
  {
    id: 'o5',
    requestDate: '2026-02-05',
    productName: '경량 런닝화 (230, 240)',
    orderQty: 200,
    unitPrice: 22000,
    totalAmount: 4400000,
    status: 'china_arrived',
    expectedShipDate: '2026-02-28',
    expectedArrivalDate: '2026-03-15',
    trackingNumber: 'CN2024022801',
    customsTax: 350000,
    domesticShipping: 200000,
    memo: '',
  },
  {
    id: 'o6',
    requestDate: '2026-01-25',
    productName: '기능성 티셔츠 (M)',
    orderQty: 300,
    unitPrice: 8500,
    totalAmount: 2550000,
    status: 'china_shipped',
    expectedShipDate: '2026-02-20',
    expectedArrivalDate: '2026-03-10',
    trackingNumber: 'CN2024022001',
    customsTax: 140000,
    domesticShipping: 100000,
    memo: '선박 운송',
  },
  {
    id: 'o7',
    requestDate: '2026-01-15',
    productName: '프리미엄 스포츠양말 (블랙 M, L)',
    orderQty: 600,
    unitPrice: 3500,
    totalAmount: 2100000,
    status: 'korea_arrived',
    expectedShipDate: '2026-02-10',
    expectedArrivalDate: '2026-03-01',
    trackingNumber: 'KR2024030101',
    customsTax: 105000,
    domesticShipping: 120000,
    memo: '',
  },
  {
    id: 'o8',
    requestDate: '2026-01-05',
    productName: '경량 런닝화 (240, 250)',
    orderQty: 150,
    unitPrice: 22000,
    totalAmount: 3300000,
    status: 'received',
    expectedShipDate: '2026-01-30',
    expectedArrivalDate: '2026-02-15',
    trackingNumber: 'KR2024021501',
    customsTax: 260000,
    domesticShipping: 150000,
    memo: '입고 완료 확인 필요',
  },
];

// ===== 캘린더 Mock 데이터 (2026년 3월) =====

export const mockCalendarData: CalendarDay[] = [
  { date: 1, recommendInbound: 2, stockOrder: 1, inboundInProgress: 1, sales: 2850000, netProfit: 980000 },
  { date: 2, recommendInbound: 0, stockOrder: 0, inboundInProgress: 1, sales: 1920000, netProfit: 650000 },
  { date: 3, recommendInbound: 0, stockOrder: 0, inboundInProgress: 1, sales: 3100000, netProfit: 1100000 },
  { date: 4, recommendInbound: 1, stockOrder: 2, inboundInProgress: 0, sales: 2430000, netProfit: 820000 },
  { date: 5, recommendInbound: 0, stockOrder: 1, inboundInProgress: 2, sales: 3780000, netProfit: 1350000 },
  { date: 6, recommendInbound: 0, stockOrder: 0, inboundInProgress: 2, sales: 2120000, netProfit: 710000 },
  { date: 7, recommendInbound: 3, stockOrder: 0, inboundInProgress: 0, sales: 4200000, netProfit: 1580000 },
  { date: 8, recommendInbound: 0, stockOrder: 1, inboundInProgress: 0, sales: 1850000, netProfit: 620000 },
  { date: 9, recommendInbound: 0, stockOrder: 0, inboundInProgress: 0, sales: 2960000, netProfit: 1010000 },
  { date: 10, recommendInbound: 1, stockOrder: 0, inboundInProgress: 1, sales: 3340000, netProfit: 1180000 },
  { date: 11, recommendInbound: 0, stockOrder: 2, inboundInProgress: 1, sales: 2680000, netProfit: 900000 },
  { date: 12, recommendInbound: 2, stockOrder: 0, inboundInProgress: 0, sales: 3920000, netProfit: 1420000 },
  { date: 13, recommendInbound: 0, stockOrder: 1, inboundInProgress: 0, sales: 2150000, netProfit: 730000 },
  { date: 14, recommendInbound: 0, stockOrder: 0, inboundInProgress: 2, sales: 4580000, netProfit: 1680000 },
  { date: 15, recommendInbound: 1, stockOrder: 0, inboundInProgress: 2, sales: 3210000, netProfit: 1120000 },
  { date: 16, recommendInbound: 0, stockOrder: 1, inboundInProgress: 0, sales: 2740000, netProfit: 940000 },
  { date: 17, recommendInbound: 2, stockOrder: 2, inboundInProgress: 0, sales: 3650000, netProfit: 1300000 },
  { date: 18, recommendInbound: 0, stockOrder: 0, inboundInProgress: 1, sales: 1980000, netProfit: 670000 },
  { date: 19, recommendInbound: 0, stockOrder: 0, inboundInProgress: 1, sales: 3480000, netProfit: 1240000 },
  { date: 20, recommendInbound: 1, stockOrder: 1, inboundInProgress: 0, sales: 2890000, netProfit: 990000 },
  { date: 21, recommendInbound: 0, stockOrder: 0, inboundInProgress: 0, sales: 4120000, netProfit: 1520000 },
  { date: 22, recommendInbound: 3, stockOrder: 0, inboundInProgress: 0, sales: 2360000, netProfit: 800000 },
  { date: 23, recommendInbound: 0, stockOrder: 2, inboundInProgress: 1, sales: 3750000, netProfit: 1360000 },
  { date: 24, recommendInbound: 0, stockOrder: 0, inboundInProgress: 1, sales: 2840000, netProfit: 970000 },
  { date: 25, recommendInbound: 1, stockOrder: 1, inboundInProgress: 0, sales: 4310000, netProfit: 1590000 },
  { date: 26, recommendInbound: 0, stockOrder: 0, inboundInProgress: 0, sales: 2190000, netProfit: 750000 },
  { date: 27, recommendInbound: 2, stockOrder: 1, inboundInProgress: 2, sales: 3600000, netProfit: 1290000 },
  { date: 28, recommendInbound: 0, stockOrder: 0, inboundInProgress: 2, sales: 2970000, netProfit: 1030000 },
  { date: 29, recommendInbound: 0, stockOrder: 2, inboundInProgress: 0, sales: 3820000, netProfit: 1380000 },
  { date: 30, recommendInbound: 1, stockOrder: 0, inboundInProgress: 0, sales: 2560000, netProfit: 870000 },
  { date: 31, recommendInbound: 0, stockOrder: 1, inboundInProgress: 1, sales: 4080000, netProfit: 1490000 },
];

// ===== 유틸 함수 =====

export function calcMargin(price: number, cost: number, shippingFee: number): number {
  return price - cost - shippingFee;
}

export function calcMarginRate(price: number, cost: number, shippingFee: number): number {
  const margin = calcMargin(price, cost, shippingFee);
  return Math.round((margin / price) * 100 * 10) / 10;
}

export function calcROAS(price: number, cost: number, shippingFee: number): number {
  const margin = calcMargin(price, cost, shippingFee);
  if (margin === 0) return 0;
  return Math.round((price / margin) * 100);
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('ko-KR') + '원';
}

export function formatNumber(value: number): string {
  return value.toLocaleString('ko-KR');
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  recommend: '입고권장',
  request: '발주요청',
  amount_confirmed: '발주금액확정',
  purchase_confirmed: '구매확정',
  purchase_complete: '구매완료',
  china_arrived: '중국창고도착',
  china_shipped: '중국창고출고',
  korea_arrived: '한국입항(입고중)',
  received: '상품수령완료',
  all: '전체',
};
