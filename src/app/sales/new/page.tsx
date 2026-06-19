"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { demoBusinesses, demoCustomers, formatYen } from "@/lib/demo-data";
import { useSalesStore } from "@/store/useSalesStore";

type TaxRate = 10 | 8 | 0;

interface LineItem {
  id: string;
  description: string;
  qty: number;
  unit: string;
  unitPrice: number;
  taxRate: TaxRate;
}

const TAX_LABEL: Record<TaxRate, string> = { 10: "10%", 8: "8%", 0: "非課税" };
const UNITS = ["式", "個", "本", "時間", "日", "月", "回"];

function newLine(): LineItem {
  return { id: crypto.randomUUID(), description: "", qty: 1, unit: "式", unitPrice: 0, taxRate: 10 };
}

const INVOICE_NUM = `INV-202606-001`;
const TODAY = "2026-06-19";

/* ─── フィールドラベル ─── */
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-medium text-zinc-500">
      {children}
      {required && <span className="ml-1 text-red-500">必須</span>}
    </label>
  );
}

/* ─── セクションタイトル ─── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 border-b border-zinc-100 pb-2 text-sm font-semibold text-zinc-700">
      {children}
    </h2>
  );
}

/* ─── インボイスプレビュー ─── */
function InvoicePreview({
  customer,
  subject,
  lines,
  invoiceDate,
  notes,
}: {
  customer: string;
  subject: string;
  lines: LineItem[];
  invoiceDate: string;
  notes: string;
}) {
  const subtotal10 = lines.filter((l) => l.taxRate === 10).reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const subtotal8  = lines.filter((l) => l.taxRate === 8).reduce((s, l)  => s + l.qty * l.unitPrice, 0);
  const subtotal0  = lines.filter((l) => l.taxRate === 0).reduce((s, l)  => s + l.qty * l.unitPrice, 0);
  const tax10 = Math.floor(subtotal10 * 0.1);
  const tax8  = Math.floor(subtotal8  * 0.08);
  const subtotal = subtotal10 + subtotal8 + subtotal0;
  const total = subtotal + tax10 + tax8;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 text-[11px] shadow-sm" style={{ fontFamily: "serif" }}>
      {/* ヘッダー */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          {customer && (
            <p className="text-sm font-bold text-zinc-900">{customer} 御中</p>
          )}
          {!customer && (
            <p className="text-sm text-zinc-300">取引先を選択してください</p>
          )}
          <p className="mt-3 text-zinc-500">下記の通りご請求申し上げます。</p>
          {subject && <p className="mt-1 font-semibold text-zinc-800">件名：{subject}</p>}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-zinc-900">請 求 書</p>
          <div className="mt-2 space-y-0.5 text-zinc-500">
            <p>請求日　{invoiceDate || "—"}</p>
            <p>請求書番号　{INVOICE_NUM}</p>
            <p>登録番号　T1234567890123</p>
          </div>
        </div>
      </div>

      {/* 請求金額 */}
      <div className="mb-4 rounded-md border border-zinc-200 p-3 text-center">
        <p className="text-xs text-zinc-500">ご請求金額（税込）</p>
        <p className="text-xl font-bold text-zinc-900">{formatYen(total)}</p>
      </div>

      {/* 自社情報 */}
      <div className="mb-4 rounded-md bg-zinc-50 px-3 py-2 text-zinc-500">
        <p className="font-semibold text-zinc-700">TBコーポレート株式会社</p>
        <p>〒100-0001 東京都千代田区1-1-1</p>
        <p>振込先：○○銀行 本店 普通 1234567</p>
      </div>

      {/* 明細テーブル */}
      <table className="mb-3 w-full border-collapse">
        <thead>
          <tr className="border-b border-t border-zinc-300 bg-zinc-50">
            <th className="py-1.5 pl-1 text-left font-semibold text-zinc-600" style={{ width: "40%" }}>摘要</th>
            <th className="py-1.5 text-right font-semibold text-zinc-600" style={{ width: "8%" }}>数量</th>
            <th className="py-1.5 text-right font-semibold text-zinc-600" style={{ width: "8%" }}>単位</th>
            <th className="py-1.5 text-right font-semibold text-zinc-600" style={{ width: "18%" }}>単価</th>
            <th className="py-1.5 text-center font-semibold text-zinc-600" style={{ width: "8%" }}>税率</th>
            <th className="py-1.5 pr-1 text-right font-semibold text-zinc-600" style={{ width: "18%" }}>金額</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.id} className="border-b border-zinc-100">
              <td className="py-1.5 pl-1 text-zinc-700">{l.description || "—"}</td>
              <td className="py-1.5 text-right text-zinc-700">{l.qty}</td>
              <td className="py-1.5 text-right text-zinc-500">{l.unit}</td>
              <td className="py-1.5 text-right tabular-nums text-zinc-700">{l.unitPrice ? formatYen(l.unitPrice) : "—"}</td>
              <td className="py-1.5 text-center text-zinc-500">{TAX_LABEL[l.taxRate]}</td>
              <td className="py-1.5 pr-1 text-right font-medium tabular-nums text-zinc-900">{formatYen(l.qty * l.unitPrice)}</td>
            </tr>
          ))}
          {lines.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 text-center text-zinc-300">明細行を追加してください</td>
            </tr>
          )}
          {/* 空行パディング */}
          {Array.from({ length: Math.max(0, 4 - lines.length) }).map((_, i) => (
            <tr key={`empty-${i}`} className="border-b border-zinc-50">
              <td className="py-1.5">&nbsp;</td>
              <td /><td /><td /><td /><td />
            </tr>
          ))}
        </tbody>
      </table>

      {/* 合計 */}
      <div className="mb-4 space-y-1">
        <div className="flex justify-between text-zinc-500">
          <span>小計</span>
          <span className="tabular-nums">{formatYen(subtotal)}</span>
        </div>
        {subtotal10 > 0 && (
          <div className="flex justify-between text-zinc-500">
            <span>消費税（10%）</span>
            <span className="tabular-nums">{formatYen(tax10)}</span>
          </div>
        )}
        {subtotal8 > 0 && (
          <div className="flex justify-between text-zinc-500">
            <span>消費税（8%）</span>
            <span className="tabular-nums">{formatYen(tax8)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-zinc-300 pt-1 font-bold text-zinc-900">
          <span>合計（税込）</span>
          <span className="tabular-nums">{formatYen(total)}</span>
        </div>
      </div>

      {/* 備考 */}
      {notes && (
        <div className="rounded border border-zinc-200 p-2">
          <p className="mb-0.5 font-semibold text-zinc-600">備考</p>
          <p className="whitespace-pre-wrap text-zinc-600">{notes}</p>
        </div>
      )}
    </div>
  );
}

/* ─── メインページ ─── */
export default function NewSalePage() {
  const router = useRouter();
  const addSale = useSalesStore((s) => s.addSale);

  const [customerId, setCustomerId]   = useState("");
  const [businessId, setBusinessId]   = useState(demoBusinesses[0]?.id ?? "");
  const [invoiceDate, setInvoiceDate] = useState(TODAY);
  const [subject, setSubject]         = useState("");
  const [lines, setLines]             = useState<LineItem[]>([newLine()]);
  const [notes, setNotes]             = useState("");
  const [memo, setMemo]               = useState("");
  const [errors, setErrors]           = useState<Record<string, string>>({});

  const customer = demoCustomers.find((c) => c.id === customerId);

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.qty * l.unitPrice, 0),
    [lines]
  );
  const tax10 = useMemo(
    () => Math.floor(lines.filter((l) => l.taxRate === 10).reduce((s, l) => s + l.qty * l.unitPrice, 0) * 0.1),
    [lines]
  );
  const tax8 = useMemo(
    () => Math.floor(lines.filter((l) => l.taxRate === 8).reduce((s, l) => s + l.qty * l.unitPrice, 0) * 0.08),
    [lines]
  );
  const total = subtotal + tax10 + tax8;

  const updateLine = (id: string, patch: Partial<LineItem>) =>
    setLines((prev) => prev.map((l) => l.id === id ? { ...l, ...patch } : l));

  const removeLine = (id: string) =>
    setLines((prev) => prev.filter((l) => l.id !== id));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!customerId)    e.customer = "取引先を選択してください";
    if (!subject.trim()) e.subject  = "件名を入力してください";
    if (lines.every((l) => !l.description.trim())) e.lines = "明細を1件以上入力してください";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const month = invoiceDate.slice(0, 7);
    lines
      .filter((l) => l.description.trim())
      .forEach((l) => {
        addSale({
          id: `s${Date.now()}-${l.id.slice(0, 6)}`,
          customerId,
          businessId,
          description: l.description,
          amount: l.qty * l.unitPrice,
          qty: l.qty,
          unitPrice: l.unitPrice,
          month,
          status: "uninvoiced",
        });
      });
    router.push("/sales");
  };

  return (
    <div className="space-y-4">
      {/* ページヘッダー */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Sales</p>
          <h1 className="mt-0.5 text-xl font-semibold text-zinc-900">売上登録</h1>
        </div>
      </div>

      {/* 2カラムレイアウト */}
      <div className="flex gap-6 items-start">
        {/* ── 左：フォーム ── */}
        <div className="min-w-0 flex-1 space-y-5">

          {/* 取引先・事業部 */}
          <div className="rounded-2xl bg-white shadow-card p-6 space-y-4">
            <SectionTitle>取引先情報</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
              <div>
                <FieldLabel required>取引先</FieldLabel>
                <Select value={customerId} onValueChange={(v) => v && setCustomerId(v)}>
                  <SelectTrigger className={`w-full rounded-md bg-gray-50 ${errors.customer ? "border-red-400" : ""}`}>
                    <SelectValue placeholder="取引先を選択" />
                  </SelectTrigger>
                  <SelectContent className="min-w-[260px]">
                    {demoCustomers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.customer && <p className="mt-1 text-xs text-red-500">{errors.customer}</p>}
              </div>
              <div>
                <FieldLabel required>事業部</FieldLabel>
                <Select value={businessId} onValueChange={(v) => v && setBusinessId(v)}>
                  <SelectTrigger className="w-full rounded-md bg-gray-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="min-w-[180px]">
                    {demoBusinesses.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 請求情報 */}
          <div className="rounded-2xl bg-white shadow-card p-6 space-y-4">
            <SectionTitle>請求情報</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>請求書番号</FieldLabel>
                <input
                  type="text"
                  readOnly
                  value={INVOICE_NUM}
                  className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-400"
                />
                <p className="mt-1 text-[11px] text-zinc-400">保存時に自動付番</p>
              </div>
              <div>
                <FieldLabel required>請求日</FieldLabel>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="block w-full rounded-lg border border-zinc-200 bg-gray-50 px-3 py-2 text-sm text-zinc-800 focus:border-[#0071e3] focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
                />
              </div>
            </div>
            <div>
              <FieldLabel required>件名</FieldLabel>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="例：2026年6月分 設備保守サービス"
                className={`block w-full rounded-md border bg-gray-50 px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-300 focus:border-[#0071e3] focus:outline-none focus:ring-1 focus:ring-[#0071e3] ${errors.subject ? "border-red-400" : "border-zinc-200"}`}
              />
              {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
            </div>
          </div>

          {/* 明細 */}
          <div className="rounded-2xl bg-white shadow-card p-6">
            <SectionTitle>明細</SectionTitle>
            {errors.lines && <p className="mb-3 text-xs text-red-500">{errors.lines}</p>}

            {/* テーブルヘッダー */}
            <div className="mb-1 grid text-[11px] font-medium text-zinc-400"
              style={{ gridTemplateColumns: "1fr 64px 64px 120px 80px 100px 32px" }}>
              <span className="pl-1">摘要</span>
              <span className="pl-1">数量</span>
              <span className="pl-1">単位</span>
              <span className="pl-1">単価</span>
              <span className="pl-1">税率</span>
              <span className="pl-1">金額</span>
              <span />
            </div>

            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div
                  key={line.id}
                  className="grid items-center gap-1.5 rounded-xl bg-zinc-50 px-2 py-2"
                  style={{ gridTemplateColumns: "1fr 64px 64px 120px 80px 100px 32px" }}
                >
                  {/* 摘要 */}
                  <input
                    type="text"
                    value={line.description}
                    onChange={(e) => updateLine(line.id, { description: e.target.value })}
                    placeholder={`明細 ${idx + 1}`}
                    className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-800 placeholder:text-zinc-300 focus:border-[#0071e3] focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
                  />
                  {/* 数量 */}
                  <input
                    type="number"
                    min={0}
                    value={line.qty}
                    onChange={(e) => updateLine(line.id, { qty: Number(e.target.value) || 0 })}
                    className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-center text-sm tabular-nums focus:border-[#0071e3] focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
                  />
                  {/* 単位 */}
                  <select
                    value={line.unit}
                    onChange={(e) => updateLine(line.id, { unit: e.target.value })}
                    className="w-full rounded-md border border-zinc-200 bg-white px-1 py-1.5 text-center text-sm focus:border-[#0071e3] focus:outline-none"
                  >
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                  {/* 単価 */}
                  <input
                    type="number"
                    min={0}
                    value={line.unitPrice || ""}
                    onChange={(e) => updateLine(line.id, { unitPrice: Number(e.target.value) || 0 })}
                    placeholder="0"
                    className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-right text-sm tabular-nums focus:border-[#0071e3] focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
                  />
                  {/* 税率 */}
                  <select
                    value={line.taxRate}
                    onChange={(e) => updateLine(line.id, { taxRate: Number(e.target.value) as TaxRate })}
                    className="w-full rounded-md border border-zinc-200 bg-white px-1 py-1.5 text-center text-sm focus:border-[#0071e3] focus:outline-none"
                  >
                    <option value={10}>10%</option>
                    <option value={8}>8%</option>
                    <option value={0}>非課税</option>
                  </select>
                  {/* 金額 */}
                  <p className="pr-1 text-right text-sm font-semibold tabular-nums text-zinc-800">
                    {formatYen(line.qty * line.unitPrice)}
                  </p>
                  {/* 削除 */}
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    disabled={lines.length === 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-300 transition-colors hover:bg-red-50 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setLines((prev) => [...prev, newLine()])}
              className="mt-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-[#0071e3] transition-colors hover:bg-blue-50"
            >
              <Plus className="h-3.5 w-3.5" />
              行を追加
            </button>

            {/* 小計・税・合計 */}
            <div className="mt-5 border-t border-zinc-100 pt-4 space-y-1.5">
              <div className="flex justify-between text-sm text-zinc-500">
                <span>小計</span>
                <span className="tabular-nums">{formatYen(subtotal)}</span>
              </div>
              {tax10 > 0 && (
                <div className="flex justify-between text-sm text-zinc-500">
                  <span>消費税（10%）</span>
                  <span className="tabular-nums">{formatYen(tax10)}</span>
                </div>
              )}
              {tax8 > 0 && (
                <div className="flex justify-between text-sm text-zinc-500">
                  <span>消費税（8%）</span>
                  <span className="tabular-nums">{formatYen(tax8)}</span>
                </div>
              )}
              <div className="flex justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm font-bold text-zinc-900">
                <span>合計（税込）</span>
                <span className="tabular-nums text-[#0071e3]">{formatYen(total)}</span>
              </div>
            </div>
          </div>

          {/* 備考・社内メモ */}
          <div className="rounded-2xl bg-white shadow-card p-6 space-y-4">
            <SectionTitle>備考・メモ</SectionTitle>
            <div>
              <FieldLabel>備考（請求書に記載）</FieldLabel>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="振込手数料はご負担ください。など"
                className="block w-full resize-none rounded-md border border-zinc-200 bg-gray-50 px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-300 focus:border-[#0071e3] focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
              />
            </div>
            <div>
              <FieldLabel>社内メモ（外部非公開）</FieldLabel>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={2}
                placeholder="担当者への申し送り事項など"
                className="block w-full resize-none rounded-md border border-zinc-200 bg-gray-50 px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-300 focus:border-[#0071e3] focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
              />
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex items-center gap-3 pb-8">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-[#0071e3] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#005fc2]"
            >
              保存する
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
            >
              キャンセル
            </button>
          </div>
        </div>

        {/* ── 右：プレビュー ── */}
        <div className="w-[400px] shrink-0 sticky top-8">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-400">プレビュー</p>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
              リアルタイム更新
            </span>
          </div>
          <InvoicePreview
            customer={customer?.name ?? ""}
            subject={subject}
            lines={lines}
            invoiceDate={invoiceDate}
            notes={notes}
          />
        </div>
      </div>
    </div>
  );
}
