import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  calculateRemainingDays,
  calculateRecommendedStock,
  calculateRiskLevel,
} from '@/lib/services/inventory.service';

export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: goals, error: goalsError } = await supabase
      .from('inventory_goals')
      .select('*');

    if (goalsError) {
      return NextResponse.json({ data: null, error: { message: goalsError.message } }, { status: 500 });
    }

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, alias, name, option, market_stock, domestic_stock');

    if (productsError) {
      return NextResponse.json({ data: null, error: { message: productsError.message } }, { status: 500 });
    }

    // 상품별 재고 현황 계산
    const statusData = products?.map((product) => {
      const goal = goals?.find((g) => g.product_id === product.id);
      const dailyAvg = goal ? Number(goal.daily_avg_sales) : 0;
      const monthlyTarget = goal?.monthly_target || 0;
      const leadTime = 45;

      const remainingDays = calculateRemainingDays(product.market_stock, dailyAvg);
      const recommendedStock = calculateRecommendedStock(
        monthlyTarget,
        leadTime,
        product.domestic_stock
      );
      const riskLevel = calculateRiskLevel(
        remainingDays === Infinity ? 999 : remainingDays
      );

      return {
        product_id: product.id,
        alias: product.alias,
        name: product.name,
        option: product.option,
        market_stock: product.market_stock,
        domestic_stock: product.domestic_stock,
        daily_avg_sales: dailyAvg,
        monthly_target: monthlyTarget,
        remaining_days: remainingDays,
        recommended_stock: recommendedStock,
        risk_level: riskLevel,
      };
    });

    return NextResponse.json({ data: statusData, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ data: null, error: { message } }, { status: 500 });
  }
}
