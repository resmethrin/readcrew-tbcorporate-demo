# P0: 世界観の置換（実商流データへ）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ダッシュボード・売上・請求・入金の全画面で表示される事業部名・顧客名・品目名を、TBC社の実商流に基づく語彙（イニシャル表記）に置換し、「うちの業務がそのまま動いている」既視感を作る。

**Architecture:** データ層（`src/data/*.json` + `src/lib/demo-data.ts`）を実商流の値に差し替え、それを参照する各ページコンポーネントの「事業部id決め打ちマップ」（`bizAccent`, `BIZ_COLOR` 等）と件数感（`sales.json` のレコード数・分布）を追従させる。UIコンポーネントのロジック自体（フィルタ・集計関数）は変更しない — データのみを差し替える。

**Tech Stack:** Next.js 16 (App Router) / TypeScript / Zustand / recharts。ローカル状態は `useSalesStore`（zustand, 永続化なし、リロードで `sales.json` のシード値に戻る）。

## Global Constraints

- 公開URL（Vercel）に実名は一切使わない。得意先名は「T紡織」のようなイニシャル表記＋デモ用架空名とする（原文spec 0-2「注意」）。
- 件数感は実測平均に寄せる：フード室 売上228件/月・仕入255件/月、人材室 立替仕入62件/月、セキュリティ室 発注13件/月（原文spec 0-1 根拠）。ただし本アプリのデータモデルには「仕入」概念が無いため、実装可能なのは**売上件数**のみ（下記 Task 3 で対応方針を明記）。
- 既存の型定義（`src/types/index.ts` の `Sale`/`Business`/`Customer`/`InvoiceGroup`）のフィールド名・shapeは変更しない。全ページがこれらの型に依存しているため、型を変えると全画面が連鎖的に壊れる。
- `src/lib/demo-data.ts` の `PERIOD_MONTHS = ["2026-06",...,"2026-01"]` は変更しない（P0のスコープ外）。

---

## File Structure

| File | 変更内容 |
|---|---|
| `src/data/businesses.json` | 3件の事業部を5室に差し替え |
| `src/data/customers.json` | 3件の顧客をTBC実商流の7先に差し替え |
| `src/data/sales.json` | 72件の売上明細を5室×新顧客×実語彙の品目で再生成（フード室の件数を実測寄りに厚く） |
| `src/types/index.ts` | `Customer` に `billingType?: '都度請求' \| '締め請求'` を追加（属性表示用、任意フィールドなので既存データは無影響） |
| `src/lib/demo-data.ts` | `businessColorClasses` のキー、`getCustomerName` 等はロジック変更不要。新設: `getCustomerBillingType(customerId)` ヘルパー追加 |
| `src/app/dashboard/page.tsx` | `bizAccent` マップ（`b001`/`b002`/`b003` 決め打ち）を新5室のidに更新、`actionItems` の顧客名を新データに合わせる |
| `src/app/billing/page.tsx` | `BIZ_COLOR` マップのキーを新5室idに更新 |
| `src/app/sales/page.tsx` | 事業部別ミニKPIは `demoBusinesses.map` で動的生成のためロジック変更不要（データ差し替えのみで追従を確認） |
| `src/components/layout/Sidebar.tsx` | 変更なし（本フェーズはナビ構造に触れない） |

---

## Task 1: 事業部（5室）データの差し替え

**Files:**
- Modify: `src/data/businesses.json`

**Interfaces:**
- Produces: `id` は `b001`〜`b005` の5件（既存の3件から5件に増加）。既存の `Business` 型（`id`, `name`, `color`）はそのまま使う。

- [ ] **Step 1: `businesses.json` を5室構成に書き換える**

```json
[
  { "id": "b001", "name": "物販営業室", "color": "blue" },
  { "id": "b002", "name": "セキュリティサービス室", "color": "green" },
  { "id": "b003", "name": "人材サービス室", "color": "orange" },
  { "id": "b004", "name": "フードサービス室", "color": "purple" },
  { "id": "b005", "name": "サービス企画室", "color": "slate" }
]
```

- [ ] **Step 2: `demo-data.ts` の `businessColorClasses` に新色2種を追加**

`src/lib/demo-data.ts` の該当箇所を以下に置換（既存の3色は残し、`purple`/`slate` を追加）：

```ts
export const businessColorClasses: Record<string, string> = {
  blue: "bg-sky-50 text-sky-700 border-sky-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
  purple: "bg-violet-50 text-violet-700 border-violet-200",
  slate: "bg-slate-50 text-slate-700 border-slate-200",
};
```

