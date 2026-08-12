export interface Customer {
  id: string
  name: string
  contact: string
  email?: string
  billingType?: '都度請求' | '締め請求'
  closingDay?: string
}

export interface Business {
  id: string
  name: string
  color: string
}

export type SaleStatus = 'uninvoiced' | 'consolidated' | 'invoiced' | 'paid'

export type BusinessColor = 'blue' | 'green' | 'orange' | 'purple' | 'slate'

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
  assignee?: string
  rakurakuSynced?: boolean
}

export interface InvoiceGroup {
  businessId: string
  businessName: string
  items: Sale[]
  subtotal: number
}
