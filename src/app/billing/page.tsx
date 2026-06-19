"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Calendar, ChevronDown, ChevronRight, FileText, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  demoBusinesses,
  demoCustomers,
  formatYen,
  getBusinessName,
  getCustomerName,
  groupSalesByBusiness,
  invoiceDateLabel,
  invoiceNumberForMonth,
  formatMonth,
  monthToLabel,
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

const STATUS_STYLE: Record<SaleStatus, { bg: string; text: string; dot: string; border: string }> = {
  uninvoiced:   { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400",   border: "border-amber-200" },
  consolidated: { bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-500",  border: "border-violet-200" },
  invoiced:     { bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-500",     border: "border-sky-200" },
  paid:         { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
};

const STATUS_FILTERS: { id: "all" | SaleStatus; label: string }[] = [
  { id: "all",          label: "全て" },
  { id: "uninvoiced",   label: "未請求" },
  { id: "consolidated", label: "統合済み" },
  { id: "invoiced",     label: "請求済" },
];

export default function BillingPage() {
  const sales = useSalesStore((s) => s.sales);

  // ── 統合画面の状態 ────────────────────────────────────
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [month, setMonth] = useState("2026-06");
  const [selectedBizIds, setSelectedBizIds] = useState<Set<string>>(new Set());
  const [invoiceNo, setInvoiceNo] = useState("");

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string) =>
    setExpandedRows((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // ── 一覧フィルター ────────────────────────────────────
  const [monthFilter, setMonthFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | SaleStatus>("all");

  // 請求行（顧客 × 月 単位）
  const invoiceRows = useMemo(() => {
    type Row = {
      id: string;
      customerId: string;
      customerName: string;
      month: string;
      bizNames: string[];
      bizIds: string[];
      itemCount: number;
      subtotal: number;
      uninvoiced: number;
      consolidated: number;
      invoiced: number;
      paid: number;
      issuer: string;
    };
    const map = new Map<string, Row>();
    for (const sale of sales) {
      const id = `${sale.customerId}-${sale.month}`;
      const row: Row = map.get(id) ?? {
        id,
        customerId: sale.customerId,
        customerName: getCustomerName(sale.customerId),
        month: sale.month,
        bizNames: [],
        bizIds: [],
        itemCount: 0,
        subtotal: 0,
        uninvoiced: 0,
        consolidated: 0,
        invoiced: 0,
        paid: 0,
        issuer: sale.assignee ?? "—",
      };
      const bizName = getBusinessName(sale.businessId);
      if (!row.bizIds.includes(sale.businessId)) {
        row.bizIds.push(sale.businessId);
        row.bizNames.push(bizName);
      }
      row.itemCount += 1;
      row.subtotal += sale.amount;
      row[sale.status] += 1;
      map.set(id, row);
    }
    return Array.from(map.values()).sort((a, b) => b.month.localeCompare(a.month));
  }, [sales]);

  // 行ごとのステータス（未請求 > 統合済み > 請求済 > 入金済）
  const rowStatus = (row: { uninvoiced: number; consolidated: number; invoiced: number; paid: number }): SaleStatus => {
    if (row.uninvoiced > 0)   return "uninvoiced";
    if (row.consolidated > 0) return "consolidated";
    if (row.invoiced > 0)     return "invoiced";
    return "paid";
  };

  // KPI集計（フィルターなし・全体）
  const kpi = useMemo(() => {
    const totals = {
      uninvoiced: 0, consolidated: 0, invoiced: 0, paid: 0,
      uninvoicedCount: 0, consolidatedCount: 0, invoicedCount: 0, paidCount: 0,
    };
    for (const row of invoiceRows) {
      const st = rowStatus(row);
      const withTax = row.subtotal + Math.round(row.subtotal * 0.1);
      if (st === "uninvoiced")   { totals.uninvoiced   += withTax; totals.uninvoicedCount++; }
      else if (st === "consolidated") { totals.consolidated += withTax; totals.consolidatedCount++; }
      else if (st === "invoiced")     { totals.invoiced     += withTax; totals.invoicedCount++; }
      else                            { totals.paid         += withTax; totals.paidCount++; }
    }
    return totals;
  }, [invoiceRows]);

  // フィルター適用（入金済みは非表示）
  const filtered = useMemo(() =>
    invoiceRows.filter((row) => {
      const st = rowStatus(row);
      if (st === "paid") return false;
      return (
        (monthFilter === "all" || row.month === monthFilter) &&
(statusFilter === "all" || st === statusFilter)
      );
    }),
    [invoiceRows, monthFilter, statusFilter],
  );

  // ── 統合画面（事業部選択）────────────────────────────
  const bizGroups = useMemo(() => {
    if (!selectedCustomerId) return [];
    return groupSalesByBusiness(
      sales.filter((s) => s.customerId === selectedCustomerId && s.month === month),
    );
  }, [sales, selectedCustomerId, month]);

  const toggleBiz = (bizId: string) =>
    setSelectedBizIds((prev) => {
      const next = new Set(prev);
      next.has(bizId) ? next.delete(bizId) : next.add(bizId);
      return next;
    });

  const toggleAllBiz = () =>
    setSelectedBizIds(
      selectedBizIds.size === bizGroups.length ? new Set() : new Set(bizGroups.map((g) => g.businessId)),
    );

  const handleOpenCustomer = (customerId: string, openMonth: string) => {
    setSelectedCustomerId(customerId);
    setMonth(openMonth);
    setSelectedBizIds(new Set());
    setInvoiceNo("");
  };

  const handleBack = () => {
    setSelectedCustomerId(null);
    setSelectedBizIds(new Set());
    setInvoiceNo("");
  };

  const markConsolidatedByIds = useSalesStore((s) => s.markConsolidatedByIds);
  const selectedGroups = bizGroups.filter((g) => selectedBizIds.has(g.businessId));
  const subtotal = selectedGroups.reduce((sum, g) => sum + g.subtotal, 0);
  const tax = Math.round(subtotal * 0.1);
  const resolvedInvoiceNo = invoiceNo.trim() || invoiceNumberForMonth(month);
  const bizIdsParam = Array.from(selectedBizIds).join(",");
  const previewHref =
    `/billing/${selectedCustomerId}-${month}/preview` +
    `?invoiceNo=${encodeURIComponent(resolvedInvoiceNo)}` +
    (selectedBizIds.size < bizGroups.length ? `&bizIds=${encodeURIComponent(bizIdsParam)}` : "");

  const handleMarkConsolidated = () => {
    const ids = selectedGroups.flatMap((g) => g.items.map((item) => item.id));
    markConsolidatedByIds(ids);
    handleBack();
  };

  const selectedCustomer = demoCustomers.find((c) => c.id === selectedCustomerId);

  // ── 統合画面 ─────────────────────────────────────────
  if (selectedCustomerId) {
    return (
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <button
              onClick={handleBack}
              className="mb-2 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              請求一覧に戻る
            </button>
            <div className="text-sm font-medium text-zinc-500">Billing</div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{selectedCustomer?.name}</h1>
          </div>
          <Button variant="outline">
            <Upload className="h-4 w-4" />
            CSV出力
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base">請求月を選択</CardTitle>
            <select
              value={month}
              onChange={(e) => { setMonth(e.target.value); setSelectedBizIds(new Set()); }}
              className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {PERIOD_MONTHS.map((v) => (
                <option key={v} value={v}>{formatMonth(v)}</option>
              ))}
            </select>
          </CardHeader>
          <CardContent className="space-y-5">
            {bizGroups.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-400">{monthToLabel(month)} の売上データがありません</p>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                    <input
                      type="checkbox"
                      id="biz-all"
                      checked={selectedBizIds.size === bizGroups.length && bizGroups.length > 0}
                      onChange={toggleAllBiz}
                      className="h-4 w-4 rounded border-zinc-300 accent-accent"
                    />
                    <label htmlFor="biz-all" className="text-sm font-medium text-zinc-600 cursor-pointer">
                      すべて選択
                    </label>
                  </div>
                  {bizGroups.map((group) => (
                    <div
                      key={group.businessId}
                      className={[
                        "rounded-xl border p-4 transition-colors",
                        selectedBizIds.has(group.businessId) ? "border-accent/30 bg-red-50/40" : "border-zinc-200 bg-white",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id={`biz-${group.businessId}`}
                          checked={selectedBizIds.has(group.businessId)}
                          onChange={() => toggleBiz(group.businessId)}
                          className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-accent"
                        />
                        <div className="flex-1 min-w-0">
                          <label htmlFor={`biz-${group.businessId}`} className="flex items-center justify-between cursor-pointer">
                            <span className="font-semibold text-zinc-900">{group.businessName}</span>
                            <span className="text-sm font-medium text-zinc-700">{formatYen(group.subtotal)}</span>
                          </label>
                          <div className="mt-2 space-y-1">
                            {group.items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between text-xs text-zinc-500">
                                <span>{item.description}</span>
                                <span>{formatYen(item.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-1.5">
                  <label className="text-sm font-medium">
                    請求書番号
                    <span className="ml-2 text-xs font-normal text-zinc-400">（空欄で自動採番）</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      placeholder={invoiceNumberForMonth(month)}
                      className="h-9 w-72 rounded-lg border border-zinc-200 bg-white px-3 font-mono text-sm placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    {invoiceNo.trim() && (
                      <button onClick={() => setInvoiceNo("")} className="text-xs text-zinc-400 hover:text-zinc-600">
                        リセット
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-zinc-50 px-5 py-4">
                  <div className="space-y-0.5 text-sm">
                    <div className="text-zinc-500">
                      {selectedBizIds.size}事業部 / {selectedGroups.reduce((n, g) => n + g.items.length, 0)}件選択
                    </div>
                    <div className="text-lg font-semibold text-zinc-900">
                      {formatYen(subtotal + tax)}
                      <span className="ml-1 text-xs font-normal text-zinc-500">（税込）</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={selectedBizIds.size === 0}
                      onClick={handleMarkConsolidated}
                      className={[
                        "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                        selectedBizIds.size === 0
                          ? "pointer-events-none bg-zinc-100 text-zinc-400"
                          : "bg-violet-600 text-white hover:bg-violet-700",
                      ].join(" ")}
                    >
                      統合済みにする
                    </button>
                    <Link
                      href={previewHref}
                      className={[
                        "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                        selectedBizIds.size === 0
                          ? "pointer-events-none bg-zinc-100 text-zinc-400"
                          : "bg-accent text-white hover:bg-[#b91c1c]",
                      ].join(" ")}
                    >
                      <FileText className="h-4 w-4" />
                      請求書プレビュー
                    </Link>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── 請求一覧 ─────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Billing</p>
          <h1 className="mt-1 text-xl font-semibold text-zinc-900">請求一覧</h1>
        </div>
        <Button variant="outline">
          <Upload className="h-4 w-4" />
          CSV出力
        </Button>
      </div>

      {/* KPI カード（ステータス別・クリックでフィルター） */}
      <div className="grid gap-3 md:grid-cols-3">
        {(["uninvoiced", "consolidated", "invoiced"] as SaleStatus[]).map((st) => {
          const s = STATUS_STYLE[st];
          const amount = kpi[st];
          const count = kpi[`${st}Count` as keyof typeof kpi];
          const active = statusFilter === st;
          return (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(active ? "all" : st)}
              className={`rounded-2xl border bg-white p-4 text-left shadow-card transition-all ${
                active ? "ring-2 ring-accent ring-offset-1" : "hover:shadow-md"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-block h-2 w-2 rounded-full ${s.dot}`} />
                <span className={`text-xs font-medium ${active ? "text-accent" : "text-zinc-500"}`}>
                  {statusLabels[st]}
                </span>
                {active && <span className="ml-auto text-[10px] font-medium text-accent">選択中</span>}
              </div>
              <p className="text-xl font-bold text-zinc-900 tracking-tight">{formatYen(amount)}</p>
              <p className="mt-0.5 text-xs text-zinc-400">{count}件</p>
            </button>
          );
        })}
      </div>

      {/* フィルターバー + テーブル */}
      <Card className="rounded-2xl shadow-card bg-white">
        <CardHeader className="px-6 pt-5 pb-0">
          <div className="flex flex-wrap items-center gap-6">
            {/* 期間 */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-zinc-400 shrink-0" />
              <span className="text-xs font-medium text-zinc-400 whitespace-nowrap">期間</span>
              <div className="flex flex-wrap gap-1.5 ml-1">
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
            {/* ステータス */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-400 whitespace-nowrap">ステータス</span>
              <div className="flex gap-1.5">
                {STATUS_FILTERS.map((item) => {
                  const s = item.id !== "all" ? STATUS_STYLE[item.id] : null;
                  const active = statusFilter === item.id;
                  return (
                    <button key={item.id} type="button" onClick={() => setStatusFilter(item.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        active && s ? `${s.bg} ${s.text}` : active ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}>
                      {s && active && <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />}
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-4">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-100 hover:bg-transparent">
                <TableHead className="pl-5 text-xs font-medium text-zinc-400">請求番号</TableHead>
                <TableHead className="text-xs font-medium text-zinc-400">顧客</TableHead>
                <TableHead className="text-xs font-medium text-zinc-400">件名</TableHead>
                <TableHead className="text-xs font-medium text-zinc-400">請求日</TableHead>
                <TableHead className="text-xs font-medium text-zinc-400 text-right">金額（税込）</TableHead>
                <TableHead className="text-xs font-medium text-zinc-400">発行者</TableHead>
                <TableHead className="text-xs font-medium text-zinc-400">ステータス</TableHead>
                <TableHead className="pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-sm text-zinc-400">
                    該当する請求データがありません
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((row) => {
                const st = rowStatus(row);
                const s = STATUS_STYLE[st];
                const total = row.subtotal + Math.round(row.subtotal * 0.1);
                const subject =
                  row.bizNames.length === 1
                    ? row.bizNames[0]
                    : `${row.bizNames[0]} 他${row.bizNames.length - 1}件`;
                const isExpanded = expandedRows.has(row.id);
                const rowSales = sales.filter((s) => row.bizIds.some(() => true) && s.customerId === row.customerId && s.month === row.month && row.bizIds.includes(s.businessId));
                return (
                  <React.Fragment key={row.id}>
                    <TableRow className="border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                      <TableCell className="pl-5 font-mono text-xs text-zinc-500">
                        {invoiceNumberForMonth(row.month)}
                      </TableCell>
                      <TableCell className="font-medium text-zinc-800">{row.customerName}</TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => toggleExpand(row.id)}
                          className="flex items-center gap-1.5 text-left hover:text-accent transition-colors"
                        >
                          {isExpanded
                            ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                            : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" />}
                          <div>
                            <div className="text-sm text-zinc-700">{subject}</div>
                            <div className="text-xs text-zinc-400">{row.itemCount}件</div>
                          </div>
                        </button>
                      </TableCell>
                      <TableCell className="text-sm text-zinc-500 tabular-nums">{invoiceDateLabel(row.month)}</TableCell>
                      <TableCell className="text-right font-semibold text-zinc-900 tabular-nums">
                        {formatYen(total)}
                      </TableCell>
                      <TableCell className="text-sm text-zinc-500">{row.issuer}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.text} ${s.border}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                          {statusLabels[st]}
                        </span>
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <button
                          onClick={() => handleOpenCustomer(row.customerId, row.month)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
                        >
                          統合 <ArrowRight className="h-3 w-3" />
                        </button>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${row.id}-detail`} className="bg-zinc-50/60 border-zinc-100">
                        <TableCell colSpan={8} className="px-8 py-3">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-zinc-400 border-b border-zinc-200">
                                <th className="pb-1.5 text-left font-medium">事業部</th>
                                <th className="pb-1.5 text-left font-medium">内容</th>
                                <th className="pb-1.5 text-right font-medium">数量</th>
                                <th className="pb-1.5 text-right font-medium">単価</th>
                                <th className="pb-1.5 text-right font-medium">金額</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                              {rowSales.map((sale) => {
                                const biz = demoBusinesses.find((b) => b.id === sale.businessId);
                                const bc = BIZ_COLOR[sale.businessId];
                                const sc = STATUS_STYLE[sale.status];
                                return (
                                  <tr key={sale.id} className="text-zinc-600">
                                    <td className="py-1.5 pr-3">
                                      <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${bc.bg} ${bc.text}`}>
                                        <span className={`h-1 w-1 rounded-full ${bc.dot}`} />
                                        {biz?.name}
                                      </span>
                                    </td>
                                    <td className="py-1.5 pr-3">{sale.description}</td>
                                    <td className="py-1.5 pr-3 text-right tabular-nums">{sale.qty ?? 1}</td>
                                    <td className="py-1.5 pr-3 text-right tabular-nums">{formatYen(sale.unitPrice ?? Math.round(sale.amount / (sale.qty ?? 1)))}</td>
                                    <td className="py-1.5 pr-3 text-right font-medium tabular-nums">{formatYen(sale.amount)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t border-zinc-50 px-5 py-3">
            <span className="text-xs text-zinc-400">{filtered.length}件表示</span>
            <span className="text-xs font-semibold text-zinc-700">
              合計 {formatYen(filtered.reduce((n, r) => n + r.subtotal + Math.round(r.subtotal * 0.1), 0))}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
