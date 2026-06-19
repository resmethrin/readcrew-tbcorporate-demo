export interface Customer {
  id: string
  name: string
  contact: string
  email?: string
}

export interface Business {
  id: string
  name: string
  color: string
}

export type SaleStatus = 'uninvoiced' | 'consolidated' | 'invoiced' | 'paid'

export type BusinessColor = 'blue' | 'green' | 'orange'

export interface Sale {
  id: string
  customerId: string
  businessId: string
  description: string
  amount: number
  qty?: number
  unitPrice?: number
  month: string
  status: SaleStatus
}

export interface InvoiceGroup {
  businessId: string
  businessName: string
  items: Sale[]
  subtotal: number
}
