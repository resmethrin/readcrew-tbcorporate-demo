import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-noto",
});

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
    <html lang="ja" className={`h-full antialiased ${notoSansJP.variable}`}>
      <body className="min-h-full bg-gray-50 text-zinc-950">
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
