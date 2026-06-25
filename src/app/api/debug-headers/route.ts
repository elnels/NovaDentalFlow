import { NextRequest, NextResponse } from 'next/server';
import { debugHeaders } from '@/lib/api';

export async function GET() {
  try {
    const result = await debugHeaders();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting debug headers:', error);
    return NextResponse.json({ error: 'Failed to get debug headers' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await debugHeaders();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting debug headers:', error);
    return NextResponse.json({ error: 'Failed to get debug headers' }, { status: 500 });
  }
}