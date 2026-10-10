import type { AnimSpeed, TimeFormat } from './types';

export const DAY_MIN = 1440;

export function fmtTime(m: number, format: TimeFormat = '24h') {
  m = ((m % DAY_MIN) + DAY_MIN) % DAY_MIN;
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  if (format === '12h') return `${h % 12 || 12}:${mm} ${h < 12 ? 'AM' : 'PM'}`;
  return `${String(h).padStart(2, '0')}:${mm}`;
}

export function minutesOf(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}

/** Local calendar day key, e.g. "2026-10-10". */
export function dayKey(d: Date = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Whole local days between two day keys (b - a). */
export function daysBetween(a: string, b: string) {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const ua = Date.UTC(ay, am - 1, ad);
  const ub = Date.UTC(by, bm - 1, bd);
  return Math.round((ub - ua) / 86_400_000);
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Saturday, Oct 10" — formatted by hand so it is identical on Hermes and web. */
export function dateLabel(d: Date) {
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function greeting(d: Date) {
  const h = d.getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Duration of the completion flip for each animation-speed setting. */
export function flipDuration(speed: AnimSpeed) {
  return speed === 'Gentle' ? 1150 : speed === 'Snappy' ? 540 : 800;
}
