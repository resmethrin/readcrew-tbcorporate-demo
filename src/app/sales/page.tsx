"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, Calendar, FileSpreadsheet, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { demoBusinesses, demoCustomers, formatMonth, formatYen, statusLabels, PERIOD_MONTHS } from "@/lib/demo-data";
import { useSalesStore } from "@/store/useSalesStore";
import type { Sale, SaleStatus } from "@/types";

const BIZ_COLOR: Record<string, { dot: string; bg: string; text: string }> = {
  b001: { dot: "bg-[#0071e3]",   bg: "bg-blue-50",   text: "text-blue-700" },
  b002: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
  b003: { dot: "bg-orange-500",  bg: "bg-orange-50",  text: "text-orange-700" },
};

const STATUS_STYLE: Record<SaleStatus, { bg: string; text: string; dot: string }> = {
  uninvoiced:   { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400" },
  consolidated: { bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-500" },
  invoiced:     { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-[#0071e3]" },
  paid:         { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
};

const statusFilters: { id: "all" | SaleStatus; label: string }[] = [
  { id: "all",          label: "全て" },
  { id: "uninvoiced",   label: "未請求" },
  { id: "consolidated", label: "統合済み" },
  { id: "invoiced",     label: "請求済" },
  { id: "paid",         label: "入金済" },
];

export default function SalesPage() {
  const sales = useSalesStore((s) => s.sales);
  const markInvoicedByIds = useSalesStore((s) => s.markInvoicedByIds);
  const markPaidByIds = useSalesStore((s) => s.markPaidByIds);
  const addSale = useSalesStore((s) => s.addSale);
  const [businessId, setBusinessId] = useState("all");
  const [status, setStatus] = useState<"all" | SaleStatus>("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);

  // Excel 取り込み
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importRows, setImportRows] = useState<Sale[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importDone, setImportDone] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    if (!file) return;
    setImportError(null);
    setImportDone(false);

    try {
      const { read, utils } = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

      const parsed: Sale[] = rows.map((row, i) => ({
        id: `excel-${Date.now()}-${i}`,
        customerId: String(row["顧客ID"] ?? row["customerId"] ?? demoCustomers[0]?.id ?? "c001"),
        businessId: String(row["事業部ID"] ?? row["businessId"] ?? demoBusinesses[0]?.id ?? "b001"),
        description: String(row["内容"] ?? row["description"] ?? ""),
        amount: Number(row["金額"] ?? row["amount"] ?? 0),
        qty: row["数量"] != null ? Number(row["数量"]) : undefined,
        unitPrice: row["単価"] != null ? Number(row["単価"]) : undefined,
        month: String(row["月"] ?? row["month"] ?? "2026-06"),
        status: "uninvoiced" as SaleStatus,
      }));

      if (parsed.length === 0) { setImportError("データが見つかりませんでした"); return; }
      setImportRows(parsed);
    } catch {
      setImportError("ファイルの読み込みに失敗しました");
    }
  };

  const handleImportConfirm = () => {
    importRows.forEach((s) => addSale(s));
    setImportDone(true);
    setImportRows([]);
  };

  const closeImportModal = () => { setImportRows([]); setImportError(null); setImportDone(false); };

  const availableMonths = PERIOD_MONTHS;

  const filtered = useMemo(
    () =>
      sales.filter((s) => {
        const bizMatch    = businessId === "all" || s.businessId === businessId;
        const statusMatch = status === "all"     || s.status === status;
        const monthMatch  = monthFilter === "all" || s.month === monthFilter;
        return bizMatch && statusMatch && monthMatch;
      }),
    [businessId, monthFilter, sales, status],
  );

  const bizTotals = useMemo(() =>
    demoBusinesses.map((b) => {
      const items = sales.filter(
        (s) => s.businessId === b.id && (status === "all" || s.status === status)
      );
      return { ...b, total: items.reduce((n, s) => n + s.amount, 0), count: items.length };
    }),
    [sales, status]
  );

  const toggleSelected = (id: string) =>
    setSelected((cur) => cur.includes(id) ? cur.filter((v) => v !== id) : [...cur, id]);

  const allFilteredIds = filtered.map((s) => s.id);

  // 選択中アイテムのステータス分類
  const selectedSales = sales.filter((s) => selected.includes(s.id));
  const hasUninvoiced = selectedSales.some((s) => s.status === "uninvoiced");
  const hasInvoiced   = selectedSales.some((s) => s.status === "invoiced");
  const allChecked = allFilteredIds.length > 0 && allFilteredIds.every((id) => selected.includes(id));
  const toggleAll = () =>
    setSelected(allChecked ? selected.filter((id) => !allFilteredIds.includes(id)) : [...new Set([...selected, ...allFilteredIds])]);

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Sales</p>
          <h1 className="mt-1 text-xl font-semibold text-zinc-900">売上一覧</h1>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Excel取込
          </button>
          <Link
            href="/sales/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0071e3] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#005fc2]"
          >
            <Plus className="h-4 w-4" />
            売上登録
          </Link>
        </div>
      </div>

      {/* 事業部別 ミニ KPI */}
      <div className="grid gap-3 md:grid-cols-3">
        {bizTotals.map((b) => {
          const c = BIZ_COLOR[b.id];
          const active = businessId === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setBusinessId(active ? "all" : b.id)}
              className={`rounded-2xl border bg-white p-4 text-left shadow-card transition-all ${
                active ? "ring-2 ring-[#0071e3] ring-offset-1" : "hover:shadow-md"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-block h-2 w-2 rounded-full ${c.dot}`} />
                <span className={`text-xs font-medium ${active ? "text-[#0071e3]" : "text-zinc-500"}`}>{b.name}</span>
                {active && <span className="ml-auto text-[10px] font-medium text-[#0071e3]">選択中</span>}
              </div>
              <p className="text-xl font-bold text-zinc-900 tracking-tight">{formatYen(b.total)}</p>
              <p className="mt-0.5 text-xs text-zinc-400">{b.count}件</p>
            </button>
          );
        })}
      </div>

      {/* フィルターバー */}
      <Card className="rounded-2xl shadow-card bg-white">
        <CardHeader className="px-6 pt-5 pb-0">
          <div className="flex flex-wrap items-center gap-6">
            {/* 期間フィルター */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-zinc-400 shrink-0" />
              <span className="text-xs font-medium text-zinc-400 whitespace-nowrap">期間</span>
              <div className="flex flex-wrap gap-1.5 ml-1">
                <button
                  type="button"
                  onClick={() => setMonthFilter("all")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    monthFilter === "all" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >全期間</button>
                {availableMonths.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMonthFilter(monthFilter === m ? "all" : m)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      monthFilter === m ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >{formatMonth(m)}</button>
                ))}
              </div>
            </div>

            {/* 事業部フィルター */}
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-zinc-400 shrink-0" />
              <span className="text-xs font-medium text-zinc-400 whitespace-nowrap">事業部</span>
              <div className="flex flex-wrap gap-1.5 ml-1">
                <button
                  type="button"
                  onClick={() => setBusinessId("all")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    businessId === "all"
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  全て
                </button>
                {demoBusinesses.map((b) => {
                  const c = BIZ_COLOR[b.id];
                  const active = businessId === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBusinessId(active ? "all" : b.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? `${c.bg} ${c.text}`
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${active ? c.dot : "bg-zinc-400"}`} />
                      {b.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ステータスフィルター */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-400 whitespace-nowrap">ステータス</span>
              <div className="flex gap-1.5">
                {statusFilters.map((item) => {
                  const s = item.id !== "all" ? STATUS_STYLE[item.id] : null;
                  const active = status === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStatus(item.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        active && s
                          ? `${s.bg} ${s.text}`
                          : active
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      {s && active && <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />}
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 一括操作 */}
            {selected.length > 0 && (
              <div className="ml-auto flex items-center gap-2">
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                  {selected.length}件選択中
                </span>
                {hasUninvoiced && (
                  <button
                    type="button"
                    onClick={() => {
                      markInvoicedByIds(selected.filter((id) => sales.find((s) => s.id === id)?.status === "uninvoiced"));
                      setSelected([]);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                  >
                    <span className="inline-flex items-center gap-1">
                      <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-white">未請求</span>
                      <ArrowRight className="h-3 w-3 text-blue-400" />
                      <span className="rounded-full bg-[#0071e3] px-1.5 py-0.5 text-[10px] font-bold text-white">請求済</span>
                    </span>
                    にする
                  </button>
                )}
                {hasInvoiced && (
                  <button
                    type="button"
                    onClick={() => {
                      markPaidByIds(selected.filter((id) => sales.find((s) => s.id === id)?.status === "invoiced"));
                      setSelected([]);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                  >
                    <span className="inline-flex items-center gap-1">
                      <span className="rounded-full bg-[#0071e3] px-1.5 py-0.5 text-[10px] font-bold text-white">請求済</span>
                      <ArrowRight className="h-3 w-3 text-emerald-400" />
                      <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">入金済</span>
                    </span>
                    にする
                  </button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-4">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-100 hover:bg-transparent">
                <TableHead className="w-10 pl-6">
                  <Checkbox checked={allChecked} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead className="text-xs font-medium text-zinc-400">顧客名</TableHead>
                <TableHead className="text-xs font-medium text-zinc-400">事業部</TableHead>
                <TableHead className="text-xs font-medium text-zinc-400">内容</TableHead>
                <TableHead className="text-xs font-medium text-zinc-400">金額</TableHead>
                <TableHead className="text-xs font-medium text-zinc-400">月</TableHead>
                <TableHead className="text-xs font-medium text-zinc-400">ステータス</TableHead>
                <TableHead className="pr-6" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-sm text-zinc-400">
                    該当する売上データがありません
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((sale) => {
                const customer = demoCustomers.find((c) => c.id === sale.customerId);
                const business = demoBusinesses.find((b) => b.id === sale.businessId);
                const bc = BIZ_COLOR[sale.businessId];
                const sc = STATUS_STYLE[sale.status];
                const isSelected = selected.includes(sale.id);
                return (
                  <TableRow
                    key={sale.id}
                    className={`border-zinc-50 transition-colors ${isSelected ? "bg-blue-50/50" : "hover:bg-zinc-50/50"}`}
                  >
                    <TableCell className="pl-6">
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleSelected(sale.id)} />
                    </TableCell>
                    <TableCell className="font-medium text-zinc-800">{customer?.name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${bc.bg} ${bc.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${bc.dot}`} />
                        {business?.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-600 max-w-[200px] truncate">{sale.description}</TableCell>
                    <TableCell className="font-semibold text-zinc-900 tabular-nums">{formatYen(sale.amount)}</TableCell>
                    <TableCell className="text-sm text-zinc-500 tabular-nums">{formatMonth(sale.month)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.bg} ${sc.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                        {statusLabels[sale.status]}
                      </span>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Link
                        href={`/sales/new?id=${sale.id}`}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
                      >
                        詳細 <ArrowRight className="h-3 w-3" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* フッター */}
          <div className="flex items-center justify-between border-t border-zinc-50 px-6 py-3">
            <span className="text-xs text-zinc-400">{filtered.length}件表示</span>
            <span className="text-xs font-semibold text-zinc-700">
              合計 {formatYen(filtered.reduce((n, s) => n + s.amount, 0))}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Excel 取り込みモーダル */}
      {(importRows.length > 0 || importError || importDone) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold text-zinc-900">Excel 取り込み</span>
              </div>
              <button type="button" onClick={closeImportModal} className="rounded-lg p-1 hover:bg-zinc-100">
                <X className="h-4 w-4 text-zinc-500" />
              </button>
            </div>

            <div className="px-6 py-5">
              {importError && (
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{importError}</p>
              )}
              {importDone && (
                <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {`取り込み完了しました`}
                </p>
              )}
              {importRows.length > 0 && (
                <>
                  <p className="mb-3 text-sm text-zinc-500">{importRows.length} 件のデータを取り込みます</p>
                  <div className="max-h-72 overflow-y-auto rounded-xl border border-zinc-100">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-50 text-xs text-zinc-400">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">内容</th>
                          <th className="px-3 py-2 text-left font-medium">顧客</th>
                          <th className="px-3 py-2 text-left font-medium">事業部</th>
                          <th className="px-3 py-2 text-left font-medium">月</th>
                          <th className="px-3 py-2 text-right font-medium">金額</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {importRows.map((row) => (
                          <tr key={row.id} className="hover:bg-zinc-50/50">
                            <td className="px-3 py-2 text-zinc-700">{row.description || "—"}</td>
                            <td className="px-3 py-2 text-zinc-600">
                              {demoCustomers.find((c) => c.id === row.customerId)?.name ?? row.customerId}
                            </td>
                            <td className="px-3 py-2 text-zinc-600">
                              {demoBusinesses.find((b) => b.id === row.businessId)?.name ?? row.businessId}
                            </td>
                            <td className="px-3 py-2 text-zinc-500 tabular-nums">{formatMonth(row.month)}</td>
                            <td className="px-3 py-2 text-right font-medium text-zinc-900 tabular-nums">
                              {formatYen(row.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4">
              <button
                type="button"
                onClick={closeImportModal}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                {importDone ? "閉じる" : "キャンセル"}
              </button>
              {importRows.length > 0 && (
                <button
                  type="button"
                  onClick={handleImportConfirm}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                >
                  取り込む
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
