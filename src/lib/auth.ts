// デモ環境のアクセス制限。
// 既定の認証情報は demo / demo（モック用途のため）。
// 環境変数を設定すればそちらが優先される（Vercel の Basic 認証で使っていた変数名を流用）。
//   BASIC_AUTH_USER / BASIC_AUTH_PASSWORD  … 優先
//   DEMO_AUTH_USER  / DEMO_AUTH_PASSWORD   … 別名（どちらでもよい）

export const SESSION_COOKIE = "tbc_demo_session";

export const DEFAULT_DEMO_USER = "demo";
export const DEFAULT_DEMO_PASSWORD = "demo";

export const getDemoCredentials = () => {
  const user = process.env.BASIC_AUTH_USER || process.env.DEMO_AUTH_USER || DEFAULT_DEMO_USER;
  const password =
    process.env.BASIC_AUTH_PASSWORD || process.env.DEMO_AUTH_PASSWORD || DEFAULT_DEMO_PASSWORD;
  return { user, password };
};

export const isAuthConfigured = () => {
  const { user, password } = getDemoCredentials();
  return Boolean(user && password);
};

export const sessionToken = (user: string, password: string) =>
  btoa(encodeURIComponent(`${user}:${password}`));

/** cookie と突き合わせる期待値。認証情報が未設定なら null（＝常に不一致） */
export const expectedSessionToken = (): string | null => {
  const { user, password } = getDemoCredentials();
  if (!user || !password) return null;
  return sessionToken(user, password);
};

/** ログイン後の戻り先。オープンリダイレクトを避けるため自サイト内のパスのみ許可する */
export const safeNextPath = (value: string | null | undefined) => {
  if (!value) return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  if (value.startsWith("/login")) return "/dashboard";
  return value;
};
