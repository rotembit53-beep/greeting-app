import { MusicMood } from './types';

/**
 * V2 music library.
 *
 * Every track is drawn from the same royalty-free / no-copyright set already
 * hosted in R2 for V1 (nothing new was licensed and nothing was removed) —
 * but here they're re-organised by *emotional mood* instead of by genre
 * folder, which is what someone picking music for a greeting actually thinks
 * in. V1's own category list is untouched and keeps working as before.
 */

export interface Track {
  id: string;
  /** R2 object key, served through /api/media/<key>. */
  key: string;
  title: string;
  mood: MusicMood;
  premium: boolean;
}

export interface MoodMeta {
  id: MusicMood;
  emoji: string;
  label: string;
}

export const MOODS: MoodMeta[] = [
  { id: 'romantic', emoji: '💗', label: 'רומנטי' },
  { id: 'emotional', emoji: '🥹', label: 'מרגש' },
  { id: 'happy', emoji: '☀️', label: 'שמח' },
  { id: 'funny', emoji: '😂', label: 'מצחיק' },
  { id: 'party', emoji: '🎉', label: 'מסיבה' },
  { id: 'calm', emoji: '🌿', label: 'רגוע' },
];

export const TRACKS: Track[] = [
  // — Romantic ------------------------------------------------------
  {
    id: 'romantic-piano',
    key: 'audio/romance/desifreemusic-gentle-romantic-piano-instrumental-royalty-free-music-397373.mp3',
    title: 'פסנתר רומנטי עדין',
    mood: 'romantic',
    premium: false,
  },
  {
    id: 'romantic-moments',
    key: 'audio/pop/studiokolomna-beautiful-moments-136801.mp3',
    title: 'רגעים יפים',
    mood: 'romantic',
    premium: false,
  },
  {
    id: 'romantic-lofi-cake',
    key: 'audio/birthday/turning_pages-birthday-cake-lofi-501727.mp3',
    title: 'לופי חמים',
    mood: 'romantic',
    premium: true,
  },

  // — Emotional -----------------------------------------------------
  {
    id: 'emotional-cinematic',
    key: 'audio/epic/soulfuljamtracks-inspiring-epic-cinematic-247677.mp3',
    title: 'קולנועי מרגש',
    mood: 'emotional',
    premium: false,
  },
  {
    id: 'emotional-build',
    key: 'audio/rock/desifreemusic-rising-tension-dramatic-snare-build-505313.mp3',
    title: 'בנייה דרמטית',
    mood: 'emotional',
    premium: false,
  },
  {
    id: 'emotional-epic-rock',
    key: 'audio/epic/soulfuljamtracks-powerful-epic-rock-248903.mp3',
    title: 'רוק אפי עוצמתי',
    mood: 'emotional',
    premium: true,
  },

  // — Happy ---------------------------------------------------------
  {
    id: 'happy-birthday',
    key: 'audio/birthday/the_mountain-happy-birthday-576570.mp3',
    title: 'יום הולדת שמח',
    mood: 'happy',
    premium: false,
  },
  {
    id: 'happy-upbeat-funk',
    key: 'audio/party/bfcmusic-upbeat-amp-optimistic-funky-groove-252342.mp3',
    title: 'גרוב אופטימי',
    mood: 'happy',
    premium: false,
  },
  {
    id: 'happy-vlog',
    key: 'audio/pop/pocketbeats-mini-vlog-562664.mp3',
    title: 'קליל ויומיומי',
    mood: 'happy',
    premium: false,
  },
  {
    id: 'happy-sunny',
    key: 'audio/pop/aamirsomewhere-copyright-free-musicroyalty-free-music100-free-music-437088.mp3',
    title: 'בוקר שמשי',
    mood: 'happy',
    premium: true,
  },
  {
    id: 'happy-sunny-2',
    key: 'audio/pop/aamirsomewhere-copyright-free-musicroyalty-free-music100-free-music-437089.mp3',
    title: 'אנרגיה טובה',
    mood: 'happy',
    premium: false,
  },
  {
    id: 'happy-lovely',
    key: 'audio/party/bfcmusic-happy-lovely-xmas-249620.mp3',
    title: 'שמח וחגיגי',
    mood: 'happy',
    premium: true,
  },

  // — Funny ---------------------------------------------------------
  {
    id: 'funny-breakbeat',
    key: 'audio/party/alexguz-funk-amp-breakbeat-541097.mp3',
    title: 'פאנק שובב',
    mood: 'funny',
    premium: false,
  },
  {
    id: 'funny-whip',
    key: 'audio/party/kontraa-whip-afro-dancehall-music-110235.mp3',
    title: 'דאנסהול קופצני',
    mood: 'funny',
    premium: false,
  },
  {
    id: 'funny-hiphop',
    key: 'audio/pop/kontraa-no-sleep-hiphop-music-473847.mp3',
    title: 'היפ הופ קליל',
    mood: 'funny',
    premium: true,
  },

  // — Party ---------------------------------------------------------
  {
    id: 'party-joy',
    key: 'audio/party/joyinsound-no-copyright-music-398375.mp3',
    title: 'שמחה ואנרגיה',
    mood: 'party',
    premium: false,
  },
  {
    id: 'party-trance',
    key: 'audio/gaming/playhousesound-forever-trance-royalty-free-music-play-house-287383.mp3',
    title: 'טראנס אנרגטי',
    mood: 'party',
    premium: false,
  },
  {
    id: 'party-techno',
    key: 'audio/gaming/playhousesound-play-techno-play-house-copyright-free-music-206935.mp3',
    title: 'טכנו מסיבה',
    mood: 'party',
    premium: false,
  },
  {
    id: 'party-anthem',
    key: 'audio/sports/sigmamusicart-football-football-music-551346.mp3',
    title: 'המנון ניצחון',
    mood: 'party',
    premium: false,
  },
  {
    id: 'party-guitar',
    key: 'audio/rock/desifreemusic-powerful-electric-guitar-rock-beat-for-action-amp-sports-505311.mp3',
    title: 'גיטרה חשמלית',
    mood: 'party',
    premium: true,
  },

  // — Calm ----------------------------------------------------------
  {
    id: 'calm-lofi',
    key: 'audio/chill/pufino-vibing-chill-lofi-royalty-free-music-318954.mp3',
    title: 'לופי רגוע',
    mood: 'calm',
    premium: false,
  },
  {
    id: 'calm-soft',
    key: 'audio/pop/nastelbom-no-copyright-music-463071.mp3',
    title: 'רך ושקט',
    mood: 'calm',
    premium: false,
  },
  {
    id: 'calm-ambient',
    key: 'audio/pop/prettyjohn1-no-copyright-music-498106.mp3',
    title: 'אווירה נעימה',
    mood: 'calm',
    premium: false,
  },
  {
    id: 'calm-acoustic',
    key: 'audio/pop/desifreemusic-royalty-free-background-music-audio-tracks-no-copyright-406801.mp3',
    title: 'אקוסטי עדין',
    mood: 'calm',
    premium: true,
  },
];

export function trackUrl(track: Track): string {
  return `/api/media/${track.key}`;
}

export function tracksByMood(mood: MusicMood): Track[] {
  return TRACKS.filter((t) => t.mood === mood);
}

export function findTrackByUrl(url: string): Track | undefined {
  return TRACKS.find((t) => trackUrl(t) === url);
}

/** First free track of a mood — used as the AI's suggested default. */
export function defaultTrackForMood(mood: MusicMood): Track | undefined {
  return TRACKS.find((t) => t.mood === mood && !t.premium) ?? tracksByMood(mood)[0];
}
