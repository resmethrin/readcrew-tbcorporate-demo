# P4: デモの運び・演出 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. **Prerequisite: P0, P1 Task2(preview-v2), P2 Task1(楽楽連携), P1 Task1(伝票消込) が完了していること**（本フェーズはそれらを1つの動線につなぐ演出フェーズのため）。

**Goal:** 個々の機能を「フード室の1ヶ月」という5分デモシナリオでつなぎ、効果カード・商蔵語彙併記・購買領域プレースホルダで説得力を底上げする。

**Architecture:** 既存画面への軽微な追加のみ（新規データモデルなし）。

**Tech Stack:** Next.js 16 App Router / TypeScript。

## Global Constraints

- 本フェーズは既存画面のコピー・軽微なUI追加のみで、ロジック変更は行わない。

---

## Task 1: ダッシュボードに効果カードを追加

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: 効果カードコンポーネントを追加する**

既存のKPIカード群（今月着地予測/確定売上/売掛残高）の並びに4枚目のカードとして追加する：「請求業務時間: 12.0H → 1.5H/月（現行 6.0H×2名 基準）」という文言と、Before/Afterを視覚的に示す簡易バー（横幅比率で表現、他のカードと同じ `src/components/ui/card.tsx` を使用）。

- [ ] **Step 2: 動作確認**

`/dashboard` でカードが表示されることを確認する。

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: ダッシュボードに請求業務時間の効果カードを追加"
```

---

## Task 2: 商蔵語彙の併記

**Files:**
- Modify: `src/app/payments/page.tsx`
- Modify: `src/app/billing/page.tsx`

- [ ] **Step 1: ページ見出しに商蔵語彙を括弧併記する**

`src/app/payments/page.tsx` のページタイトル「入金管理」を「入金管理〈回収消込〉」に変更する。
`src/app/billing/page.tsx` のページタイトル「請求一覧」を「請求一覧〈請求締処理〉」に変更する。

- [ ] **Step 2: 動作確認**

両ページで見出しが変わっていることを確認する。

- [ ] **Step 3: Commit**

```bash
git add src/app/payments/page.tsx src/app/billing/page.tsx
git commit -m "feat: 入金管理・請求一覧の見出しに商蔵語彙を併記"
```

---

## Task 3: 購買領域のプレースホルダタブ

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Create: `src/app/procurement/page.tsx`

- [ ] **Step 1: プレースホルダページを作成する**

`src/app/procurement/page.tsx` を作成し、「発注・仕入・支払（蔵奉行領域）」という見出しと、「Phase 1で構築予定のスコープです」という説明文、想定される機能領域の箇条書き（発注管理・仕入計上・支払管理）を表示する静的ページにする。

- [ ] **Step 2: Sidebarに追加する**

`src/components/layout/Sidebar.tsx` の `nav` 配列末尾に追加：

```ts
{ href: "/procurement", label: "発注・仕入・支払（Phase 1）", icon: PackageSearch };
```

- [ ] **Step 3: 動作確認**

Sidebarから `/procurement` に遷移し、スコープ説明が表示されることを確認する。

- [ ] **Step 4: Commit**

```bash
git add src/app/procurement/page.tsx src/components/layout/Sidebar.tsx
git commit -m "feat: 購買領域（Phase 1スコープ）のプレースホルダページを追加"
```

---

## Task 4: デモ用メモの差し替え

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: フッター文言を差し替える**

Sidebarフッターの静的「デモ用メモ」ボックスの文言を「顧客切替・月切替・事業別集計がそのまま動くことを優先」から「貴社の運用フロー資料・経理からの要望を反映したデモです」に変更する。

- [ ] **Step 2: 動作確認**

任意のページでSidebarフッターの文言が変わっていることを確認する。

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "docs: デモ用メモの文言を要望反映済みメッセージに変更"
```

---

## Self-Review Notes

- 「デモシナリオを5分で1周する動線」自体（原文spec 4-1の前半）は、個々の画面が完成していれば操作手順として口頭で説明可能であり、専用の「シナリオモード」画面は本計画では作らない。過剰実装を避けるための判断。必要になれば別タスクとして追加する。
