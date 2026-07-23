/**
 * Autenticação simples do admin via cookie assinado (HMAC).
 * Usuário: admin | Senha: ADMIN_PASSWORD (padrão 84074070)
 */

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "ld_admin";
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 dias

function secret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.XAI_API_KEY ||
    "linhadireita-dev-secret-change-me"
  );
}

export function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USER || "admin",
    password: process.env.ADMIN_PASSWORD || "84074070",
  };
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function createSessionToken(username: string): string {
  const exp = Date.now() + MAX_AGE_SEC * 1000;
  const payload = `${username}:${exp}`;
  return `${payload}:${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split(":");
  if (parts.length !== 3) return false;
  const [username, expStr, sig] = parts;
  const payload = `${username}:${expStr}`;
  const expected = sign(payload);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const { username: validUser } = getAdminCredentials();
  return username === validUser;
}

export function validateLogin(username: string, password: string): boolean {
  const creds = getAdminCredentials();
  return username === creds.username && password === creds.password;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(COOKIE)?.value);
}

export function sessionCookieOptions(token: string) {
  return {
    name: COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  };
}

export function clearSessionCookieOptions() {
  return {
    name: COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}
