// ===== Supabase DB 타입 정의 =====

export type OrderStatus =
  | 'recommend'
  | 'request'
  | 'amount_confirmed'
  | 'purchase_confirmed'
  | 'purchase_complete'
  | 'china_arrived'
  | 'china_shipped'
  | 'korea_arrived'
  | 'received';

export type MarketType = 'growth' | 'rocket' | 'wing';

export interface Product {
  id: string;
  alias: string;
  product_id: string;
  option_code: string | null;
  barcode: string | null;
  name: string;
  option: string | null;
  price: number;
  discount_price: number;
  current_cost: number;
  shipping_fee: number;
  review_count: number;
  review_score: number;
  market_stock: number;
  domestic_stock: number;
  updated_at: string;
}

export interface CostHistory {
  id: string;
  product_id: string;
  date: string;
  cost: number;
  created_at: string;
}

export interface DailyInventory {
  id: string;
  alias: string | null;
  product_id: string;
  product_name: string | null;
  option: string | null;
  net_profit: number;
  inventory_value: number;
  month_sales: number;
  day_sales: number;
  ad_sales: number;
  natural_sales: number;
  ad_spend: number;
  market_stock: number;
  domestic_stock: number;
  daily_target: number;
  inbound_in_progress: number;
  parent_id: string | null;
  record_date: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_no: string;
  store: string | null;
  sales_type: string | null;
  image: string | null;
  barcode: string | null;
  product_link: string | null;
  request_date: string | null;
  product_name: string;
  order_qty: number;
  unit_price: number;
  total_amount: number;
  status: OrderStatus;
  expected_ship_date: string | null;
  expected_arrival_date: string | null;
  tracking_number: string | null;
  customs_tax: number;
  domestic_shipping: number;
  china_freight: number;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryHistory {
  id: string;
  product_id: string | null;
  barcode: string | null;
  product_name: string | null;
  change_type: string;
  quantity: number;
  note: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface InventoryGoal {
  id: string;
  product_id: string;
  barcode: string | null;
  product_name: string | null;
  monthly_target: number;
  daily_avg_sales: number;
  total_stock: number;
  gross_stock: number;
  rocket_stock: number;
  created_at: string;
  updated_at: string;
}

export interface MarketSendHistory {
  id: string;
  product_id: string;
  product_name: string | null;
  market_type: MarketType;
  quantity: number;
  send_date: string;
  status: string;
  note: string | null;
  created_at: string;
}

// API 응답 공통 타입
export interface ApiResponse<T> {
  data: T | null;
  error: { message: string } | null;
}
