import { TEMPLATES } from './templates';
import { PlanId, TemplateId } from './types';

/**
 * Freemium limits, kept in one place so the paywall can be enforced
 * identically on the client (for UX) and the server (for real).
 *
 * Payments themselves are intentionally not built yet — `plan` is a plain
 * column and every gate reads from this table, so dropping in a provider
 * later means flipping `plan` to 'premium' after a webhook, nothing more.
 */
export interface PlanLimits {
  id: PlanId;
  label: string;
  maxImages: number;
  /** Whether the small "נוצר ב-Interagift" footer is shown on the greeting. */
  branding: boolean;
  video: boolean;
  premiumTemplates: boolean;
  premiumMusic: boolean;
}

/**
 * Premium is currently switched off as a product concept: every capability is
 * available to everyone. The tier still exists as a column and a table so a
 * paid plan can be reintroduced by changing these numbers alone — but nothing
 * in the product may gate on it while the two rows are identical.
 *
 * `branding` deliberately stays true on free: the footer is the viral loop
 * back to the product, not a restriction on anything the creator can make.
 */
export const PLANS: Record<PlanId, PlanLimits> = {
  free: {
    id: 'free',
    label: 'חינם',
    maxImages: 40,
    branding: true,
    video: true,
    premiumTemplates: true,
    premiumMusic: true,
  },
  premium: {
    id: 'premium',
    label: 'פרימיום',
    maxImages: 40,
    branding: false,
    video: true,
    premiumTemplates: true,
    premiumMusic: true,
  },
};

/** Target price per greeting, in ILS. Shown on the upgrade prompts. */
export const PREMIUM_PRICE_ILS = 19.9;
/** Future group-greeting tier. */
export const GROUP_PRICE_ILS = 39;

/**
 * Still derived from the templates rather than hand-listed, so reinstating a
 * paid tier needs no edit here — with `premiumTemplates: true` on every plan,
 * `canUseTemplate` never consults it today.
 */
export const PREMIUM_TEMPLATES: TemplateId[] = Object.values(TEMPLATES)
  .filter((t) => t.premium)
  .map((t) => t.id);

export function limitsFor(plan: PlanId): PlanLimits {
  return PLANS[plan] ?? PLANS.free;
}

export function canUseTemplate(plan: PlanId, template: TemplateId): boolean {
  if (limitsFor(plan).premiumTemplates) return true;
  return !PREMIUM_TEMPLATES.includes(template);
}

export function maxImagesFor(plan: PlanId): number {
  return limitsFor(plan).maxImages;
}
