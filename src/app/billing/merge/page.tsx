"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatYen, getCustomerName, groupSalesByBusiness, monthToLabel } from "@/lib/demo-data";
import { useSalesStore } from "@/store/useSalesStore";

const ISSUER = {
  name: "株式会社エキサイター",
  postal: "〒103-0007",
  address: "東京都中央区日本橋浜町2-16-5 東味ビルディング４F",
  tel: "00-0000-0000",
  email: "billing@exciter.co.jp",
  registrationNo: "T1234567890123",
};

const BANK = {
  name: "三菱UFJ銀行",
  branch: "人形町支店",
  type: "普通",
  account: "1234567",
  holder: "カ)エキサイター",
};

export default function MergePreviewPage() {
  const searchParams = useSearchParams();
  const sales = useSalesStore((s) => s.sales);
  const [invoiceNo, setInvoiceNo] = useState("");

  const ids = (searchParams.get("ids") ?? "").split(",").filter(Boolean);

  const pairs = useMemo(
    () =>
      ids.map((id) => {
        const segments = id.split("-");
        const month = segments.slice(-2).join("-");
        const customerId = segments.slice(0, -2).join("-");
        return { id, customerId, month };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids.join(",")],
  );

  const targetSales = useMemo(
    () => sales.filter((s) => pairs.some((p) => p.customerId === s.customerId && p.month === s.month)),
    [sales, pairs],
  );

  const groups = useMemo(() => groupSalesByBusiness(targetSales), [targetSales]);
  const total = groups.reduce((sum, g) => sum + g.subtotal, 0);
  const tax = Math.round(total * 0.1);

  const customerNames = [...new Set(pairs.map((p) => getCustomerName(p.customerId)))];
  const months = [...new Set(pairs.map((p) => p.month))].sort();

  const autoInvoiceNo = `INV-MERGE-${months.map((m) => m.replace("-", "")).join("-")}`;
  const resolvedInvoiceNo = invoiceNo.trim() || autoInvoiceNo;

  const [lastY, lastM] = months[months.length - 1].split("-").map(Number);
  const dueMonth = lastM === 12 ? 1 : lastM + 1;
  const dueYear = lastM === 12 ? lastY + 1 : lastY;
  const dueDateLabel = `${dueYear}年${dueMonth}月${new Date(dueYear, dueMonth, 0).getDate()}日`;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-zinc-500">Billing</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">統合請求書プレビュー</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {ids.length}件の請求書を統合 — {months.map(monthToLabel).join("・")}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.print()}>
            PDF出力
          </Button>
          <Button className="bg-accent text-white hover:bg-[#b91c1c]">発行済にする</Button>
        </div>
      </div>

      {/* 請求書番号入力 */}
      <div className="flex items-end gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4">
        <div className="grid gap-1.5">
          <label className="text-sm font-medium">
            請求書番号
            <span className="ml-2 text-xs font-normal text-zinc-400">（空欄の場合は自動採番）</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              placeholder={autoInvoiceNo}
              className="h-9 w-80 rounded-lg border border-zinc-200 bg-white px-3 font-mono text-sm placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            {invoiceNo.trim() && (
              <button onClick={() => setInvoiceNo("")} className="text-xs text-zinc-400 hover:text-zinc-600">
                リセット
              </button>
            )}
          </div>
        </div>
        <div className="text-xs text-zinc-500 pb-1">
          発行番号: <span className="font-mono font-medium text-zinc-800">{resolvedInvoiceNo}</span>
        </div>
      </div>

      <Card className="bg-white shadow-sm print:shadow-none">
        <CardContent className="space-y-8 p-10 text-sm leading-7 text-zinc-900">

          {/* ヘッダー */}
          <div className="flex justify-between gap-6">
            <div>
              <div className="text-3xl font-bold tracking-wide">請求書</div>
              <div className="mt-6 space-y-0.5 text-sm text-zinc-600">
                <div className="flex items-center gap-2">
                  <span className="w-20 text-zinc-400">入金期限</span>
                  <span className="font-semibold text-zinc-900">{dueDateLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 text-zinc-400">発行日</span>
                  <span>2026年6月30日</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 text-zinc-400">請求書番号</span>
                  <span className="font-mono">{resolvedInvoiceNo}</span>
                </div>
                <div className="mt-2 flex gap-2">
                  <Badge variant="secondary">発行準備完了</Badge>
                  <Badge variant="outline">統合請求書</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="space-y-1 text-right text-sm">
                <div className="text-base font-semibold">{ISSUER.name}</div>
                <div className="text-zinc-600">{ISSUER.postal}</div>
                <div className="text-zinc-600">{ISSUER.address}</div>
                <div className="text-zinc-600">TEL: {ISSUER.tel}</div>
                <div className="text-zinc-600">{ISSUER.email}</div>
                <div className="mt-1 text-xs text-zinc-500">
                  適格請求書発行事業者登録番号<br />
                  <span className="font-mono font-medium text-zinc-700">{ISSUER.registrationNo}</span>
                </div>
              </div>
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-sm border-2 border-red-600 text-center text-sm font-bold text-red-600 tracking-widest">
                各印
              </div>
            </div>
          </div>

          {/* 請求先 */}
          <div className="border-b border-zinc-200 pb-5">
            <div className="text-lg font-semibold">
              {customerNames.join(" / ")} <span className="font-normal">御中</span>
            </div>
            <p className="mt-2 text-zinc-600">下記の通りご請求申し上げます。</p>
            <div className="mt-2 text-xs text-zinc-500">
              対象期間: {months.map(monthToLabel).join("、")}
            </div>
          </div>

          {/* 請求金額サマリ */}
          <div className="rounded-xl bg-zinc-50 px-6 py-4">
            <div className="text-sm text-zinc-500">ご請求金額（税込）</div>
            <div className="mt-1 text-3xl font-bold text-accent">{formatYen(total + tax)}</div>
            <div className="mt-2 text-sm text-zinc-600">
              入金期限: {dueDateLabel}
            </div>
          </div>

          {/* 明細 (月別にグループ表示) */}
          <div className="space-y-6">
            {pairs.map((pair) => {
              const pairSales = targetSales.filter(
                (s) => s.customerId === pair.customerId && s.month === pair.month,
              );
              const pairGroups = groupSalesByBusiness(pairSales);
              const pairTotal = pairGroups.reduce((sum, g) => sum + g.subtotal, 0);
              if (pairSales.length === 0) return null;
              return (
                <section key={pair.id} className="space-y-3">
                  <h2 className="font-semibold text-zinc-700 border-b border-zinc-200 pb-2">
                    {getCustomerName(pair.customerId)} — {monthToLabel(pair.month)}
                  </h2>
                  {pairGroups.map((group) => (
                    <div key={group.businessId} className="rounded-lg border border-zinc-200 overflow-hidden">
                      <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-600">
                        【{group.businessName}】
                      </div>
                      <div className="grid grid-cols-[1fr_80px_130px_130px] gap-4 border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-500">
                        <div>内容</div>
                        <div className="text-right">数量</div>
                        <div className="text-right">単価</div>
                        <div className="text-right">金額</div>
                      </div>
                      {group.items.map((sale) => (
                        <div
                          key={sale.id}
                          className="grid grid-cols-[1fr_80px_130px_130px] gap-4 border-b border-zinc-100 px-4 py-2.5 last:border-b-0 text-sm"
                        >
                          <div>{sale.description}</div>
                          <div className="text-right">{sale.qty ?? 1}</div>
                          <div className="text-right">
                            {formatYen(sale.unitPrice ?? Math.round(sale.amount / (sale.qty ?? 1)))}
                          </div>
                          <div className="text-right font-medium">{formatYen(sale.amount)}</div>
                        </div>
                      ))}
                      <div className="flex justify-end border-t border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium">
                        小計: {formatYen(group.subtotal)}
                      </div>
                    </div>
                  ))}
                  <div className="text-right text-sm font-semibold text-zinc-700">
                    {monthToLabel(pair.month)} 合計: {formatYen(pairTotal)}
                  </div>
                </section>
              );
            })}
          </div>

          {/* 合計 */}
          <div className="rounded-xl border border-zinc-200 overflow-hidden">
            <div className="flex justify-between px-5 py-2.5 text-sm text-zinc-600">
              <span>小計（税抜）</span>
              <span>{formatYen(total)}</span>
            </div>
            <div className="flex justify-between border-t border-zinc-100 px-5 py-2.5 text-sm text-zinc-600">
              <span>消費税（10%）</span>
              <span>{formatYen(tax)}</span>
            </div>
            <div className="flex justify-between border-t border-zinc-200 bg-zinc-50 px-5 py-3 text-base font-bold text-zinc-900">
              <span>合計（税込）</span>
              <span className="text-accent">{formatYen(total + tax)}</span>
            </div>
          </div>

          {/* 振込先 */}
          <div className="rounded-xl border border-zinc-200 p-5 space-y-3">
            <div className="font-semibold text-zinc-800">お振込先</div>
            <div className="grid gap-2 sm:grid-cols-2 text-sm">
              <div className="flex gap-2">
                <span className="w-20 shrink-0 text-zinc-400">銀行名</span>
                <span className="font-medium">{BANK.name}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-20 shrink-0 text-zinc-400">支店名</span>
                <span className="font-medium">{BANK.branch}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-20 shrink-0 text-zinc-400">口座種別</span>
                <span className="font-medium">{BANK.type}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-20 shrink-0 text-zinc-400">口座番号</span>
                <span className="font-mono font-medium">{BANK.account}</span>
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <span className="w-20 shrink-0 text-zinc-400">口座名義</span>
                <span className="font-medium">{BANK.holder}</span>
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              振込手数料はご負担をお願いいたします。
            </p>
          </div>

          <div className="text-xs text-zinc-500 space-y-1">
            <p>※ 本請求書の内容にご不明な点がございましたら、上記連絡先までお問い合わせください。</p>
            <p>※ {dueDateLabel} までにお振込みいただけますようお願い申し上げます。</p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
