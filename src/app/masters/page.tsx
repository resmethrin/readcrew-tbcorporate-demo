"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useMasterApprovalStore } from "@/store/useMasterApprovalStore";

interface SpotPartner {
  id: string;
  name: string;
  contact: string;
}

export default function MastersPage() {
  const requests = useMasterApprovalStore((s) => s.requests);
  const submitRequest = useMasterApprovalStore((s) => s.submitRequest);
  const approve = useMasterApprovalStore((s) => s.approve);

  const [targetType, setTargetType] = useState<"得意先" | "商品">("得意先");
  const [targetName, setTargetName] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string) =>
    setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleSubmit = () => {
    if (!targetName.trim() || !requestedBy.trim()) return;
    submitRequest(targetType, targetName.trim(), requestedBy.trim());
    setTargetName("");
    setRequestedBy("");
  };

  // スポット取引先簡易登録
  const [spotPartners, setSpotPartners] = useState<SpotPartner[]>([]);
  const [spotName, setSpotName] = useState("");
  const [spotContact, setSpotContact] = useState("");
  const handleSpotRegister = () => {
    if (!spotName.trim()) return;
    setSpotPartners((prev) => [
      ...prev,
      { id: `spot-${prev.length + 1}`, name: spotName.trim(), contact: spotContact.trim() || "—" },
    ]);
    setSpotName("");
    setSpotContact("");
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Masters</p>
        <h1 className="mt-1 text-xl font-semibold text-zinc-900">マスタ管理</h1>
      </div>

      {/* マスタ申請ワークフロー */}
      <Card className="rounded-2xl shadow-card bg-white">
        <CardHeader className="px-6 pt-5 pb-2">
          <CardTitle className="text-sm font-semibold text-zinc-700">マスタ新規登録の申請</CardTitle>
          <p className="text-xs text-zinc-400">申請者 → 上長 → 経営管理室 の3段階承認を経て有効化されます</p>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-5">
          <div className="grid gap-3 sm:grid-cols-4 items-end">
            <div className="space-y-1">
              <Label>対象種別</Label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as "得意先" | "商品")}
                className="h-8 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="得意先">得意先</option>
                <option value="商品">商品</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>名称</Label>
              <Input value={targetName} onChange={(e) => setTargetName(e.target.value)} placeholder="例: 新規委託先株式会社" />
            </div>
            <div className="space-y-1">
              <Label>申請者</Label>
              <Input value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} placeholder="氏名" />
            </div>
            <Button onClick={handleSubmit} disabled={!targetName.trim() || !requestedBy.trim()}>申請する</Button>
          </div>

          <div className="rounded-xl border border-zinc-200 overflow-hidden">
            {requests.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-zinc-400">申請はまだありません</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50 text-xs text-zinc-400">
                    <th className="px-4 py-2 text-left font-medium">種別</th>
                    <th className="px-4 py-2 text-left font-medium">名称</th>
                    <th className="px-4 py-2 text-left font-medium">申請者</th>
                    <th className="px-4 py-2 text-left font-medium">ステータス</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {requests.map((r) => {
                    const isExpanded = expanded.has(r.id);
                    return (
                      <React.Fragment key={r.id}>
                        <tr>
                          <td className="px-4 py-2.5 text-zinc-600">{r.targetType}</td>
                          <td className="px-4 py-2.5 font-medium text-zinc-800">
                            <button type="button" onClick={() => toggleExpand(r.id)} className="flex items-center gap-1.5 hover:text-accent">
                              {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-zinc-400" /> : <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />}
                              {r.targetName}
                            </button>
                          </td>
                          <td className="px-4 py-2.5 text-zinc-600">{r.requestedBy}</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                              r.status === "承認待ち" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {r.status === "承認待ち" && (
                              <Button size="sm" variant="outline" onClick={() => approve(r.id, "経営管理室 承認者", "経営管理室")}>
                                承認する
                              </Button>
                            )}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-zinc-50/60">
                            <td colSpan={5} className="px-8 py-3">
                              <ol className="space-y-1.5 text-xs text-zinc-500">
                                {r.history.map((h, i) => (
                                  <li key={i}>
                                    <span className="font-medium text-zinc-700">{h.at}</span> — {h.actor}（{h.role}）が{h.action}
                                  </li>
                                ))}
                              </ol>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* スポット取引先の簡易登録 */}
      <Card className="rounded-2xl shadow-card bg-white">
        <CardHeader className="px-6 pt-5 pb-2">
          <CardTitle className="text-sm font-semibold text-zinc-700">簡易取引先登録（スポット）</CardTitle>
          <p className="text-xs text-zinc-400">最低限の項目で即登録。債権・債務をスポット先ごとに個別に追えます</p>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3 items-end">
            <div className="space-y-1">
              <Label>名称</Label>
              <Input value={spotName} onChange={(e) => setSpotName(e.target.value)} placeholder="例: 強化クラブ" />
            </div>
            <div className="space-y-1">
              <Label>連絡先</Label>
              <Input value={spotContact} onChange={(e) => setSpotContact(e.target.value)} placeholder="任意" />
            </div>
            <Button onClick={handleSpotRegister} disabled={!spotName.trim()}>登録する</Button>
          </div>

          {spotPartners.length > 0 && (
            <div className="rounded-xl border border-zinc-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50 text-xs text-zinc-400">
                    <th className="px-4 py-2 text-left font-medium">名称</th>
                    <th className="px-4 py-2 text-left font-medium">連絡先</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {spotPartners.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-2.5 font-medium text-zinc-800">{p.name}</td>
                      <td className="px-4 py-2.5 text-zinc-600">{p.contact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-zinc-400">
            現行: 仕入先コード90000に集約 → 本システム: スポット先ごとに個別管理
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
