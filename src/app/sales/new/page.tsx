"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { demoBusinesses, demoCustomers } from "@/lib/demo-data";
import { useSalesStore } from "@/store/useSalesStore";

export default function NewSalePage() {
  const router = useRouter();
  const addSale = useSalesStore((state) => state.addSale);
  const [customerId, setCustomerId] = useState(demoCustomers[0]?.id ?? "");
  const [businessId, setBusinessId] = useState(demoBusinesses[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState("2026-06");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="text-sm font-medium text-zinc-500">Sales</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">売上登録</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>新規売上</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-2">
            <Label>顧客</Label>
            <Select value={customerId} onValueChange={(value) => value && setCustomerId(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {demoCustomers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>事業区分</Label>
            <Select value={businessId} onValueChange={(value) => value && setBusinessId(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {demoBusinesses.map((business) => (
                  <SelectItem key={business.id} value={business.id}>
                    {business.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>内容</Label>
            <Input value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>金額</Label>
            <Input
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>月</Label>
            <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          </div>
          <Button
            className="bg-accent text-white hover:bg-[#b91c1c]"
            onClick={() => {
              addSale({
                id: `s${Date.now()}`,
                customerId,
                businessId,
                description,
                amount: Number(amount || 0),
                month,
                status: "uninvoiced",
              });
              router.push("/sales");
            }}
          >
            登録する
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
