"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { demoCustomers, formatYen, groupSalesByBusiness, invoiceNumberForMonth, monthToLabel } from "@/lib/demo-data";
import { useSalesStore } from "@/store/useSalesStore";

export default function InvoicePreviewPage() {
  const params = useParams<{ id: string }>();
  const sales = useSalesStore((state) => state.sales);
  const segments = params.id.split("-");
  const month = segments.slice(-2).join("-");
  const customerId = segments.slice(0, -2).join("-");
  const customer = demoCustomers.find((item) => item.id === customerId);

  const targetSales = useMemo(
    () => sales.filter((sale) => sale.customerId === customerId && sale.month === month),
    [customerId, month, sales],
  );
  const groups = useMemo(() => groupSalesByBusiness(targetSales), [targetSales]);
  const total = groups.reduce((sum, group) => sum + group.subtotal, 0);
  const tax = Math.round(total * 0.1);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-zinc-500">Billing</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">請求書プレビュー</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.print()}>
            PDF出力
          </Button>
          <Button className="bg-accent text-white hover:bg-[#b91c1c]">発行済にする</Button>
        </div>
      </div>
      <Card className="bg-white shadow-sm">
        <CardContent className="space-y-8 p-10 font-mono text-sm leading-7 text-zinc-900">
          <div className="flex justify-between">
            <div>
              <div className="text-2xl font-semibold font-sans">請求書</div>
              <div className="mt-8 font-sans text-base">{customer?.name} 御中</div>
              <p className="mt-4 font-sans text-zinc-600">
                下記の通りご請求申し上げます。
              </p>
            </div>
            <div className="space-y-2 text-right font-sans">
              <div>発行日: 2026年6月30日</div>
              <div>請求書番号: {invoiceNumberForMonth(month)}</div>
              <Badge variant="secondary">発行準備完了</Badge>
            </div>
          </div>
          <div className="space-y-6 font-sans">
            {groups.map((group) => (
              <section key={group.businessId} className="space-y-3">
                <h2 className="text-lg font-semibold">【{group.businessName}】</h2>
                <div className="border-y border-zinc-900 py-3">
                  <div className="grid grid-cols-[1fr_100px_140px_140px] gap-4 border-b border-zinc-200 pb-2 text-sm font-medium">
                    <div>内容</div>
                    <div className="text-right">数量</div>
                    <div className="text-right">単価</div>
                    <div className="text-right">金額</div>
                  </div>
                  {group.items.map((sale) => (
                    <div
                      key={sale.id}
                      className="grid grid-cols-[1fr_100px_140px_140px] gap-4 border-b border-zinc-100 py-2 last:border-b-0"
                    >
                      <div>{sale.description}</div>
                      <div className="text-right">{sale.qty ?? 1}</div>
                      <div className="text-right">{formatYen(sale.unitPrice ?? Math.round(sale.amount / (sale.qty ?? 1)))}</div>
                      <div className="text-right">{formatYen(sale.amount)}</div>
                    </div>
                  ))}
                </div>
                <div className="text-right font-medium">小計: {formatYen(group.subtotal)}</div>
              </section>
            ))}
          </div>
          <div className="border-t border-zinc-900 pt-4 text-right font-sans">
            <div>合計（税抜）: {formatYen(total)}</div>
            <div>消費税（10%）: {formatYen(tax)}</div>
            <div className="text-lg font-semibold">合計（税込）: {formatYen(total + tax)}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
