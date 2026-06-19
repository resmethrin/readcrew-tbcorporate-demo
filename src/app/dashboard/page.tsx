"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  ChevronRight,
  FileText,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSalesStore } from "@/store/useSalesStore";
import { demoBusinesses, formatYen, formatMonth } from "@/lib/demo-data";

const MONTHLY_TARGET = 21_000_000;
const FORECAST = 16_500_000;

const trendData = [
  { month: "12月", 実績: 9_200_000 },
  { month: "1月",  実績: 11_800_000 },
  { month: "2月",  実績: 10_500_000 },
  { month: "3月",  実績: 13_200_000 },
  { month: "4月",  実績: 12_100_000 },
  { month: "5月",  実績: 14_800_000, 見込み: 14_800_000 },
  { month: "6月",  実績: null,        見込み: 16_500_000 },
  { month: "7月",  実績: null,        見込み: 17_200_000 },
];

const actionItems = [
  { type: "overdue",  label: "株式会社ニシカワ — 電気設備点検",  amount: 150_000, note: "支払期日 6/15 超過（4日）" },
  { type: "overdue",  label: "山田商事 — 定期メンテナンス",       amount: 60_000,  note: "支払期日 6/16 超過（3日）" },
  { type: "deadline", label: "未請求 5件 — 6月末締め切り",        amount: null,    note: "今月末までに請求書を発行してください" },
  { type: "forecast", label: "来月見込み受注 — 改修工事",         amount: 890_000, note: "契約確定待ち（工事関連事業）" },
];

const bizAccent: Record<string, string> = {
  b001: "rgb(0 113 227)",
  b002: "#2563EB",
  b003: "#EA580C",
};

