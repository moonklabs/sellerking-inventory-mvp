// ===== 프론트엔드 API 헬퍼 함수 =====
import type {
  ApiResponse,
  Product,
  CostHistory,
  DailyInventory,
  Order,
  InventoryHistory,
  InventoryGoal,
  MarketSendHistory,
  OrderStatus,
  MarketType,
} from './supabase/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

async function fetchApi<T>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const json = await res.json();
    return json as ApiResponse<T>;
  } catch (err) {
    const message = err instanceof Error ? err.message : '네트워크 오류';
    return { data: null, error: { message } };
  }
}

// ===== Products API =====

export const productsApi = {
  list: () => fetchApi<Product[]>('/api/products'),

  get: (id: string) => fetchApi<Product>(`/api/products/${id}`),

  create: (body: Partial<Product>) =>
    fetchApi<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: string, body: Partial<Product>) =>
    fetchApi<Product>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: (id: string) =>
    fetchApi<{ id: string }>(`/api/products/${id}`, { method: 'DELETE' }),

  getCostHistory: (productId: string) =>
    fetchApi<CostHistory[]>(`/api/products/${productId}/cost-history`),

  addCostHistory: (productId: string, body: { date: string; cost: number }) =>
    fetchApi<CostHistory>(`/api/products/${productId}/cost-history`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

// ===== Inventory API =====

export const inventoryApi = {
  // 일일 재고 현황
  getDailyInventory: (date?: string) => {
    const params = date ? `?date=${date}` : '';
    return fetchApi<DailyInventory[]>(`/api/inventory/daily${params}`);
  },

  addDailyInventory: (body: Partial<DailyInventory>) =>
    fetchApi<DailyInventory>('/api/inventory/daily', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // 발주 관리
  getOrders: (status?: OrderStatus | 'all') => {
    const params = status ? `?status=${status}` : '';
    return fetchApi<Order[]>(`/api/inventory/orders${params}`);
  },

  createOrder: (body: Partial<Order>) =>
    fetchApi<Order>('/api/inventory/orders', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateOrder: (id: string, body: Partial<Order>) =>
    fetchApi<Order>(`/api/inventory/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  deleteOrder: (id: string) =>
    fetchApi<{ id: string }>(`/api/inventory/orders/${id}`, { method: 'DELETE' }),

  bulkUpdateOrders: (ids: string[], status: OrderStatus) =>
    fetchApi<Order[]>('/api/inventory/orders/bulk', {
      method: 'PUT',
      body: JSON.stringify({ ids, status }),
    }),

  // 입출고 이력
  getHistory: (productId?: string) => {
    const params = productId ? `?product_id=${productId}` : '';
    return fetchApi<InventoryHistory[]>(`/api/inventory/history${params}`);
  },

  addHistory: (body: Partial<InventoryHistory>) =>
    fetchApi<InventoryHistory>('/api/inventory/history', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // 재고 목표
  getGoals: (productId?: string) => {
    const params = productId ? `?product_id=${productId}` : '';
    return fetchApi<InventoryGoal[]>(`/api/inventory/goals${params}`);
  },

  upsertGoal: (body: Partial<InventoryGoal>) =>
    fetchApi<InventoryGoal>('/api/inventory/goals', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  // 마켓 발송 이력
  getMarketSendHistory: (params?: { product_id?: string; market_type?: MarketType }) => {
    const query = new URLSearchParams();
    if (params?.product_id) query.set('product_id', params.product_id);
    if (params?.market_type) query.set('market_type', params.market_type);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return fetchApi<MarketSendHistory[]>(`/api/inventory/market-send${qs}`);
  },

  addMarketSend: (body: Partial<MarketSendHistory>) =>
    fetchApi<MarketSendHistory>('/api/inventory/market-send', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // 재고 현황 (위험도 포함)
  getStatus: () =>
    fetchApi<{
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
    }[]>('/api/inventory/status'),
};
