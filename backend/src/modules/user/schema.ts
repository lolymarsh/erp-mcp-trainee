import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1).max(255),
  password: z.string().min(1).max(128),
});

export const createUserSchema = z.object({
  username: z.string().min(1).max(255),
  password: z.string().min(6).max(128),
  displayName: z.string().min(1).max(255),
  role: z.enum(["ADMIN", "MANAGER", "STAFF", "TECHNICIAN"]),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
  role: z.enum(["ADMIN", "MANAGER", "STAFF", "TECHNICIAN"]).optional(),
  version: z.number().int().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export interface UserResponse {
  id: string;
  username: string;
  displayName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}
