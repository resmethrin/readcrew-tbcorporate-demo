"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { demoCustomers, demoBusinesses, formatYen } from "@/lib/demo-data";
import { useSalesStore } from "@/store/useSalesStore";
import type { Sale } from "@/types";

type SourceRow = Sale & { source: "Decssy" | "手入力" };

const sampleSales: SourceRow[] = [
  {
    id: "import-sample-1",
    customerId: demoCustomers.find((c) => c.id === "c005")?.id ?? "c005",
    businessId: demoBusinesses.find((b) => b.id === "b004")?.id ?? "b004",
    description: "食材（米）",
    amount: 220000,
    qty: 1,
    unitPrice: 220000,
    month: "2026-06",
    status: "uninvoiced",
    source: "Decssy",
  },
  {
    id: "import-sample-2",
    customerId: demoCustomers.find((c) => c.id === "c005")?.id ?? "c005",
    businessId: demoBusinesses.find((b) => b.id === "b004")?.id ?? "b004",
    description: "厨房機器 保守（ホシザキ）",
    amount: 45000,
    qty: 1,
    unitPrice: 45000,
    month: "2026-06",
    status: "uninvoiced",
    source: "手入力",
  },
  {
    id: "import-sample-3",
    customerId: demoCustomers.find((c) => c.id === "c005")?.id ?? "c005",
    businessId: demoBusinesses.find((b) => b.id === "b004")?.id ?? "b004",
    description: "什器（ヤマダ電機）",
    amount: 98000,
    qty: 1,
    unitPrice: 98000,
    month: "2026-06",
    status: "invoiced",
    source: "手入力",
  },
];

export default function ImportPage() {
  const addSale = useSalesStore((state) => state.addSale);
  const [previewRows, setPreviewRows] = useState<SourceRow[]>([]);
  const hasPreview = previewRows.length > 0;

  const handleSampleLoad = () => {
    sampleSales.forEach((sale) => addSale(sale));
    setPreviewRows(sampleSales);
  };

  const preview = useMemo(() => previewRows, [previewRows]);

  // Excel・CSV取込
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importRows, setImportRows] = useState<Sale[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importDone, setImportDone] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    if (!file) return;
    setImportError(null);
    setImportDone(false);

    try {
      const { read, utils } = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

      const parsed: Sale[] = rows.map((row, i) => ({
        id: `excel-${Date.now()}-${i}`,
        customerId: String(row["顧客ID"] ?? row["customerId"] ?? demoCustomers[0]?.id ?? "c001"),
        businessId: String(row["事業部ID"] ?? row["businessId"] ?? demoBusinesses[0]?.id ?? "b001"),
        description: String(row["内容"] ?? row["description"] ?? ""),
        amount: Number(row["金額"] ?? row["amount"] ?? 0),
        qty: row["数量"] != null ? Number(row["数量"]) : undefined,
        unitPrice: row["単価"] != null ? Number(row["単価"]) : undefined,
        month: String(row["月"] ?? row["month"] ?? "2026-06"),
        status: "uninvoiced" as const,
      }));

      if (parsed.length === 0) { setImportError("データが見つかりませんでした"); return; }
      setImportRows(parsed);
    } catch {
      setImportError("ファイルの読み込みに失敗しました");
    }
  };

  const handleImportConfirm = () => {
    importRows.forEach((s) => addSale(s));
    setImportDone(true);
    setImportRows([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-medium text-zinc-500">Import</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">取込</h1>
        <p className="mt-1 text-sm text-zinc-500">取込元ごとに経路が分かれていた運用を、1つのハブ画面にまとめています。</p>
      </div>

      <Tabs defaultValue="decssy">
        <TabsList variant="line">
          <TabsTrigger value="decssy">Decssy取込</TabsTrigger>
          <TabsTrigger value="excel">Excel・CSV取込</TabsTrigger>
          <TabsTrigger value="manual">手入力</TabsTrigger>
        </TabsList>

        <TabsContent value="decssy" className="pt-4">
          <Card>
            <CardContent className="p-6">
              <div className="rounded-3xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-16 text-center">
                <div className="text-sm font-medium text-zinc-500">Decssyファイルをドロップ</div>
                <div className="mt-1 text-xs text-zinc-400">フード室の食材発注データなど、Decssy連携分はこちらから取込みます</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="excel" className="pt-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-zinc-500">
                列見出し「顧客ID/customerId, 室ID（事業部ID）/businessId, 内容/description, 金額/amount, 数量, 単価, 月/month」に対応したExcel・CSVファイルを取込みます。
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button onClick={() => fileInputRef.current?.click()}>ファイルを選択</Button>
              {importError && (
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{importError}</p>
              )}
              {importDone && (
                <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">取込が完了しました</p>
              )}
              {importRows.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-500">{importRows.length} 件のデータを取り込みます</p>
                  <div className="space-y-2">
                    {importRows.map((row) => (
                      <div
                        key={row.id}
                        className="grid grid-cols-[1.2fr_1fr_1fr_120px] gap-3 rounded-xl border border-zinc-200 p-3 text-sm"
                      >
                        <div>{row.description}</div>
                        <div>{demoCustomers.find((c) => c.id === row.customerId)?.name ?? row.customerId}</div>
                        <div>{demoBusinesses.find((b) => b.id === row.businessId)?.name ?? row.businessId}</div>
                        <div className="text-right font-medium">{formatYen(row.amount)}</div>
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleImportConfirm}>取込を確定</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="pt-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-zinc-500 mb-4">
                フード室の実運用では、Decssy取込分と手入力分（ヤマダ電機・ホシザキ等フード以外の仕入先）が同一画面に混在して流れます。
              </p>
              <Button onClick={handleSampleLoad}>サンプルデータ読込</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {hasPreview && (
        <Card>
          <CardHeader>
            <CardTitle>取込プレビュー</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {preview.map((sale) => (
              <div
                key={sale.id}
                className="grid grid-cols-[1.2fr_1fr_1fr_100px_90px] gap-3 rounded-xl border border-zinc-200 p-4 text-sm items-center"
              >
                <div>{sale.description}</div>
                <div>{demoCustomers.find((customer) => customer.id === sale.customerId)?.name ?? sale.customerId}</div>
                <div>{demoBusinesses.find((business) => business.id === sale.businessId)?.name ?? sale.businessId}</div>
                <div className="text-right font-medium">{formatYen(sale.amount)}</div>
                <div className="text-right">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${sale.source === "Decssy" ? "bg-sky-50 text-sky-700" : "bg-zinc-100 text-zinc-600"}`}>
                    {sale.source}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
