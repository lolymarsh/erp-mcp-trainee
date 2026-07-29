import type { IInvoiceRepository } from "./repo";
import type { InvoiceEntity, InvoiceItemEntity } from "./entity";
import type {
  CreateInvoiceInput,
  InvoiceResponse,
  InvoiceItemResponse,
  InvoiceWithItemsResponse,
  TodaySummaryResponse,
  UpdatePaymentStatusInput,
} from "./schema";
import type { FilterRequestInput } from "../../shared/pagination/schema";
import type { PaginationResponse } from "../../shared/response/handler";
import { CalculatePagination } from "../../shared/response/handler";
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from "../../shared/errors/AppError";
import type { ICustomerRepository } from "../customer/repo";
import type { IInventoryRepository } from "../inventory/repo";
import type Redis from "ioredis";
import type { IAuditLogService } from "../audit/service";
import type { AuditMeta } from "../../shared/middleware/auditMeta";

export interface IInvoiceService {
  Filter(
    input: FilterRequestInput,
  ): Promise<{ data: InvoiceResponse[]; pagination: PaginationResponse }>;
  GetById(id: string): Promise<InvoiceWithItemsResponse>;
  Create(
    input: CreateInvoiceInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<InvoiceWithItemsResponse>;
  GetTodaySummary(): Promise<TodaySummaryResponse>;
  UpdatePaymentStatus(
    id: string,
    input: UpdatePaymentStatusInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<InvoiceResponse>;
}

const DASHBOARD_CACHE_KEY = "dashboard:summary";

export class InvoiceService implements IInvoiceService {
  constructor(
    private repo: IInvoiceRepository,
    private customerRepo: ICustomerRepository,
    private inventoryRepo: IInventoryRepository,
    private redis: Redis,
    private auditService: IAuditLogService,
  ) {}

  async Filter(
    input: FilterRequestInput,
  ): Promise<{ data: InvoiceResponse[]; pagination: PaginationResponse }> {
    const result = await this.repo.FindFiltered(input);
    const pagination = CalculatePagination(
      input.page,
      input.pageSize,
      result.total,
    );

    return {
      data: result.data.map((inv) => this.toInvoiceResponse(inv)),
      pagination,
    };
  }

  async GetById(id: string): Promise<InvoiceWithItemsResponse> {
    const result = await this.repo.FindByIdWithItems(id);
    if (!result) {
      throw new NotFoundError("Invoice not found");
    }

    return {
      ...this.toInvoiceResponse(result.invoice),
      items: result.items.map((item) => this.toItemResponse(item)),
    };
  }

  async Create(
    input: CreateInvoiceInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<InvoiceWithItemsResponse> {
    const customer = await this.customerRepo.FindById(input.customerId);
    if (!customer) {
      throw new BadRequestError("Customer not found");
    }

    const productRows = await this.inventoryRepo.FindByIds(
      input.items.map((i) => i.productId),
    );

    const productMap = new Map(productRows.map((p) => [p.id, p]));

    for (const item of input.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestError(
          `Product not found: ${item.productId}`,
        );
      }
      if (product.currentStock < item.quantity) {
        throw new BadRequestError(
          `Insufficient stock for product: ${product.name} (${product.sku})`,
        );
      }
    }

    let totalAmount = 0;
    const itemsData = input.items.map((item) => {
      const product = productMap.get(item.productId);
      const unitPrice = product!.sellPrice;
      const total = (parseFloat(product!.sellPrice) * item.quantity).toFixed(2);
      totalAmount += parseFloat(total);
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        total,
      };
    });

    const discount = input.discount ?? 0;
    const tax = 0;
    const grandTotal = (totalAmount - discount + tax).toFixed(2);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const invoiceNumber = `INV-${dateStr}-${random}`;

    const result = await this.repo.CreateInvoice({
      invoiceNumber,
      customerId: input.customerId,
      vehicleId: input.vehicleId ?? null,
      discount: String(discount),
      tax: String(tax),
      totalAmount: totalAmount.toFixed(2),
      grandTotal,
      paymentMethod: input.paymentMethod ?? null,
      createdBy: userId,
      items: itemsData,
    });

    await this.redis.del(DASHBOARD_CACHE_KEY);

    this.auditService.Insert(
      "CREATE",
      "invoices",
      result.invoice.id,
      userId,
      null,
      result.invoice,
      meta,
    );

    return {
      ...this.toInvoiceResponse(result.invoice),
      items: result.items.map((item) => this.toItemResponse(item)),
    };
  }

  async GetTodaySummary(): Promise<TodaySummaryResponse> {
    return this.repo.GetTodaySummary();
  }

  async UpdatePaymentStatus(
    id: string,
    input: UpdatePaymentStatusInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<InvoiceResponse> {
    const existing = await this.repo.FindById(id);
    if (!existing) throw new NotFoundError("Invoice not found");

    const updated = await this.repo.UpdatePaymentStatus(id, {
      paymentStatus: input.paymentStatus,
      paymentMethod: input.paymentMethod ?? null,
    }, input.version);

    if (!updated) throw new ConflictError("Version mismatch");

    this.auditService.Insert(
      "UPDATE",
      "invoices",
      id,
      userId,
      existing,
      updated,
      meta,
    );

    return this.toInvoiceResponse(updated);
  }

  private toInvoiceResponse(entity: InvoiceEntity): InvoiceResponse {
    return {
      id: entity.id,
      invoiceNumber: entity.invoiceNumber,
      customerId: entity.customerId,
      vehicleId: entity.vehicleId,
      totalAmount: entity.totalAmount,
      discount: entity.discount,
      tax: entity.tax,
      grandTotal: entity.grandTotal,
      paymentStatus: entity.paymentStatus,
      paymentMethod: entity.paymentMethod,
      createdBy: entity.createdBy,
      version: entity.version,
      createdAt:
        entity.createdAt instanceof Date
          ? entity.createdAt.toISOString()
          : String(entity.createdAt),
      updatedAt:
        entity.updatedAt instanceof Date
          ? entity.updatedAt.toISOString()
          : String(entity.updatedAt),
    };
  }

  private toItemResponse(entity: InvoiceItemEntity): InvoiceItemResponse {
    return {
      id: entity.id,
      invoiceId: entity.invoiceId,
      productId: entity.productId,
      quantity: entity.quantity,
      unitPrice: entity.unitPrice,
      total: entity.total,
    };
  }
}
