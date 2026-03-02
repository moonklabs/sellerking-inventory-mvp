import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    const marketType = searchParams.get('market_type');

    const supabase = createServerClient();
    let query = supabase
      .from('market_send_history')
      .select('*')
      .order('send_date', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    if (marketType) {
      query = query.eq('market_type', marketType);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ data: null, error: { message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ data, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ data: null, error: { message } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.product_id || !body.market_type || !body.quantity) {
      return NextResponse.json(
        { data: null, error: { message: '상품ID, 마켓타입, 수량은 필수입니다.' } },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('market_send_history')
      .insert({ ...body, send_date: body.send_date || new Date().toISOString().split('T')[0] })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ data: null, error: { message: error.message } }, { status: 400 });
    }

    return NextResponse.json({ data, error: null }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ data: null, error: { message } }, { status: 500 });
  }
}
