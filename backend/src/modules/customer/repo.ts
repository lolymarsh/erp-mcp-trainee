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
} from "drizzle-orm";
import type { MySql2Database } from "drizzle-orm/mysql2";
import type { SQL, Column } from "drizzle-orm";
import { customers, vehicles } from "../../config/schema";
import type { CustomerEntity, VehicleEntity } from "./entity";
import type { FilterRequestInput } from "../../shared/pagination/schema";

export interface ICustomerRepository {
  FindFiltered(
    input: FilterRequestInput,
  ): Promise<{ data: CustomerEntity[]; total: number }>;
  FindById(id: string): Promise<CustomerEntity | null>;
  FindByIdWithVehicles(
    id: string,
  ): Promise<{ customer: CustomerEntity; vehicles: VehicleEntity[] } | null>;
  FindByPhone(phone: string): Promise<CustomerEntity | null>;
  Create(data: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
    address: string | null;
    version: number;
  }): Promise<CustomerEntity>;
  Update(
    id: string,
    data: Partial<
      Pick<
        CustomerEntity,
        "firstName" | "lastName" | "phone" | "email" | "address"
      >
    >,
    version: number,
  ): Promise<CustomerEntity | null>;
  SoftDelete(id: string, version: number): Promise<boolean>;
  FindVehicleById(id: string): Promise<VehicleEntity | null>;
  CreateVehicle(data: {
    id: string;
    customerId: string;
    licensePlate: string;
    brand: string | null;
    model: string | null;
    year: number | null;
    engineType: string | null;
    fuelType: string | null;
  }): Promise<VehicleEntity>;
  UpdateVehicle(
    id: string,
    data: {
      licensePlate?: string;
      brand?: string | null;
      model?: string | null;
      year?: number | null;
      engineType?: string | null;
      fuelType?: string | null;
    },
  ): Promise<VehicleEntity | null>;
  DeleteVehicle(id: string): Promise<boolean>;
}

export class CustomerRepository implements ICustomerRepository {
  constructor(private db: MySql2Database) {}

  async FindFiltered(
    input: FilterRequestInput,
  ): Promise<{ data: CustomerEntity[]; total: number }> {
    const conditions = this.buildFilterConditions(input);
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const totalResult = await this.db
      .select({ count: count() })
      .from(customers)
      .where(whereClause);

    const total = totalResult[0]?.count ?? 0;

    const orderClause = this.resolveSort(input.sortName, input.sortBy);
    const offset = (input.page - 1) * input.pageSize;

    const rows = await this.db
      .select()
      .from(customers)
      .where(whereClause)
      .orderBy(orderClause)
      .limit(input.pageSize)
      .offset(offset);

    return { data: rows, total };
  }

  private buildFilterConditions(input: FilterRequestInput): SQL[] {
    const conditions: SQL[] = [isNull(customers.deletedAt)];

    if (!input.filters) return conditions;

    for (const f of input.filters) {
      const col = this.resolveColumn(f.field);
      if (!col) continue;

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

  async FindById(id: string): Promise<CustomerEntity | null> {
    const result = await this.db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), isNull(customers.deletedAt)))
      .limit(1);

