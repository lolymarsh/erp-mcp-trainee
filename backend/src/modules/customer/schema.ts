import { z } from "zod";

export const createCustomerSchema = z.object({
  firstName: z.string().min(1).max(255),
  lastName: z.string().min(1).max(255),
  phone: z.string().min(1).max(50),
  email: z.email().max(255).optional().nullable(),
  address: z.string().optional().nullable(),
});

export const updateCustomerSchema = z.object({
  firstName: z.string().min(1).max(255).optional(),
  lastName: z.string().min(1).max(255).optional(),
  phone: z.string().min(1).max(50).optional(),
  email: z.email().max(255).optional().nullable(),
  address: z.string().optional().nullable(),
  version: z.number().int().min(1),
});

export const deleteCustomerSchema = z.object({
  version: z.number().int().min(1),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type DeleteCustomerInput = z.infer<typeof deleteCustomerSchema>;

export interface CustomerResponse {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  address: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export const createVehicleSchema = z.object({
  customerId: z.string().min(1).max(36),
  licensePlate: z.string().min(1).max(50),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  year: z.number().int().optional().nullable(),
  engineType: z.string().optional().nullable(),
  fuelType: z.string().optional().nullable(),
});

export const updateVehicleSchema = z.object({
  licensePlate: z.string().min(1).max(50).optional(),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  year: z.number().int().optional().nullable(),
  engineType: z.string().optional().nullable(),
  fuelType: z.string().optional().nullable(),
});

export const deleteVehicleSchema = z.object({});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type DeleteVehicleInput = z.infer<typeof deleteVehicleSchema>;

export interface VehicleResponse {
  id: string;
  customerId: string;
  licensePlate: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  engineType: string | null;
  fuelType: string | null;
}

export interface CustomerWithVehiclesResponse extends CustomerResponse {
  vehicles: VehicleResponse[];
}
