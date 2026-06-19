import businesses from "@/data/businesses.json";
import customers from "@/data/customers.json";
import type {
  Business,
  Customer,
  InvoiceGroup,
  Sale,
  SaleStatus,
} from "@/types";

export const demoCustomers = customers as Customer[];
export const demoBusinesses = businesses as Business[];

export const businessColorClasses: Record<string, string> = {
  blue: "bg-sky-50 text-sky-700 border-sky-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
};

export const statusLabels: Record<SaleStatus, string> = {
  uninvoiced:   "未請求",
  consolidated: "統合済み",
  invoiced:     "請求済",
  paid:         "入金済",
};

export const formatYen = (value: number) =>
  new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);

export const formatMonth = (month: string) =>
  month.replace("-", "年") + "月";

export const getCustomerName = (customerId: string) =>
  demoCustomers.find((customer) => customer.id === customerId)?.name ?? customerId;

export const getBusinessName = (businessId: string) =>
  demoBusinesses.find((business) => business.id === businessId)?.name ?? businessId;

export const groupSalesByBusiness = (sales: Sale[]): InvoiceGroup[] => {
  const grouped = new Map<string, InvoiceGroup>();

  for (const sale of sales) {
    const businessName = getBusinessName(sale.businessId);
    const current =
      grouped.get(sale.businessId) ??
      ({ businessId: sale.businessId, businessName, items: [], subtotal: 0 } satisfies InvoiceGroup);
    current.items.push(sale);
    current.subtotal += sale.amount;
    grouped.set(sale.businessId, current);
  }

  return Array.from(grouped.values());
};

export const invoiceNumberForMonth = (month: string) =>
  `INV-${month.replace("-", "")}-001`;

export const monthToLabel = (month: string) => {
  const [year, mm] = month.split("-");
  return `${year}年${Number(mm)}月`;
};

// 2026-01 から現在（デモ: 2026-06）までの全月リスト（新しい順）
export const PERIOD_MONTHS = ["2026-06","2026-05","2026-04","2026-03","2026-02","2026-01"];

// 当月末を "YYYY年M月D日" 形式で返す（請求日）
export const invoiceDateLabel = (month: string): string => {
  const [y, m] = month.split("-").map(Number);
  const days = new Date(y, m, 0).getDate();
  return `${y}年${m}月${days}日`;
};

// 翌月末を "YYYY年M月D日" 形式で返す
export const dueDateLabel = (month: string): string => {
  const [y, m] = month.split("-").map(Number);
  const dueMonth = m === 12 ? 1 : m + 1;
  const dueYear  = m === 12 ? y + 1 : y;
  const days = new Date(dueYear, dueMonth, 0).getDate();
  return `${dueYear}年${dueMonth}月${days}日`;
};
