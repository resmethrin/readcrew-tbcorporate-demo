"use client";

import { useMemo, useState } from "react";
import { Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { demoBusinesses, demoCustomers, formatMonth, formatYen, getBusinessName, statusLabels, PERIOD_MONTHS } from "@/lib/demo-data";
import { useSalesStore } from "@/store/useSalesStore";
import type { SaleStatus } from "@/types";

const BIZ_COLOR: Record<string, { dot: string; bg: string; text: string }> = {
  b001: { dot: "bg-[#0071e3]",   bg: "bg-blue-50",   text: "text-blue-700" },
  b002: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
  b003: { dot: "bg-orange-500",  bg: "bg-orange-50",  text: "text-orange-700" },
};

const STATUS_STYLE: Record<SaleStatus, { bg: string; text: string; dot: string }> = {
  uninvoiced: { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400" },
  invoiced:   { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-[#0071e3]" },
  paid:       { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
};

export default function PaymentsPage() {
  const sales = useSalesStore((state) => state.sales);
  const markPaidByIds = useSalesStore((s) => s.markPaidByIds);

  const [monthFilter, setMonthFilter] = useState("all");
  const [bizFilter, setBizFilter] = useState("all");

  const availableMonths = PERIOD_MONTHS;

  // invoiced + paid のみ対象
  const paymentSales = useMemo(() =>
    sales.filter(s =>
      (s.status === "invoiced" || s.status === "paid") &&
      (monthFilter === "all" || s.month === monthFilter) &&
      (bizFilter === "all" || s.businessId === bizFilter)
    ),
    [sales, monthFilter, bizFilter]
  );

  const paidTotal = paymentSales.filter(s => s.status === "paid").reduce((n, s) => n + s.amount, 0);
  const invoicedTotal = paymentSales.filter(s => s.status === "invoiced").reduce((n, s) => n + s.amount, 0);

  const handleCsvExport = () => {
    const rows = paymentSales.map(s => [
      demoCustomers.find(c => c.id === s.customerId)?.name ?? s.customerId,
      getBusinessName(s.businessId),
      s.description,
      String(s.amount),
      formatMonth(s.month),
      s.status,
    ].join(",")).join("\n");
    const csv = "顧客名,事業部,内容,金額,月,ステータス\n" + rows;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "入金データ.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-zinc-500">Payments</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">入金管理</h1>
        </div>
        <Button variant="outline" onClick={handleCsvExport}>
          <Upload className="h-4 w-4" />
          CSV出力
        </Button>
      </div>

      {/* KPI */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-xs font-medium text-zinc-400">入金済</div>
          <div className="mt-1 text-2xl font-bold text-zinc-900">{formatYen(paidTotal)}</div>
          <div className="mt-0.5 text-xs text-zinc-400">{paymentSales.filter(s => s.status === "paid").length}件</div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-xs font-medium text-zinc-400">未入金（請求済）</div>
          <div className="mt-1 text-2xl font-bold text-blue-700">{formatYen(invoicedTotal)}</div>
          <div className="mt-0.5 text-xs text-zinc-400">{paymentSales.filter(s => s.status === "invoiced").length}件</div>
        </div>
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
                {availableMonths.map(m => (
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
                {demoBusinesses.map(b => {
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
          </div>
        </CardContent>
      </Card>

      {/* テーブル */}
      <Card className="rounded-2xl shadow-sm bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-100 hover:bg-transparent">
                <TableHead className="pl-5 text-xs font-medium text-zinc-400">顧客名</TableHead>
                <TableHead className="text-xs font-medium text-zinc-400">事業部</TableHead>
                <TableHead className="text-xs font-medium text-zinc-400">内容</TableHead>
                <TableHead className="text-xs font-medium text-zinc-400">月</TableHead>
                <TableHead className="text-xs font-medium text-zinc-400 text-right">金額</TableHead>
                <TableHead className="text-xs font-medium text-zinc-400">ステータス</TableHead>
                <TableHead className="pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentSales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-zinc-400">
                    該当するデータがありません
                  </TableCell>
                </TableRow>
              )}
              {paymentSales.map(sale => {
                const customer = demoCustomers.find(c => c.id === sale.customerId);
                const bc = BIZ_COLOR[sale.businessId];
                const sc = STATUS_STYLE[sale.status];
                return (
                  <TableRow key={sale.id} className="border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                    <TableCell className="pl-5 font-medium text-zinc-800">{customer?.name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${bc.bg} ${bc.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${bc.dot}`} />
                        {getBusinessName(sale.businessId)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm text-zinc-600">{sale.description}</TableCell>
                    <TableCell className="text-sm text-zinc-500 tabular-nums">{formatMonth(sale.month)}</TableCell>
                    <TableCell className="text-right font-semibold text-zinc-900 tabular-nums">{formatYen(sale.amount)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.bg} ${sc.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                        {statusLabels[sale.status]}
                      </span>
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      {sale.status === "invoiced" && (
                        <button
                          type="button"
                          onClick={() => markPaidByIds([sale.id])}
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
            <span className="text-xs text-zinc-400">{paymentSales.length}件表示</span>
            <span className="text-xs font-semibold text-zinc-700">
              合計 {formatYen(paymentSales.reduce((n, s) => n + s.amount, 0))}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
