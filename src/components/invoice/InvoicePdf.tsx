"use client";

import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { formatYen, unitFor, voucherDateLabel } from "@/lib/demo-data";
import type { InvoiceGroup, Sale } from "@/types";

// 日本語フォント（デモで使う文字にサブセット済み）
Font.register({
  family: "NotoSansJP",
  fonts: [
    { src: "/fonts/NotoSansJP-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/NotoSansJP-Bold.ttf", fontWeight: 700 },
  ],
});
// 日本語は単語区切りがないため、行末の折り返しをハイフネーションで壊さない
Font.registerHyphenationCallback((word) => [word]);

const COLORS = {
  text: "#18181b",
  muted: "#71717a",
  light: "#a1a1aa",
  line: "#d4d4d8",
  headBg: "#f4f4f5",
  accent: "#0071e3",
  highlight: "#e0f2fe",
  band: "#ecfdf5",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansJP",
    fontSize: 8,
    color: COLORS.text,
    paddingTop: 36,
    paddingBottom: 46,
    paddingHorizontal: 40,
  },
  row: { flexDirection: "row" },
  spaceBetween: { flexDirection: "row", justifyContent: "space-between" },
  title: { fontSize: 20, fontWeight: 700, letterSpacing: 2 },
  issuer: { textAlign: "right", color: COLORS.muted, lineHeight: 1.5 },
  seal: {
    width: 46,
    height: 46,
    marginLeft: 10,
    borderWidth: 1.5,
    borderColor: "#dc2626",
    color: "#dc2626",
    fontSize: 9,
    fontWeight: 700,
    textAlign: "center",
    paddingTop: 16,
  },
  metaLabel: { width: 52, color: COLORS.light },
  customer: { fontSize: 13, fontWeight: 700 },
  badge: {
    marginLeft: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "#bae6fd",
    color: "#0369a1",
    fontSize: 7,
  },
  sectionTitle: { fontWeight: 700, marginBottom: 4 },
  th: {
    backgroundColor: COLORS.headBg,
    color: COLORS.muted,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.line,
  },
  td: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f4f4f5",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f4f4f5",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    color: COLORS.light,
    fontSize: 7,
  },
});

// 明細の列幅（合計100%）
const COLS = {
  date: "10%",
  voucher: "10%",
  name: "36%",
  qty: "7%",
  unit: "6%",
  price: "13%",
  amount: "13%",
  tax: "5%",
};

export interface InvoicePdfProps {
  invoiceNo: string;
  customerName: string;
  closingLabel: string;
  closingDateLabel: string;
  periodLabel: string;
  dueDateLabel: string;
  monthLabel: string;
  groups: InvoiceGroup[];
  total: number;
  tax: number;
  carryOverMode: boolean;
  carryOver: number;
  prevBilled: number;
  prevPaid: number;
  issuer: {
    name: string;
    postal: string;
    address: string;
    tel: string;
    email: string;
    registrationNo: string;
  };
  bank: { name: string; branch: string; type: string; account: string; holder: string };
  displayAmountOf: (sale: Sale) => number;
  displayDescriptionOf: (sale: Sale) => string;
  referenceNoteOf: (sale: Sale) => string;
}

