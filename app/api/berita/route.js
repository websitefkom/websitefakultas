import { NextResponse } from 'next/server';
import * as beritaService from '@/services/beritaService';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const q = (url.searchParams.get('q') || url.searchParams.get('search') || '').trim();
    const statusParam = (url.searchParams.get('status') || '').trim();
    const slugParam = (url.searchParams.get('slug') || '').trim();
    const kategoriParam = (url.searchParams.get('kategori') || url.searchParams.get('category') || '').trim();
    const withCategories = url.searchParams.get('withCategories') === '1' || url.searchParams.get('withCategories') === 'true';

    const result = await beritaService.listBerita({ page, limit, q, status: statusParam, slug: slugParam, kategori: kategoriParam, withCategories });
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const saved = await beritaService.createBerita(formData);
    return NextResponse.json({ success: true, berita: saved });
  } catch (err) {
    console.error('POST error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function PUT(req) {
  try {
    const formData = await req.formData();
    const result = await beritaService.updateBerita(formData);
    return NextResponse.json(result);
  } catch (err) {
    console.error('PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    const result = await beritaService.deleteBerita(id);
    return NextResponse.json(result);
  } catch (err) {
    console.error('DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