    if (result.length === 0) return null;
    return result[0];
  }

  async FindByIdWithVehicles(
    id: string,
  ): Promise<{ customer: CustomerEntity; vehicles: VehicleEntity[] } | null> {
    const customerRow = await this.FindById(id);
    if (!customerRow) return null;

    const vehicleRows = await this.db
      .select()
      .from(vehicles)
      .where(eq(vehicles.customerId, id));

    return {
      customer: customerRow,
      vehicles: vehicleRows as unknown as VehicleEntity[],
    };
  }

  async FindByPhone(phone: string): Promise<CustomerEntity | null> {
    const result = await this.db
      .select()
      .from(customers)
      .where(and(eq(customers.phone, phone), isNull(customers.deletedAt)))
      .limit(1);

    if (result.length === 0) return null;
    return result[0];
  }

  async Create(data: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
    address: string | null;
    version: number;
  }): Promise<CustomerEntity> {
    await this.db.insert(customers).values(data);
    const created = await this.db
      .select()
      .from(customers)
      .where(eq(customers.id, data.id))
      .limit(1);

    return created[0];
  }

  async Update(
    id: string,
    data: Partial<
      Pick<
        CustomerEntity,
        "firstName" | "lastName" | "phone" | "email" | "address"
      >
    >,
    version: number,
  ): Promise<CustomerEntity | null> {
    const result = await this.db
      .update(customers)
      .set({ ...data, version: version + 1, updatedAt: new Date() })
      .where(and(eq(customers.id, id), eq(customers.version, version)));

    if (result[0].affectedRows === 0) return null;

    const updated = await this.db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    return updated[0];
  }

  async SoftDelete(id: string, version: number): Promise<boolean> {
    const result = await this.db
      .update(customers)
      .set({
        deletedAt: new Date(),
        version: version + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(customers.id, id), eq(customers.version, version)));

    return result[0].affectedRows > 0;
  }

  private resolveColumn(field: string): Column | null {
    switch (field) {
      case "firstName":
        return customers.firstName;
      case "lastName":
        return customers.lastName;
      case "phone":
        return customers.phone;
      case "email":
        return customers.email;
      default:
        return null;
    }
  }

  async FindVehicleById(id: string): Promise<VehicleEntity | null> {
    const result = await this.db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, id))
      .limit(1);
    return (result[0] as VehicleEntity) ?? null;
  }

  async CreateVehicle(data: {
    id: string;
    customerId: string;
    licensePlate: string;
    brand: string | null;
    model: string | null;
    year: number | null;
    engineType: string | null;
    fuelType: string | null;
  }): Promise<VehicleEntity> {
    await this.db.insert(vehicles).values({
      id: data.id,
      customerId: data.customerId,
      licensePlate: data.licensePlate,
      brand: data.brand ?? "",
      model: data.model ?? "",
      year: data.year,
      engineType: data.engineType,
      fuelType: data.fuelType,
    });
    return this.FindVehicleById(data.id) as Promise<VehicleEntity>;
  }

  async UpdateVehicle(
    id: string,
    data: {
      licensePlate?: string;
      brand?: string | null;
      model?: string | null;
      year?: number | null;
      engineType?: string | null;
      fuelType?: string | null;
    },
  ): Promise<VehicleEntity | null> {
    const updateData: Record<string, unknown> = {};
    if (data.licensePlate !== undefined) updateData.licensePlate = data.licensePlate;
    if (data.brand !== undefined) updateData.brand = data.brand ?? "";
    if (data.model !== undefined) updateData.model = data.model ?? "";
    if (data.year !== undefined) updateData.year = data.year;
    if (data.engineType !== undefined) updateData.engineType = data.engineType;
    if (data.fuelType !== undefined) updateData.fuelType = data.fuelType;

    await this.db
      .update(vehicles)
      .set(updateData)
      .where(eq(vehicles.id, id));

    return this.FindVehicleById(id);
  }

  async DeleteVehicle(id: string): Promise<boolean> {
    const result = await this.db
      .delete(vehicles)
      .where(eq(vehicles.id, id));
    return result[0].affectedRows > 0;
  }

  private resolveSort(
    sortName: string | undefined,
    sortBy: "asc" | "desc",
  ): SQL {
    const sortFn = sortBy === "asc" ? asc : desc;
    switch (sortName) {
      case "firstName":
        return sortFn(customers.firstName);
      case "lastName":
        return sortFn(customers.lastName);
      case "phone":
        return sortFn(customers.phone);
      case "email":
        return sortFn(customers.email);
      case "updatedAt":
        return sortFn(customers.updatedAt);
      default:
        return sortFn(customers.createdAt);
    }
  }
}
