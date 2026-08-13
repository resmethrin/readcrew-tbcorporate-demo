// フードサービス室の 2026-06 分を実測件数（売上228件/月）に合わせて生成する。
// 生成分は id を "sf" で始めるため、再実行しても既存の手書きデータ（s001〜）は壊れない。
//
//   node scripts/gen-food-sales.mjs
//
// 件数のみ実測に寄せ、金額は架空。1件あたりを小口中心にして月合計が跳ねないようにしている。

import { readFileSync, writeFileSync } from "node:fs";

const TARGET_TOTAL = 228; // フードサービス室 売上件数/月（3月・5月実測の平均）
const MONTH = "2026-06";
const BUSINESS_ID = "b004";
const SALES_PATH = new URL("../src/data/sales.json", import.meta.url);

// 決定的な擬似乱数（再実行しても同じデータになるように）
let seed = 20260613;
const random = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};
const pick = (items) => items[Math.floor(random() * items.length)];
const between = (min, max, step) => min + Math.floor(random() * ((max - min) / step + 1)) * step;

// 品目ごとの単価帯と数量帯。喫食代・お弁当が件数の大半を占める実運用に合わせている
const ITEMS = [
  { description: "喫食代（補助含む）", weight: 38, unit: [420, 780, 10],     qty: [5, 60, 5] },
  { description: "お弁当",             weight: 22, unit: [520, 980, 10],     qty: [5, 40, 5] },
  { description: "食材（米）",         weight: 10, unit: [3200, 5800, 100],  qty: [1, 8, 1] },
  { description: "食材（乳製品）",     weight: 10, unit: [1800, 4200, 100],  qty: [1, 10, 1] },
  { description: "廃油他",             weight: 8,  unit: [1200, 2800, 100],  qty: [1, 8, 1] },
  { description: "おしぼり",           weight: 7,  unit: [28, 62, 2],        qty: [100, 500, 50] },
  { description: "自販機手数料",       weight: 5,  unit: [8000, 24000, 1000], qty: [1, 2, 1] },
];

const CUSTOMERS = [
  { id: "c005", weight: 46 }, // 食堂委託会社
  { id: "c006", weight: 24 }, // TBJ従業員（給与天引）
  { id: "c001", weight: 20 }, // T紡織
  { id: "c002", weight: 10 }, // T紡織滋賀
];

const ASSIGNEES = ["田村 誠", "中村 あかり", "佐藤 健太"];
const STATUSES = [
  ...Array(8).fill("paid"),
  ...Array(8).fill("invoiced"),
  ...Array(4).fill("uninvoiced"),
];

const weightedPick = (entries) => {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let threshold = random() * total;
  for (const entry of entries) {
    threshold -= entry.weight;
    if (threshold <= 0) return entry;
  }
  return entries[entries.length - 1];
};

const sales = JSON.parse(readFileSync(SALES_PATH, "utf8"));
const handWritten = sales.filter((sale) => !sale.id.startsWith("sf"));
const existingFoodJune = handWritten.filter(
  (sale) => sale.businessId === BUSINESS_ID && sale.month === MONTH,
).length;

const generated = [];
for (let i = 0; i < TARGET_TOTAL - existingFoodJune; i += 1) {
  const item = weightedPick(ITEMS);
  const unitPrice = between(...item.unit);
  const qty = between(...item.qty);
  generated.push({
    id: `sf${String(i + 1).padStart(3, "0")}`,
    customerId: weightedPick(CUSTOMERS).id,
    businessId: BUSINESS_ID,
    description: item.description,
    amount: unitPrice * qty,
    qty,
    unitPrice,
    month: MONTH,
    status: pick(STATUSES),
    assignee: pick(ASSIGNEES),
  });
}

writeFileSync(SALES_PATH, `${JSON.stringify([...handWritten, ...generated], null, 2)}\n`);

const total = generated.reduce((sum, sale) => sum + sale.amount, 0);
console.log(`生成: ${generated.length}件 / フード室 ${MONTH} 合計 ${existingFoodJune + generated.length}件`);
console.log(`生成分の金額合計: ¥${total.toLocaleString("ja-JP")}（平均 ¥${Math.round(total / generated.length).toLocaleString("ja-JP")}/件）`);
