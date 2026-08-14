// 各売上に発注日（orderDate）と伝票No.（voucherNo）を付与する。
//
//   node scripts/gen-voucher-fields.mjs
//
// 請求書サンプルの明細が「年月日 / 伝票No. / 商品名 / 数量 / 単位 / 単価 / 金額 / 備考」
// の並びなので、それに必要な2項目をデータ側に持たせる。
//
// 発注日は得意先の締日区分に応じた請求対象期間に収まるようにする。
//   25日締め : 前月26日 〜 当月25日
//   月末締め : 当月1日  〜 当月末日
// 伝票No. は発注日の古い順に採番する（実物と同じく日付と番号の並びが揃う）。
// 決定的に生成するので再実行しても同じ結果になる。

import { readFileSync, writeFileSync } from "node:fs";

const SALES_PATH = new URL("../src/data/sales.json", import.meta.url);
const CUSTOMERS_PATH = new URL("../src/data/customers.json", import.meta.url);
const VOUCHER_NO_START = 596000;

const sales = JSON.parse(readFileSync(SALES_PATH, "utf8"));
const customers = JSON.parse(readFileSync(CUSTOMERS_PATH, "utf8"));

const isDay25Closing = (customerId) =>
  Boolean(customers.find((c) => c.id === customerId)?.closingDay?.startsWith("25"));

// 伝票IDから決まる 0〜1 の値（同じIDなら常に同じ日付になる）
const ratioFromId = (id) => {
  let hash = 7;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 100003;
  return hash / 100003;
};

const pad = (n) => String(n).padStart(2, "0");
const lastDayOf = (y, m) => new Date(y, m, 0).getDate();

const orderDateFor = (sale) => {
  const [y, m] = sale.month.split("-").map(Number);
  const ratio = ratioFromId(sale.id);

  if (isDay25Closing(sale.customerId)) {
    // 前月26日〜当月25日を1本の範囲として扱う
    const prevY = m === 1 ? y - 1 : y;
    const prevM = m === 1 ? 12 : m - 1;
    const prevTail = lastDayOf(prevY, prevM) - 26 + 1;
    const offset = Math.floor(ratio * (prevTail + 25));
    return offset < prevTail
      ? `${prevY}-${pad(prevM)}-${pad(26 + offset)}`
      : `${y}-${pad(m)}-${pad(offset - prevTail + 1)}`;
  }

  return `${y}-${pad(m)}-${pad(1 + Math.floor(ratio * lastDayOf(y, m)))}`;
};

for (const sale of sales) {
  sale.orderDate = sale.orderDate ?? orderDateFor(sale);
}

// 発注日順に伝票No.を採番
[...sales]
  .sort((a, b) => (a.orderDate === b.orderDate ? a.id.localeCompare(b.id) : a.orderDate.localeCompare(b.orderDate)))
  .forEach((sale, index) => {
    sale.voucherNo = sale.voucherNo ?? String(VOUCHER_NO_START + index);
  });

writeFileSync(SALES_PATH, `${JSON.stringify(sales, null, 2)}\n`);
console.log(`発注日・伝票No.を付与: ${sales.length}件`);
