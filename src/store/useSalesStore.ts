import { create } from "zustand";
import salesData from "@/data/sales.json";
import type { Sale, SaleStatus } from "@/types";

interface SalesStore {
  sales: Sale[];
  addSale: (sale: Sale) => void;
  updateStatus: (id: string, status: SaleStatus) => void;
  markInvoicedByIds: (ids: string[]) => void;
  markPaidByIds: (ids: string[]) => void;
}

export const useSalesStore = create<SalesStore>((set) => ({
  sales: salesData as Sale[],
  addSale: (sale) => set((state) => ({ sales: [...state.sales, sale] })),
  updateStatus: (id, status) =>
    set((state) => ({
      sales: state.sales.map((sale) => (sale.id === id ? { ...sale, status } : sale)),
    })),
  markInvoicedByIds: (ids) =>
    set((state) => ({
      sales: state.sales.map((sale) =>
        ids.includes(sale.id) ? { ...sale, status: "invoiced" } : sale,
      ),
    })),
  markPaidByIds: (ids) =>
    set((state) => ({
      sales: state.sales.map((sale) =>
        ids.includes(sale.id) ? { ...sale, status: "paid" } : sale,
      ),
    })),
}));
