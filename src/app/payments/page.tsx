"use client";

import { useMemo } from "react";
import { Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { demoCustomers, formatMonth, getBusinessName } from "@/lib/demo-data";
import { useSalesStore } from "@/store/useSalesStore";

export default function PaymentsPage() {
  const sales = useSalesStore((state) => state.sales);
  const exportRows = useMemo(
    () =>
      sales.filter((sale) => sale.status === "invoiced" || sale.status === "paid").map((sale) => [
        demoCustomers.find((customer) => customer.id === sale.customerId)?.name ?? sale.customerId,
        getBusinessName(sale.businessId),
        sale.description,
        String(sale.amount),
        formatMonth(sale.month),
        sale.status,
      ]),
    [sales],
  );

  const handleCsvExport = () => {
    const rows = exportRows.map((row) => row.join(",")).join("\n");
    const csv = "顧客名,事業,内容,金額,月,ステータス\n" + rows;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "請求データ.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-medium text-zinc-500">Payments</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">入金管理</h1>
      </div>
      <div className="flex justify-end">
        <Button variant="outline" onClick={handleCsvExport}>
          <Upload className="h-4 w-4" />
          CSV出力
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>入金状況</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-zinc-200 p-4">
            <div>
              <div className="font-medium">株式会社アルファテック</div>
              <div className="text-sm text-zinc-500">2026年6月請求分</div>
            </div>
            <Badge className="bg-[#0071e3] text-white">入金済</Badge>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-zinc-200 p-4">
            <div>
              <div className="font-medium">ベータ商事株式会社</div>
              <div className="text-sm text-zinc-500">2026年6月請求分</div>
            </div>
            <Badge variant="secondary">入金待ち</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
