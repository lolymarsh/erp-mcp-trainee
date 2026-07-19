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
import { calculatePagination } from "../../shared/response/handler";
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
  login(input: LoginInput): Promise<{ token: string; user: UserResponse }>;
  getProfile(userId: string): Promise<UserResponse>;
  createUser(
    input: CreateUserInput,
    adminUserId: string,
    meta?: AuditMeta,
  ): Promise<UserResponse>;
  filter(
    input: FilterRequestInput,
  ): Promise<{ data: UserResponse[]; pagination: PaginationResponse }>;
  update(
    id: string,
    input: UpdateUserInput,
    adminUserId: string,
    meta?: AuditMeta,
  ): Promise<UserResponse>;
  softDelete(
    id: string,
    input: DeleteUserInput,
    adminUserId: string,
    meta?: AuditMeta,
  ): Promise<void>;
  deactivate(
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

  async login(
    input: LoginInput,
  ): Promise<{ token: string; user: UserResponse }> {
    const user = await this.repo.findByUsername(input.username);
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

  async getProfile(userId: string): Promise<UserResponse> {
    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    return this.toResponse(user);
  }

  async createUser(
    input: CreateUserInput,
    adminUserId: string,
    meta?: AuditMeta,
  ): Promise<UserResponse> {
    const existing = await this.repo.findByUsername(input.username);
    if (existing) throw new AppError(409, "Username already exists");

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.repo.create({
      id: uuidv4(),
      username: input.username,
      passwordHash,
      displayName: input.displayName,
      role: input.role,
      isActive: true,
      version: 1,
    });

    this.auditService.insertAuditLog(
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

  async filter(
    input: FilterRequestInput,
  ): Promise<{ data: UserResponse[]; pagination: PaginationResponse }> {
    const { data, total } = await this.repo.findFiltered(input);
    const pagination = calculatePagination(input.page, input.pageSize, total);

    return {
      data: data.map((u) => this.toResponse(u)),
      pagination,
    };
  }

  async update(
    id: string,
    input: UpdateUserInput,
    adminUserId: string,
    meta?: AuditMeta,
  ): Promise<UserResponse> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("User not found");

    const updateData: Partial<UserEntity> = {};
    if (input.displayName !== undefined) updateData.displayName = input.displayName;
    if (input.role !== undefined) updateData.role = input.role;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    const updated = await this.repo.update(id, updateData, input.version);
    if (!updated) throw new ConflictError("Version mismatch");

    this.auditService.insertAuditLog(
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

  async softDelete(
    id: string,
    input: DeleteUserInput,
    adminUserId: string,
    meta?: AuditMeta,
  ): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("User not found");

    const deleted = await this.repo.softDelete(id, input.version);
    if (!deleted) throw new ConflictError("Version mismatch");

    this.auditService.insertAuditLog(
      "DELETE",
      "users",
      id,
      adminUserId,
      existing,
      null,
      meta,
    );
  }

  async deactivate(
    id: string,
    adminUserId: string,
    meta?: AuditMeta,
  ): Promise<UserResponse> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("User not found");

    const newStatus = !existing.isActive;
    const updated = await this.repo.update(
      id,
      { isActive: newStatus } as Partial<UserEntity>,
      existing.version,
    );
    if (!updated) throw new ConflictError("Version mismatch");

    this.auditService.insertAuditLog(
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
