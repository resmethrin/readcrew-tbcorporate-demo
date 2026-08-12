# P2: 3段階運用の解消を1クリックで Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. **Prerequisite: P0完了**（5室・新顧客idに依存）。P1完了は必須ではないが、先に完了していると導線が自然になる。

**Goal:** 「商蔵→Excel加工→楽楽明細取込」という3段階運用を「1クリック連携」に見せる画面と、取込元が複数混在する実態（Decssy取込／Excel・CSV取込／手入力）をハブとして見せる画面を追加する。

**Architecture:** 既存の `billing/page.tsx`（請求一覧）にボタンとステータス表示を追加。既存の孤立ページ `src/app/import/page.tsx` をベースに、取込経路を選択できるUIへ拡張し、Sidebarに正式なナビ項目として追加する。

**Tech Stack:** Next.js 16 App Router / TypeScript / 既存UIコンポーネント。

## Global Constraints

- 実際の楽楽明細APIとは連携しない（デモのため、トースト通知とステータス表示のみ）。
- `src/app/import/page.tsx` は現状Sidebarにリンクが無い孤立ページ — 本フェーズでナビに正式追加する。

---

## Task 1: 「楽楽明細へ連携」ボタン

**Files:**
- Modify: `src/app/billing/page.tsx`
- Modify: `src/types/index.ts`（`Sale` に連携済みフラグを追加）

**Interfaces:**
- Produces: `Sale` 型に `rakurakuSynced?: boolean` を追加（任意フィールド、既存データに影響なし）。

- [ ] **Step 1: 型に連携済みフラグを追加**

`src/types/index.ts` の `Sale` interface に `rakurakuSynced?: boolean` を追加する。

- [ ] **Step 2: ストアに連携アクションを追加**

`src/store/useSalesStore.ts` に `markRakurakuSyncedByIds: (ids: string[]) => void` を追加（既存の `markInvoicedByIds` と同型パターンで、`sales` を map して該当idの `rakurakuSynced: true` をセットする）。

- [ ] **Step 3: 請求一覧のCSV出力ボタンの隣にボタンを追加**

`src/app/billing/page.tsx` のリストビュー、既存の「CSV出力」ボタン（現状onClickなしの非機能プレースホルダ）の隣に「楽楽明細へ連携」ボタンを追加する。クリック時:
1. 選択中の請求行（または全表示行）の saleId 群に対し `markRakurakuSyncedByIds` を呼ぶ
2. トースト風の通知（`src/components/ui/dialog.tsx` を流用した簡易モーダルでよい）に「楽楽明細向けデータを生成しました — Excel加工は不要です」を表示
3. 対象行に「連携済」バッジ（`src/components/ui/badge.tsx`）を表示

- [ ] **Step 4: 現行対比キャプションを追加**

ボタン付近に小さいキャプションテキストで「現行: 商蔵→Excel加工→楽楽取込（3段階） → 本システム: 1クリック」を表示する。

- [ ] **Step 5: 連携データの項目リストを明示**

ボタン隣に「連携データに含まれる項目」を開く小さいリンク/ポップオーバーを設置し、以下の項目リストを表示する（Phase 0ヒアリングで実物のExcel加工項目リストに差し替える前提の暫定リスト）：

```
請求書番号 / 請求日 / 得意先名 / 品目 / 数量 / 単価 / 金額 / 消費税額 / 担当室
```

- [ ] **Step 6: 動作確認**

`/billing` で連携ボタンを押し、通知表示とバッジ付与を確認する。

- [ ] **Step 7: Commit**

```bash
git add src/app/billing/page.tsx src/store/useSalesStore.ts src/types/index.ts
git commit -m "feat: 請求一覧に楽楽明細への1クリック連携ボタンを追加"
```

---

## Task 2: 取込ハブ化

**Files:**
- Modify: `src/app/import/page.tsx`
- Modify: `src/components/layout/Sidebar.tsx`

**Interfaces:**
- Consumes: `demoCustomers`, `demoBusinesses`, `useSalesStore((s) => s.addSale)`（すべて既存import、変更不要）

- [ ] **Step 1: Sidebarに正式なナビ項目として追加する**

`src/components/layout/Sidebar.tsx` の `nav` 配列に以下を追加（「入金管理」の後）：

```ts
{ href: "/import", label: "取込", icon: Upload },
```

`lucide-react` から `Upload` アイコンをimportに追加する。

- [ ] **Step 2: 取込経路を3つに拡張する**

`src/app/import/page.tsx` の既存UI（ドロップゾーン＋「サンプルデータ読込」ボタン）を、タブ切り替え（`src/components/ui/tabs.tsx`）で3経路に分ける：

- **Decssy取込タブ**: 既存のドロップゾーンUIをこのタブに移設（見た目のみ、実ファイル処理はしないプレースホルダのまま）
- **Excel・CSV取込タブ**: `src/app/sales/page.tsx` に既にある実装済みのExcelインポート機構（`xlsx` 動的import、ヘッダー名パース、プレビューモーダル、`addSale` 確定）と同等のロジックをこのタブに実装する。既存実装をコピーしてそのまま使ってよい。
- **手入力タブ**: 既存の「サンプルデータ読込」ボタンと `sampleSales` プレビュー表示をこのタブに残す。

- [ ] **Step 3: フード室ケースで混在を見せる**

`sampleSales` 配列に、P0で追加したフード室（`b004`）の Decssy取込想定レコードと、フード以外の仕入先（ヤマダ電機・ホシザキ等）を想定した手入力レコードを追加し、取込プレビューの一覧に「取込元」列（`"Decssy"` / `"手入力"` の文字列、表示専用でデータ型追加は不要）を出す。

- [ ] **Step 4: 動作確認**

`/import` にSidebarからアクセスでき、3タブが切り替わることを確認する。

- [ ] **Step 5: Commit**

```bash
git add src/app/import/page.tsx src/components/layout/Sidebar.tsx
git commit -m "feat: データ取込ページをDecssy/Excel/手入力の3経路ハブにしSidebarへ追加"
```

---

## Self-Review Notes

- Task 2 で `import/page.tsx` の実ファイル処理（Decssyタブ）は依然プレースホルダのまま。実データ連携の要否はPhase 0ヒアリング後に判断する（原文spec末尾の確認事項）。
