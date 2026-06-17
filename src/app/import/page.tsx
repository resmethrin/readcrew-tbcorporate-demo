"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { demoCustomers, demoBusinesses, formatYen } from "@/lib/demo-data";
import { useSalesStore } from "@/store/useSalesStore";
import type { Sale } from "@/types";

const sampleSales: Sale[] = [
  {
    id: "import-sample-1",
    customerId: demoCustomers[0]?.id ?? "c001",
    businessId: demoBusinesses[0]?.id ?? "b001",
    description: "保守サポート月額",
    amount: 220000,
    qty: 1,
    unitPrice: 220000,
    month: "2026-06",
    status: "uninvoiced",
  },
  {
    id: "import-sample-2",
    customerId: demoCustomers[1]?.id ?? "c002",
    businessId: demoBusinesses[1]?.id ?? "b002",
    description: "機器点検作業",
    amount: 180000,
    qty: 3,
    unitPrice: 60000,
    month: "2026-06",
    status: "invoiced",
  },
  {
    id: "import-sample-3",
    customerId: demoCustomers[2]?.id ?? "c003",
    businessId: demoBusinesses[2]?.id ?? "b003",
    description: "配線工事一式",
    amount: 540000,
    qty: 2,
    unitPrice: 270000,
    month: "2026-06",
    status: "paid",
  },
];

export default function ImportPage() {
  const addSale = useSalesStore((state) => state.addSale);
  const [previewRows, setPreviewRows] = useState<Sale[]>([]);
  const hasPreview = previewRows.length > 0;

  const handleSampleLoad = () => {
    sampleSales.forEach((sale) => addSale(sale));
    setPreviewRows(sampleSales);
  };

  const preview = useMemo(() => previewRows, [previewRows]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-medium text-zinc-500">Import</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">データ取込</h1>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="rounded-3xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-16 text-center">
            <div className="text-sm font-medium text-zinc-500">CSVファイルをドロップ</div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={handleSampleLoad}>サンプルデータ読込</Button>
            <Button
              variant="outline"
              onClick={() => {
                window.alert("取込が完了しました");
              }}
              disabled={!hasPreview}
            >
              取込実行
            </Button>
          </div>
        </CardContent>
      </Card>
      {hasPreview && (
        <Card>
          <CardHeader>
            <CardTitle>取込プレビュー</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {preview.map((sale) => (
              <div
                key={sale.id}
                className="grid grid-cols-[1.2fr_1fr_1fr_120px] gap-3 rounded-xl border border-zinc-200 p-4 text-sm"
              >
                <div>{sale.description}</div>
                <div>{demoCustomers.find((customer) => customer.id === sale.customerId)?.name ?? sale.customerId}</div>
                <div>{demoBusinesses.find((business) => business.id === sale.businessId)?.name ?? sale.businessId}</div>
                <div className="text-right font-medium">{formatYen(sale.amount)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
