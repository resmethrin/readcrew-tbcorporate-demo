"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ReceiptText,
  Table2,
  Upload,
  ShieldCheck,
  History,
  LogOut,
} from "lucide-react";

const nav = [
  { href: "/dashboard",    label: "ダッシュボード",              icon: LayoutDashboard },
  { href: "/sales",        label: "売上一覧",                    icon: Table2 },
  { href: "/billing",      label: "請求一覧",                     icon: ReceiptText },
  { href: "/import",       label: "取込",                        icon: Upload },
  { href: "/masters",      label: "マスタ管理",                   icon: ShieldCheck },
  { href: "/audit-log",    label: "操作ログ",                     icon: History },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {
      // デモ環境のためログアウト失敗時もログイン画面へ戻す
    }
    router.replace("/login");
    router.refresh();
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-20 w-72 border-r bg-gray-50 print:hidden" style={{ borderColor: "rgb(243 244 246)" }}>
      <div className="flex h-full flex-col px-5 py-7">
        <div className="mb-8 border-l-2 border-[#0071e3] pl-3">
          <div className="text-lg font-semibold text-zinc-900">販売・請求ハブ</div>
          <div className="mt-1 text-xs text-zinc-400">TBコーポレート様</div>
        </div>

        <nav className="space-y-0.5">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#0071e3] text-white"
                    : "text-zinc-500 hover:bg-white hover:text-zinc-800"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-zinc-400"}`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2">
          <div className="rounded-lg border bg-white p-4" style={{ borderColor: "rgb(243 244 246)" }}>
            <div className="text-xs font-medium uppercase tracking-widest text-zinc-400">
              デモ用メモ
            </div>
            <p className="mt-2 text-xs leading-5 text-zinc-400">
              貴社の運用フロー資料・経理からの要望を反映したデモです。
            </p>
            <p className="mt-2 text-[11px] font-medium leading-5 text-red-500">
              デモ環境 — データはすべて架空です
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-500 transition-colors hover:bg-white hover:text-zinc-800 disabled:opacity-40"
          >
            <LogOut className="h-4 w-4 shrink-0 text-zinc-400" />
            {loggingOut ? "ログアウト中…" : "ログアウト"}
          </button>
        </div>
      </div>
    </aside>
  );
}
