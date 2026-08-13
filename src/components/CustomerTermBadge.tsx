"use client";

import { getCustomerBillingType, getCustomerClosingDay, isDay25Closing } from "@/lib/demo-data";

/**
 * 得意先の請求区分バッジ。
 * 締め請求先は締日（25日締め / 月末締め）を、都度請求先は「都度」を表示する。
 * 締日が他とずれる得意先を一覧で見分けられるようにするためのもの。
 */
export function CustomerTermBadge({ customerId }: { customerId: string }) {
  const billingType = getCustomerBillingType(customerId);
  const closingDay = getCustomerClosingDay(customerId);

  if (billingType === "都度請求") {
    return (
      <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
        都度
      </span>
    );
  }

  const highlight = isDay25Closing(closingDay);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${
        highlight
          ? "border-sky-200 bg-sky-50 text-sky-700"
          : "border-zinc-200 bg-zinc-50 text-zinc-500"
      }`}
    >
      {closingDay ?? "締め請求"}
    </span>
  );
}