export function InvoicePdf(props: InvoicePdfProps) {
  const {
    invoiceNo, customerName, closingLabel, closingDateLabel, periodLabel, dueDateLabel,
    monthLabel, groups, total, tax, carryOverMode, carryOver, prevBilled, prevPaid,
    issuer, bank, displayAmountOf, displayDescriptionOf, referenceNoteOf,
  } = props;

  const bandItems: [string, number][] = [
    ["① 前回御請求額", prevBilled],
    ["② 御入金金額", prevPaid],
    ["③ 差引繰越額", carryOver],
    ["④ 今回御買上額", total],
    ["⑤ 消費税", tax],
    ["⑥ 今回御請求額", total + tax],
    ["⑦ 累計御請求額", carryOver + total + tax],
  ];

  return (
    <Document title={`請求書 ${invoiceNo}`}>
      <Page size="A4" style={styles.page} wrap>
        {/* ── ヘッダー ── */}
        <View style={styles.spaceBetween}>
          <View>
            <Text style={styles.title}>請求書</Text>
            <View style={{ marginTop: 14, color: COLORS.muted }}>
              <View style={styles.row}>
                <Text style={styles.metaLabel}>入金期日</Text>
                <Text style={{ fontWeight: 700, color: COLORS.text }}>{dueDateLabel}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.metaLabel}>発行日</Text>
                <Text>{closingDateLabel}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.metaLabel}>請求書番号</Text>
                <Text>{invoiceNo}</Text>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.issuer}>
              <Text style={{ fontSize: 10, fontWeight: 700, color: COLORS.text }}>{issuer.name}</Text>
              <Text>{issuer.postal}</Text>
              <Text>{issuer.address}</Text>
              <Text>TEL: {issuer.tel}</Text>
              <Text>{issuer.email}</Text>
              <Text style={{ marginTop: 3, fontSize: 7 }}>適格請求書発行事業者登録番号</Text>
              <Text style={{ fontSize: 7, color: COLORS.text }}>{issuer.registrationNo}</Text>
            </View>
            <Text style={styles.seal}>各印</Text>
          </View>
        </View>

        {/* ── 請求先 ── */}
        <View style={{ marginTop: 18, borderBottomWidth: 0.5, borderBottomColor: COLORS.line, paddingBottom: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.customer}>{customerName} 御中</Text>
            <Text style={styles.badge}>{closingLabel}</Text>
          </View>
          <View style={{ flexDirection: "row", marginTop: 6, color: COLORS.muted }}>
            <Text style={{ width: 150 }}>締日: {closingDateLabel}</Text>
            <Text>対象期間: {periodLabel}</Text>
          </View>
          <Text style={{ marginTop: 6, color: COLORS.muted }}>
            毎度有難うございます。下記の通り御請求申し上げます。
          </Text>
        </View>

        {/* ── 繰越型の7項目 ── */}
        {carryOverMode && (
          <View style={{ marginTop: 12, borderWidth: 0.5, borderColor: COLORS.line }} wrap={false}>
            <View style={styles.row}>
              {bandItems.map(([label], index) => (
                <Text
                  key={label}
                  style={{
                    width: `${100 / 7}%`,
                    textAlign: "center",
                    paddingVertical: 3,
                    fontSize: 7,
                    backgroundColor: index === 5 ? COLORS.highlight : COLORS.band,
                    borderRightWidth: index === 6 ? 0 : 0.5,
                    borderRightColor: COLORS.line,
                  }}
                >
                  {label}
                </Text>
              ))}
            </View>
            <View style={styles.row}>
              {bandItems.map(([label, value], index) => (
                <Text
                  key={label}
                  style={{
                    width: `${100 / 7}%`,
                    textAlign: "center",
                    paddingVertical: 5,
                    borderTopWidth: 0.5,
                    borderTopColor: COLORS.line,
                    borderRightWidth: index === 6 ? 0 : 0.5,
                    borderRightColor: COLORS.line,
                    fontWeight: index === 5 ? 700 : 400,
                  }}
                >
                  {formatYen(value)}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* ── 請求金額サマリ ── */}
        <View style={{ marginTop: 14, backgroundColor: COLORS.headBg, padding: 10, borderRadius: 4 }} wrap={false}>
          <Text style={{ color: COLORS.muted }}>ご請求金額（税込）</Text>
          <Text style={{ fontSize: 18, fontWeight: 700, color: COLORS.accent, marginTop: 2 }}>
            {formatYen(carryOverMode ? carryOver + total + tax : total + tax)}
          </Text>
          <View style={{ flexDirection: "row", marginTop: 4, color: COLORS.muted }}>
            <Text style={{ width: 110 }}>対象月: {monthLabel}</Text>
            <Text style={{ width: 230 }}>対象期間: {periodLabel}</Text>
            <Text>入金期日: {dueDateLabel}</Text>
          </View>
        </View>

        {/* ── 明細（ページをまたぐ場合は列見出しを各ページで繰り返す）── */}
        {groups.map((group) => (
          <View key={group.businessId} style={{ marginTop: 14 }}>
            <Text style={styles.sectionTitle}>【{group.businessName}】</Text>
            <View style={{ borderWidth: 0.5, borderColor: COLORS.line, borderRadius: 2 }}>
              <View style={styles.row} fixed>
                <Text style={[styles.th, { width: COLS.date }]}>年月日</Text>
                <Text style={[styles.th, { width: COLS.voucher }]}>伝票No.</Text>
                <Text style={[styles.th, { width: COLS.name }]}>商品名</Text>
                <Text style={[styles.th, { width: COLS.tax, textAlign: "center" }]}>税率</Text>
                <Text style={[styles.th, { width: COLS.qty, textAlign: "right" }]}>数量</Text>
                <Text style={[styles.th, { width: COLS.unit, textAlign: "center" }]}>単位</Text>
                <Text style={[styles.th, { width: COLS.price, textAlign: "right" }]}>単価</Text>
                <Text style={[styles.th, { width: COLS.amount, textAlign: "right" }]}>金額</Text>
              </View>

              {group.items.map((sale) => {
                const amount = displayAmountOf(sale);
                const reference = referenceNoteOf(sale);
                return (
                  <View key={sale.id} style={styles.row} wrap={false}>
                    <Text style={[styles.td, { width: COLS.date, color: COLORS.muted }]}>
                      {voucherDateLabel(sale.orderDate)}
                    </Text>
                    <Text style={[styles.td, { width: COLS.voucher, color: COLORS.muted }]}>
                      {sale.voucherNo ?? "—"}
                    </Text>
                    <View style={[styles.td, { width: COLS.name }]}>
                      <Text>{displayDescriptionOf(sale)}</Text>
                      {sale.note ? (
                        <Text style={{ marginTop: 1, fontSize: 7, color: COLORS.muted }}>（{sale.note}）</Text>
                      ) : null}
                      {reference ? (
                        <Text style={{ marginTop: 1, fontSize: 7, color: COLORS.light }}>{reference}</Text>
                      ) : null}
                    </View>
                    <Text style={[styles.td, { width: COLS.tax, textAlign: "center", color: COLORS.muted }]}>
                      {sale.taxRate ?? 10}%
                    </Text>
                    <Text style={[styles.td, { width: COLS.qty, textAlign: "right" }]}>{sale.qty ?? 1}</Text>
                    <Text style={[styles.td, { width: COLS.unit, textAlign: "center", color: COLORS.muted }]}>
                      {sale.unit ?? unitFor(sale.description)}
                    </Text>
                    <Text style={[styles.td, { width: COLS.price, textAlign: "right" }]}>
                      {formatYen(sale.unitPrice ?? Math.round(amount / (sale.qty ?? 1)))}
                    </Text>
                    <Text style={[styles.td, { width: COLS.amount, textAlign: "right", fontWeight: 700 }]}>
                      {formatYen(amount)}
                    </Text>
                  </View>
                );
              })}

              <Text
                style={{
                  textAlign: "right",
                  paddingVertical: 4,
                  paddingHorizontal: 6,
                  backgroundColor: COLORS.headBg,
                  fontWeight: 700,
                }}
              >
                小計: {formatYen(group.subtotal)}
              </Text>
            </View>
          </View>
        ))}

        {/* ── 合計 ── */}
        <View
          style={{ marginTop: 14, borderWidth: 0.5, borderColor: COLORS.line, borderRadius: 2 }}
          wrap={false}
        >
          <View style={styles.totalRow}>
            <Text style={{ color: COLORS.muted }}>{carryOverMode ? "④ 今回御買上額（税抜）" : "小計（税抜）"}</Text>
            <Text>{formatYen(total)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={{ color: COLORS.muted }}>{carryOverMode ? "⑤ 消費税（10%）" : "消費税（10%）"}</Text>
            <Text>{formatYen(tax)}</Text>
          </View>
          {carryOverMode && (
            <View style={[styles.totalRow, { backgroundColor: "#fffbeb" }]}>
              <Text style={{ color: "#92400e" }}>③ 差引繰越額</Text>
              <Text style={{ color: "#92400e" }}>{formatYen(carryOver)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, { backgroundColor: COLORS.headBg, borderBottomWidth: 0 }]}>
            <Text style={{ fontWeight: 700 }}>{carryOverMode ? "⑦ 累計御請求額（税込）" : "合計（税込）"}</Text>
            <Text style={{ fontWeight: 700, color: COLORS.accent }}>
              {formatYen(carryOverMode ? carryOver + total + tax : total + tax)}
            </Text>
          </View>
        </View>

        {/* ── 振込先 ── */}
        <View
          style={{ marginTop: 14, borderWidth: 0.5, borderColor: COLORS.line, borderRadius: 2, padding: 10 }}
          wrap={false}
        >
          <Text style={{ fontWeight: 700, marginBottom: 5 }}>お振込先</Text>
          <View style={styles.row}>
            <Text style={{ width: 160 }}>
              <Text style={{ color: COLORS.light }}>銀行名 </Text>
              {bank.name}
            </Text>
            <Text style={{ width: 160 }}>
              <Text style={{ color: COLORS.light }}>支店名 </Text>
              {bank.branch}
            </Text>
            <Text>
              <Text style={{ color: COLORS.light }}>口座種別 </Text>
              {bank.type}
            </Text>
          </View>
          <View style={[styles.row, { marginTop: 3 }]}>
            <Text style={{ width: 160 }}>
              <Text style={{ color: COLORS.light }}>口座番号 </Text>
              {bank.account}
            </Text>
            <Text>
              <Text style={{ color: COLORS.light }}>口座名義 </Text>
              {bank.holder}
            </Text>
          </View>
          <Text style={{ marginTop: 5, fontSize: 7, color: COLORS.muted }}>
            振込手数料はご負担をお願いいたします。振込完了後、本書をもって領収書に代えさせていただきます。
          </Text>
        </View>

        {/* ── フッター（全ページ）── */}
        <View style={styles.footer} fixed>
          <Text>デモ環境 — データはすべて架空です</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
