-- ===== 셀러킹 초기 스키마 =====

-- products: 상품 기본 정보
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  alias VARCHAR(100) NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  option_code VARCHAR(100),
  barcode VARCHAR(50),
  name VARCHAR(200) NOT NULL,
  option VARCHAR(100),
  price INTEGER NOT NULL DEFAULT 0,
  discount_price INTEGER NOT NULL DEFAULT 0,
  current_cost INTEGER NOT NULL DEFAULT 0,
  shipping_fee INTEGER NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  review_score DECIMAL(3,1) NOT NULL DEFAULT 0,
  market_stock INTEGER NOT NULL DEFAULT 0,
  domestic_stock INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- cost_history: 원가 변경 이력
CREATE TABLE IF NOT EXISTS cost_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  cost INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- daily_inventory: 일일 재고 현황 (계층 구조 지원)
CREATE TABLE IF NOT EXISTS daily_inventory (
  id TEXT PRIMARY KEY,
  alias VARCHAR(100),
  product_id VARCHAR(50) NOT NULL,
  product_name VARCHAR(200),
  option VARCHAR(100),
  net_profit BIGINT NOT NULL DEFAULT 0,
  inventory_value BIGINT NOT NULL DEFAULT 0,
  month_sales INTEGER NOT NULL DEFAULT 0,
  day_sales INTEGER NOT NULL DEFAULT 0,
  ad_sales INTEGER NOT NULL DEFAULT 0,
  natural_sales INTEGER NOT NULL DEFAULT 0,
  ad_spend INTEGER NOT NULL DEFAULT 0,
  market_stock INTEGER NOT NULL DEFAULT 0,
  domestic_stock INTEGER NOT NULL DEFAULT 0,
  daily_target INTEGER NOT NULL DEFAULT 0,
  inbound_in_progress INTEGER NOT NULL DEFAULT 0,
  parent_id TEXT REFERENCES daily_inventory(id) ON DELETE CASCADE,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- orders: 재고 발주 관리
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_no VARCHAR(50) NOT NULL,
  store VARCHAR(100),
  sales_type VARCHAR(100),
  image TEXT DEFAULT '',
  barcode VARCHAR(50),
  product_link TEXT DEFAULT '',
  request_date DATE,
  product_name VARCHAR(200) NOT NULL,
  order_qty INTEGER NOT NULL DEFAULT 0,
  unit_price INTEGER NOT NULL DEFAULT 0,
  total_amount BIGINT NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'recommend',
  expected_ship_date DATE,
  expected_arrival_date DATE,
  tracking_number VARCHAR(100) DEFAULT '',
  customs_tax INTEGER NOT NULL DEFAULT 0,
  domestic_shipping INTEGER NOT NULL DEFAULT 0,
  china_freight INTEGER NOT NULL DEFAULT 0,
  memo TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- inventory_history: 재고 입출고 이력
CREATE TABLE IF NOT EXISTS inventory_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT,
  barcode VARCHAR(50),
  product_name VARCHAR(200),
  change_type VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  note TEXT DEFAULT '',
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- inventory_goals: 재고 목표 설정
CREATE TABLE IF NOT EXISTS inventory_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  barcode VARCHAR(50),
  product_name VARCHAR(200),
  monthly_target INTEGER NOT NULL DEFAULT 0,
  daily_avg_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_stock INTEGER NOT NULL DEFAULT 0,
  gross_stock INTEGER NOT NULL DEFAULT 0,
  rocket_stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- market_send_history: 마켓 발송 이력
CREATE TABLE IF NOT EXISTS market_send_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  product_name VARCHAR(200),
  market_type VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  send_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_cost_history_product_id ON cost_history(product_id);
CREATE INDEX IF NOT EXISTS idx_daily_inventory_product_id ON daily_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_daily_inventory_parent_id ON daily_inventory(parent_id);
CREATE INDEX IF NOT EXISTS idx_daily_inventory_record_date ON daily_inventory(record_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_barcode ON orders(barcode);
CREATE INDEX IF NOT EXISTS idx_inventory_history_product_id ON inventory_history(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_goals_product_id ON inventory_goals(product_id);
CREATE INDEX IF NOT EXISTS idx_market_send_history_product_id ON market_send_history(product_id);
