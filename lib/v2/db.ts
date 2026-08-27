import { getCloudflareContext } from '@opennextjs/cloudflare';
import { Gift } from './gifts';
import {
  EventType,
  GenderValue,
  GreetingContent,
  GreetingV2,
  MediaItem,
  PlanId,
  TemplateId,
} from './types';

/**
 * V2 persistence. Deliberately its own module and its own tables — V1's
 * lib/db.ts and the `greetings` table are never touched from here, so the
 * two versions can run side by side without any chance of interference.
 */

async function db(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  return env.DB;
}

interface GreetingV2Row {
  id: string;
  slug: string;
  ownerToken: string;
  eventType: string;
  recipientName: string;
  recipientGender: string;
  relationship: string;
  recipientAge: string;
  aboutThem: string;
  sharedMemory: string;
  senderName: string;
  senderGender: string;
  tone: string;
  content: string;
  templateId: string;
  musicTrack: string;
  musicEnabled: number;
  media: string;
  coverMediaId: string;
  gift: string;
  giftInterests: string;
  giftBudget: string;
  plan: string;
  status: string;
  allowContributions: number;
  viewCount: number;
  openCount: number;
  createdAt: string;
  updatedAt: string;
}

function rowToGreeting(row: GreetingV2Row): GreetingV2 {
  return {
    id: row.id,
    slug: row.slug,
    ownerToken: row.ownerToken,
    eventType: row.eventType as EventType,
    recipientName: row.recipientName,
    recipientGender: (row.recipientGender || '') as GenderValue,
    relationship: row.relationship,
    recipientAge: row.recipientAge,
    aboutThem: row.aboutThem,
    sharedMemory: row.sharedMemory,
    senderName: row.senderName,
    senderGender: (row.senderGender || '') as GenderValue,
    tone: row.tone,
    content: JSON.parse(row.content) as GreetingContent,
    templateId: row.templateId as TemplateId,
    musicTrack: row.musicTrack,
    musicEnabled: row.musicEnabled === 1,
    media: JSON.parse(row.media) as MediaItem[],
    coverMediaId: row.coverMediaId || '',
    gift: row.gift ? (JSON.parse(row.gift) as Gift) : null,
    giftInterests: row.giftInterests ? (JSON.parse(row.giftInterests) as string[]) : [],
    giftBudget: row.giftBudget || '',
    plan: row.plan as PlanId,
    status: row.status as GreetingV2['status'],
    allowContributions: row.allowContributions === 1,
    viewCount: row.viewCount,
    openCount: row.openCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createGreeting(g: GreetingV2): Promise<void> {
  await (await db())
    .prepare(
      `INSERT INTO greetings_v2
        (id, slug, ownerToken, eventType, recipientName, recipientGender, relationship,
         recipientAge, aboutThem, sharedMemory, senderName, senderGender, tone,
         content, templateId, musicTrack,
         musicEnabled, media, coverMediaId, gift, giftInterests, giftBudget,
         plan, status, allowContributions, viewCount, openCount,
         createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      g.id,
      g.slug,
      g.ownerToken,
      g.eventType,
      g.recipientName,
      g.recipientGender,
      g.relationship,
      g.recipientAge,
      g.aboutThem,
      g.sharedMemory,
      g.senderName,
      g.senderGender,
      g.tone,
      JSON.stringify(g.content),
      g.templateId,
      g.musicTrack,
      g.musicEnabled ? 1 : 0,
      JSON.stringify(g.media),
      g.coverMediaId ?? '',
      g.gift ? JSON.stringify(g.gift) : '',
      JSON.stringify(g.giftInterests ?? []),
      g.giftBudget ?? '',
      g.plan,
      g.status,
      g.allowContributions ? 1 : 0,
      g.viewCount,
      g.openCount,
      g.createdAt,
      g.updatedAt
    )
    .run();
}

export async function getGreetingBySlug(slug: string): Promise<GreetingV2 | null> {
  const row = await (await db())
    .prepare('SELECT * FROM greetings_v2 WHERE slug = ?')
    .bind(slug)
    .first<GreetingV2Row>();
  return row ? rowToGreeting(row) : null;
}

export async function getGreetingById(id: string): Promise<GreetingV2 | null> {
  const row = await (await db())
    .prepare('SELECT * FROM greetings_v2 WHERE id = ?')
    .bind(id)
    .first<GreetingV2Row>();
  return row ? rowToGreeting(row) : null;
}

/** Fields the editor is allowed to change after creation. */
export interface GreetingUpdate {
  content?: GreetingContent;
  templateId?: TemplateId;
  musicTrack?: string;
  musicEnabled?: boolean;
  media?: MediaItem[];
  coverMediaId?: string;
  gift?: Gift | null;
  giftInterests?: string[];
  giftBudget?: string;
  status?: GreetingV2['status'];
  plan?: PlanId;
  allowContributions?: boolean;
}

/**
 * Applies a partial update. The owner token is verified by the caller
 * (the API route) before this is reached.
 */
export async function updateGreeting(
  id: string,
  patch: GreetingUpdate
): Promise<void> {
  const sets: string[] = [];
  const values: unknown[] = [];

  if (patch.content !== undefined) {
    sets.push('content = ?');
    values.push(JSON.stringify(patch.content));
  }
  if (patch.templateId !== undefined) {
    sets.push('templateId = ?');
    values.push(patch.templateId);
  }
  if (patch.musicTrack !== undefined) {
    sets.push('musicTrack = ?');
    values.push(patch.musicTrack);
  }
  if (patch.musicEnabled !== undefined) {
    sets.push('musicEnabled = ?');
    values.push(patch.musicEnabled ? 1 : 0);
  }
  if (patch.media !== undefined) {
    sets.push('media = ?');
    values.push(JSON.stringify(patch.media));
  }
  if (patch.coverMediaId !== undefined) {
    sets.push('coverMediaId = ?');
    values.push(patch.coverMediaId);
  }
  if (patch.gift !== undefined) {
    sets.push('gift = ?');
    values.push(patch.gift ? JSON.stringify(patch.gift) : '');
  }
  if (patch.giftInterests !== undefined) {
    sets.push('giftInterests = ?');
    values.push(JSON.stringify(patch.giftInterests));
  }
  if (patch.giftBudget !== undefined) {
    sets.push('giftBudget = ?');
    values.push(patch.giftBudget);
  }
  if (patch.status !== undefined) {
    sets.push('status = ?');
    values.push(patch.status);
  }
  if (patch.plan !== undefined) {
    sets.push('plan = ?');
    values.push(patch.plan);
  }
  if (patch.allowContributions !== undefined) {
    sets.push('allowContributions = ?');
    values.push(patch.allowContributions ? 1 : 0);
  }

  if (!sets.length) return;

  sets.push('updatedAt = ?');
  values.push(new Date().toISOString());
  values.push(id);

  await (await db())
    .prepare(`UPDATE greetings_v2 SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();
}

/** Bumps a counter without reading the row first (safe under concurrency). */
export async function incrementCounter(
  slug: string,
  column: 'viewCount' | 'openCount'
): Promise<void> {
  await (await db())
    .prepare(`UPDATE greetings_v2 SET ${column} = ${column} + 1 WHERE slug = ?`)
    .bind(slug)
    .run();
}

/* ------------------------------------------------------------------ *
 * Analytics
 * ------------------------------------------------------------------ */

export interface AnalyticsEvent {
  id: string;
  name: string;
  greetingId?: string | null;
  sessionId?: string | null;
  props?: Record<string, unknown> | null;
  createdAt: string;
}

export async function recordEvent(event: AnalyticsEvent): Promise<void> {
  await (await db())
    .prepare(
      `INSERT INTO analytics_events (id, name, greetingId, sessionId, props, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(
      event.id,
      event.name,
      event.greetingId ?? null,
      event.sessionId ?? null,
      event.props ? JSON.stringify(event.props) : null,
      event.createdAt
    )
    .run();
}

/** Funnel roll-up: one row per event name with its count. */
export async function getFunnel(): Promise<{ name: string; count: number }[]> {
  const res = await (await db())
    .prepare(
      `SELECT name, COUNT(*) as count FROM analytics_events
       GROUP BY name ORDER BY count DESC`
    )
    .all<{ name: string; count: number }>();
  return res.results ?? [];
}
