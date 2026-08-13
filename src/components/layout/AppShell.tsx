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
      <main className="flex-1 pl-72">
        <div className="min-h-screen px-8 py-8 lg:px-10">
          <div className="mx-auto max-w-[1280px]">{children}</div>
        </div>
      </main>
    </div>
  );
}
