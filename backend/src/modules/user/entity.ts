export interface UserEntity {
  id: string;
  username: string;
  passwordHash: string;
  displayName: string;
  role: "ADMIN" | "MANAGER" | "STAFF" | "TECHNICIAN";
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
