import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-medium text-zinc-500">Payments</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">入金管理</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>入金状況</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-zinc-200 p-4">
            <div>
              <div className="font-medium">株式会社アルファテック</div>
              <div className="text-sm text-zinc-500">2026年6月請求分</div>
            </div>
            <Badge className="bg-zinc-950 text-white">入金済</Badge>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-zinc-200 p-4">
            <div>
              <div className="font-medium">ベータ商事株式会社</div>
              <div className="text-sm text-zinc-500">2026年6月請求分</div>
            </div>
            <Badge variant="secondary">入金待ち</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
