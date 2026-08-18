import { VisualConcept, DesignOverrides } from '@/lib/visualStyles';

export interface GiftCard {
  /** Card / voucher number shown to the recipient. */
  number?: string;
  /** Expiry or issue date, formatted MM/YYYY. */
  date?: string;
  /** Redemption code. */
  code?: string;
  /** Brand/company that issued the card (e.g. "BuyMe", "Zara", "Google Play"). */
  company?: string;
  /** Whether the sender typed the details manually or uploaded photo(s) of the physical card. */
  inputMode?: 'manual' | 'image';
  /** Uploaded photo(s) of the physical card, used when inputMode is 'image'. */
  images?: string[];
}

export interface Greeting {
  id: string;
  recipientName: string;
  eventType: string;
  theme: string;
  userNotes: string;
  /** Grammatical gender of the recipient, used so the AI writes correctly-gendered Hebrew. */
  recipientGender?: 'male' | 'female' | '';
  /** Sender's relationship to the recipient (e.g. "אמא", "חבר/ה"), free text. */
  relationship?: string;
  mediaFiles: string[];
  /** Per-video-file choice of whether that clip keeps its own audio (true/absent) or plays muted (false). */
  mediaAudioSettings?: Record<string, boolean>;
  buyMeLink?: string;
  audioTrack: string;
  aiText: {
    fullGreeting: string;
    shareData: {
      whatsappMessage: string;
      gmailSubject: string;
      gmailBody: string;
    };
  };
  giftCard?: GiftCard | null;
  visualConcept: VisualConcept;
  designPrompt?: string;
  designOverrides?: DesignOverrides | null;
  status: 'draft' | 'pending' | 'approved';
  createdAt: string;
}

export interface GreetingRequest {
  id: string;
  greetingId: string;
  contactName: string;
  phone: string;
  email: string;
  status: 'pending' | 'approved';
  token: string;
  requestedAt: string;
  approvedAt?: string;
}
