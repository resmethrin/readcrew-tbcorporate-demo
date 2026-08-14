"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";

// ログイン画面はサイドナビなしの単独レイアウトで表示する
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      {/* min-w-0: 中身の最小幅でページ全体が横に広がるのを防ぐ（テーブルは各自でスクロール）*/}
      <main className="min-w-0 flex-1 pl-72 print:pl-0">
        <div className="min-h-screen px-8 py-8 lg:px-10 print:min-h-0 print:p-0">
          <div className="mx-auto max-w-[1280px]">{children}</div>
        </div>
      </main>
    </div>
  );
}
