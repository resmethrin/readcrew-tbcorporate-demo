"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Truck, PackageSearch, Wallet } from "lucide-react";

export default function ProcurementPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Procurement</p>
        <h1 className="mt-1 text-xl font-semibold text-zinc-900">発注・仕入・支払（蔵奉行領域）</h1>
      </div>

      <Card className="rounded-2xl shadow-card bg-white">
        <CardContent className="p-8 space-y-6">
          <p className="text-sm text-zinc-600 leading-6">
            この領域は <span className="font-semibold text-zinc-800">Phase 1で構築予定</span> のスコープです。
            現在の販売・請求ハブ（Phase 0）は商蔵奉行の「販売」機能を中心にカバーしており、
            「仕入」機能（39機能フル使用）の受け皿は本フェーズで用意します。
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 p-5">
              <PackageSearch className="h-5 w-5 text-zinc-400" />
              <p className="mt-3 text-sm font-semibold text-zinc-800">発注管理</p>
              <p className="mt-1 text-xs text-zinc-400">発注書の起票・承認・進捗管理</p>
            </div>
            <div className="rounded-xl border border-zinc-200 p-5">
              <Truck className="h-5 w-5 text-zinc-400" />
              <p className="mt-3 text-sm font-semibold text-zinc-800">仕入計上</p>
              <p className="mt-1 text-xs text-zinc-400">検収・仕入伝票の起票、在庫連携</p>
            </div>
            <div className="rounded-xl border border-zinc-200 p-5">
              <Wallet className="h-5 w-5 text-zinc-400" />
              <p className="mt-3 text-sm font-semibold text-zinc-800">支払管理</p>
              <p className="mt-1 text-xs text-zinc-400">支払予定・実行・仕入先別残高管理</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
