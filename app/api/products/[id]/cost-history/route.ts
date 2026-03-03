import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('cost_history')
      .select('*')
      .eq('product_id', id)
      .order('date', { ascending: false });

    if (error) {
      return NextResponse.json({ data: null, error: { message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ data, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ data: null, error: { message } }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ data: null, error: { message: '유효하지 않은 요청입니다.' } }, { status: 400 });
    }
    if (!body.date || body.cost === undefined) {
      return NextResponse.json({ data: null, error: { message: '날짜(date)와 원가(cost)는 필수입니다.' } }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('cost_history')
      .insert({ ...body, product_id: id })
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
