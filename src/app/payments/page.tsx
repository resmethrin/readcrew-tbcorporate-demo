"use client";

import React, { useMemo, useState } from "react";
import { Calendar, ChevronDown, ChevronRight, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomerTermBadge } from "@/components/CustomerTermBadge";
import {
  demoBusinesses,
  dueDateInfo,
  formatMonth,
  formatYen,
  getCustomerName,
  invoiceDateLabel,
  invoiceNumberForMonth,
  isPastDue,
  PERIOD_MONTHS,
} from "@/lib/demo-data";
import { useSalesStore } from "@/store/useSalesStore";
import type { SaleStatus } from "@/types";

const BIZ_COLOR: Record<string, { dot: string; bg: string; text: string }> = {
  b001: { dot: "bg-[#0071e3]",   bg: "bg-blue-50",    text: "text-blue-700" },
  b002: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
  b003: { dot: "bg-orange-500",  bg: "bg-orange-50",  text: "text-orange-700" },
  b004: { dot: "bg-violet-500",  bg: "bg-violet-50",  text: "text-violet-700" },
  b005: { dot: "bg-slate-500",   bg: "bg-slate-50",   text: "text-slate-700" },
};

type BillingStatus = "awaiting" | "partial" | "paid";

const STATUS_STYLE: Record<BillingStatus | "overdue", { label: string; bg: string; text: string; dot: string; border: string }> = {
  awaiting: { label: "入金待ち",  bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-500",     border: "border-sky-200" },
  partial:  { label: "一部入金",  bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500",   border: "border-amber-200" },
  paid:     { label: "入金済",    bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
  overdue:  { label: "期限超過",  bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500",     border: "border-red-200" },
};

const withTax = (amount: number) => amount + Math.round(amount * 0.1);

export default function PaymentsPage() {
  const sales = useSalesStore((s) => s.sales);
  const markPaidByIds = useSalesStore((s) => s.markPaidByIds);
  const partialPayments = useSalesStore((s) => s.partialPayments);
  const recordPartialPayment = useSalesStore((s) => s.recordPartialPayment);

  const [monthFilter, setMonthFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "overdue" | BillingStatus>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string) =>
    setExpandedRows((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const [reconcileTarget, setReconcileTarget] = useState<{ id: string; description: string; remaining: number } | null>(null);
  const [reconcileAmount, setReconcileAmount] = useState("");
  const [reconcileError, setReconcileError] = useState<string | null>(null);

  const openReconcile = (saleId: string, description: string, remaining: number) => {
    setReconcileTarget({ id: saleId, description, remaining });
    setReconcileAmount(String(remaining));
    setReconcileError(null);
  };

  const submitReconcile = () => {
    if (!reconcileTarget) return;
    const amount = Number(reconcileAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setReconcileError("入金額を正しく入力してください");
      return;
    }
    if (amount > reconcileTarget.remaining) {
      setReconcileError(`残額（${formatYen(reconcileTarget.remaining)}）を超える金額は入力できません`);
      return;
    }
    recordPartialPayment(reconcileTarget.id, amount);
    setReconcileTarget(null);
  };

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
      confirmer: string;
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
        confirmer: sale.assignee ?? "—",
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

  // 請求済み以降の行に、請求額・入金済み額・未入金額の3数字と期日超過判定を付ける
  const billingRows = useMemo(() => {
    return invoiceRows
      .filter((row) => row.invoiced > 0 || row.paid > 0)
      .map((row) => {
        const rowSales = sales.filter(
          (sale) =>
            sale.customerId === row.customerId &&
            sale.month === row.month &&
            row.bizIds.includes(sale.businessId) &&
            (sale.status === "invoiced" || sale.status === "paid"),
        );
        // 税抜で集計してから税込に直す（消込の記録は伝票の税抜金額基準）
        const billedNet = rowSales.reduce((n, sale) => n + sale.amount, 0);
        const paidNet = rowSales.reduce(
          (n, sale) => n + (sale.status === "paid" ? sale.amount : partialPayments[sale.id] ?? 0),
          0,
        );
        const billed = withTax(billedNet);
        const paid = withTax(paidNet);
        const unpaid = Math.max(0, billed - paid);

        const status: BillingStatus =
          unpaid === 0 ? "paid" : paid > 0 ? "partial" : "awaiting";
        const overdue = unpaid > 0 && isPastDue(row.customerId, row.month);

        return { ...row, billed, paidAmount: paid, unpaid, status, overdue };
      });
  }, [invoiceRows, partialPayments, sales]);

  const counts = useMemo(
    () => ({
      all: billingRows.length,
      overdue: billingRows.filter((r) => r.overdue).length,
      partial: billingRows.filter((r) => r.status === "partial").length,
      awaiting: billingRows.filter((r) => r.status === "awaiting").length,
      paid: billingRows.filter((r) => r.status === "paid").length,
    }),
    [billingRows],
  );

  const paymentRows = useMemo(
    () =>
      billingRows.filter((row) => {
        if (monthFilter !== "all" && row.month !== monthFilter) return false;
        if (statusFilter === "all") return true;
        if (statusFilter === "overdue") return row.overdue;
        return row.status === statusFilter;
      }),
    [billingRows, monthFilter, statusFilter],
  );

  const billedTotal = billingRows.reduce((n, r) => n + r.billed, 0);
  const paidTotal   = billingRows.reduce((n, r) => n + r.paidAmount, 0);
  const unpaidTotal = billingRows.reduce((n, r) => n + r.unpaid, 0);
  const overdueTotal = billingRows.filter((r) => r.overdue).reduce((n, r) => n + r.unpaid, 0);

  const invoicedRows = useMemo(() => paymentRows.filter((r) => r.status !== "paid"), [paymentRows]);

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
          <h1 className="mt-1 text-xl font-semibold text-zinc-900">入金管理〈回収消込〉</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4" />
            CSV出力
          </Button>
        </div>
      </div>

      <Tabs defaultValue="voucher">
        <TabsList variant="line">
          <TabsTrigger value="voucher">伝票基準</TabsTrigger>
          <TabsTrigger value="payment">入金基準</TabsTrigger>
        </TabsList>

        <TabsContent value="payment" className="pt-4">
          <Card className="rounded-2xl shadow-card bg-white">
            <CardHeader className="px-6 pt-5 pb-2">
              <p className="text-sm font-semibold text-zinc-700">入金記録一覧</p>
              <p className="text-xs text-zinc-400">伝票（売上）単位で記録された入金を時系列でなく金額基準に一覧表示</p>
            </CardHeader>
            <CardContent className="px-0 pb-4 pt-2">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-100 hover:bg-transparent">
                    <TableHead className="pl-5 text-xs font-medium text-zinc-400">伝票ID</TableHead>
                    <TableHead className="text-xs font-medium text-zinc-400">得意先</TableHead>
                    <TableHead className="text-xs font-medium text-zinc-400">内容</TableHead>
                    <TableHead className="text-xs font-medium text-zinc-400 text-right">伝票金額</TableHead>
                    <TableHead className="text-xs font-medium text-zinc-400 text-right pr-5">入金累計</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.keys(partialPayments).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-sm text-zinc-400">
                        入金記録がありません
                      </TableCell>
                    </TableRow>
                  )}
                  {Object.entries(partialPayments).map(([saleId, amount]) => {
                    const sale = sales.find((s) => s.id === saleId);
                    if (!sale) return null;
                    return (
                      <TableRow key={saleId} className="border-zinc-50">
                        <TableCell className="pl-5 font-mono text-xs text-zinc-500">{saleId}</TableCell>
                        <TableCell className="text-sm text-zinc-700">{getCustomerName(sale.customerId)}</TableCell>
                        <TableCell className="text-sm text-zinc-600">{sale.description}</TableCell>
                        <TableCell className="text-right text-sm text-zinc-500 tabular-nums">{formatYen(sale.amount)}</TableCell>
                        <TableCell className="pr-5 text-right text-sm font-semibold text-emerald-700 tabular-nums">{formatYen(amount)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voucher" className="space-y-6 pt-4">

      {/* KPI */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { key: "billed",  label: "請求額",   value: billedTotal,  count: counts.all,      dot: "bg-zinc-400",    text: "text-zinc-900" },
          { key: "paid",    label: "入金済",   value: paidTotal,    count: counts.paid,     dot: "bg-emerald-500", text: "text-zinc-900" },
          { key: "unpaid",  label: "未入金",   value: unpaidTotal,  count: counts.awaiting + counts.partial, dot: "bg-sky-500", text: "text-zinc-900" },
          { key: "overdue", label: "期限超過", value: overdueTotal, count: counts.overdue,  dot: "bg-red-500",     text: "text-red-600" },
        ].map((kpi) => (
          <div key={kpi.key} className="rounded-2xl border bg-white p-4 shadow-card">
            <div className="mb-2 flex items-center gap-2">
              <span className={`inline-block h-2 w-2 rounded-full ${kpi.dot}`} />
              <span className="text-xs font-medium text-zinc-500">{kpi.label}</span>
            </div>
            <p className={`text-lg font-bold tracking-tight tabular-nums ${kpi.text}`}>{formatYen(kpi.value)}</p>
            <p className="mt-0.5 text-xs text-zinc-400">{kpi.count}件</p>
          </div>
        ))}
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
            {/* ステータス（バッジで絞り込み） */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-400 whitespace-nowrap">ステータス</span>
              <div className="flex flex-wrap gap-1.5">
                {([
                  { id: "all",      label: "全て",     count: counts.all },
                  { id: "overdue",  label: "期限超過", count: counts.overdue },
                  { id: "partial",  label: "一部入金", count: counts.partial },
                  { id: "awaiting", label: "入金待ち", count: counts.awaiting },
                  { id: "paid",     label: "入金済",   count: counts.paid },
                ] as { id: "all" | "overdue" | BillingStatus; label: string; count: number }[]).map((item) => {
                  const active = statusFilter === item.id;
                  const isOverdueBadge = item.id === "overdue";
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStatusFilter(item.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? isOverdueBadge ? "bg-red-600 text-white" : "bg-zinc-900 text-white"
                          : isOverdueBadge && item.count > 0
                            ? "bg-red-50 text-red-700 hover:bg-red-100"
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      {item.label}
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                        active ? "bg-white/20" : "bg-white/70 text-zinc-500"
                      }`}>
                        {item.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-4">
          <div className="flex items-center justify-between px-5 pb-3">
            <button
              type="button"
              onClick={handleBulkPaid}
              disabled={selected.size === 0}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                selected.size > 0
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
              }`}
            >
              まとめて入金済にする
              {selected.size > 0 && (
                <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-bold leading-none">
                  {selected.size}
                </span>
              )}
            </button>
          </div>
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
                <TableHead className="text-xs font-medium text-zinc-400">請求日 / 入金期限</TableHead>
                <TableHead className="text-xs font-medium text-zinc-400 text-right">請求額 / 入金済 / 未入金（税込）</TableHead>
                <TableHead className="text-xs font-medium text-zinc-400">確認者</TableHead>
                <TableHead className="text-xs font-medium text-zinc-400">ステータス</TableHead>
                <TableHead className="pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-sm text-zinc-400">
                    該当するデータがありません
                  </TableCell>
                </TableRow>
              )}
              {paymentRows.map((row) => {
                // 期日超過は他のステータスより優先して表示する
                const rowStyle = STATUS_STYLE[row.overdue ? "overdue" : row.status];
                const subject = row.bizNames.length === 1
                  ? row.bizNames[0]
                  : `${row.bizNames[0]} 他${row.bizNames.length - 1}件`;
                const isSelectable = row.status !== "paid";
                const isSelected = selected.has(row.id);
                const isExpanded = expandedRows.has(row.id);
                const rowSales = sales.filter((sale) =>
                  sale.customerId === row.customerId &&
                  sale.month === row.month &&
                  row.bizIds.includes(sale.businessId)
                );
                return (
                  <React.Fragment key={row.id}>
                    <TableRow
                      className={`border-zinc-50 transition-colors ${
                        isSelected ? "bg-emerald-50/40" : row.overdue ? "bg-red-50/50 hover:bg-red-50" : "hover:bg-zinc-50/50"
                      }`}
                    >
                      <TableCell className={`pl-5 ${row.overdue ? "border-l-2 border-l-red-500" : ""}`}>
                        {isSelectable ? (
                          <Checkbox checked={isSelected} onCheckedChange={() => toggleRow(row.id)} />
                        ) : (
                          <span className="inline-block h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-500">
                        {invoiceNumberForMonth(row.month)}
                      </TableCell>
                      <TableCell className="font-medium text-zinc-800">
                        <span className="inline-flex items-center gap-1.5">
                          {row.customerName}
                          <CustomerTermBadge customerId={row.customerId} />
                        </span>
                      </TableCell>
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
                      <TableCell>
                        <div className="text-xs text-zinc-500 tabular-nums">{invoiceDateLabel(row.month)}</div>
                        <div className={`mt-0.5 text-xs tabular-nums ${row.overdue ? "font-semibold text-red-600" : "text-zinc-400"}`}>
                          {dueDateInfo(row.customerId, row.month).label}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-semibold text-zinc-900 tabular-nums">{formatYen(row.billed)}</div>
                        <div className="mt-0.5 flex justify-end gap-3 text-xs tabular-nums">
                          <span className="text-zinc-400">
                            入金 <span className="font-medium text-emerald-600">{formatYen(row.paidAmount)}</span>
                          </span>
                          <span className="text-zinc-400">
                            未入金{" "}
                            <span className={`font-medium ${row.unpaid > 0 ? "text-red-600" : "text-zinc-400"}`}>
                              {formatYen(row.unpaid)}
                            </span>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-zinc-500">{row.confirmer}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${rowStyle.bg} ${rowStyle.text} ${rowStyle.border}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${rowStyle.dot}`} />
                          {rowStyle.label}
                        </span>
                      </TableCell>
                      <TableCell className="pr-5" />
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${row.id}-detail`} className="bg-zinc-50/60 border-zinc-100">
                        <TableCell colSpan={9} className="px-8 py-3">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-zinc-400 border-b border-zinc-200">
                                <th className="pb-1.5 text-left font-medium">室</th>
                                <th className="pb-1.5 text-left font-medium">内容</th>
                                <th className="pb-1.5 text-right font-medium">数量</th>
                                <th className="pb-1.5 text-right font-medium">単価</th>
                                <th className="pb-1.5 text-right font-medium">金額</th>
                                <th className="pb-1.5 text-right font-medium">伝票消込（残額）</th>
                                <th className="pb-1.5 text-right font-medium" />
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                              {rowSales.map((sale) => {
                                const biz = demoBusinesses.find((b) => b.id === sale.businessId);
                                const bc = BIZ_COLOR[sale.businessId];
                                const paidSoFar = partialPayments[sale.id] ?? 0;
                                const remaining = sale.amount - paidSoFar;
                                const isVoucherReconcilable = sale.status === "invoiced";
                                const isVoucherSettled = isVoucherReconcilable && remaining <= 0;
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
                                    <td className="py-1.5 pr-3 text-right tabular-nums">
                                      {isVoucherReconcilable ? (
                                        isVoucherSettled ? (
                                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">消込済</span>
                                        ) : (
                                          <span className="text-amber-600 font-medium">{formatYen(remaining)}</span>
                                        )
                                      ) : (
                                        <span className="text-zinc-300">—</span>
                                      )}
                                    </td>
                                    <td className="py-1.5 pl-2 text-right">
                                      {isVoucherReconcilable && !isVoucherSettled && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => openReconcile(sale.id, sale.description, remaining)}
                                        >
                                          消込
                                        </Button>
                                      )}
                                    </td>
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
            <span className="text-xs text-zinc-400">{paymentRows.length}件表示</span>
            <span className="text-xs font-semibold text-zinc-700">
              請求 {formatYen(paymentRows.reduce((n, r) => n + r.billed, 0))}
              <span className="ml-3 text-zinc-400">
                未入金 <span className="text-red-600">{formatYen(paymentRows.reduce((n, r) => n + r.unpaid, 0))}</span>
              </span>
            </span>
          </div>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!reconcileTarget} onOpenChange={(open) => !open && setReconcileTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>伝票単位で消込する</DialogTitle>
          </DialogHeader>
          {reconcileTarget && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-600">{reconcileTarget.description}</p>
              <p className="text-xs text-zinc-400">残額 {formatYen(reconcileTarget.remaining)}</p>
              <div className="space-y-1">
                <Label htmlFor="reconcile-amount">入金額</Label>
                <Input
                  id="reconcile-amount"
                  type="number"
                  value={reconcileAmount}
                  onChange={(e) => setReconcileAmount(e.target.value)}
                />
              </div>
              {reconcileError && <p className="text-xs text-red-600">{reconcileError}</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReconcileTarget(null)}>キャンセル</Button>
            <Button onClick={submitReconcile}>消込を確定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
