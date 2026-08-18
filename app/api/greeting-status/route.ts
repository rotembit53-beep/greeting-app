import { NextRequest, NextResponse } from 'next/server';
import { getGreeting } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing greeting ID' },
        { status: 400 }
      );
    }

    const greeting = await getGreeting(id);

    if (!greeting) {
      return NextResponse.json(
        { error: 'Greeting not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: greeting.status,
      isApproved: greeting.status === 'approved',
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
