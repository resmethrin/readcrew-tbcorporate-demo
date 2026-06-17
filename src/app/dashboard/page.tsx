import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSalesStore } from "@/store/useSalesStore";
import { demoBusinesses, formatYen } from "@/lib/demo-data";

export default function DashboardPage() {
  const sales = useSalesStore.getState().sales;
  const salesByBusiness = Object.fromEntries(
    demoBusinesses.map((business) => [
      business.id,
      sales
        .filter((sale) => sale.businessId === business.id)
        .reduce((sum, sale) => sum + sale.amount, 0),
    ]),
  );
  const uninvoicedCount = sales.filter((sale) => sale.status === "uninvoiced").length;
  const invoicedCount = sales.filter((sale) => sale.status === "invoiced").length;
  const paidCount = sales.filter((sale) => sale.status === "paid").length;

  return (
    <div className="space-y-8">
      <div>
        <div className="text-sm font-medium text-zinc-500">Dashboard</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
          販売・請求統合デモ
        </h1>
      </div>
      <section className="grid gap-4 xl:grid-cols-4">
        {[
          ["今月売上", "¥12,480,000"],
          ["未請求", `${uninvoicedCount}件`],
          ["未入金", `${paidCount}件`],
          ["請求書発行待ち", `${invoicedCount}件`],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight text-zinc-950">
                {value}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="grid gap-4 xl:grid-cols-3">
        {demoBusinesses.map((business) => (
          <Card key={business.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                {business.name}
                <Badge variant="secondary" className="border-zinc-200 bg-zinc-50">
                  締め状況
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{formatYen(salesByBusiness[business.id])}</div>
              <p className="mt-3 text-sm text-zinc-500">
                {business.id === "b001"
                  ? "締め完了 ✅"
                  : business.id === "b002"
                    ? "締め処理中 🔄"
                    : "未着手 ⬜"}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>
      <Card>
        <CardHeader>
          <CardTitle>締め処理ステータス</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm">
          <Badge className="bg-zinc-950 text-white hover:bg-zinc-950">設備販売 締め完了</Badge>
          <Badge variant="secondary">保守サービス 締め処理中</Badge>
          <Badge variant="outline">工事関連 未着手</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
