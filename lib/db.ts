import { getCloudflareContext } from '@opennextjs/cloudflare';
import { Greeting, GreetingRequest } from '@/types/greeting';

async function db(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  return env.DB;
}

interface GreetingRow {
  id: string;
  recipientName: string;
  eventType: string;
  theme: string;
  userNotes: string;
  recipientGender: string;
  relationship: string;
  mediaFiles: string;
  mediaAudioSettings: string;
  buyMeLink: string;
  audioTrack: string;
  aiText: string;
  giftCard: string | null;
  visualConcept: string;
  designPrompt: string;
  designOverrides: string | null;
  status: string;
  createdAt: string;
}

function rowToGreeting(row: GreetingRow): Greeting {
  return {
    id: row.id,
    recipientName: row.recipientName,
    eventType: row.eventType,
    theme: row.theme,
    userNotes: row.userNotes,
    recipientGender: (row.recipientGender || '') as Greeting['recipientGender'],
    relationship: row.relationship || '',
    mediaFiles: JSON.parse(row.mediaFiles),
    mediaAudioSettings: row.mediaAudioSettings ? JSON.parse(row.mediaAudioSettings) : {},
    buyMeLink: row.buyMeLink,
    audioTrack: row.audioTrack,
    aiText: JSON.parse(row.aiText),
    giftCard: row.giftCard ? JSON.parse(row.giftCard) : null,
    visualConcept: row.visualConcept as Greeting['visualConcept'],
    designPrompt: row.designPrompt,
    designOverrides: row.designOverrides ? JSON.parse(row.designOverrides) : null,
    status: row.status as Greeting['status'],
    createdAt: row.createdAt,
  };
}

export async function getGreeting(id: string): Promise<Greeting | null> {
  const row = await (await db())
    .prepare('SELECT * FROM greetings WHERE id = ?')
    .bind(id)
    .first<GreetingRow>();
  return row ? rowToGreeting(row) : null;
}

export async function saveGreeting(greeting: Greeting): Promise<void> {
  await (await db())
    .prepare(
      `INSERT INTO greetings
        (id, recipientName, eventType, theme, userNotes, recipientGender, relationship, mediaFiles, mediaAudioSettings, buyMeLink, audioTrack, aiText, giftCard, visualConcept, designPrompt, designOverrides, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
        recipientName = excluded.recipientName,
        eventType = excluded.eventType,
        theme = excluded.theme,
        userNotes = excluded.userNotes,
        recipientGender = excluded.recipientGender,
        relationship = excluded.relationship,
        mediaFiles = excluded.mediaFiles,
        mediaAudioSettings = excluded.mediaAudioSettings,
        buyMeLink = excluded.buyMeLink,
        audioTrack = excluded.audioTrack,
        aiText = excluded.aiText,
        giftCard = excluded.giftCard,
        visualConcept = excluded.visualConcept,
        designPrompt = excluded.designPrompt,
        designOverrides = excluded.designOverrides,
        status = excluded.status`
    )
    .bind(
      greeting.id,
      greeting.recipientName,
      greeting.eventType,
      greeting.theme,
      greeting.userNotes,
      greeting.recipientGender || '',
      greeting.relationship || '',
      JSON.stringify(greeting.mediaFiles),
      JSON.stringify(greeting.mediaAudioSettings || {}),
      greeting.buyMeLink || '',
      greeting.audioTrack || '',
      JSON.stringify(greeting.aiText),
      greeting.giftCard ? JSON.stringify(greeting.giftCard) : null,
      greeting.visualConcept,
      greeting.designPrompt || '',
      greeting.designOverrides ? JSON.stringify(greeting.designOverrides) : null,
      greeting.status,
      greeting.createdAt
    )
    .run();
}

export async function updateGreetingStatus(
  id: string,
  status: Greeting['status']
): Promise<void> {
  await (await db())
    .prepare('UPDATE greetings SET status = ? WHERE id = ?')
    .bind(status, id)
    .run();
}

interface RequestRow {
  id: string;
  greetingId: string;
  contactName: string;
  phone: string;
  email: string;
  status: string;
  token: string;
  requestedAt: string;
  approvedAt: string | null;
}

function rowToRequest(row: RequestRow): GreetingRequest {
  return {
    id: row.id,
    greetingId: row.greetingId,
    contactName: row.contactName,
    phone: row.phone,
    email: row.email,
    status: row.status as GreetingRequest['status'],
    token: row.token,
    requestedAt: row.requestedAt,
    approvedAt: row.approvedAt ?? undefined,
  };
}

export async function createRequest(request: GreetingRequest): Promise<void> {
  await (await db())
    .prepare(
      `INSERT INTO requests (id, greetingId, contactName, phone, email, status, token, requestedAt, approvedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      request.id,
      request.greetingId,
      request.contactName,
      request.phone,
      request.email,
      request.status,
      request.token,
      request.requestedAt,
      request.approvedAt ?? null
    )
    .run();
}

export async function getRequestById(id: string): Promise<GreetingRequest | null> {
  const row = await (await db())
    .prepare('SELECT * FROM requests WHERE id = ?')
    .bind(id)
    .first<RequestRow>();
  return row ? rowToRequest(row) : null;
}

export async function getRequestByGreetingAndToken(
  greetingId: string,
  token: string
): Promise<GreetingRequest | null> {
  const row = await (await db())
    .prepare('SELECT * FROM requests WHERE greetingId = ? AND token = ?')
    .bind(greetingId, token)
    .first<RequestRow>();
  return row ? rowToRequest(row) : null;
}

export async function approveRequest(id: string, approvedAt: string): Promise<void> {
  await (await db())
    .prepare(`UPDATE requests SET status = 'approved', approvedAt = ? WHERE id = ?`)
    .bind(approvedAt, id)
    .run();
}
