# P1: 経理の名指し課題を「解決済み画面」で見せる Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Prerequisite: P0 (2026-08-12-p0-data-replacement.md) が完了していること**（新5室id・新顧客idに依存する画面を追加するため）。

**Goal:** 経理が名指しした3つの課題（入金消込が伝票単位でできない／差引繰越額の誤解／税込税抜混在）を、それぞれ「解決済みの画面」としてデモで見せる。

**Architecture:** 既存の `useSalesStore`（zustand）に消込用の新アクションを追加し、`payments/page.tsx` に展開消込UIを追加する。請求書プレビューは新規ルート `billing/[id]/preview-v2` として当月完結型を追加実装し（既存の繰越型プレビューは残し、Before/After比較用に温存する）、税抜統一トグルもこのv2ページ内に実装する。

**Tech Stack:** Next.js 16 App Router / TypeScript / Zustand / 既存UIコンポーネント（`src/components/ui/*`）を再利用。

## Global Constraints

- P0で確定した型（`Sale`, `Customer` with `billingType`/`closingDay`）を変更しない。
- 新規追加するのは「加算」のみ（既存 `billing/[id]/preview` は壊さない）。Before/After比較を成立させるため、旧プレビュー画面は削除・改変しない。
- 金額はすべて `formatYen`（`src/lib/demo-data.ts`）を使う。独自のフォーマットを書かない。

---

## Task 1: 入金消込を伝票単位に展開する

**Files:**
- Modify: `src/store/useSalesStore.ts`
- Modify: `src/app/payments/page.tsx`

**Interfaces:**
- Produces: `useSalesStore` に `markPaidByIds(ids: string[])` は既存のまま維持。新規 `partialPayments: Record<string, number>`（saleId → 入金済み累計額）を state に追加し、`recordPartialPayment(saleId: string, amount: number)` アクションを追加する。

- [ ] **Step 1: ストアに部分入金の記録機構を追加する**

`src/store/useSalesStore.ts` の `SalesStore` interface に追加：

```ts
interface SalesStore {
  sales: Sale[];
  partialPayments: Record<string, number>;
  addSale: (sale: Sale) => void;
  updateSale: (id: string, patch: Partial<Omit<Sale, "id">>) => void;
  updateStatus: (id: string, status: SaleStatus) => void;
  markConsolidatedByIds: (ids: string[]) => void;
  markInvoicedByIds: (ids: string[]) => void;
  markPaidByIds: (ids: string[]) => void;
  recordPartialPayment: (saleId: string, amount: number) => void;
}
```

実装本体に `partialPayments: {}` の初期値と、以下のアクションを追加：

```ts
recordPartialPayment: (saleId, amount) =>
  set((state) => ({
    partialPayments: {
      ...state.partialPayments,
      [saleId]: (state.partialPayments[saleId] ?? 0) + amount,
    },
  })),
```

- [ ] **Step 2: 入金管理テーブルの請求行を展開可能にする**

`src/app/payments/page.tsx` の既存の行展開機構（`expandedRows: Set<string>`, billing/page.tsx と同型パターン）はすでに明細行を展開表示できる。この展開明細行に、伝票（`Sale`）ごとのチェックボックスと「この伝票を消込」ボタンを追加する。各伝票行に、その伝票の `amount` と `partialPayments[sale.id] ?? 0` から残額 `amount - (partialPayments[sale.id] ?? 0)` を表示する。残額が0になった伝票は行に「消込済」バッジを表示し、チェックボックスをdisabledにする。

- [ ] **Step 3: 部分入金入力UIを追加する**

明細行の消込ボタンから `Dialog`（`src/components/ui/dialog.tsx` を使用）を開き、入金額を入力する数値フィールドを表示する。確定時に `recordPartialPayment(saleId, amount)` を呼ぶ。入力額が残額を超える場合はエラー表示（`errors` state、`sales/new/page.tsx` の既存エラー表示パターンを踏襲）。

- [ ] **Step 4: 請求単位の一括消込ボタンは残す**

既存の「まとめて入金済にする」ボタン（`markPaidByIds` 呼び出し）はそのまま残す。Step 2〜3で追加する伝票単位消込は、同じ行の中に「請求単位」「伝票単位」の2つの操作が併存する形にする。

- [ ] **Step 5: 消込済照会ビューの軸切り替えを追加**

入金管理ページ上部に「伝票基準 / 入金基準」のタブ（`src/components/ui/tabs.tsx` を使用）を追加する。伝票基準＝現行の請求行ベース表示。入金基準＝`partialPayments` を日時なしの単純な入金記録一覧として横断表示する簡易テーブル（saleId, 得意先名, 入金額, 対象伝票の内容）。

- [ ] **Step 6: 動作確認**

`npm run dev` → `/payments` で、請求 ¥4,889,500 相当の行を展開し、部分入金 ¥4,700,000 を記録 → 残額 ¥189,500 の伝票が特定できることを確認する（spec 1-1 の例に対応するテストデータが必要な場合、該当する高額売上レコードを `sales.json` に1件追加してよい）。

- [ ] **Step 7: Commit**

