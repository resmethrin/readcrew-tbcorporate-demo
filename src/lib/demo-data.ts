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
  uninvoiced: "未請求",
  invoiced: "請求済",
  paid: "入金済",
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
