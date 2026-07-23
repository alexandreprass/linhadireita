import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, sessionCookieOptions, validateLogin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const username = String(body.username || "");
  const password = String(body.password || "");

  if (!validateLogin(username, password)) {
    return NextResponse.json({ ok: false, error: "Usuário ou senha inválidos" }, { status: 401 });
  }

  const token = createSessionToken(username);
  const res = NextResponse.json({ ok: true });
  const cookie = sessionCookieOptions(token);
  res.cookies.set(cookie.name, cookie.value, cookie);
  return res;
}
