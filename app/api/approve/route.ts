import { NextRequest, NextResponse } from 'next/server';
import {
  getRequestById,
  getRequestByGreetingAndToken,
  getGreeting,
  approveRequest,
  updateGreetingStatus,
} from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    const token = req.nextUrl.searchParams.get('token');

    if (!id || !token) {
      return NextResponse.redirect(new URL('/admin/approved?error=invalid', req.url));
    }

    // The link normally carries the request id, but emails sent by older
    // versions used the greeting id — accept either so existing links work.
    let request = await getRequestById(id);

    if (!request) {
      request = await getRequestByGreetingAndToken(id, token);
    }

    if (!request || request.token !== token) {
      return NextResponse.redirect(new URL('/admin/approved?error=unauthorized', req.url));
    }

    // Don't report success if there's no greeting to actually publish.
    const greeting = await getGreeting(request.greetingId);
    if (!greeting) {
      console.error(`Approval failed: greeting ${request.greetingId} not found`);
      return NextResponse.redirect(new URL('/admin/approved?error=failed', req.url));
    }

    await approveRequest(request.id, new Date().toISOString());
    await updateGreetingStatus(request.greetingId, 'approved');

    return NextResponse.redirect(new URL('/admin/approved?success=true', req.url));
  } catch (error) {
    console.error('Approval error:', error);
    return NextResponse.redirect(new URL('/admin/approved?error=failed', req.url));
  }
}
