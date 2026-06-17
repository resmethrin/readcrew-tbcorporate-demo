import Link from "next/link";
import { LayoutDashboard, ReceiptText, Table2, Banknote, Upload } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/sales", label: "売上一覧", icon: Table2 },
  { href: "/billing", label: "請求統合", icon: ReceiptText },
  { href: "/payments", label: "入金管理", icon: Banknote },
  { href: "/import", label: "データ取込", icon: Upload },
];

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 w-72 border-r border-zinc-200 bg-white/95 backdrop-blur">
      <div className="flex h-full flex-col px-6 py-7">
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-[0.32em] text-accent">
            ReadyCrew Demo
          </div>
          <div className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
            販売・請求ハブ
          </div>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            事業ごとに入力や管理方法が違っても、請求業務は一元化できます。
          </p>
        </div>
        <nav className="space-y-2">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-950"
              >
                <Icon className="h-4 w-4 text-accent" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
            デモ用メモ
          </div>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            顧客切替・月切替・事業別集計がそのまま動くことを優先しています。
          </p>
        </div>
      </div>
    </aside>
  );
}
