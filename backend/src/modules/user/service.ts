import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import type Redis from "ioredis";
import type { IUserRepository } from "./repo";
import type {
  LoginInput,
  CreateUserInput,
  UpdateUserInput,
  DeleteUserInput,
  UserResponse,
} from "./schema";
import type { UserEntity } from "./entity";
import type { FilterRequestInput } from "../../shared/pagination/schema";
import type { PaginationResponse } from "../../shared/response/handler";
import { CalculatePagination } from "../../shared/response/handler";
import {
  UnauthorizedError,
  AppError,
  NotFoundError,
  ConflictError,
} from "../../shared/errors/AppError";
import type { IAuditLogService } from "../audit/service";
import type { AuditMeta } from "../../shared/middleware/auditMeta";

const JWT_SECRET = process.env.JWT_SECRET || "versus-dev-secret-key";

export interface IUserService {
  Login(input: LoginInput): Promise<{ token: string; user: UserResponse }>;
  GetProfile(userId: string): Promise<UserResponse>;
  CreateUser(
    input: CreateUserInput,
    adminUserId: string,
    meta?: AuditMeta,
  ): Promise<UserResponse>;
  Filter(
    input: FilterRequestInput,
  ): Promise<{ data: UserResponse[]; pagination: PaginationResponse }>;
  Update(
    id: string,
    input: UpdateUserInput,
    adminUserId: string,
    meta?: AuditMeta,
  ): Promise<UserResponse>;
  SoftDelete(
    id: string,
    input: DeleteUserInput,
    adminUserId: string,
    meta?: AuditMeta,
  ): Promise<void>;
  Deactivate(
    id: string,
    adminUserId: string,
    meta?: AuditMeta,
  ): Promise<UserResponse>;
}

export class UserService implements IUserService {
  constructor(
    private repo: IUserRepository,
    private redis: Redis,
    private auditService: IAuditLogService,
  ) {}

  async Login(
    input: LoginInput,
  ): Promise<{ token: string; user: UserResponse }> {
    const user = await this.repo.FindByUsername(input.username);
    if (!user) throw new UnauthorizedError("Invalid credentials");

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError("Invalid credentials");

    if (!user.isActive) throw new UnauthorizedError("Account is disabled");

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "24h",
    });

    await this.redis.set(`session:${user.id}`, token, "EX", 86400);

    return { token, user: this.toResponse(user) };
  }

  async GetProfile(userId: string): Promise<UserResponse> {
    const user = await this.repo.FindById(userId);
    if (!user) throw new NotFoundError("User not found");
    return this.toResponse(user);
  }

  async CreateUser(
    input: CreateUserInput,
    adminUserId: string,
    meta?: AuditMeta,
  ): Promise<UserResponse> {
    const existing = await this.repo.FindByUsername(input.username);
    if (existing) throw new AppError(409, "Username already exists");

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.repo.Create({
      id: uuidv4(),
      username: input.username,
      passwordHash,
      displayName: input.displayName,
      role: input.role,
      isActive: true,
      version: 1,
    });

    this.auditService.Insert(
      "CREATE",
      "users",
      user.id,
      adminUserId,
      null,
      user,
      meta,
    );

    return this.toResponse(user);
  }

  async Filter(
    input: FilterRequestInput,
  ): Promise<{ data: UserResponse[]; pagination: PaginationResponse }> {
    const { data, total } = await this.repo.FindFiltered(input);
    const pagination = CalculatePagination(input.page, input.pageSize, total);

    return {
      data: data.map((u) => this.toResponse(u)),
      pagination,
    };
  }

  async Update(
    id: string,
    input: UpdateUserInput,
    adminUserId: string,
    meta?: AuditMeta,
  ): Promise<UserResponse> {
    const existing = await this.repo.FindById(id);
    if (!existing) throw new NotFoundError("User not found");

    const updateData: Partial<UserEntity> = {};
    if (input.displayName !== undefined) updateData.displayName = input.displayName;
    if (input.role !== undefined) updateData.role = input.role;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    const updated = await this.repo.Update(id, updateData, input.version);
    if (!updated) throw new ConflictError("Version mismatch");

    this.auditService.Insert(
      "UPDATE",
      "users",
      id,
      adminUserId,
      existing,
      updated,
      meta,
    );
    return this.toResponse(updated);
  }

  async SoftDelete(
    id: string,
    input: DeleteUserInput,
    adminUserId: string,
    meta?: AuditMeta,
  ): Promise<void> {
    const existing = await this.repo.FindById(id);
    if (!existing) throw new NotFoundError("User not found");

    const deleted = await this.repo.SoftDelete(id, input.version);
    if (!deleted) throw new ConflictError("Version mismatch");

    this.auditService.Insert(
      "DELETE",
      "users",
      id,
      adminUserId,
      existing,
      null,
      meta,
    );
  }

  async Deactivate(
    id: string,
    adminUserId: string,
    meta?: AuditMeta,
  ): Promise<UserResponse> {
    const existing = await this.repo.FindById(id);
    if (!existing) throw new NotFoundError("User not found");

    const newStatus = !existing.isActive;
    const updated = await this.repo.Update(
      id,
      { isActive: newStatus } as Partial<UserEntity>,
      existing.version,
    );
    if (!updated) throw new ConflictError("Version mismatch");

    this.auditService.Insert(
      newStatus ? "ACTIVATE" : "DEACTIVATE",
      "users",
      id,
      adminUserId,
      existing,
      updated,
      meta,
    );
    return this.toResponse(updated);
  }

  private toResponse(user: UserEntity): UserResponse {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive,
      version: user.version,
      createdAt:
        user.createdAt instanceof Date
          ? user.createdAt.toISOString()
          : String(user.createdAt),
    };
  }
}
