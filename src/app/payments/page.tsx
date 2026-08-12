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
import {
  demoBusinesses,
  dueDateLabel,
  formatMonth,
  formatYen,
  getCustomerName,
  invoiceDateLabel,
  invoiceNumberForMonth,
  statusLabels,
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

const STATUS_STYLE: Record<"invoiced" | "paid", { bg: string; text: string; dot: string; border: string }> = {
  invoiced: { bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-500",     border: "border-sky-200" },
  paid:     { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
};

export default function PaymentsPage() {
  const sales = useSalesStore((s) => s.sales);
  const markPaidByIds = useSalesStore((s) => s.markPaidByIds);
  const partialPayments = useSalesStore((s) => s.partialPayments);
  const recordPartialPayment = useSalesStore((s) => s.recordPartialPayment);

  const [monthFilter, setMonthFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "invoiced" | "paid">("all");
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

  const paymentRowStatus = (row: { invoiced: number; paid: number }): "invoiced" | "paid" =>
    row.invoiced > 0 ? "invoiced" : "paid";

  const paymentRows = useMemo(() => {
    return invoiceRows.filter((row) => {
      if (row.invoiced === 0 && row.paid === 0) return false;
      if (monthFilter !== "all" && row.month !== monthFilter) return false;
      const st = paymentRowStatus(row);
      if (statusFilter !== "all" && st !== statusFilter) return false;
      return true;
    });
  }, [invoiceRows, monthFilter, statusFilter]);

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
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === "invoiced" ? "all" : "invoiced")}
          className={`rounded-2xl border bg-white p-4 text-left shadow-card transition-all ${statusFilter === "invoiced" ? "ring-2 ring-sky-500 ring-offset-1" : "hover:shadow-md"}`}
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
          className={`rounded-2xl border bg-white p-4 text-left shadow-card transition-all ${statusFilter === "paid" ? "ring-2 ring-emerald-500 ring-offset-1" : "hover:shadow-md"}`}
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
                <TableHead className="text-xs font-medium text-zinc-400 text-right">金額（税込）</TableHead>
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
                const st = paymentRowStatus(row);
                const rowStyle = STATUS_STYLE[st];
                const total = row.subtotal + Math.round(row.subtotal * 0.1);
                const subject = row.bizNames.length === 1
                  ? row.bizNames[0]
                  : `${row.bizNames[0]} 他${row.bizNames.length - 1}件`;
                const isSelectable = st === "invoiced";
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
                        <div className="text-xs text-zinc-400 tabular-nums mt-0.5">{dueDateLabel(row.month)}</div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-zinc-900 tabular-nums">
                        {formatYen(total)}
                      </TableCell>
                      <TableCell className="text-sm text-zinc-500">{row.confirmer}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${rowStyle.bg} ${rowStyle.text} ${rowStyle.border}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${rowStyle.dot}`} />
                          {statusLabels[st]}
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
                                <th className="pb-1.5 text-left font-medium">事業部</th>
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
              合計 {formatYen(paymentRows.reduce((n, r) => n + r.subtotal + Math.round(r.subtotal * 0.1), 0))}
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
