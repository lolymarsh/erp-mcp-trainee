import { api } from '../../config/api';

export interface InvoiceResponse {
  id: string;
  invoiceNumber: string;
  customerId: string;
  vehicleId: string | null;
  totalAmount: string;
  discount: string;
  tax: string;
  grandTotal: string;
  paymentStatus: 'PENDING' | 'PAID' | 'PARTIAL' | 'REFUNDED';
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CREDIT' | 'PROMPTPAY' | null;
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

export interface CreateInvoiceItemInput {
  productId: string;
  quantity: number;
}

export interface CreateInvoiceInput {
  customerId: string;
  vehicleId?: string | null;
  items: CreateInvoiceItemInput[];
  discount?: number;
  paymentMethod?: 'CASH' | 'BANK_TRANSFER' | 'CREDIT' | 'PROMPTPAY' | null;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalData: number;
  totalPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedInvoices {
  data: InvoiceResponse[];
  pagination: PaginationInfo;
}

export interface FilterRequest {
  page: number;
  pageSize: number;
  sortName?: string;
  sortBy?: 'asc' | 'desc';
  filters?: { field: string; operator: string; value: unknown }[];
}

export interface TodaySummaryResponse {
  totalAmount: string;
  count: number;
}

export const invoiceApi = {
  Filter: async (input: FilterRequest): Promise<PaginatedInvoices> => {
    const { data } = await api.post('/sales/invoices/filter', input);
    return { data: data.data, pagination: data.pagination };
  },

  GetById: async (id: string): Promise<InvoiceWithItemsResponse> => {
    const { data } = await api.get(`/sales/invoices/${id}`);
    return data.data;
  },

  Create: async (input: CreateInvoiceInput): Promise<InvoiceWithItemsResponse> => {
    const { data } = await api.post('/sales/invoices', input);
    return data.data;
  },

  GetTodaySummary: async (): Promise<TodaySummaryResponse> => {
    const { data } = await api.get('/sales/invoices/today-summary');
    return data.data;
  },

  UpdatePaymentStatus: async (id: string, input: {
    paymentStatus: string;
    paymentMethod?: string | null;
    version: number;
  }): Promise<InvoiceResponse> => {
    const { data } = await api.patch(`/sales/invoices/${id}/payment-status`, input);
    return data.data;
  },
};
