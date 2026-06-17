"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { demoBusinesses, demoCustomers, formatMonth, formatYen, statusLabels } from "@/lib/demo-data";
import { useSalesStore } from "@/store/useSalesStore";
import type { SaleStatus } from "@/types";

const businessTabs = [
  { id: "all", label: "全て" },
  ...demoBusinesses.map((business) => ({ id: business.id, label: business.name })),
];

const statusFilters: { id: "all" | SaleStatus; label: string }[] = [
  { id: "all", label: "全て" },
  { id: "uninvoiced", label: "未請求" },
  { id: "invoiced", label: "請求済" },
  { id: "paid", label: "入金済" },
];

export default function SalesPage() {
  const sales = useSalesStore((state) => state.sales);
  const markInvoicedByIds = useSalesStore((state) => state.markInvoicedByIds);
  const [businessId, setBusinessId] = useState("all");
  const [status, setStatus] = useState<"all" | SaleStatus>("all");
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(
    () =>
      sales.filter((sale) => {
        const businessMatch = businessId === "all" || sale.businessId === businessId;
        const statusMatch = status === "all" || sale.status === status;
        return businessMatch && statusMatch;
      }),
    [businessId, sales, status],
  );

  const toggleSelected = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-zinc-500">Sales</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">売上一覧</h1>
        </div>
        <Link
          href="/sales/new"
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-accent px-2.5 text-sm font-medium text-white hover:bg-[#b91c1c]"
        >
          <Plus className="h-4 w-4" />
          売上登録
        </Link>
      </div>
      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>事業フィルタ</CardTitle>
          <Tabs value={businessId} onValueChange={setBusinessId}>
            <TabsList className="bg-zinc-100">
              {businessTabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant={status === item.id ? "default" : "outline"}
                className={status === item.id ? "bg-zinc-950 text-white" : ""}
                onClick={() => setStatus(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => markInvoicedByIds(selected)}
              disabled={selected.length === 0}
            >
              請求処理へ
            </Button>
            <div className="text-sm text-zinc-500">{selected.length}件選択中</div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>顧客名</TableHead>
                <TableHead>事業</TableHead>
                <TableHead>内容</TableHead>
                <TableHead>金額</TableHead>
                <TableHead>月</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sale) => {
                const customer = demoCustomers.find((item) => item.id === sale.customerId);
                const business = demoBusinesses.find((item) => item.id === sale.businessId);
                return (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <Checkbox checked={selected.includes(sale.id)} onCheckedChange={() => toggleSelected(sale.id)} />
                    </TableCell>
                    <TableCell>{customer?.name}</TableCell>
                    <TableCell>{business?.name}</TableCell>
                    <TableCell>{sale.description}</TableCell>
                    <TableCell>{formatYen(sale.amount)}</TableCell>
                    <TableCell>{formatMonth(sale.month)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{statusLabels[sale.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        詳細 <ArrowRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
