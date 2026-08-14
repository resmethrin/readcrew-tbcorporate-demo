"use client";

import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Copy, FileText, Link2, Mail, X } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { demoCustomers, formatYen, groupSalesByBusiness, invoiceNumberForMonth, monthToLabel, unitFor, voucherDateLabel } from "@/lib/demo-data";
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

/**
 * Before / After を切り替えるセグメントコントロール。
 * つまみが移動するスイッチだと選択位置がずれて見えるため、
 * 幅が変わらない2択のボタン列にしている。
 */
function BeforeAfterControl({
  label,
  beforeLabel,
  afterLabel,
  note,
  isAfter,
  onChange,
}: {
  label: string;
  beforeLabel: string;
  afterLabel: string;
  note: string;
  isAfter: boolean;
  onChange: (isAfter: boolean) => void;
}) {
  const optionClass = (active: boolean) =>
    `w-28 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
      active ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
    }`;

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <div className="text-sm">
        <span className="font-medium text-zinc-700">{label}</span>
        <span className="ml-2 text-xs text-zinc-400">{note}</span>
      </div>
      <div role="radiogroup" aria-label={label} className="flex shrink-0 gap-1 rounded-lg bg-zinc-100 p-1">
        <button type="button" role="radio" aria-checked={!isAfter} onClick={() => onChange(false)} className={optionClass(!isAfter)}>
          {beforeLabel}
        </button>
        <button type="button" role="radio" aria-checked={isAfter} onClick={() => onChange(true)} className={optionClass(isAfter)}>
          {afterLabel}
        </button>
      </div>
    </div>
  );
}