```bash
git add src/store/useSalesStore.ts src/app/payments/page.tsx
git commit -m "feat: 入金消込を伝票単位に展開可能にする"
```

---

## Task 2: 請求書プレビュー v2（当月完結型）+ 未入金分別発行

**Files:**
- Create: `src/app/billing/[id]/preview-v2/page.tsx`
- Modify: `src/app/billing/page.tsx`（v2への導線リンク追加）

**Interfaces:**
- Consumes: `groupSalesByBusiness`, `getCustomerName`, `formatYen`, `monthToLabel`, `invoiceNumberForMonth`（すべて `src/lib/demo-data.ts` から既存export）
- Produces: なし（末端ページ）

- [ ] **Step 1: 既存プレビューをベースに新ファイルを作成する**

`src/app/billing/[id]/preview/page.tsx` の全体構造（`ISSUER`/`BANK` 定数、`groups.map` 描画、アクションボタン群）をコピーして `src/app/billing/[id]/preview-v2/page.tsx` を作成する。

- [ ] **Step 2: 繰越欄を除去し当月完結型にする**

コピー元にある「前回御請求額」「入金額」「差引繰越額」「累計御請求額」に相当する欄（存在する場合）を削除し、対象月の明細と当月請求金額のみを表示する構成にする。合計box は「小計 / 消費税10% / 今回御請求額」の3行のみとする。

- [ ] **Step 3: 「未入金分請求書を別発行」ボタンを追加**

`groups`（`groupSalesByBusiness` の結果）から `status !== "paid"` の明細のみを抽出した別紙プレビューを、同ページ内のモーダル（`src/components/ui/dialog.tsx`）として表示するボタンを追加する。別紙にも当月完結型と同じ合計box構成を使う。

- [ ] **Step 4: 締日ズレのデモケースをデータに仕込む**

P0で追加した `c001`（T紡織、25日締め）向けの売上レコードのうち1件を、`month` を月末ではなく25日締めの実務に合わせた説明が伝わるよう `description` に「（25日締め分）」を含める形で `sales.json` に反映する（新規レコード追加、または既存T紡織レコードの `description` 編集）。

- [ ] **Step 5: 請求一覧からv2への導線を追加**

`src/app/billing/page.tsx` の統合ビュー内、既存の「請求書プレビュー」リンクの隣に「請求書プレビュー（新方式）」リンクを追加し、`/billing/${customerId}-${month}/preview-v2?...` へ遷移させる。

- [ ] **Step 6: 動作確認**

`/billing` → T紡織（`c001`）の統合ビューを開き、新旧両方のプレビューリンクから遷移できること、v2に繰越欄が無いこと、未入金分別発行ボタンが機能することを確認する。

- [ ] **Step 7: Commit**

```bash
git add src/app/billing/[id]/preview-v2 src/app/billing/page.tsx src/data/sales.json
git commit -m "feat: 請求書プレビューv2（当月完結型）と未入金分別発行を追加"
```

---

## Task 3: 税抜統一 + Before/After トグル

**Files:**
- Modify: `src/app/billing/[id]/preview-v2/page.tsx`

**Interfaces:**
- Consumes: Task 2 で作成した preview-v2 の明細描画部分

- [ ] **Step 1: 税込/税抜混在データを1件仕込む**

`src/data/sales.json` の食堂委託会社（`c005`）向けレコードのうち1件を、他とは異なる税処理（税込入力）を表す `description` に「（税込入力）」を付与する形で用意する（データモデルに税区分フィールドが無いため、備考文言で区別を表現する）。

- [ ] **Step 2: Before/Afterトグルを実装する**

preview-v2 ページに `useState<boolean>` の `unifiedTaxDisplay` を追加し、トグルスイッチ（`src/components/ui/checkbox.tsx` を流用、またはシンプルなボタン2択）を設置する。

- OFF（Before）: 該当明細行の金額をそのまま表示し、行の隣に小さく「税込」バッジを出す（混在の様子を再現）。
- ON（After）: 全明細を税抜金額表示に統一し、該当行の備考欄下に「参考価格: 税込◯◯円」を自動計算（`Math.round(amount * 1.1)`）して印字する。

- [ ] **Step 3: 動作確認**

preview-v2 を開き、トグルON/OFFで表示が3秒で変わることを目視確認する。

- [ ] **Step 4: Commit**

```bash
git add src/app/billing/[id]/preview-v2/page.tsx src/data/sales.json
git commit -m "feat: 請求書プレビューに税抜統一のBefore/Afterトグルを追加"
```

---

## Self-Review Notes

- Task 1 の「入金基準」ビューは簡易実装（`partialPayments` の生の記録一覧）にとどめている。商蔵の消込30機能相当の完全な突合ロジックはデモの目的（既視感の演出）を超えるため意図的にスコープ外とした。
- Task 3 は税区分フィールドをデータモデルに追加していない（`description` の文言で表現）。恒久対応する場合は `Sale` 型に `taxInclusive?: boolean` を追加する設計変更が必要 — P1では見送り、Phase 0ヒアリングで実運用の税区分ロジックを確認してから型を拡張する。
