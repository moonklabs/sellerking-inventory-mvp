import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { canTransition } from '@/lib/services/order.service';
import type { OrderStatus } from '@/lib/supabase/types';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createServerClient();

    // 상태 전이 검증
    if (body.status) {
      const { data: current, error: fetchError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', id)
        .single();

      if (fetchError) {
        return NextResponse.json({ data: null, error: { message: '발주를 찾을 수 없습니다.' } }, { status: 404 });
      }

      if (!canTransition(current.status as OrderStatus, body.status as OrderStatus)) {
        return NextResponse.json(
          { data: null, error: { message: `${current.status} → ${body.status} 전이는 허용되지 않습니다.` } },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ data: null, error: { message: error.message } }, { status: 400 });
    }

    return NextResponse.json({ data, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ data: null, error: { message } }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();
    const { error } = await supabase.from('orders').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ data: null, error: { message: error.message } }, { status: 400 });
    }

    return NextResponse.json({ data: { id }, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ data: null, error: { message } }, { status: 500 });
  }
}
