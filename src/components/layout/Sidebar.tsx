"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ReceiptText,
  Table2,
  Banknote,
  Upload,
} from "lucide-react";

const nav = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/sales",     label: "売上一覧",       icon: Table2 },
  { href: "/billing",   label: "請求統合",        icon: ReceiptText },
  { href: "/payments",  label: "入金管理",        icon: Banknote },
  { href: "/import",    label: "データ取込",      icon: Upload },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 w-72 border-r bg-gray-50" style={{ borderColor: "rgb(243 244 246)" }}>
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

        <div className="mt-auto rounded-lg border bg-white p-4" style={{ borderColor: "rgb(243 244 246)" }}>
          <div className="text-xs font-medium uppercase tracking-widest text-zinc-400">
            デモ用メモ
          </div>
          <p className="mt-2 text-xs leading-5 text-zinc-400">
            顧客切替・月切替・事業別集計がそのまま動くことを優先しています。
          </p>
        </div>
      </div>
    </aside>
  );
}
