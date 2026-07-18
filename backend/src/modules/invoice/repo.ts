import {
  eq,
  and,
  like,
  gt,
  gte,
  lt,
  lte,
  ne,
  isNull,
  count,
  inArray,
  asc,
  desc,
  sql,
} from "drizzle-orm";
import type { MySql2Database } from "drizzle-orm/mysql2";
import type { SQL, Column } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import {
  invoices,
  invoiceItems,
  products,
  stockMovements,
} from "../../config/schema";
import type { InvoiceEntity, InvoiceItemEntity } from "./entity";
import type { FilterRequestInput } from "../../shared/pagination/schema";

export interface CreateInvoiceItemData {
  productId: string;
  quantity: number;
  unitPrice: string;
  total: string;
}

export interface CreateInvoiceData {
  invoiceNumber: string;
  customerId: string;
  vehicleId: string | null;
  discount: string;
  tax: string;
  totalAmount: string;
  grandTotal: string;
  paymentMethod: string | null;
  createdBy: string;
  items: CreateInvoiceItemData[];
}

export interface InvoiceWithItemsResult {
  invoice: InvoiceEntity;
  items: InvoiceItemEntity[];
}

export interface IInvoiceRepository {
  findFiltered(
    input: FilterRequestInput,
  ): Promise<{ data: InvoiceEntity[]; total: number }>;
  findById(id: string): Promise<InvoiceEntity | null>;
  findByIdWithItems(
    id: string,
  ): Promise<InvoiceWithItemsResult | null>;
  createInvoice(data: CreateInvoiceData): Promise<InvoiceWithItemsResult>;
  getTodaySummary(): Promise<{ totalAmount: string; count: number }>;
}

export class InvoiceRepository implements IInvoiceRepository {
  constructor(private db: MySql2Database) {}

  async findFiltered(
    input: FilterRequestInput,
  ): Promise<{ data: InvoiceEntity[]; total: number }> {
    const conditions = this.buildFilterConditions(input);
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const totalResult = await this.db
      .select({ count: count() })
      .from(invoices)
      .where(whereClause);

    const total = totalResult[0]?.count ?? 0;

    const orderClause = this.resolveSort(input.sortName, input.sortBy);
    const offset = (input.page - 1) * input.pageSize;

    const rows = await this.db
      .select()
      .from(invoices)
      .where(whereClause)
      .orderBy(orderClause)
      .limit(input.pageSize)
      .offset(offset);

    return { data: rows, total };
  }

  private buildFilterConditions(input: FilterRequestInput): SQL[] {
    const conditions: SQL[] = [];

    if (!input.filters) {
      return conditions;
    }

    for (const f of input.filters) {
      const col = this.resolveColumn(f.field);
      if (!col) {
        continue;
      }

      const value = String(f.value);
      switch (f.operator) {
        case "eq":
          conditions.push(eq(col, value));
          break;
        case "neq":
          conditions.push(ne(col, value));
          break;
        case "contains":
          conditions.push(like(col, `%${value}%`));
          break;
        case "gt":
          conditions.push(gt(col, value));
          break;
        case "gte":
          conditions.push(gte(col, value));
          break;
        case "lt":
          conditions.push(lt(col, value));
          break;
        case "lte":
          conditions.push(lte(col, value));
          break;
        case "in": {
          const values = Array.isArray(f.value) ? f.value : [f.value];
          conditions.push(inArray(col, values as string[]));
          break;
        }
      }
    }

    return conditions;
  }

