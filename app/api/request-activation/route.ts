import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateId, generateToken } from '@/lib/ids';
import { createRequest } from '@/lib/db';
import { sendApprovalEmail } from '@/lib/mailer';
import { GreetingRequest } from '@/types/greeting';

const RequestSchema = z.object({
  greetingId: z.string().uuid(),
  contactName: z.string().min(1),
  phone: z.string().min(7),
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = RequestSchema.parse(body);

    const requestId = generateId();
    const token = generateToken();
    const adminEmail = process.env.ADMIN_EMAIL || 'rotembit53@gmail.com';

    const request: GreetingRequest = {
      id: requestId,
      greetingId: validated.greetingId,
      contactName: validated.contactName,
      phone: validated.phone,
      email: validated.email,
      status: 'pending',
      token,
      requestedAt: new Date().toISOString(),
    };

    // Save request
    await createRequest(request);

    // Send approval email
    const baseUrl = req.nextUrl.origin;
    let emailSent = true;
    try {
      await sendApprovalEmail(
        adminEmail,
        validated.contactName,
        requestId,
        token,
        baseUrl
      );
    } catch (emailError) {
      emailSent = false;
      console.error('Email sending failed, but request was saved:', emailError);
      console.warn(
        `Approve this greeting manually: ${baseUrl}/api/approve?id=${requestId}&token=${token}`
      );
      // Don't fail the request if email fails - just log it
    }

    return NextResponse.json({
      success: true,
      requestId,
      emailSent,
      message: 'Request submitted. Check your email for confirmation.',
    });
  } catch (error: any) {
    console.error('Request activation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
