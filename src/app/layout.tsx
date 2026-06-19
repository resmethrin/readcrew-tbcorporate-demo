import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "販売・請求ハブ",
  description: "ReadyCrew 販売・請求統合デモ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full bg-[#EEF2F7] text-zinc-950">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 pl-72">
            <div className="min-h-screen px-8 py-8 lg:px-10">
              <div className="mx-auto max-w-[1280px]">{children}</div>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
