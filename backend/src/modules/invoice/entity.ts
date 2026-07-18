export interface InvoiceEntity {
  id: string;
  invoiceNumber: string;
  customerId: string;
  vehicleId: string | null;
  totalAmount: string;
  discount: string;
  tax: string;
  grandTotal: string;
  paymentStatus: "PENDING" | "PAID" | "PARTIAL" | "REFUNDED";
  paymentMethod: "CASH" | "BANK_TRANSFER" | "CREDIT" | "PROMPTPAY" | null;
  version: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItemEntity {
  id: string;
  invoiceId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  total: string;
}