- [ ] **Step 3: ダッシュボードの色マップを5室分に更新**

`src/app/dashboard/page.tsx` 内 `bizAccent` 定義（`b001`/`b002`/`b003` の3エントリ）を、新5室idに対応する5エントリへ置換：

```ts
const bizAccent: Record<string, string> = {
  b001: "#0071e3", // 物販営業室
  b002: "#34c759", // セキュリティサービス室
  b003: "#ff9f0a", // 人材サービス室
  b004: "#af52de", // フードサービス室
  b005: "#8e8e93", // サービス企画室
};
```

- [ ] **Step 4: 請求一覧の色マップを5室分に更新**

`src/app/billing/page.tsx` 内 `BIZ_COLOR` 定義（現行は `b001`/`b002`/`b003` の3エントリ、各エントリは `{ dot, bg, text }` 形式）を、Step 3 と同じ5室idで5エントリに拡張する。既存の3エントリの構造（キー名）をそのまま流用し、`b004`/`b005` を追加する。

- [ ] **Step 5: 開発サーバーで目視確認**

`npm run dev` → `http://localhost:3000/dashboard` を開き、「室別 売上状況」カードに5室が表示され、色が重複なく割り当たっていることを確認する（Task 3完了後でないと売上データが紐付かないため、件数・金額はTask 3完了後に再確認する前提でここでは色分けとラベルのみ確認）。

- [ ] **Step 6: Commit**

```bash
git add src/data/businesses.json src/lib/demo-data.ts src/app/dashboard/page.tsx src/app/billing/page.tsx
git commit -m "feat: 事業部を実際の5室構成に置換"
```

---

## Task 2: 得意先データをTBC実商流ベースに差し替え

**Files:**
- Modify: `src/data/customers.json`
- Modify: `src/types/index.ts`
- Modify: `src/lib/demo-data.ts`

**Interfaces:**
- Consumes: なし（Task 1に依存しない、並行実施可）
- Produces: `Customer` 型に `billingType?: '都度請求' | '締め請求'` を追加。`getCustomerBillingType(customerId: string): string` ヘルパーを `demo-data.ts` に追加（他ページから属性タブ表示に使う想定、呼び出し側の実装はP1スコープ）。

- [ ] **Step 1: `Customer` 型に請求属性フィールドを追加**

`src/types/index.ts` の `Customer` interface を以下に置換：

```ts
export interface Customer {
  id: string
  name: string
  contact: string
  email?: string
  billingType?: '都度請求' | '締め請求'
  closingDay?: string // 例: "25日締め"。締め請求のみ意味を持つ任意項目
}
```

- [ ] **Step 2: `customers.json` を実商流7先に差し替える（公開URLのためイニシャル表記＋架空値）**

```json
[
  { "id": "c001", "name": "T紡織株式会社", "contact": "経理部 担当者", "email": "demo-c001@example.com", "billingType": "締め請求", "closingDay": "25日締め" },
  { "id": "c002", "name": "T紡織滋賀事業所", "contact": "総務部 担当者", "email": "demo-c002@example.com", "billingType": "締め請求", "closingDay": "月末締め" },
  { "id": "c003", "name": "派遣会社A", "contact": "営業担当", "email": "demo-c003@example.com", "billingType": "締め請求", "closingDay": "月末締め" },
  { "id": "c004", "name": "派遣会社B", "contact": "営業担当", "email": "demo-c004@example.com", "billingType": "締め請求", "closingDay": "月末締め" },
  { "id": "c005", "name": "食堂委託会社", "contact": "運営担当", "email": "demo-c005@example.com", "billingType": "締め請求", "closingDay": "月末締め" },
  { "id": "c006", "name": "TBJ従業員（給与天引）", "contact": "人事部", "email": "demo-c006@example.com", "billingType": "締め請求", "closingDay": "月末締め" },
  { "id": "c007", "name": "強化クラブ・アラコ（スポット）", "contact": "都度担当", "email": "demo-c007@example.com", "billingType": "都度請求" }
]
```

- [ ] **Step 3: 属性表示ヘルパーを追加**

`src/lib/demo-data.ts` に以下を追加（既存の `getCustomerName` の直後）：

```ts
export const getCustomerBillingType = (customerId: string) =>
  demoCustomers.find((customer) => customer.id === customerId)?.billingType ?? "—";
```

- [ ] **Step 4: 開発サーバーで型エラーが出ないことを確認**

`npm run dev` を起動し直し、コンパイルエラーが出ないことを確認する（`Customer` 型変更は任意フィールド追加のため既存コードへの破壊的影響はない想定だが、`npx tsc --noEmit` を実行して確認する）。

