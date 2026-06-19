"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { demoCustomers, formatMonth, formatYen, groupSalesByBusiness, invoiceNumberForMonth, monthToLabel } from "@/lib/demo-data";
import { useSalesStore } from "@/store/useSalesStore";

const STEPS = ["絞り込み", "明細確認", "発行"] as const;

function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-0">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                  done
                    ? "bg-accent text-white"
                    : active
                      ? "border-2 border-accent bg-white text-accent"
                      : "bg-zinc-100 text-zinc-400",
                ].join(" ")}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={[
                  "text-xs font-medium",
                  active ? "text-accent" : done ? "text-zinc-600" : "text-zinc-400",
                ].join(" ")}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={["mx-3 mb-5 h-px w-16", i < current ? "bg-accent" : "bg-zinc-200"].join(" ")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default function BillingPage() {
  const sales = useSalesStore((state) => state.sales);
  const [step, setStep] = useState(0);
  const [customerId, setCustomerId] = useState(demoCustomers[0]?.id ?? "");
  const [month, setMonth] = useState("2026-06");
  const [invoiceNo, setInvoiceNo] = useState("");

  const targetSales = useMemo(
    () => sales.filter((sale) => sale.customerId === customerId && sale.month === month),
    [customerId, month, sales],
  );
  const groups = useMemo(() => groupSalesByBusiness(targetSales), [targetSales]);
  const total = groups.reduce((sum, group) => sum + group.subtotal, 0);
  const tax = Math.round(total * 0.1);
  const getQty = (sale: (typeof targetSales)[number]) => sale.qty ?? 1;
  const getUnitPrice = (sale: (typeof targetSales)[number]) => sale.unitPrice ?? Math.round(sale.amount / getQty(sale));

  const customerName = demoCustomers.find((c) => c.id === customerId)?.name ?? "";
  const resolvedInvoiceNo = invoiceNo.trim() || invoiceNumberForMonth(month);
  const previewHref = `/billing/${customerId}-${month}/preview?invoiceNo=${encodeURIComponent(resolvedInvoiceNo)}`;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-zinc-500">Billing</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">請求統合</h1>
        </div>
        <Button variant="outline">
          <Upload className="h-4 w-4" />
          CSV出力
        </Button>
      </div>

      <div className="flex justify-center">
        <StepIndicator current={step} />
      </div>

      {/* Step 0: 絞り込み */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">STEP 1 — 顧客と請求月を選択</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium">顧客</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {demoCustomers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">請求月</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {["2026-06", "2026-05", "2026-04"].map((value) => (
                    <option key={value} value={value}>
                      {formatMonth(value)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
              <span className="font-medium text-zinc-900">{customerName}</span> /{" "}
              {monthToLabel(month)} の売上{" "}
              <span className="font-semibold text-zinc-900">{targetSales.length}件</span>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(1)} disabled={targetSales.length === 0}>
                明細を確認する
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: 明細確認 */}
      {step === 1 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">STEP 2 — 明細確認</CardTitle>
            <span className="text-sm text-zinc-500">
              {customerName} / {monthToLabel(month)}
            </span>
          </CardHeader>
          <CardContent className="space-y-5">
            {groups.length === 0 ? (
              <p className="text-sm text-zinc-500">対象の売上データがありません。</p>
            ) : (
              groups.map((group) => (
                <div key={group.businessId} className="rounded-2xl border border-zinc-200 p-5">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                    <h2 className="text-base font-semibold">{group.businessName}</h2>
                    <div className="text-sm text-zinc-500">{group.items.length}件</div>
                  </div>
                  <div className="space-y-3 pt-4">
                    <div className="grid grid-cols-[1fr_80px_110px_110px] gap-3 border-b border-zinc-200 pb-2 text-xs font-medium text-zinc-500">
                      <div>内容</div>
                      <div className="text-right">数量</div>
                      <div className="text-right">単価</div>
                      <div className="text-right">金額</div>
                    </div>
                    {group.items.map((sale) => (
                      <div key={sale.id} className="grid grid-cols-[1fr_80px_110px_110px] items-center gap-3 text-sm">
                        <div>{sale.description}</div>
                        <div className="text-right">{getQty(sale)}</div>
                        <div className="text-right">{formatYen(getUnitPrice(sale))}</div>
                        <div className="text-right font-medium">{formatYen(sale.amount)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 border-t border-zinc-200 pt-3 text-right text-sm font-semibold">
                    小計: {formatYen(group.subtotal)}
                  </div>
                </div>
              ))
            )}

            <div className="space-y-1 rounded-2xl bg-zinc-50 px-5 py-4 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>小計（税抜）</span>
                <span>{formatYen(total)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>消費税（10%）</span>
                <span>{formatYen(tax)}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-semibold text-zinc-900">
                <span>合計（税込）</span>
                <span className="text-accent">{formatYen(total + tax)}</span>
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => setStep(0)}>
                戻る
              </Button>
              <Button onClick={() => setStep(2)}>
                発行手続きへ
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: 発行 */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">STEP 3 — 請求書発行</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border border-zinc-200 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1 text-sm">
                  <div className="font-medium text-zinc-500">請求先</div>
                  <div className="font-semibold text-zinc-900">{customerName}</div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="font-medium text-zinc-500">請求月</div>
                  <div className="font-semibold text-zinc-900">{monthToLabel(month)}</div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="font-medium text-zinc-500">件数</div>
                  <div className="font-semibold text-zinc-900">{targetSales.length}件</div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="font-medium text-zinc-500">請求金額（税込）</div>
                  <div className="text-lg font-semibold text-accent">{formatYen(total + tax)}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">
                請求書番号
                <span className="ml-2 text-xs font-normal text-zinc-400">（空欄の場合は自動採番）</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder={invoiceNumberForMonth(month)}
                  className="h-10 w-72 rounded-lg border border-zinc-200 bg-white px-3 font-mono text-sm placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-accent"
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
              <div className="text-xs text-zinc-500">
                発行する請求書番号: <span className="font-mono font-medium text-zinc-800">{resolvedInvoiceNo}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={previewHref}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <FileText className="h-4 w-4" />
                請求書プレビュー
              </Link>
              <Button className="bg-accent text-white hover:bg-[#b91c1c]">
                発行済にする
                <Check className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex justify-start">
              <Button variant="outline" onClick={() => setStep(1)}>
                戻る
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