  async findById(id: string): Promise<InvoiceEntity | null> {
    const result = await this.db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }
    return result[0];
  }

  async findByIdWithItems(
    id: string,
  ): Promise<InvoiceWithItemsResult | null> {
    const inv = await this.findById(id);
    if (!inv) {
      return null;
    }

    const items = await this.db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, id));

    return {
      invoice: inv,
      items: items as unknown as InvoiceItemEntity[],
    };
  }

  async createInvoice(
    data: CreateInvoiceData,
  ): Promise<InvoiceWithItemsResult> {
    return this.db.transaction(async (tx) => {
      for (const item of data.items) {
        const [product] = await tx
          .select()
          .from(products)
          .where(and(eq(products.id, item.productId), isNull(products.deletedAt)))
          .for("update");

        if (!product) {
          throw new Error("PRODUCT_NOT_FOUND");
        }
        if (product.currentStock < item.quantity) {
          throw new Error("INSUFFICIENT_STOCK");
        }
      }

      const invId = uuidv4();
      const now = new Date();

      await tx.insert(invoices).values({
        id: invId,
        invoiceNumber: data.invoiceNumber,
        customerId: data.customerId,
        vehicleId: data.vehicleId,
        totalAmount: data.totalAmount,
        discount: data.discount,
        tax: data.tax,
        grandTotal: data.grandTotal,
        paymentStatus: "PENDING",
        paymentMethod: data.paymentMethod as
          | "CASH"
          | "BANK_TRANSFER"
          | "CREDIT"
          | "PROMPTPAY"
          | null,
        version: 1,
        createdBy: data.createdBy,
        createdAt: now,
        updatedAt: now,
      });

      const createdItems: InvoiceItemEntity[] = [];

      for (const item of data.items) {
        const itemId = uuidv4();
        await tx.insert(invoiceItems).values({
          id: itemId,
          invoiceId: invId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        });

        createdItems.push({
          id: itemId,
          invoiceId: invId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        });
      }

      for (const item of data.items) {
        await tx
          .update(products)
          .set({
            currentStock: sql`${products.currentStock} - ${item.quantity}`,
            updatedAt: now,
          })
          .where(eq(products.id, item.productId));
      }

      for (const item of data.items) {
        await tx.insert(stockMovements).values({
          id: uuidv4(),
          productId: item.productId,
          type: "OUT",
          quantity: item.quantity,
          referenceType: "INVOICE",
          referenceId: invId,
          createdBy: data.createdBy,
          note: null,
          createdAt: now,
        });
      }

      return {
        invoice: {
          id: invId,
          invoiceNumber: data.invoiceNumber,
          customerId: data.customerId,
          vehicleId: data.vehicleId,
          totalAmount: data.totalAmount,
          discount: data.discount,
          tax: data.tax,
          grandTotal: data.grandTotal,
          paymentStatus: "PENDING",
          paymentMethod: data.paymentMethod as
            | "CASH"
            | "BANK_TRANSFER"
            | "CREDIT"
            | "PROMPTPAY"
            | null,
          version: 1,
          createdBy: data.createdBy,
          createdAt: now,
          updatedAt: now,
        },
        items: createdItems,
      };
    });
  }

  async getTodaySummary(): Promise<{
    totalAmount: string;
    count: number;
  }> {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );

    const result = await this.db
      .select({
        totalAmount: sql<string>`CAST(COALESCE(SUM(${invoices.grandTotal}), 0) AS CHAR)`,
        count: count(),
      })
      .from(invoices)
      .where(
        and(gte(invoices.createdAt, startOfDay), lt(invoices.createdAt, endOfDay)),
      );

    return {
      totalAmount: result[0]?.totalAmount ?? "0.00",
      count: result[0]?.count ?? 0,
    };
  }

  private resolveColumn(field: string): Column | null {
    switch (field) {
      case "invoiceNumber":
        return invoices.invoiceNumber;
      case "customerId":
        return invoices.customerId;
      case "paymentStatus":
        return invoices.paymentStatus;
      case "paymentMethod":
        return invoices.paymentMethod;
      default:
        return null;
    }
  }

  private resolveSort(
    sortName: string | undefined,
    sortBy: "asc" | "desc",
  ): SQL {
    const sortFn = sortBy === "asc" ? asc : desc;
    switch (sortName) {
      case "invoiceNumber":
        return sortFn(invoices.invoiceNumber);
      case "grandTotal":
        return sortFn(invoices.grandTotal);
      case "paymentStatus":
        return sortFn(invoices.paymentStatus);
      case "updatedAt":
        return sortFn(invoices.updatedAt);
      default:
        return sortFn(invoices.createdAt);
    }
  }
}
