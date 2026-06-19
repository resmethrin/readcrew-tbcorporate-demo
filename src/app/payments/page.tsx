"use client";

import { useMemo, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  demoBusinesses,
  formatMonth,
  formatYen,
  getCustomerName,
  invoiceNumberForMonth,
  statusLabels,
  PERIOD_MONTHS,
} from "@/lib/demo-data";
import { useSalesStore } from "@/store/useSalesStore";
import type { SaleStatus } from "@/types";

const BIZ_COLOR: Record<string, { dot: string; bg: string; text: string }> = {
  b001: { dot: "bg-[#0071e3]",   bg: "bg-blue-50",   text: "text-blue-700" },
  b002: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
  b003: { dot: "bg-orange-500",  bg: "bg-orange-50",  text: "text-orange-700" },
};

const STATUS_STYLE: Record<"invoiced" | "paid", { bg: string; text: string; dot: string; border: string }> = {
  invoiced: { bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-500",     border: "border-sky-200" },
  paid:     { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
};

export default function PaymentsPage() {
  const sales = useSalesStore((s) => s.sales);
  const markPaidByIds = useSalesStore((s) => s.markPaidByIds);

  const [monthFilter, setMonthFilter] = useState("all");
  const [bizFilter, setBizFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "invoiced" | "paid">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // 請求一覧と同じ「顧客×月」集計
  const invoiceRows = useMemo(() => {
    type Row = {
      id: string;
      customerId: string;
      customerName: string;
      month: string;
      bizIds: string[];
      bizNames: string[];
      saleIds: string[];
      invoicedIds: string[];
      itemCount: number;
      subtotal: number;
      uninvoiced: number;
      consolidated: number;
      invoiced: number;
      paid: number;
    };
    const map = new Map<string, Row>();
    for (const sale of sales) {
      const id = `${sale.customerId}-${sale.month}`;
      const row: Row = map.get(id) ?? {
        id,
        customerId: sale.customerId,
        customerName: getCustomerName(sale.customerId),
        month: sale.month,
        bizIds: [],
        bizNames: [],
        saleIds: [],
        invoicedIds: [],
        itemCount: 0,
        subtotal: 0,
        uninvoiced: 0,
        consolidated: 0,
        invoiced: 0,
        paid: 0,
      };
      if (!row.bizIds.includes(sale.businessId)) {
        row.bizIds.push(sale.businessId);
        const biz = demoBusinesses.find((b) => b.id === sale.businessId);
        if (biz) row.bizNames.push(biz.name);
      }
      row.saleIds.push(sale.id);
      if (sale.status === "invoiced") row.invoicedIds.push(sale.id);
      row.itemCount += 1;
      row.subtotal += sale.amount;
      row[sale.status] += 1;
      map.set(id, row);
    }
    return Array.from(map.values()).sort((a, b) => b.month.localeCompare(a.month));
  }, [sales]);

  const paymentRowStatus = (row: { invoiced: number; paid: number }): "invoiced" | "paid" =>
    row.invoiced > 0 ? "invoiced" : "paid";

  const paymentRows = useMemo(() => {
    return invoiceRows.filter((row) => {
      if (row.invoiced === 0 && row.paid === 0) return false;
      if (monthFilter !== "all" && row.month !== monthFilter) return false;
      if (bizFilter !== "all" && !row.bizIds.includes(bizFilter)) return false;
      const st = paymentRowStatus(row);
      if (statusFilter !== "all" && st !== statusFilter) return false;
      return true;
    });
  }, [invoiceRows, monthFilter, bizFilter, statusFilter]);

  const paidRows      = useMemo(() => paymentRows.filter((r) => paymentRowStatus(r) === "paid"), [paymentRows]);
  const invoicedRows  = useMemo(() => paymentRows.filter((r) => paymentRowStatus(r) === "invoiced"), [paymentRows]);
  const paidTotal     = paidRows.reduce((n, r) => n + r.subtotal + Math.round(r.subtotal * 0.1), 0);
  const invoicedTotal = invoicedRows.reduce((n, r) => n + r.subtotal + Math.round(r.subtotal * 0.1), 0);

  // 選択操作（請求済み行のみ選択可）
  const selectableIds = invoicedRows.map((r) => r.id);
  const allChecked = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
  const someChecked = selectableIds.some((id) => selected.has(id));

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(allChecked
      ? new Set([...selected].filter((id) => !selectableIds.includes(id)))
      : new Set([...selected, ...selectableIds])
    );

  const handleBulkPaid = () => {
    const ids = paymentRows
      .filter((r) => selected.has(r.id))
      .flatMap((r) => r.invoicedIds);
    markPaidByIds(ids);
    setSelected(new Set());
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Payments</p>
          <h1 className="mt-1 text-xl font-semibold text-zinc-900">入金管理</h1>
        </div>
        <Button variant="outline">
          <Upload className="h-4 w-4" />
          CSV出力
        </Button>
      </div>

      {/* KPI */}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === "invoiced" ? "all" : "invoiced")}
          className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition-all ${statusFilter === "invoiced" ? "ring-2 ring-sky-500 ring-offset-1" : "hover:shadow-md"}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block h-2 w-2 rounded-full bg-sky-500" />
            <span className={`text-xs font-medium ${statusFilter === "invoiced" ? "text-sky-600" : "text-zinc-500"}`}>未入金（請求済）</span>
            {statusFilter === "invoiced" && <span className="ml-auto text-[10px] font-medium text-sky-600">選択中</span>}
          </div>
          <p className="text-xl font-bold text-zinc-900 tracking-tight">{formatYen(invoicedTotal)}</p>
          <p className="mt-0.5 text-xs text-zinc-400">{invoicedRows.length}件</p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === "paid" ? "all" : "paid")}
          className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition-all ${statusFilter === "paid" ? "ring-2 ring-emerald-500 ring-offset-1" : "hover:shadow-md"}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span className={`text-xs font-medium ${statusFilter === "paid" ? "text-emerald-600" : "text-zinc-500"}`}>入金済</span>
            {statusFilter === "paid" && <span className="ml-auto text-[10px] font-medium text-emerald-600">選択中</span>}
          </div>
          <p className="text-xl font-bold text-zinc-900 tracking-tight">{formatYen(paidTotal)}</p>
          <p className="mt-0.5 text-xs text-zinc-400">{paidRows.length}件</p>
        </button>
      </div>

      {/* フィルターバー */}
      <Card className="rounded-2xl shadow-sm bg-white">
        <CardContent className="px-5 py-4">
          <div className="flex flex-wrap items-center gap-6">
            {/* 期間 */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-400 whitespace-nowrap">期間</span>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" onClick={() => setMonthFilter("all")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${monthFilter === "all" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
                  全期間
                </button>
                {PERIOD_MONTHS.map((m) => (
                  <button key={m} type="button" onClick={() => setMonthFilter(monthFilter === m ? "all" : m)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${monthFilter === m ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
                    {formatMonth(m)}
                  </button>
                ))}
              </div>
            </div>
            {/* 事業部 */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-400 whitespace-nowrap">事業部</span>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" onClick={() => setBizFilter("all")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${bizFilter === "all" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
                  全て
                </button>
                {demoBusinesses.map((b) => {
                  const c = BIZ_COLOR[b.id];
                  const active = bizFilter === b.id;
                  return (
                    <button key={b.id} type="button" onClick={() => setBizFilter(active ? "all" : b.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${active ? `${c.bg} ${c.text}` : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${active ? c.dot : "bg-zinc-400"}`} />
                      {b.name}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* ステータス */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-400 whitespace-nowrap">ステータス</span>
              <div className="flex gap-1.5">
                {([
                  { id: "all",      label: "全て" },
                  { id: "invoiced", label: "未入金（請求済）" },
                  { id: "paid",     label: "入金済" },
                ] as { id: "all" | "invoiced" | "paid"; label: string }[]).map((item) => {
                  const active = statusFilter === item.id;
                  return (
                    <button key={item.id} type="button" onClick={() => setStatusFilter(item.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? item.id === "invoiced" ? "bg-sky-50 text-sky-700"
                          : item.id === "paid"     ? "bg-emerald-50 text-emerald-700"
                          : "bg-zinc-900 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 一括操作 */}
            {selected.size > 0 && (
              <div className="ml-auto flex items-center gap-2">
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                  {selected.size}件選択中
                </span>
                <button
                  type="button"
                  onClick={handleBulkPaid}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  まとめて入金済にする
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* テーブル */}
      <Card className="rounded-2xl shadow-sm bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-100 hover:bg-transparent">
                <TableHead className="w-10 pl-5">
                  <Checkbox
                    checked={allChecked}
                    onCheckedChange={toggleAll}
                    aria-label="全選択"
                    className={someChecked && !allChecked ? "opacity-50" : ""}
                  />
                </TableHead>
                <TableHead className="text-xs font-medium text-zinc-400">請求番号</TableHead>
                <TableHead className="text-xs font-medium text-zinc-400">顧客</TableHead>
                <TableHead className="text-xs font-medium text-zinc-400">件名</TableHead>
                <TableHead className="text-xs font-medium text-zinc-400">期間</TableHead>
                <TableHead className="text-xs font-medium text-zinc-400 text-right">金額（税込）</TableHead>
                <TableHead className="text-xs font-medium text-zinc-400">ステータス</TableHead>
                <TableHead className="pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-sm text-zinc-400">
                    該当するデータがありません
                  </TableCell>
                </TableRow>
              )}
              {paymentRows.map((row) => {
                const st = paymentRowStatus(row);
                const s = STATUS_STYLE[st];
                const total = row.subtotal + Math.round(row.subtotal * 0.1);
                const subject = row.bizNames.length === 1
                  ? row.bizNames[0]
                  : `${row.bizNames[0]} 他${row.bizNames.length - 1}件`;
                const isSelectable = st === "invoiced";
                const isSelected = selected.has(row.id);
                return (
                  <TableRow
                    key={row.id}
                    className={`border-zinc-50 transition-colors ${isSelected ? "bg-emerald-50/40" : "hover:bg-zinc-50/50"}`}
                  >
                    <TableCell className="pl-5">
                      {isSelectable ? (
                        <Checkbox checked={isSelected} onCheckedChange={() => toggleRow(row.id)} />
                      ) : (
                        <span className="inline-block h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-zinc-500">
                      {invoiceNumberForMonth(row.month)}
                    </TableCell>
                    <TableCell className="font-medium text-zinc-800">{row.customerName}</TableCell>
                    <TableCell>
                      <div className="text-sm text-zinc-700">{subject}</div>
                      <div className="text-xs text-zinc-400">{row.itemCount}件</div>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500 tabular-nums">{formatMonth(row.month)}</TableCell>
                    <TableCell className="text-right font-semibold text-zinc-900 tabular-nums">
                      {formatYen(total)}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.text} ${s.border}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                        {statusLabels[st]}
                      </span>
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      {st === "invoiced" && (
                        <button
                          type="button"
                          onClick={() => markPaidByIds(row.saleIds)}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                        >
                          入金済にする
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t border-zinc-50 px-5 py-3">
            <span className="text-xs text-zinc-400">{paymentRows.length}件表示</span>
            <span className="text-xs font-semibold text-zinc-700">
              合計 {formatYen(paymentRows.reduce((n, r) => n + r.subtotal + Math.round(r.subtotal * 0.1), 0))}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
