import { create } from 'zustand'
import { Sale } from '@/types'
import salesData from '@/data/sales.json'

interface SalesStore {
  sales: Sale[]
  addSale: (sale: Sale) => void
  updateStatus: (id: string, status: Sale['status']) => void
}

export const useSalesStore = create<SalesStore>((set) => ({
  sales: salesData as Sale[],
  addSale: (sale) => set((state) => ({ sales: [...state.sales, sale] })),
  updateStatus: (id, status) =>
    set((state) => ({
      sales: state.sales.map((s) => (s.id === id ? { ...s, status } : s)),
    })),
}))
