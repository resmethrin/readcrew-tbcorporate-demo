"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, LogIn } from "lucide-react";
import { safeNextPath } from "@/lib/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));

  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, password }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(data?.error ?? "ログインに失敗しました。");
        setSubmitting(false);
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("通信に失敗しました。時間をおいて再度お試しください。");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-1.5">
        <label htmlFor="login-user" className="text-xs font-medium text-zinc-500">
          ユーザーID
        </label>
        <input
          id="login-user"
          type="text"
          autoComplete="username"
          value={user}
          onChange={(event) => setUser(event.target.value)}
          className="h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
          required
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="login-password" className="text-xs font-medium text-zinc-500">
          パスワード
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
          required
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting || !user || !password}
        className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#0071e3] text-sm font-medium text-white transition-colors hover:bg-[#005fc2] disabled:opacity-40"
      >
        <LogIn className="h-4 w-4" />
        {submitting ? "認証中…" : "ログイン"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="rounded-2xl border bg-white p-7 shadow-sm" style={{ borderColor: "rgb(243 244 246)" }}>
          <div className="mb-5 flex items-center gap-2">
            <Lock className="h-4 w-4 text-zinc-400" />
            <h1 className="text-sm font-semibold text-zinc-700">デモ環境へのログイン</h1>
          </div>

          <Suspense fallback={<div className="h-56" />}>
            <LoginForm />
          </Suspense>

          <div className="mt-5 border-t border-zinc-100 pt-4">
            <p className="text-[11px] leading-5 text-zinc-400">
              本デモは関係者限定で公開しています。
            </p>
            <p className="mt-1 text-[11px] leading-5 text-zinc-500">
              デモ用アカウント: <span className="font-mono font-medium text-zinc-700">demo</span> /{" "}
              <span className="font-mono font-medium text-zinc-700">demo</span>
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] font-medium text-red-500">
          デモ環境 — データはすべて架空です
        </p>
      </div>
    </div>
  );
}
