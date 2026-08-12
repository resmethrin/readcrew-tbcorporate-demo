# P3: 統制（稟議・監査の目に応える）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. **Prerequisite: P0完了**。

**Goal:** マスタ申請ワークフロー・スポット取引先簡易登録・操作ログ画面を追加し、経理要望とリスク評価表の統制ニーズに応える。

**Architecture:** 新規のワークフロー用データ（承認申請の状態）と操作ログはページ内 `useState` によるモックデータで表現する（既存の `useSalesStore` を拡張せず、統制系は独立した軽量ストアとして新設する — 売上データと責務が異なるため）。

**Tech Stack:** Next.js 16 App Router / TypeScript / Zustand（新規ストア）。

## Global Constraints

- 本フェーズは「統制の存在」をデモで示すことが目的であり、実際の承認ロジック・監査基盤は実装しない。

---

## Task 1: マスタ申請ワークフロー

**Files:**
- Create: `src/store/useMasterApprovalStore.ts`
- Create: `src/app/masters/page.tsx`
- Modify: `src/components/layout/Sidebar.tsx`

**Interfaces:**
- Produces: `MasterApprovalRequest { id: string; targetType: '得意先' | '商品'; targetName: string; requestedBy: string; status: '承認待ち' | '承認済み'; history: { actor: string; role: string; action: string; at: string }[] }`。`useMasterApprovalStore` は `requests: MasterApprovalRequest[]`、`submitRequest(targetType, targetName, requestedBy)`、`approve(id, actor, role)` を公開する。

- [ ] **Step 1: 承認ワークフロー用ストアを新設する**

`src/store/useMasterApprovalStore.ts` を作成し、`useSalesStore.ts` と同じzustandパターンで実装する：

```ts
import { create } from "zustand";

export interface MasterApprovalRequest {
  id: string;
  targetType: "得意先" | "商品";
  targetName: string;
  requestedBy: string;
  status: "承認待ち" | "承認済み";
  history: { actor: string; role: string; action: string; at: string }[];
}

interface MasterApprovalStore {
  requests: MasterApprovalRequest[];
  submitRequest: (targetType: "得意先" | "商品", targetName: string, requestedBy: string) => void;
  approve: (id: string, actor: string, role: string) => void;
}

export const useMasterApprovalStore = create<MasterApprovalStore>((set) => ({
  requests: [],
  submitRequest: (targetType, targetName, requestedBy) =>
    set((state) => ({
      requests: [
        ...state.requests,
        {
          id: `req-${state.requests.length + 1}`,
          targetType,
          targetName,
          requestedBy,
          status: "承認待ち",
          history: [{ actor: requestedBy, role: "申請者", action: "申請", at: "2026-06-19" }],
        },
      ],
    })),
  approve: (id, actor, role) =>
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === id
          ? { ...r, status: "承認済み", history: [...r.history, { actor, role, action: "承認", at: "2026-06-20" }] }
          : r
      ),
    })),
}));
```

- [ ] **Step 2: マスタ管理ページを新設する**

`src/app/masters/page.tsx` を作成し、既存ページのレイアウトパターン（`src/app/payments/page.tsx` のheader+Card構成）を踏襲する：
- 新規登録フォーム（対象種別select: 得意先/商品、名称input、申請者input）→「申請する」ボタン→ `submitRequest` 呼び出し
- 申請一覧テーブル：ステータスバッジ（承認待ち=黄, 承認済み=緑）、行クリックで承認履歴（申請者→上長→経営管理室の3段階を `history` から表示）を展開
- 承認待ち行に「承認する」ボタン（デモ用に誰でも押せる、押すと `approve(id, "経営管理室 承認者", "経営管理室")` を呼ぶ）

- [ ] **Step 3: Sidebarに追加する**

`src/components/layout/Sidebar.tsx` の `nav` 配列に追加：

```ts
{ href: "/masters", label: "マスタ管理", icon: ShieldCheck },
```

- [ ] **Step 4: 動作確認**

`/masters` で申請→承認待ちバッジ→承認→承認済みへの遷移と履歴表示を確認する。

- [ ] **Step 5: Commit**

```bash
git add src/store/useMasterApprovalStore.ts src/app/masters/page.tsx src/components/layout/Sidebar.tsx
git commit -m "feat: マスタ申請ワークフロー画面を追加"
```

---

## Task 2: スポット取引先の簡易登録

**Files:**
- Modify: `src/app/masters/page.tsx`

**Interfaces:**
- Consumes: Task 1 のページ構造

- [ ] **Step 1: 簡易登録セクションを追加する**

`/masters` ページに「簡易取引先登録（スポット）」セクションを追加する。最低限の項目（名称、連絡先）のみのフォーム→登録ボタン→ローカル `useState` の配列に追加し一覧表示する（この一覧はデモ用で `useSalesStore` とは連携しない）。

- [ ] **Step 2: 汎用コード対比キャプションを追加する**

登録一覧の下に、「現行: 仕入先コード90000に集約 → 本システム: スポット先ごとに個別管理」という対比キャプションを表示する。

- [ ] **Step 3: 動作確認**

`/masters` でスポット登録フォームから1件登録し、一覧に反映されることを確認する。

- [ ] **Step 4: Commit**

```bash
git add src/app/masters/page.tsx
git commit -m "feat: スポット取引先の簡易登録セクションを追加"
```

---

## Task 3: 操作ログ画面

**Files:**
- Create: `src/app/audit-log/page.tsx`
- Modify: `src/components/layout/Sidebar.tsx`

**Interfaces:**
- Produces: なし（末端ページ、モックデータ内蔵）

- [ ] **Step 1: 操作ログページを新設する**

`src/app/audit-log/page.tsx` を作成し、日時・担当者・操作・対象・IPの5列テーブルを表示する。データはページ内に固定配列でモックする（例: 「2026-06-19 09:12 / 田村 誠 / 請求書発行 / T紡織 2026-06分 / 192.168.1.10」を含む10件程度）。

- [ ] **Step 2: 保存期間の注記を追加する**

ページ上部に「保存期間: 6ヶ月以上」の注記テキストを表示する。

- [ ] **Step 3: Sidebarに追加する**

`src/components/layout/Sidebar.tsx` の `nav` 配列に追加：

```ts
{ href: "/audit-log", label: "操作ログ", icon: History };
```

- [ ] **Step 4: 動作確認**

`/audit-log` にSidebarからアクセスでき、テーブルと注記が表示されることを確認する。

- [ ] **Step 5: Commit**

```bash
git add src/app/audit-log/page.tsx src/components/layout/Sidebar.tsx
git commit -m "feat: 操作ログ画面を追加"
```

---

## Self-Review Notes

- Task 1〜3はいずれも「統制機能が存在するという見た目」を作ることが目的であり、実際の権限制御・永続化・監査保全は実装しない。二次提案・商談での説明時にその旨を口頭で補足すること。
