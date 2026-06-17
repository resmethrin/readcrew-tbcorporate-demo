"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  AlertCircle,
  Clock,
  FileText,
  CheckCircle,
  Loader2,
  Circle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSalesStore } from "@/store/useSalesStore";
import { demoBusinesses, formatYen } from "@/lib/demo-data";

const kpiCards = [
  {
    label: "今月売上",
    value: "¥12,480,000",
    sub: "先月比 +12.3%",
    bar: "bg-red-600",
    icon: TrendingUp,
    iconColor: "text-red-600",
    iconBg: "bg-red-50",
    span: "xl:col-span-2",
  },
  {
    label: "未請求",
    value: null,
    sub: "請求処理が必要です",
    bar: "bg-amber-500",
    icon: AlertCircle,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
    span: "",
  },
  {
    label: "未入金",
    value: null,
    sub: "回収要確認",
    bar: "bg-blue-500",
    icon: Clock,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    span: "",
  },
  {
    label: "請求書発行待ち",
    value: null,
    sub: "今月締め切り",
    bar: "bg-emerald-500",
    icon: FileText,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
    span: "",
  },
];

const closingStatus = [
  { id: "b001", label: "設備販売事業", status: "done" },
  { id: "b002", label: "保守サービス事業", status: "processing" },
  { id: "b003", label: "工事関連事業", status: "pending" },
];

export default function DashboardPage() {
  const sales = useSalesStore((state) => state.sales);

  const uninvoicedCount = sales.filter((s) => s.status === "uninvoiced").length;
  const invoicedCount = sales.filter((s) => s.status === "invoiced").length;
  const paidCount = sales.filter((s) => s.status === "paid").length;

  const dynamicValues: Record<string, string> = {
    未請求: `${uninvoicedCount}件`,
    未入金: `${paidCount}件`,
    請求書発行待ち: `${invoicedCount}件`,
  };

  const salesByBusiness = Object.fromEntries(
    demoBusinesses.map((b) => [
      b.id,
      sales.filter((s) => s.businessId === b.id).reduce((sum, s) => sum + s.amount, 0),
    ])
  );

  const chartData = demoBusinesses.map((b) => ({
    name: b.name.replace("事業", ""),
    売上: salesByBusiness[b.id],
    fill: b.id === "b001" ? "#DC2626" : b.id === "b002" ? "#16A34A" : "#EA580C",
  }));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Dashboard</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
          販売・請求統合デモ
        </h1>
      </div>

      <section className="grid gap-4 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const value = card.value ?? dynamicValues[card.label];
          return (
            <Card key={card.label} className={`overflow-hidden ${card.span}`}>
              <div className={`h-1 ${card.bar}`} />
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-zinc-500">{card.label}</p>
                    <p className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
                      {value}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">{card.sub}</p>
                  </div>
                  <div className={`rounded-lg p-2 ${card.iconBg}`}>
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {demoBusinesses.map((b) => {
          const cs = closingStatus.find((c) => c.id === b.id);
          return (
            <Card key={b.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-zinc-700">{b.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tracking-tight text-zinc-950">
                  {formatYen(salesByBusiness[b.id])}
                </div>
                <div className="mt-3 text-sm">
                  {cs?.status === "done" && (
                    <span className="inline-flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle className="h-3.5 w-3.5" />
                      締め完了
                    </span>
                  )}
                  {cs?.status === "processing" && (
                    <span className="inline-flex items-center gap-1.5 text-amber-600">
                      <Loader2 className="h-3.5 w-3.5" />
                      処理中
                    </span>
                  )}
                  {cs?.status === "pending" && (
                    <span className="inline-flex items-center gap-1.5 text-zinc-400">
                      <Circle className="h-3.5 w-3.5" />
                      未着手
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-700">事業別売上</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  tickFormatter={(v) => `${Number(v) / 10000}万`}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <Tooltip formatter={(v) => formatYen(Number(v ?? 0))} />
                <Bar dataKey="売上" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
