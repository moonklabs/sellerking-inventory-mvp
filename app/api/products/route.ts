import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('alias');

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

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ data: null, error: { message: '유효하지 않은 요청입니다.' } }, { status: 400 });
    }
    if (!body.name || !body.alias) {
      return NextResponse.json({ data: null, error: { message: '상품명(name)과 별칭(alias)은 필수입니다.' } }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('products')
      .insert(body)
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
