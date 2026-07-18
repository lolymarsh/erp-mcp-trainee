import { eq, and } from "drizzle-orm";
import type { MySql2Database } from "drizzle-orm/mysql2";
import { users } from "../../config/schema";
import type { UserEntity } from "./entity";

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByUsername(username: string): Promise<UserEntity | null>;
  create(data: Partial<UserEntity>): Promise<UserEntity>;
  update(
    id: string,
    data: Partial<UserEntity>,
    version: number,
  ): Promise<UserEntity | null>;
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
}
