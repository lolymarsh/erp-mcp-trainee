import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import type Redis from "ioredis";
import type { IUserRepository } from "./repo";
import type { LoginInput, CreateUserInput, UserResponse } from "./schema";
import type { UserEntity } from "./entity";
import {
  UnauthorizedError,
  AppError,
  NotFoundError,
} from "../../shared/errors/AppError";

const JWT_SECRET = process.env.JWT_SECRET || "versus-dev-secret-key";

export interface IUserService {
  login(input: LoginInput): Promise<{ token: string; user: UserResponse }>;
  getProfile(userId: string): Promise<UserResponse>;
  createUser(input: CreateUserInput): Promise<UserResponse>;
}

export class UserService implements IUserService {
  constructor(
    private repo: IUserRepository,
    private redis: Redis,
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

  async createUser(input: CreateUserInput): Promise<UserResponse> {
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
    return this.toResponse(user);
  }

  private toResponse(user: UserEntity): UserResponse {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive,
      createdAt:
        user.createdAt instanceof Date
          ? user.createdAt.toISOString()
          : String(user.createdAt),
    };
  }
}
