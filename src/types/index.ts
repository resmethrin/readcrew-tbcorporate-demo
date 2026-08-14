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
  /** 発注日（YYYY-MM-DD）。請求書明細の「年月日」に表示する */
  orderDate?: string
  /** 伝票No.（6桁）。請求書明細の「伝票No.」に表示する */
  voucherNo?: string
  /** 単位（足・通・枚 など）。未設定なら品名から推定する */
  unit?: string
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
