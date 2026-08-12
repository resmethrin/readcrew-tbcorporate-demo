"use client";

import { Card, CardContent } from "@/components/ui/card";

interface AuditLogEntry {
  at: string;
  actor: string;
  action: string;
  target: string;
  ip: string;
}

const AUDIT_LOG: AuditLogEntry[] = [
  { at: "2026-06-19 09:12", actor: "田村 誠",     action: "請求書発行", target: "T紡織株式会社 2026-06分",   ip: "192.168.1.10" },
  { at: "2026-06-19 09:40", actor: "中村 あかり", action: "入金消込",   target: "食堂委託会社 2026-06分",     ip: "192.168.1.14" },
  { at: "2026-06-18 17:03", actor: "佐藤 健太",   action: "売上登録",   target: "s142 制服",                 ip: "192.168.1.22" },
  { at: "2026-06-18 15:21", actor: "田村 誠",     action: "マスタ申請", target: "得意先: 強化クラブ",         ip: "192.168.1.10" },
  { at: "2026-06-17 11:08", actor: "経営管理室 承認者", action: "マスタ承認", target: "得意先: 強化クラブ",   ip: "192.168.1.30" },
  { at: "2026-06-17 10:02", actor: "中村 あかり", action: "楽楽明細連携", target: "請求一覧 2026-06分（12件）", ip: "192.168.1.14" },
  { at: "2026-06-16 14:47", actor: "佐藤 健太",   action: "Excel取込",  target: "売上 8件",                  ip: "192.168.1.22" },
  { at: "2026-06-15 09:30", actor: "田村 誠",     action: "統合",       target: "T紡織滋賀事業所 2026-06分",  ip: "192.168.1.10" },
  { at: "2026-06-12 16:55", actor: "中村 あかり", action: "共有リンク発行", target: "派遣会社A 2026-06分",     ip: "192.168.1.14" },
  { at: "2026-06-10 08:58", actor: "佐藤 健太",   action: "ログイン",   target: "—",                          ip: "192.168.1.22" },
];

export default function AuditLogPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Audit Log</p>
        <h1 className="mt-1 text-xl font-semibold text-zinc-900">操作ログ</h1>
        <p className="mt-1 text-xs text-zinc-400">保存期間: 6ヶ月以上</p>
      </div>

      <Card className="rounded-2xl shadow-card bg-white">
        <CardContent className="px-0 py-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-xs text-zinc-400">
                <th className="px-5 py-2.5 text-left font-medium">日時</th>
                <th className="px-5 py-2.5 text-left font-medium">担当者</th>
                <th className="px-5 py-2.5 text-left font-medium">操作</th>
                <th className="px-5 py-2.5 text-left font-medium">対象</th>
                <th className="px-5 py-2.5 text-left font-medium">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {AUDIT_LOG.map((entry, i) => (
                <tr key={i}>
                  <td className="px-5 py-2.5 tabular-nums text-zinc-500">{entry.at}</td>
                  <td className="px-5 py-2.5 font-medium text-zinc-800">{entry.actor}</td>
                  <td className="px-5 py-2.5 text-zinc-600">{entry.action}</td>
                  <td className="px-5 py-2.5 text-zinc-600">{entry.target}</td>
                  <td className="px-5 py-2.5 font-mono text-xs text-zinc-400">{entry.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
