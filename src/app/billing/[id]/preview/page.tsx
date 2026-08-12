"use client";

import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Copy, FileText, Link2, Mail, X } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { demoCustomers, formatYen, groupSalesByBusiness, invoiceNumberForMonth, monthToLabel } from "@/lib/demo-data";
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
  const groups = useMemo(() => groupSalesByBusiness(targetSales), [targetSales]);
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

  // 入金期限: 翌月末
  const [y, m] = month.split("-").map(Number);
  const dueMonth = m === 12 ? 1 : m + 1;
  const dueYear = m === 12 ? y + 1 : y;
  const dueDaysInMonth = new Date(dueYear, dueMonth, 0).getDate();
  const dueDateLabel = `${dueYear}年${dueMonth}月${dueDaysInMonth}日`;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Link href="/billing" className="mb-2 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900">
            <ArrowLeft className="h-3.5 w-3.5" />
            請求一覧に戻る
          </Link>
          <div className="text-sm font-medium text-zinc-500">Billing</div>
          <h1 className="mt-1 text-xl font-semibold text-zinc-900">請求書プレビュー</h1>
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

      <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-3 print:hidden">
        <div className="text-sm">
          <span className="font-medium text-zinc-700">税抜統一表示</span>
          <span className="ml-2 text-xs text-zinc-400">
            {unifiedTaxDisplay ? "After: 全明細を税抜表示に統一" : "Before: 税込入力の明細が混在したまま表示"}
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={unifiedTaxDisplay}
          onClick={() => setUnifiedTaxDisplay((v) => !v)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${unifiedTaxDisplay ? "bg-[#0071e3]" : "bg-zinc-200"}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${unifiedTaxDisplay ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>

      <Card className="bg-white shadow-sm print:shadow-none">
        <CardContent className="space-y-8 p-10 text-sm leading-7 text-zinc-900">

          {/* ヘッダー: タイトル + 発行者情報 */}
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
            <div className="text-lg font-semibold">
              {customer?.name} <span className="font-normal">御中</span>
            </div>
            <p className="mt-2 text-zinc-600">
              下記の通りご請求申し上げます。
            </p>
          </div>

          {/* 請求金額サマリ */}
          <div className="rounded-xl bg-zinc-50 px-6 py-4">
            <div className="text-sm text-zinc-500">ご請求金額（税込）</div>
            <div className="mt-1 text-3xl font-bold text-accent">{formatYen(total + tax)}</div>
            <div className="mt-2 flex gap-6 text-sm text-zinc-600">
              <span>対象月: {monthToLabel(month)}</span>
              <span>入金期限: {dueDateLabel}</span>
            </div>
          </div>

          {/* 明細 */}
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={group.businessId} className="space-y-3">
                <h2 className="font-semibold text-zinc-700">【{group.businessName}】</h2>
                <div className="rounded-lg border border-zinc-200 overflow-hidden">
                  <div className="grid grid-cols-[1fr_80px_130px_130px] gap-4 border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-500">
                    <div>内容</div>
                    <div className="text-right">数量</div>
                    <div className="text-right">単価</div>
                    <div className="text-right">金額</div>
                  </div>
                  {group.items.map((sale) => {
                    const taxInclusiveInput = isTaxInclusiveInput(sale.description);
                    const displayAmount = taxInclusiveInput && unifiedTaxDisplay ? exclusiveAmount(sale.amount) : sale.amount;
                    return (
                      <div
                        key={sale.id}
                        className="grid grid-cols-[1fr_80px_130px_130px] gap-4 border-b border-zinc-100 px-4 py-2.5 last:border-b-0 text-sm"
                      >
                        <div>
                          {displayDescription(sale.description)}
                          {taxInclusiveInput && !unifiedTaxDisplay && (
                            <span className="ml-2 inline-flex items-center rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">税込</span>
                          )}
                          {taxInclusiveInput && unifiedTaxDisplay && (
                            <div className="mt-0.5 text-[11px] text-zinc-400">参考価格: 税込{formatYen(sale.amount)}</div>
                          )}
                        </div>
                        <div className="text-right">{sale.qty ?? 1}</div>
                        <div className="text-right">{formatYen(sale.unitPrice ?? Math.round(displayAmount / (sale.qty ?? 1)))}</div>
                        <div className="text-right font-medium">{formatYen(displayAmount)}</div>
                      </div>
                    );
                  })}
                  <div className="flex justify-end border-t border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium">
                    小計: {formatYen(group.subtotal)}
                  </div>
                </div>
              </section>
            ))}
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
