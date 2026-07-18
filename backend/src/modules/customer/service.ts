import { v4 as uuidv4 } from "uuid";
import type { ICustomerRepository } from "./repo";
import type { CustomerEntity, VehicleEntity } from "./entity";
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
  DeleteCustomerInput,
  CustomerResponse,
  CustomerWithVehiclesResponse,
  VehicleResponse,
} from "./schema";
import type { FilterRequestInput } from "../../shared/pagination/schema";
import type { PaginationResponse } from "../../shared/response/handler";
import { calculatePagination } from "../../shared/response/handler";
import {
  NotFoundError,
  ConflictError,
  AppError,
} from "../../shared/errors/AppError";

export interface ICustomerService {
  filter(
    input: FilterRequestInput,
  ): Promise<{ data: CustomerResponse[]; pagination: PaginationResponse }>;
  getById(id: string): Promise<CustomerWithVehiclesResponse>;
  create(input: CreateCustomerInput): Promise<CustomerResponse>;
  update(id: string, input: UpdateCustomerInput): Promise<CustomerResponse>;
  softDelete(id: string, input: DeleteCustomerInput): Promise<void>;
}

export class CustomerService implements ICustomerService {
  constructor(private repo: ICustomerRepository) {}

  async filter(
    input: FilterRequestInput,
  ): Promise<{ data: CustomerResponse[]; pagination: PaginationResponse }> {
    const result = await this.repo.findFiltered(input);
    const pagination = calculatePagination(
      input.page,
      input.pageSize,
      result.total,
    );

    return {
      data: result.data.map((c) => this.toResponse(c)),
      pagination,
    };
  }

  async getById(id: string): Promise<CustomerWithVehiclesResponse> {
    const result = await this.repo.findByIdWithVehicles(id);
    if (!result) throw new NotFoundError("Customer not found");

    return {
      ...this.toResponse(result.customer),
      vehicles: result.vehicles.map((v) => this.toVehicleResponse(v)),
    };
  }

  async create(input: CreateCustomerInput): Promise<CustomerResponse> {
    const existing = await this.repo.findByPhone(input.phone);
    if (existing) throw new AppError(409, "Phone number already exists");

    const entity = await this.repo.create({
      id: uuidv4(),
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      email: input.email ?? null,
      address: input.address ?? null,
      version: 1,
    });

    return this.toResponse(entity);
  }

  async update(
    id: string,
    input: UpdateCustomerInput,
  ): Promise<CustomerResponse> {
    const { version, ...fields } = input;

    const phone = fields.phone;
    if (typeof phone === "string") {
      const existing = await this.repo.findByPhone(phone);
      if (existing && existing.id !== id) {
        throw new AppError(409, "Phone number already exists");
      }
    }

    const updated = await this.repo.update(id, fields, version);
    if (!updated) throw new ConflictError("Version mismatch");

    return this.toResponse(updated);
  }

  async softDelete(id: string, input: DeleteCustomerInput): Promise<void> {
    const deleted = await this.repo.softDelete(id, input.version);
    if (!deleted)
      throw new ConflictError("Version mismatch or customer not found");
  }

  private toResponse(entity: CustomerEntity): CustomerResponse {
    return {
      id: entity.id,
      firstName: entity.firstName,
      lastName: entity.lastName,
      phone: entity.phone,
      email: entity.email,
      address: entity.address,
      version: entity.version,
      createdAt:
        entity.createdAt instanceof Date
          ? entity.createdAt.toISOString()
          : String(entity.createdAt),
      updatedAt:
        entity.updatedAt instanceof Date
          ? entity.updatedAt.toISOString()
          : String(entity.updatedAt),
    };
  }

  private toVehicleResponse(entity: VehicleEntity): VehicleResponse {
    return {
      id: entity.id,
      customerId: entity.customerId,
      licensePlate: entity.licensePlate,
      brand: entity.brand,
      model: entity.model,
      year: entity.year,
      engineType: entity.engineType,
      fuelType: entity.fuelType,
    };
  }
}
