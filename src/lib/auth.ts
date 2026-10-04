import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'admin_session';
const SESSION_DAYS = 7;

const safeEqual = (a: string, b: string) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

// Stored format: "scrypt:<salt hex>:<hash hex>" (see scripts/hash-password.mjs).
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split(':');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  return safeEqual(scryptSync(password, salt, 64).toString('hex'), hash);
}

export function isConfigured() {
  const { ADMIN_USERNAME, ADMIN_PASSWORD_HASH, SESSION_SECRET } = process.env;
  return Boolean(ADMIN_USERNAME && ADMIN_PASSWORD_HASH && SESSION_SECRET);
}

export function checkLogin(username: string, password: string) {
  if (!isConfigured()) return false;
  // Always run both checks so timing doesn't reveal which one failed.
  const userOk = safeEqual(username, process.env.ADMIN_USERNAME!);
  const passwordOk = verifyPassword(password, process.env.ADMIN_PASSWORD_HASH!);
  return userOk && passwordOk;
}

const sign = (value: string) => createHmac('sha256', process.env.SESSION_SECRET!).update(value).digest('hex');

export function createSession(username: string) {
  const payload = `${username}.${Date.now() + SESSION_DAYS * 86_400_000}`;
  return { value: `${payload}.${sign(payload)}`, maxAge: SESSION_DAYS * 86_400 };
}

export function verifySession(cookie: string | undefined) {
  if (!cookie || !isConfigured()) return null;
  const cut = cookie.lastIndexOf('.');
  const payload = cookie.slice(0, cut);
  if (cut < 0 || !safeEqual(cookie.slice(cut + 1), sign(payload))) return null;
  const [username, expires] = [payload.slice(0, payload.lastIndexOf('.')), Number(payload.slice(payload.lastIndexOf('.') + 1))];
  if (!(expires > Date.now()) || username !== process.env.ADMIN_USERNAME) return null;
  return { username };
}

// Slows down password guessing: 5 failed attempts per address per 15 minutes.
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60_000;
const failures = new Map<string, { count: number; resetAt: number }>();

export function isLockedOut(address: string) {
  const entry = failures.get(address);
  if (entry && entry.resetAt < Date.now()) failures.delete(address);
  return (failures.get(address)?.count ?? 0) >= MAX_FAILURES;
}

export function recordFailure(address: string) {
  const entry = failures.get(address) ?? { count: 0, resetAt: Date.now() + WINDOW_MS };
  entry.count++;
  failures.set(address, entry);
}

export const clearFailures = (address: string) => failures.delete(address);
