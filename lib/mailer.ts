import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function sendApprovalEmail(
  adminEmail: string,
  recipientName: string,
  requestId: string,
  token: string,
  baseUrl: string
): Promise<void> {
  // RESEND_API_KEY lives in .dev.vars / wrangler secrets, which only reach
  // the Cloudflare `env` binding — not process.env (unlike wrangler.toml
  // [vars] entries) — so it's read the same way lib/media.ts and lib/db.ts
  // read their Cloudflare-bound resources.
  const { env } = await getCloudflareContext({ async: true });
  const apiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;

  // Must be the request id: /api/approve looks this up in D1 (requests table),
  // which is keyed by request id (not greeting id).
  const approveLink = `${baseUrl}/api/approve?id=${requestId}&token=${token}`;

  if (!apiKey) {
    console.warn(
      `⚠️  RESEND_API_KEY not configured. Approve this greeting manually: ${approveLink}`
    );
    throw new Error('RESEND_API_KEY is not configured');
  }

  const html = `
    <h2>בקשת אישור חדשה</h2>
    <p><strong>שם הנמען:</strong> ${recipientName}</p>
    <p><strong>ID:</strong> ${requestId}</p>
    <hr />
    <p><a href="${approveLink}" style="
      display: inline-block;
      background: #1e40af;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
    ">✅ לחץ לאישור</a></p>
    <hr />
    <p style="font-size: 12px; color: #666;">או העתק את הקישור הזה לדפדפן:</p>
    <p style="font-size: 11px; color: #999; word-break: break-all;">${approveLink}</p>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Interagift <onboarding@resend.dev>',
      to: adminEmail,
      subject: `בקשת אישור ברכה: ${recipientName}`,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('❌ Failed to send approval email:', res.status, text);
    throw new Error(`Resend API error (${res.status}): ${text}`);
  }

  console.log(`✅ Approval email sent to ${adminEmail}`);
}
