import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { canTransition } from '@/lib/services/order.service';
import type { OrderStatus } from '@/lib/supabase/types';

export async function PUT(request: NextRequest) {
  try {
    const { ids, status } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { data: null, error: { message: '업데이트할 발주 ID 목록이 필요합니다.' } },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { data: null, error: { message: '변경할 상태가 필요합니다.' } },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // 각 주문의 현재 상태를 조회하여 전이 가능 여부 확인
    const { data: currentOrders, error: fetchError } = await supabase
      .from('orders')
      .select('id, status')
      .in('id', ids);

    if (fetchError) {
      return NextResponse.json({ data: null, error: { message: fetchError.message } }, { status: 500 });
    }

    const invalidTransitions = currentOrders?.filter(
      (order) => !canTransition(order.status as OrderStatus, status as OrderStatus)
    );

    if (invalidTransitions && invalidTransitions.length > 0) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: `일부 발주의 상태 전이가 불가능합니다: ${invalidTransitions.map((o) => o.id).join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', ids)
      .select();

    if (error) {
      return NextResponse.json({ data: null, error: { message: error.message } }, { status: 400 });
    }

    return NextResponse.json({ data, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ data: null, error: { message } }, { status: 500 });
  }
}