export default function DashboardPage() {
  const sales = useSalesStore((s) => s.sales);

  const [monthFilter, setMonthFilter] = useState("all");
  const availableMonths = useMemo(() => {
    const set = new Set(sales.map((s) => s.month));
    return Array.from(set).sort().reverse();
  }, [sales]);

  const filteredSales = monthFilter === "all" ? sales : sales.filter((s) => s.month === monthFilter);

  const paidTotal      = filteredSales.filter((s) => s.status === "paid").reduce((n, s) => n + s.amount, 0);
  const invoicedTotal  = filteredSales.filter((s) => s.status === "invoiced").reduce((n, s) => n + s.amount, 0);
  const uninvoicedTotal = filteredSales.filter((s) => s.status === "uninvoiced").reduce((n, s) => n + s.amount, 0);
  const achieveRate    = Math.round((FORECAST / MONTHLY_TARGET) * 100);

  const bizStats = demoBusinesses.map((b) => {
    const bSales     = filteredSales.filter((s) => s.businessId === b.id);
    const paid       = bSales.filter((s) => s.status === "paid").reduce((n, s) => n + s.amount, 0);
    const invoiced   = bSales.filter((s) => s.status === "invoiced").reduce((n, s) => n + s.amount, 0);
    const uninvoiced = bSales.filter((s) => s.status === "uninvoiced").reduce((n, s) => n + s.amount, 0);
    const total      = paid + invoiced + uninvoiced;
    return { ...b, paid, invoiced, uninvoiced, total, alert: uninvoiced > total * 0.4 };
  });

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Dashboard</p>
          <h1 className="mt-1 text-xl font-semibold text-zinc-900">経営サマリ</h1>
        </div>
        <p className="text-sm text-zinc-400">{monthFilter === "all" ? "全期間" : formatMonth(monthFilter)}</p>
      </div>

      {/* 期間フィルター */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-white px-4 py-3 shadow-card">
        <Calendar className="h-4 w-4 text-zinc-400 shrink-0" />
        <span className="text-xs font-medium text-zinc-400 whitespace-nowrap">期間</span>
        <div className="flex flex-wrap gap-1.5">
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
              onClick={() => setMonthFilter(m)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                monthFilter === m ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >{formatMonth(m)}</button>
          ))}
        </div>
      </div>

      {/* 3カラム KPI */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* 今月着地予測 */}
        <Card className="rounded-2xl shadow-card bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-zinc-500">今月着地予測</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                <ArrowUpRight className="h-3 w-3" />+11.5%
              </span>
            </div>
            <p className="text-4xl font-bold tracking-tight text-zinc-950 leading-none">
              ¥16,500,000
            </p>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>達成率 {achieveRate}%</span>
                <span>目標 ¥21M</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
                <div className="h-full rounded-full bg-[#0071e3]" style={{ width: `${achieveRate}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 確定売上 */}
        <Card className="rounded-2xl shadow-card bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-zinc-500">確定売上（入金済）</p>
              <div className="rounded-lg bg-[#EFF6FF] p-1.5">
                <TrendingUp className="h-4 w-4 text-[#0071e3]" />
              </div>
            </div>
            <p className="text-4xl font-bold tracking-tight text-zinc-950 leading-none">
              {formatYen(paidTotal)}
            </p>
            <p className="mt-4 text-xs text-zinc-400">
              {filteredSales.filter((s) => s.status === "paid").length}件 確定済
            </p>
          </CardContent>
        </Card>

        {/* 売掛残高 */}
        <Card className="rounded-2xl shadow-card bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-zinc-500">売掛残高</p>
              <div className="rounded-lg bg-amber-50 p-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
            </div>
            <p className="text-4xl font-bold tracking-tight text-zinc-950 leading-none">
              {formatYen(invoicedTotal + uninvoicedTotal)}
            </p>
            <div className="mt-4 flex gap-3 text-xs">
              <span className="text-amber-600">未請求 {formatYen(uninvoicedTotal)}</span>
              <span className="text-zinc-400">請求済 {formatYen(invoicedTotal)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 売上トレンド */}
      <Card className="rounded-2xl shadow-card bg-white">
        <CardHeader className="pb-0 px-7 pt-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-zinc-700">売上推移</CardTitle>
            <div className="flex items-center gap-5 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-[#0071e3]" />実績
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full border-2 border-[#0071e3] bg-white" />見込み
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-2">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="rgb(0 113 227)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="rgb(0 113 227)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="rgb(0 113 227)" stopOpacity={0.08} />
                    <stop offset="95%" stopColor="rgb(0 113 227)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} tick={{ fill: "#a1a1aa" }} />
                <YAxis
                  tickFormatter={(v) => `${v / 1_000_000}M`}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tick={{ fill: "#a1a1aa" }}
                  width={38}
                />
                <ReferenceLine
                  y={MONTHLY_TARGET}
                  stroke="rgb(0 113 227)"
                  strokeDasharray="5 5"
                  strokeOpacity={0.5}
                  label={{ value: "目標", position: "right", fontSize: 11, fill: "rgb(0 113 227)" }}
                />
                <Tooltip
                  formatter={(v: number) => formatYen(v)}
                  contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 13 }}
                  labelStyle={{ fontWeight: 600, color: "#18181b" }}
                />
                <Area
                  dataKey="実績"
                  stroke="rgb(0 113 227)"
                  strokeWidth={2.5}
                  fill="url(#gradActual)"
                  dot={{ r: 4, fill: "rgb(0 113 227)", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                />
                <Area
                  dataKey="見込み"
                  stroke="rgb(0 113 227)"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  fill="url(#gradForecast)"
                  dot={{ r: 4, fill: "#fff", stroke: "rgb(0 113 227)", strokeWidth: 2 }}
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 事業部別 */}
      <Card className="rounded-2xl shadow-card bg-white">
        <CardHeader className="px-7 pt-6 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-zinc-700">事業部別 売上状況</CardTitle>
            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-[#0071e3]" />入金済</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-blue-400" />請求済</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-amber-400" />未請求</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-7 pb-6 space-y-5">
          {bizStats.map((b) => {
            const accent = bizAccent[b.id];
            const paidPct = b.total > 0 ? (b.paid / b.total) * 100 : 0;
            const invPct  = b.total > 0 ? (b.invoiced / b.total) * 100 : 0;
            const uninvPct = b.total > 0 ? (b.uninvoiced / b.total) * 100 : 0;
            return (
              <div key={b.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />
                    <span className="text-sm font-medium text-zinc-700">{b.name}</span>
                    {b.alert && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 flex items-center gap-1">
                        <AlertTriangle className="h-2.5 w-2.5" />要対応
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-zinc-400 text-xs">未請求 <span className="font-semibold text-amber-600">{formatYen(b.uninvoiced)}</span></span>
                    <span className="text-zinc-400 text-xs">未入金 <span className="font-semibold text-blue-600">{formatYen(b.invoiced)}</span></span>
                    <span className="font-bold text-zinc-900">{formatYen(b.total)}</span>
                  </div>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div className="flex h-full">
                    <div className="bg-[#0071e3] transition-all" style={{ width: `${paidPct}%`, opacity: b.id === "b001" ? 1 : b.id === "b002" ? 0.9 : 0.8 }} />
                    <div className="bg-blue-400 transition-all"  style={{ width: `${invPct}%` }} />
                    <div className="bg-amber-400 transition-all" style={{ width: `${uninvPct}%` }} />
                  </div>
                </div>
                <div className="mt-1 flex gap-4 text-xs text-zinc-400">
                  <span>入金済 {Math.round(paidPct)}%</span>
                  <span>請求済 {Math.round(invPct)}%</span>
                  <span>未請求 {Math.round(uninvPct)}%</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 今週のアクション */}
      <Card className="rounded-2xl shadow-card bg-white">
        <CardHeader className="px-7 pt-6 pb-3">
          <CardTitle className="text-sm font-semibold text-zinc-700">今週のアクション</CardTitle>
        </CardHeader>
        <CardContent className="px-7 pb-4 divide-y divide-zinc-50">
          {actionItems.map((item, i) => (
            <div key={i} className="flex items-center gap-4 py-3.5">
              <div className={`shrink-0 rounded-xl p-2 ${
                item.type === "overdue"  ? "bg-red-50"    :
                item.type === "deadline" ? "bg-amber-50"  : "bg-zinc-100"
              }`}>
                {item.type === "overdue"  && <AlertTriangle className="h-4 w-4 text-red-500" />}
                {item.type === "deadline" && <FileText      className="h-4 w-4 text-amber-500" />}
                {item.type === "forecast" && <TrendingUp    className="h-4 w-4 text-zinc-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-800 truncate">{item.label}</p>
                <p className={`text-xs mt-0.5 ${item.type === "overdue" ? "text-red-500" : "text-zinc-400"}`}>
                  {item.note}
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-3">
                {item.amount != null && (
                  <span className={`text-sm font-bold ${item.type === "overdue" ? "text-red-600" : "text-zinc-700"}`}>
                    {formatYen(item.amount)}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-zinc-200" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
