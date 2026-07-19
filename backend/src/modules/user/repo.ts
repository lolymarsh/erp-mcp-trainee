import {
  eq,
  and,
  like,
  ne,
  gt,
  gte,
  lt,
  lte,
  isNull,
  count,
  inArray,
  asc,
  desc,
} from "drizzle-orm";
import type { MySql2Database } from "drizzle-orm/mysql2";
import type { SQL, Column } from "drizzle-orm";
import { users } from "../../config/schema";
import type { UserEntity } from "./entity";
import type { FilterRequestInput } from "../../shared/pagination/schema";

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByUsername(username: string): Promise<UserEntity | null>;
  create(data: Partial<UserEntity>): Promise<UserEntity>;
  update(
    id: string,
    data: Partial<UserEntity>,
    version: number,
  ): Promise<UserEntity | null>;
  findFiltered(
    input: FilterRequestInput,
  ): Promise<{ data: UserEntity[]; total: number }>;
  softDelete(id: string, version: number): Promise<boolean>;
  findAll(): Promise<UserEntity[]>;
}

export class UserRepository implements IUserRepository {
  constructor(private db: MySql2Database) {}

  async findById(id: string): Promise<UserEntity | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return result[0] ?? null;
  }

  async create(data: Partial<UserEntity>): Promise<UserEntity> {
    const insertData = data as unknown as typeof users.$inferInsert;
    await this.db.insert(users).values(insertData);
    return data as UserEntity;
  }

  async update(
    id: string,
    data: Partial<UserEntity>,
    version: number,
  ): Promise<UserEntity | null> {
    const result = await this.db
      .update(users)
      .set({ ...data, version: version + 1, updatedAt: new Date() })
      .where(and(eq(users.id, id), eq(users.version, version)));

    if (result[0].affectedRows === 0) return null;
    return this.findById(id);
  }

  async findFiltered(
    input: FilterRequestInput,
  ): Promise<{ data: UserEntity[]; total: number }> {
    const conditions = this.buildFilterConditions(input);
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const totalResult = await this.db
      .select({ count: count() })
      .from(users)
      .where(whereClause);

    const total = totalResult[0]?.count ?? 0;

    const orderClause = this.resolveSort(input.sortName, input.sortBy);
    const offset = (input.page - 1) * input.pageSize;

    const rows = await this.db
      .select()
      .from(users)
      .where(whereClause)
      .orderBy(orderClause)
      .limit(input.pageSize)
      .offset(offset);

    return { data: rows, total };
  }

  async softDelete(id: string, version: number): Promise<boolean> {
    const result = await this.db
      .update(users)
      .set({
        deletedAt: new Date(),
        version: version + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, id), eq(users.version, version)));

    return result[0].affectedRows > 0;
  }

  async findAll(): Promise<UserEntity[]> {
    const rows = await this.db
      .select()
      .from(users)
      .where(isNull(users.deletedAt));
    return rows;
  }

  private buildFilterConditions(input: FilterRequestInput): SQL[] {
    const conditions: SQL[] = [isNull(users.deletedAt)];

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

  private resolveColumn(field: string): Column | null {
    switch (field) {
      case "username":
        return users.username;
      case "displayName":
        return users.displayName;
      case "role":
        return users.role;
      case "isActive":
        return users.isActive;
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
      case "username":
        return sortFn(users.username);
      case "displayName":
        return sortFn(users.displayName);
      case "role":
        return sortFn(users.role);
      case "updatedAt":
        return sortFn(users.updatedAt);
      default:
        return sortFn(users.createdAt);
    }
  }
}
