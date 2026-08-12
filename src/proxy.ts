import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const password = process.env.BASIC_AUTH_PASSWORD;

  // 環境変数が未設定の場合は認証をスキップする（ローカル開発時など）
  if (!user || !password) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const [scheme, encoded] = authHeader.split(" ");
    if (scheme === "Basic" && encoded) {
      const [inputUser, inputPassword] = atob(encoded).split(":");
      if (inputUser === user && inputPassword === password) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="readcrew-tbcorporate-demo"' },
  });
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