export default function InvoicePreviewPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const sales = useSalesStore((state) => state.sales);
  const markInvoicedByIds = useSalesStore((s) => s.markInvoicedByIds);

  // メール送付モーダル
  const [showMailModal, setShowMailModal] = useState(false);
  const [mailTo, setMailTo] = useState("");
  const [mailFrom, setMailFrom] = useState(ISSUER.email);
  const [mailBody, setMailBody] = useState("");
  const [mailSent, setMailSent] = useState(false);

  // 共有リンクモーダル
  const [showShareModal, setShowShareModal] = useState(false);
  const [markInvoiced, setMarkInvoiced] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // 未入金分別発行モーダル
  const [showUnpaidModal, setShowUnpaidModal] = useState(false);

  // 税抜統一 Before/After トグル
  const [unifiedTaxDisplay, setUnifiedTaxDisplay] = useState(false);
  // 繰越型（現行フォーム）/ 当月完結型 Before/After トグル
  const [carryOverMode, setCarryOverMode] = useState(false);
  const isTaxInclusiveInput = (description: string) => description.includes("（税込入力）");
  const displayDescription = (description: string) => description.replace("（税込入力）", "");
  const exclusiveAmount = (amount: number) => Math.round(amount / 1.1);
  const segments = params.id.split("-");
  const month = segments.slice(-2).join("-");
  const customerId = segments.slice(0, -2).join("-");
  const customer = demoCustomers.find((item) => item.id === customerId);
  const invoiceNo = searchParams.get("invoiceNo") || invoiceNumberForMonth(month);
  const bizIdsParam = searchParams.get("bizIds");
  const bizIdFilter = bizIdsParam ? new Set(bizIdsParam.split(",")) : null;

  const targetSales = useMemo(
    () =>
      sales.filter(
        (sale) =>
          sale.customerId === customerId &&
          sale.month === month &&
          (bizIdFilter === null || bizIdFilter.has(sale.businessId)),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customerId, month, sales, bizIdsParam],
  );
  const groups = useMemo(() => {
    const sorted = [...targetSales].sort((a, b) => (a.orderDate ?? "").localeCompare(b.orderDate ?? ""));
    return groupSalesByBusiness(sorted);
  }, [targetSales]);
  const total = groups.reduce((sum, group) => sum + group.subtotal, 0);
  const tax = Math.round(total * 0.1);

  const unpaidSales = useMemo(() => targetSales.filter((s) => s.status !== "paid"), [targetSales]);
  const unpaidGroups = useMemo(() => groupSalesByBusiness(unpaidSales), [unpaidSales]);
  const unpaidTotal = unpaidGroups.reduce((sum, group) => sum + group.subtotal, 0);
  const unpaidTax = Math.round(unpaidTotal * 0.1);

  // メールモーダルを開く際に初期値をセット
  const openMailModal = () => {
    setMailTo(customer?.email ?? "");
    setMailFrom(ISSUER.email);
    setMailBody(
      `${customer?.name} ${customer?.contact} 様\n\n` +
      `いつもお世話になっております。\n${ISSUER.name}でございます。\n\n` +
      `${monthToLabel(month)}分の請求書（${invoiceNo}）をお送りいたします。\n` +
      `ご確認のうえ、期日までにお振込みいただけますようお願い申し上げます。\n\n` +
      `何かご不明な点がございましたら、お気軽にご連絡ください。\n\n` +
      `${ISSUER.name}\n${ISSUER.email}`
    );
    setMailSent(false);
    setShowMailModal(true);
  };

  const handleSendMail = () => {
    const subject = encodeURIComponent(`【請求書】${monthToLabel(month)}分 ${invoiceNo} / ${ISSUER.name}`);
    const body = encodeURIComponent(mailBody);
    window.open(`mailto:${mailTo}?cc=${mailFrom}&subject=${subject}&body=${body}`);
    setMailSent(true);
  };

  // 共有リンク発行
  const handleIssueLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).catch(() => {});
    if (markInvoiced) {
      const ids = targetSales.map((s) => s.id);
      markInvoicedByIds(ids);
    }
    setLinkCopied(true);
  };

  // ── 締日・対象期間・入金期日 ────────────────────────
  // 得意先マスタの締日区分で、請求対象期間と入金期日が変わる。
  //   25日締め : 前月26日〜当月25日 / 当月末日入金（例: T紡織）
  //   月末締め : 当月1日〜当月末日   / 翌月末日入金
  const [y, m] = month.split("-").map(Number);
  const lastDayOf = (yy: number, mm: number) => new Date(yy, mm, 0).getDate();
  const dateLabel = (yy: number, mm: number, dd: number) => `${yy}年${mm}月${dd}日`;

  const prevYear = m === 1 ? y - 1 : y;
  const prevMonth = m === 1 ? 12 : m - 1;
  const nextYear = m === 12 ? y + 1 : y;
  const nextMonth = m === 12 ? 1 : m + 1;

  const closingLabel = customer?.closingDay ?? "月末締め";
  const isDay25Closing = closingLabel.startsWith("25");

  const periodLabel = isDay25Closing
    ? `${dateLabel(prevYear, prevMonth, 26)} 〜 ${dateLabel(y, m, 25)}`
    : `${dateLabel(y, m, 1)} 〜 ${dateLabel(y, m, lastDayOf(y, m))}`;
  const closingDateLabel = isDay25Closing
    ? dateLabel(y, m, 25)
    : dateLabel(y, m, lastDayOf(y, m));
  const dueDateLabel = isDay25Closing
    ? dateLabel(y, m, lastDayOf(y, m))
    : dateLabel(nextYear, nextMonth, lastDayOf(nextYear, nextMonth));

  // ── 繰越型 Before/After 用: 前月分の請求・入金実績 ──────
  const prevMonthKey = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;
  const prevSales = useMemo(
    () =>
      sales.filter(
        (sale) =>
          sale.customerId === customerId &&
          sale.month === prevMonthKey &&
          (bizIdFilter === null || bizIdFilter.has(sale.businessId)),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customerId, prevMonthKey, sales, bizIdsParam],
  );
  const withTax = (amount: number) => amount + Math.round(amount * 0.1);
  const prevBilled = withTax(prevSales.reduce((sum, sale) => sum + sale.amount, 0));
  const prevPaid = withTax(
    prevSales.filter((sale) => sale.status === "paid").reduce((sum, sale) => sum + sale.amount, 0),
  );
  const carryOver = prevBilled - prevPaid;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Link href="/billing" className="mb-2 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900">
            <ArrowLeft className="h-3.5 w-3.5" />
            請求一覧に戻る
          </Link>
          <div className="text-sm font-medium text-zinc-500">Billing</div>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold text-zinc-900">請求書プレビュー</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-xs text-zinc-500">
              請求番号 <span className="font-mono font-medium text-zinc-800">{invoiceNo}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-xs text-zinc-500">
              請求日 <span className="font-medium text-zinc-800">{closingDateLabel}</span>
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            PDF出力
          </Button>
          <Button variant="outline" onClick={openMailModal}>
            <Mail className="h-4 w-4" />
            メール送付
          </Button>
          <Button variant="outline" onClick={() => { setLinkCopied(false); setMarkInvoiced(false); setShowShareModal(true); }}>
            <Link2 className="h-4 w-4" />
            共有リンク
          </Button>
          <Button variant="outline" onClick={() => setShowUnpaidModal(true)} disabled={unpaidSales.length === 0}>
            <FileText className="h-4 w-4" />
            未入金分請求書を別発行
          </Button>
        </div>
      </div>

      <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white print:hidden">
        <BeforeAfterControl
          label="税抜表示"
          beforeLabel="Before"
          afterLabel="After"
          note={unifiedTaxDisplay ? "全明細を税抜表示に統一" : "税込入力の明細が混在したまま表示"}
          isAfter={unifiedTaxDisplay}
          onChange={setUnifiedTaxDisplay}
        />
        <BeforeAfterControl
          label="請求書フォーム"
          beforeLabel="繰越型"
          afterLabel="当月完結型"
          note={
            carryOverMode
              ? "現行フォーム（①前回御請求額 〜 ⑦累計御請求額）"
              : "当月分のみ・繰越欄なし"
          }
          isAfter={!carryOverMode}
          onChange={(isAfter) => setCarryOverMode(!isAfter)}
        />
      </div>

      <Card className="bg-white shadow-sm print:shadow-none">
        <CardContent className="space-y-8 p-10 text-sm leading-7 text-zinc-900">

          {/* ヘッダー: タイトル + 発行者情報 */}
          <div className="flex justify-between gap-6">
            <div>
              <div className="text-3xl font-bold tracking-wide">請求書</div>
              <div className="mt-6 space-y-0.5 text-sm text-zinc-600">
                <div className="flex items-center gap-2">
                  <span className="w-20 text-zinc-400">入金期日</span>
                  <span className="font-semibold text-zinc-900">{dueDateLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 text-zinc-400">発行日</span>
                  <span>{closingDateLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 text-zinc-400">請求書番号</span>
                  <span className="font-mono">{invoiceNo}</span>
                </div>
                <div className="mt-2">
                  <Badge variant="secondary">発行準備完了</Badge>
                </div>
              </div>
            </div>

            {/* 発行者 + 角印エリア */}
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
              {/* 角印 */}
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-sm border-2 border-red-600 text-center text-sm font-bold text-red-600 tracking-widest">
                各印
              </div>
            </div>
          </div>

          {/* 請求先 */}
          <div className="border-b border-zinc-200 pb-5">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">
                {customer?.name} <span className="font-normal">御中</span>
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                  isDay25Closing
                    ? "border-sky-200 bg-sky-50 text-sky-700"
                    : "border-zinc-200 bg-zinc-50 text-zinc-500"
                }`}
              >
                {closingLabel}
              </span>
            </div>

            <div className="mt-3 grid gap-1 text-sm text-zinc-600 sm:grid-cols-3">
              <div className="flex gap-2">
                <span className="shrink-0 text-zinc-400">締日</span>
                <span className="font-medium text-zinc-800">{closingDateLabel}</span>
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <span className="shrink-0 text-zinc-400">対象期間</span>
                <span className="font-medium text-zinc-800">{periodLabel}</span>
              </div>
              <div className="flex gap-2">
                <span className="shrink-0 text-zinc-400">入金期日</span>
                <span className="font-medium text-zinc-800">{dueDateLabel}</span>
              </div>
            </div>

            <p className="mt-3 text-zinc-600">
              下記の通りご請求申し上げます。
            </p>
          </div>

          {/* 請求金額サマリ */}
          <div className="print-keep rounded-xl bg-zinc-50 px-6 py-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">ご請求金額（税込）</span>
              {carryOverMode ? (
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                  繰越型（現行フォーム）
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  当月完結型
                </span>
              )}
            </div>
            <div className="mt-1 text-3xl font-bold text-accent">
              {formatYen(carryOverMode ? carryOver + total + tax : total + tax)}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-600">
              <span>対象月: {monthToLabel(month)}</span>
              <span>対象期間: {periodLabel}</span>
              <span>入金期日: {dueDateLabel}</span>
            </div>
            {!carryOverMode && (
              <p className="mt-2 text-xs text-zinc-400">
                当月分のみを記載します。前回御請求額・差引繰越額の欄はありません。
              </p>
            )}
          </div>

          {/* 明細（印刷時は thead が各ページの先頭で繰り返される）*/}
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={group.businessId} className="print-section space-y-3">
                <h2 className="font-semibold text-zinc-700">【{group.businessName}】</h2>
                <div className="rounded-lg border border-zinc-200 overflow-hidden">
                  <table className="w-full table-fixed text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-500">
                        <th className="w-20 px-3 py-2 text-left font-medium">年月日</th>
                        <th className="w-20 px-3 py-2 text-left font-medium">伝票No.</th>
                        <th className="px-3 py-2 text-left font-medium">商品名</th>
                        <th className="w-16 px-3 py-2 text-right font-medium">数量</th>
                        <th className="w-12 px-3 py-2 text-center font-medium">単位</th>
                        <th className="w-24 px-3 py-2 text-right font-medium">単価</th>
                        <th className="w-28 px-3 py-2 text-right font-medium">金額</th>
                        <th className="w-28 px-3 py-2 text-left font-medium">備考</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((sale) => {
                        const taxInclusiveInput = isTaxInclusiveInput(sale.description);
                        const displayAmount = taxInclusiveInput && unifiedTaxDisplay ? exclusiveAmount(sale.amount) : sale.amount;
                        return (
                          <tr key={sale.id} className="border-b border-zinc-100 last:border-b-0 align-top">
                            <td className="px-3 py-2.5 tabular-nums text-zinc-500">{voucherDateLabel(sale.orderDate)}</td>
                            <td className="px-3 py-2.5 font-mono text-xs tabular-nums text-zinc-500">{sale.voucherNo ?? "—"}</td>
                            <td className="px-3 py-2.5">
                              {displayDescription(sale.description)}
                              {taxInclusiveInput && !unifiedTaxDisplay && (
                                <span className="ml-2 inline-flex items-center rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">税込</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums">{sale.qty ?? 1}</td>
                            <td className="px-3 py-2.5 text-center text-zinc-500">{sale.unit ?? unitFor(sale.description)}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums">
                              {formatYen(sale.unitPrice ?? Math.round(displayAmount / (sale.qty ?? 1)))}
                            </td>
                            <td className="px-3 py-2.5 text-right font-medium tabular-nums">{formatYen(displayAmount)}</td>
                            <td className="px-3 py-2.5 text-[11px] text-zinc-400">
                              {taxInclusiveInput && unifiedTaxDisplay ? `参考価格: 税込${formatYen(sale.amount)}` : ""}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-zinc-200 bg-zinc-50 text-sm font-medium">
                        <td colSpan={8} className="px-3 py-2 text-right">小計: {formatYen(group.subtotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>
            ))}
          </div>

          {/* 合計 */}
          {carryOverMode ? (
            <div className="print-keep space-y-2">
              <div className="rounded-xl border border-amber-200 overflow-hidden">
                <div className="flex justify-between border-b border-amber-100 bg-amber-50/60 px-5 py-2.5 text-sm text-zinc-600">
                  <span>① 前回御請求額</span>
                  <span>{formatYen(prevBilled)}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-100 px-5 py-2.5 text-sm text-zinc-600">
                  <span>② 御入金額</span>
                  <span>{formatYen(prevPaid)}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-100 px-5 py-2.5 text-sm text-zinc-600">
                  <span>③ 調整額</span>
                  <span>{formatYen(0)}</span>
                </div>
                <div className="flex justify-between border-b border-amber-100 bg-amber-50/60 px-5 py-2.5 text-sm font-medium text-amber-800">
                  <span>④ 差引繰越額</span>
                  <span>{formatYen(carryOver)}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-100 px-5 py-2.5 text-sm text-zinc-600">
                  <span>⑤ 当月御買上額（税抜）</span>
                  <span>{formatYen(total)}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-100 px-5 py-2.5 text-sm text-zinc-600">
                  <span>⑥ 消費税（10%）</span>
                  <span>{formatYen(tax)}</span>
                </div>
                <div className="flex justify-between border-t border-amber-200 bg-amber-50 px-5 py-3 text-base font-bold text-zinc-900">
                  <span>⑦ 累計御請求額</span>
                  <span className="text-accent">{formatYen(carryOver + total + tax)}</span>
                </div>
              </div>

              <p className="rounded-lg bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800 print:hidden">
                {isDay25Closing ? (
                  <>
                    {closingLabel}の得意先では、締日（{closingDateLabel}）から入金期日（{dueDateLabel}）までの間に
                    請求書が発行されるため、<span className="font-semibold">入金済でも④差引繰越額が残って見えます</span>。
                    「払ったはずなのに繰越が立っている」という問合せの原因になります。
                  </>
                ) : (
                  <>
                    ①〜④が当月分に混ざるため、
                    <span className="font-semibold">④差引繰越額が「当月の未払い」と誤解されます</span>。
                    締日と入金期日がずれる得意先ほど問合せが増えます。
                  </>
                )}
              </p>
            </div>
          ) : (
            <div className="print-keep rounded-xl border border-zinc-200 overflow-hidden">
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
          )}

          {/* 振込先 */}
          <div className="print-keep rounded-xl border border-zinc-200 p-5 space-y-3">
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
              振込手数料はご負担をお願いいたします。振込完了後、本書をもって領収書に代えさせていただきます。
            </p>
          </div>

          {/* 備考 */}
          <div className="text-xs text-zinc-500 space-y-1">
            <p>※ 本請求書の内容にご不明な点がございましたら、上記連絡先までお問い合わせください。</p>
            <p>※ {dueDateLabel} までにお振込みいただけますようお願い申し上げます。</p>
          </div>

        </CardContent>
      </Card>

      {/* ── メール送付モーダル ── */}
      {showMailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <div className="flex items-center gap-2 font-semibold text-zinc-900">
                <Mail className="h-4 w-4 text-zinc-500" />
                メール送付
              </div>
              <button type="button" onClick={() => setShowMailModal(false)} className="rounded-lg p-1 hover:bg-zinc-100">
                <X className="h-4 w-4 text-zinc-400" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-zinc-500">担当者メールアドレス（宛先）</label>
                <input
                  type="email"
                  value={mailTo}
                  onChange={(e) => setMailTo(e.target.value)}
                  placeholder="customer@example.co.jp"
                  className="h-9 w-full rounded-lg border border-zinc-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-zinc-500">自社メールアドレス（CC）</label>
                <input
                  type="email"
                  value={mailFrom}
                  onChange={(e) => setMailFrom(e.target.value)}
                  className="h-9 w-full rounded-lg border border-zinc-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-zinc-500">本文</label>
                <textarea
                  value={mailBody}
                  onChange={(e) => setMailBody(e.target.value)}
                  rows={8}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>
              {mailSent && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
                  <Check className="h-4 w-4" />
                  メールクライアントを開きました
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4">
              <button type="button" onClick={() => setShowMailModal(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors">
                閉じる
              </button>
              <button type="button" onClick={handleSendMail} disabled={!mailTo}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#b91c1c] disabled:opacity-40">
                <Mail className="h-4 w-4" />
                送信する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 共有リンクモーダル ── */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-lg font-semibold text-zinc-900">共有リンクを発行します</h2>
            </div>

            <div className="space-y-4 px-6 py-4">
              <p className="text-sm text-zinc-600 leading-6">
                請求書をWebで共有するリンク（URL）を発行します。<br />
                リンクの発行と同時に、請求書を送付済みのステータスに変更することができます。
              </p>
              <p className="text-sm text-zinc-500">
                共有リンクの<span className="font-medium text-zinc-700">有効期限は発行より60日</span>です。
              </p>

              {!linkCopied ? (
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={markInvoiced}
                    onChange={(e) => setMarkInvoiced(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 accent-accent"
                  />
                  <span className="text-sm text-zinc-700">請求書を送付済みにする</span>
                </label>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
                    <Check className="h-4 w-4 shrink-0" />
                    リンクをクリップボードにコピーしました
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                    <span className="flex-1 truncate font-mono text-xs text-zinc-600">
                      {typeof window !== "undefined" ? window.location.href : ""}
                    </span>
                    <button type="button" onClick={() => navigator.clipboard.writeText(window.location.href)}
                      className="shrink-0 text-zinc-400 hover:text-zinc-600">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-start gap-2 border-t border-zinc-100 px-6 py-4">
              {!linkCopied ? (
                <>
                  <button type="button" onClick={handleIssueLink}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0071e3] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#005fc2]">
                    <Link2 className="h-4 w-4" />
                    共有リンク発行
                  </button>
                  <button type="button" onClick={() => setShowShareModal(false)}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors">
                    キャンセル
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setShowShareModal(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors">
                  閉じる
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ── 未入金分別発行モーダル ── */}
      {showUnpaidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <div className="flex items-center gap-2 font-semibold text-zinc-900">
                <FileText className="h-4 w-4 text-zinc-500" />
                未入金分請求書（別紙）
              </div>
              <button type="button" onClick={() => setShowUnpaidModal(false)} className="rounded-lg p-1 hover:bg-zinc-100">
                <X className="h-4 w-4 text-zinc-400" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5 text-sm">
              <p className="text-zinc-600">
                {customer?.name} 様の{monthToLabel(month)}分のうち、未入金の明細のみを抜粋した別紙です。
              </p>

              {unpaidSales.length === 0 ? (
                <p className="text-zinc-400">未入金の明細はありません。</p>
              ) : (
                <>
                  <div className="space-y-4">
                    {unpaidGroups.map((group) => (
                      <section key={group.businessId} className="space-y-2">
                        <h3 className="text-xs font-semibold text-zinc-500">【{group.businessName}】</h3>
                        <div className="rounded-lg border border-zinc-200 overflow-hidden">
                          {group.items.map((sale) => (
                            <div
                              key={sale.id}
                              className="grid grid-cols-[1fr_100px] gap-4 border-b border-zinc-100 px-3 py-2 last:border-b-0 text-sm"
                            >
                              <div>{displayDescription(sale.description)}</div>
                              <div className="text-right font-medium">{formatYen(sale.amount)}</div>
                            </div>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>

                  <div className="rounded-xl border border-zinc-200 overflow-hidden">
                    <div className="flex justify-between px-4 py-2 text-sm text-zinc-600">
                      <span>小計（税抜）</span>
                      <span>{formatYen(unpaidTotal)}</span>
                    </div>
                    <div className="flex justify-between border-t border-zinc-100 px-4 py-2 text-sm text-zinc-600">
                      <span>消費税（10%）</span>
                      <span>{formatYen(unpaidTax)}</span>
                    </div>
                    <div className="flex justify-between border-t border-zinc-200 bg-zinc-50 px-4 py-2.5 text-base font-bold text-zinc-900">
                      <span>未入金分 合計（税込）</span>
                      <span className="text-accent">{formatYen(unpaidTotal + unpaidTax)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4 print:hidden">
              <Button variant="outline" onClick={() => window.print()} disabled={unpaidSales.length === 0}>
                PDF出力
              </Button>
              <button type="button" onClick={() => setShowUnpaidModal(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors">
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
