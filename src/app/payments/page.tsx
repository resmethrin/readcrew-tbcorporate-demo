import { redirect } from "next/navigation";

// 入金管理は請求一覧に統合された（2026-08-14 会議FB）
export default function PaymentsPage() {
  redirect("/billing");
}
