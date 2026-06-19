"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { demoCustomers, formatMonth, formatYen, groupSalesByBusiness, monthToLabel } from "@/lib/demo-data";
import { useSalesStore } from "@/store/useSalesStore";

export default function BillingPage() {
  const sales = useSalesStore((state) => state.sales);
  const [customerId, setCustomerId] = useState(demoCustomers[0]?.id ?? "");
  const [month, setMonth] = useState("2026-06");

  const targetSales = useMemo(
    () => sales.filter((sale) => sale.customerId === customerId && sale.month === month),
    [customerId, month, sales],
  );
  const groups = useMemo(() => groupSalesByBusiness(targetSales), [targetSales]);
  const total = groups.reduce((sum, group) => sum + group.subtotal, 0);
  const getQty = (sale: (typeof targetSales)[number]) => sale.qty ?? 1;
  const getUnitPrice = (sale: (typeof targetSales)[number]) => sale.unitPrice ?? Math.round(sale.amount / getQty(sale));

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
      <Card>
        <CardHeader className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-2">
            <CardTitle className="text-base">顧客</CardTitle>
            <Select value={customerId} onValueChange={(value) => value && setCustomerId(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {demoCustomers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <CardTitle className="text-base">請求月</CardTitle>
            <Select value={month} onValueChange={(value) => value && setMonth(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["2026-06", "2026-05", "2026-04"].map((value) => (
                  <SelectItem key={value} value={value}>
                    {formatMonth(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="text-sm text-zinc-500">
            {demoCustomers.find((customer) => customer.id === customerId)?.name} / {monthToLabel(month)}
          </div>
          {groups.map((group) => (
            <div key={group.businessId} className="rounded-2xl border border-zinc-200 p-5">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                <h2 className="text-base font-semibold">{group.businessName}</h2>
                <div className="text-sm text-zinc-500">{group.items.length}件</div>
              </div>
              <div className="space-y-3 pt-4">
                <div className="grid grid-cols-[1fr_90px_120px_120px] gap-3 border-b border-zinc-200 pb-2 text-xs font-medium text-zinc-500">
                  <div>内容</div>
                  <div className="text-right">数量</div>
                  <div className="text-right">単価</div>
                  <div className="text-right">金額</div>
                </div>
                {group.items.map((sale) => (
                  <div key={sale.id} className="grid grid-cols-[1fr_90px_120px_120px] items-center gap-3 text-sm">
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
          ))}
          <div className="flex items-center justify-between rounded-2xl bg-[#0071e3] px-5 py-4 text-white">
            <div className="text-sm">合計</div>
            <div className="text-2xl font-semibold">{formatYen(total)}</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/billing/${customerId}-${month}/preview`}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-accent px-2.5 text-sm font-medium text-white hover:bg-[#b91c1c]"
            >
              <FileText className="h-4 w-4" />
              請求書プレビュー
            </Link>
            <Button variant="outline">
              <ArrowRight className="h-4 w-4" />
              発行処理へ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
