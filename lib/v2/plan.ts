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

export const PLANS: Record<PlanId, PlanLimits> = {
  free: {
    id: 'free',
    label: 'חינם',
    maxImages: 10,
    branding: true,
    video: false,
    premiumTemplates: false,
    premiumMusic: false,
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

export const PREMIUM_TEMPLATES: TemplateId[] = ['elegant', 'party'];

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
