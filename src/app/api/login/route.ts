import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, getDemoCredentials, sessionToken } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { user?: string; password?: string }
    | null;

  const credentials = getDemoCredentials();
  if (!credentials.user || !credentials.password) {
    return NextResponse.json(
      { ok: false, error: "認証情報が未設定です。環境変数 BASIC_AUTH_USER / BASIC_AUTH_PASSWORD を設定してください。" },
      { status: 503 },
    );
  }

  if (body?.user !== credentials.user || body?.password !== credentials.password) {
    return NextResponse.json({ ok: false, error: "IDまたはパスワードが違います。" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionToken(credentials.user, credentials.password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12時間
  });

  return NextResponse.json({ ok: true });
}
