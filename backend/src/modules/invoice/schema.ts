import { z } from "zod";

export const createInvoiceItemSchema = z.object({
  productId: z.string().min(1).max(36),
  quantity: z.coerce.number().int().min(1),
});

export const createInvoiceSchema = z.object({
  customerId: z.string().min(1).max(36),
  vehicleId: z.string().min(1).max(36).optional().nullable(),
  items: z.array(createInvoiceItemSchema).min(1),
  discount: z.coerce.number().min(0).optional().default(0),
  paymentMethod: z
    .enum(["CASH", "BANK_TRANSFER", "CREDIT", "PROMPTPAY"])
    .optional()
    .nullable(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type CreateInvoiceItemInput = z.infer<typeof createInvoiceItemSchema>;

export const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(["PENDING", "PAID", "PARTIAL", "REFUNDED"]),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CREDIT", "PROMPTPAY"]).optional().nullable(),
  version: z.number().int().min(1),
});

export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;

export interface InvoiceResponse {
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
  createdBy: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItemResponse {
  id: string;
  invoiceId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  total: string;
}

export interface InvoiceWithItemsResponse extends InvoiceResponse {
  items: InvoiceItemResponse[];
}

export interface TodaySummaryResponse {
  totalAmount: string;
  count: number;
}
