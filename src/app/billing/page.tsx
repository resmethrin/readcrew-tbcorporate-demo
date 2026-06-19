"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  demoCustomers,
  formatYen,
  getBusinessName,
  groupSalesByBusiness,
  invoiceNumberForMonth,
  formatMonth,
  monthToLabel,
  statusLabels,
} from "@/lib/demo-data";
import { useSalesStore } from "@/store/useSalesStore";
import type { SaleStatus } from "@/types";

const STATUS_STYLE: Record<SaleStatus, string> = {
  uninvoiced: "bg-amber-50 text-amber-700 border-amber-200",
  invoiced: "bg-sky-50 text-sky-700 border-sky-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

// 顧客の代表ステータス（未請求 > 請求済 > 入金済 の優先順）
function dominantStatus(counts: Record<SaleStatus, number>): SaleStatus {
  if (counts.uninvoiced > 0) return "uninvoiced";
  if (counts.invoiced > 0) return "invoiced";
  return "paid";
}

export default function BillingPage() {
  const sales = useSalesStore((s) => s.sales);

  // 選択中の顧客・月（統合画面）
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [month, setMonth] = useState("2026-06");
  const [selectedBizIds, setSelectedBizIds] = useState<Set<string>>(new Set());
  const [invoiceNo, setInvoiceNo] = useState("");

  // 顧客ごとのステータス集計
  const customerStats = useMemo(() => {
    const map = new Map<string, { uninvoiced: number; invoiced: number; paid: number; total: number }>();
    for (const sale of sales) {
      const s = map.get(sale.customerId) ?? { uninvoiced: 0, invoiced: 0, paid: 0, total: 0 };
      s[sale.status] += 1;
      s.total += sale.amount;
      map.set(sale.customerId, s);
    }
    return map;
  }, [sales]);

  // 選択顧客 × 選択月の事業部グループ
  const bizGroups = useMemo(() => {
    if (!selectedCustomerId) return [];
    return groupSalesByBusiness(
      sales.filter((s) => s.customerId === selectedCustomerId && s.month === month),
    );
  }, [sales, selectedCustomerId, month]);

  const toggleBiz = (bizId: string) => {
    setSelectedBizIds((prev) => {
      const next = new Set(prev);
      next.has(bizId) ? next.delete(bizId) : next.add(bizId);
      return next;
    });
  };

  const toggleAllBiz = () => {
    if (selectedBizIds.size === bizGroups.length) {
      setSelectedBizIds(new Set());
    } else {
      setSelectedBizIds(new Set(bizGroups.map((g) => g.businessId)));
    }
  };

  const handleOpenCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setSelectedBizIds(new Set());
    setInvoiceNo("");
  };

  const handleBack = () => {
    setSelectedCustomerId(null);
    setSelectedBizIds(new Set());
    setInvoiceNo("");
  };

  const selectedGroups = bizGroups.filter((g) => selectedBizIds.has(g.businessId));
  const subtotal = selectedGroups.reduce((sum, g) => sum + g.subtotal, 0);
  const tax = Math.round(subtotal * 0.1);

  const resolvedInvoiceNo = invoiceNo.trim() || invoiceNumberForMonth(month);
  const bizIdsParam = Array.from(selectedBizIds).join(",");
  const previewHref =
    `/billing/${selectedCustomerId}-${month}/preview` +
    `?invoiceNo=${encodeURIComponent(resolvedInvoiceNo)}` +
    (selectedBizIds.size < bizGroups.length ? `&bizIds=${encodeURIComponent(bizIdsParam)}` : "");

  const selectedCustomer = demoCustomers.find((c) => c.id === selectedCustomerId);

  // ── 統合画面（事業部選択）────────────────────────────
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
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              {selectedCustomer?.name}
            </h1>
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
              onChange={(e) => {
                setMonth(e.target.value);
                setSelectedBizIds(new Set());
              }}
              className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {["2026-06", "2026-05", "2026-04"].map((v) => (
                <option key={v} value={v}>
                  {formatMonth(v)}
                </option>
              ))}
            </select>
          </CardHeader>
          <CardContent className="space-y-5">
            {bizGroups.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-400">
                {monthToLabel(month)} の売上データがありません
              </p>
            ) : (
              <>
                {/* 事業部チェックボックス一覧 */}
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
                        selectedBizIds.has(group.businessId)
                          ? "border-accent/30 bg-red-50/40"
                          : "border-zinc-200 bg-white",
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
                          <label
                            htmlFor={`biz-${group.businessId}`}
                            className="flex items-center justify-between cursor-pointer"
                          >
                            <span className="font-semibold text-zinc-900">{group.businessName}</span>
                            <span className="text-sm font-medium text-zinc-700">
                              {formatYen(group.subtotal)}
                            </span>
                          </label>
                          <div className="mt-2 space-y-1">
                            {group.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between text-xs text-zinc-500"
                              >
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

                {/* 請求書番号 */}
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
                      <button
                        onClick={() => setInvoiceNo("")}
                        className="text-xs text-zinc-400 hover:text-zinc-600"
                      >
                        リセット
                      </button>
                    )}
                  </div>
                </div>

                {/* 合計 + プレビュー */}
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── 請求一覧 ────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-zinc-500">Billing</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">請求一覧</h1>
        </div>
        <Button variant="outline">
          <Upload className="h-4 w-4" />
          CSV出力
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs font-medium text-zinc-500">
                <th className="px-5 py-3 text-left">顧客</th>
                <th className="px-4 py-3 text-center">ステータス</th>
                <th className="px-4 py-3 text-right">未請求</th>
                <th className="px-4 py-3 text-right">請求済</th>
                <th className="px-4 py-3 text-right">入金済</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {demoCustomers.map((customer) => {
                const stats = customerStats.get(customer.id) ?? {
                  uninvoiced: 0,
                  invoiced: 0,
                  paid: 0,
                  total: 0,
                };
                const status = dominantStatus(stats);
                const hasData = stats.uninvoiced + stats.invoiced + stats.paid > 0;
                return (
                  <tr
                    key={customer.id}
                    className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium text-zinc-900">{customer.name}</div>
                      <div className="text-xs text-zinc-400">{customer.contact}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {hasData ? (
                        <Badge
                          className={[
                            "border text-xs font-medium",
                            STATUS_STYLE[status],
                          ].join(" ")}
                        >
                          {statusLabels[status]}
                        </Badge>
                      ) : (
                        <span className="text-xs text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {stats.uninvoiced > 0 ? (
                        <span className="font-medium text-amber-700">{stats.uninvoiced}件</span>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {stats.invoiced > 0 ? (
                        <span className="font-medium text-sky-700">{stats.invoiced}件</span>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {stats.paid > 0 ? (
                        <span className="font-medium text-emerald-700">{stats.paid}件</span>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => handleOpenCustomer(customer.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                      >
                        請求統合
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
