import { NextResponse } from 'next/server';
import * as mitraService from '@/services/mitraService';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const aktif = url.searchParams.get('aktif');
    const data = await mitraService.listMitra({ aktif });
    return NextResponse.json(data);
  } catch (err) {
    console.error('GET /api/mitra error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const saved = await mitraService.createMitra(formData);
    return NextResponse.json({ success: true, mitra: saved }, { status: 201 });
  } catch (err) {
    console.error('POST /api/mitra error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function PUT(req) {
  try {
    const formData = await req.formData();
    const result = await mitraService.updateMitra(formData);
    return NextResponse.json(result);
  } catch (err) {
    console.error('PUT /api/mitra error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    const result = await mitraService.deleteMitra(id);
    return NextResponse.json(result);
  } catch (err) {
    console.error('DELETE /api/mitra error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