- [ ] **Step 5: Commit**

```bash
git add src/data/customers.json src/types/index.ts src/lib/demo-data.ts
git commit -m "feat: 得意先データをTBC実商流ベース（イニシャル表記）に置換"
```

---

## Task 3: 売上データ（品目・件数感）を実商流語彙で再生成

**Files:**
- Modify: `src/data/sales.json`

**Interfaces:**
- Consumes: Task 1 の新5室id（`b001`〜`b005`）、Task 2 の新7顧客id（`c001`〜`c007`）
- Produces: `Sale[]`（既存の72件を全面差し替え）。フィールドshapeは変更しない。

**方針（件数感について）:** spec根拠の「フード室228件/月」は6ヶ月分では1,368件に相当し、他室との比率も崩れて画面が実用に耐えない量になる。本タスクでは **相対比率を保った縮小版**（フード室を他室の3〜4倍の件数にする）で「フード室が飛び抜けて処理件数が多い」という実感を再現する。絶対件数を実測と一致させたい場合は Phase 0ヒアリング後に別タスクで拡張する（原文spec末尾の確認事項と対応）。

- [ ] **Step 1: 品目語彙をフード室（`b004`）中心に用意する**

以下の語彙プールを使い、`description` フィールドに充てる（根拠: 請求書サンプル・室別フロー）：

```
フード室: "喫食代（補助含む）", "お弁当", "食材（米）", "食材（乳製品）", "廃油他", "おしぼり"
物販営業室: "制服", "安全靴", "個人あっせん販売"
サービス企画室: "自販機手数料", "売店販売", "備品・設備改善提案"
セキュリティサービス室: "警備業務委託", "設備点検"
人材サービス室: "人材派遣費", "レタックス代（弔電）", "今治タオルハンカチ"
```

- [ ] **Step 2: `sales.json` を再構成する**

`2026-01`〜`2026-06` の6ヶ月分、以下の配分で生成する（1レコードのshapeは既存のまま：`id`, `customerId`, `businessId`, `description`, `amount`, `month`, `status`, `assignee`）：

- フード室（`b004`）: 各月12件（`c005`食堂委託会社を中心に、品目プールから選択）
- 物販営業室（`b001`）: 各月4件
- サービス企画室（`b005`）: 各月3件
- セキュリティサービス室（`b002`）: 各月2件（spec根拠「発注13件/月」に近い少数運用を反映）
- 人材サービス室（`b003`）: 各月3件（`c003`/`c004`派遣会社、`c006`TBJ従業員を中心に）

`status` は既存踏襲（過去月=`paid`中心、直近月=`uninvoiced`/`invoiced`混在）。`assignee` は既存3名を流用可（`"田村 誠"`, `"中村 あかり"`, `"佐藤 健太"`）。`c007`（強化クラブ・アラコ、都度請求）は各月1件のみスポットで物販営業室かサービス企画室に混ぜる。

合計目安: 月24件 × 6ヶ月 = 144件（既存72件からの倍増、フード室の突出感を残しつつ画面表示件数として現実的な範囲）。

- [ ] **Step 3: ダッシュボード・売上一覧・請求一覧・入金管理を目視確認**

`npm run dev` で以下を確認する：
- `/dashboard`: 「室別 売上状況」に5室が表示され、フード室のバーが他室より明確に大きいこと
- `/sales`: 事業部別ミニKPIが5室分表示され、フィルタが機能すること
- `/billing`: 得意先×月の請求行が新顧客名で表示されること
- `/payments`: 入金行が新顧客名で表示されること

- [ ] **Step 4: Commit**

```bash
git add src/data/sales.json
git commit -m "feat: 売上データを実商流の品目・件数感で再生成"
```

---

## Self-Review Notes

- **P0スコープに含まれないもの**（原文specの後続フェーズで対応）: 属性タブでの「都度請求/締め請求」区分の実UI表示（Task 2で型とヘルパーのみ用意、表示箇所の実装はP1の請求書プレビュー再設計と合わせて行う方が手戻りが少ない）。
- **未解決の差異**: `src/app/sales/new/page.tsx` の dead code `InvoicePreview` コンポーネントが `"TBコーポレート株式会社"` を発行者名として持つが、実際に使われている `billing/[id]/preview/page.tsx` の `ISSUER` は `"株式会社エキサイター"`。P0では触れないが、P1 Task 1-2（請求書プレビュー再設計）で発行者名の統一を検討すること。
