"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, GitMerge, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatYen, getCustomerName, monthToLabel } from "@/lib/demo-data";
import { useSalesStore } from "@/store/useSalesStore";

export default function BillingPage() {
  const router = useRouter();
  const sales = useSalesStore((s) => s.sales);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const groups = useMemo(() => {
    const map = new Map<string, {
      id: string;
      customerId: string;
      customerName: string;
      month: string;
      count: number;
      subtotal: number;
    }>();
    for (const sale of sales) {
      const id = `${sale.customerId}-${sale.month}`;
      const g = map.get(id) ?? {
        id,
        customerId: sale.customerId,
        customerName: getCustomerName(sale.customerId),
        month: sale.month,
        count: 0,
        subtotal: 0,
      };
      g.count += 1;
      g.subtotal += sale.amount;
      map.set(id, g);
    }
    return Array.from(map.values()).sort((a, b) =>
      a.customerId !== b.customerId
        ? a.customerId.localeCompare(b.customerId)
        : b.month.localeCompare(a.month),
    );
  }, [sales]);

  const toggleAll = () => {
    setSelected(selected.size === groups.length ? new Set() : new Set(groups.map((g) => g.id)));
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleMerge = () => {
    router.push(`/billing/merge?ids=${encodeURIComponent(Array.from(selected).join(","))}`);
  };

  const withTax = (subtotal: number) => subtotal + Math.round(subtotal * 0.1);

  const selectedGroups = groups.filter((g) => selected.has(g.id));
  const selectedTotal = selectedGroups.reduce((sum, g) => sum + withTax(g.subtotal), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-zinc-500">Billing</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">請求一覧</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4" />
            CSV出力
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs font-medium text-zinc-500">
                <th className="w-10 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selected.size === groups.length && groups.length > 0}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-zinc-300 accent-accent"
                  />
                </th>
                <th className="px-4 py-3 text-left">顧客</th>
                <th className="px-4 py-3 text-left">請求月</th>
                <th className="px-4 py-3 text-right">件数</th>
                <th className="px-4 py-3 text-right">合計（税込）</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-zinc-400">
                    売上データがありません
                  </td>
                </tr>
              ) : (
                groups.map((g) => (
                  <tr
                    key={g.id}
                    className={[
                      "border-b border-zinc-100 last:border-0 transition-colors",
                      selected.has(g.id) ? "bg-blue-50" : "hover:bg-zinc-50",
                    ].join(" ")}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(g.id)}
                        onChange={() => toggle(g.id)}
                        className="h-4 w-4 rounded border-zinc-300 accent-accent"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900">{g.customerName}</td>
                    <td className="px-4 py-3 text-zinc-600">{monthToLabel(g.month)}</td>
                    <td className="px-4 py-3 text-right text-zinc-600">{g.count}件</td>
                    <td className="px-4 py-3 text-right font-semibold text-zinc-900">
                      {formatYen(withTax(g.subtotal))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/billing/${g.id}/preview`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        プレビュー
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {selected.size >= 1 && (
        <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4">
          <div className="text-sm text-zinc-600">
            <span className="font-semibold text-zinc-900">{selected.size}件</span> 選択中
            <span className="mx-3 text-zinc-300">|</span>
            合計（税込）:{" "}
            <span className="font-semibold text-zinc-900">{formatYen(selectedTotal)}</span>
          </div>
          <div className="flex gap-2">
            {selected.size === 1 && (
              <Link
                href={`/billing/${Array.from(selected)[0]}/preview`}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <FileText className="h-4 w-4" />
                請求書プレビュー
              </Link>
            )}
            {selected.size >= 2 && (
              <Button onClick={handleMerge}>
                <GitMerge className="h-4 w-4" />
                統合して請求書を作成
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
