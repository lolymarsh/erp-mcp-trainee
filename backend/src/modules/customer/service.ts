import { v4 as uuidv4 } from "uuid";
import type { ICustomerRepository } from "./repo";
import type { CustomerEntity, VehicleEntity } from "./entity";
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
  DeleteCustomerInput,
  CreateVehicleInput,
  UpdateVehicleInput,
  DeleteVehicleInput,
  CustomerResponse,
  CustomerWithVehiclesResponse,
  VehicleResponse,
} from "./schema";
import type { FilterRequestInput } from "../../shared/pagination/schema";
import type { PaginationResponse } from "../../shared/response/handler";
import { CalculatePagination } from "../../shared/response/handler";
import {
  NotFoundError,
  ConflictError,
  AppError,
} from "../../shared/errors/AppError";
import type { IAuditLogService } from "../audit/service";
import type { AuditMeta } from "../../shared/middleware/auditMeta";

export interface ICustomerService {
  Filter(
    input: FilterRequestInput,
  ): Promise<{ data: CustomerResponse[]; pagination: PaginationResponse }>;
  GetById(id: string): Promise<CustomerWithVehiclesResponse>;
  Create(
    input: CreateCustomerInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<CustomerResponse>;
  Update(
    id: string,
    input: UpdateCustomerInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<CustomerResponse>;
  SoftDelete(
    id: string,
    input: DeleteCustomerInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<void>;
  CreateVehicle(
    input: CreateVehicleInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<VehicleResponse>;
  UpdateVehicle(
    id: string,
    input: UpdateVehicleInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<VehicleResponse>;
  DeleteVehicle(
    id: string,
    input: DeleteVehicleInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<void>;
}

export class CustomerService implements ICustomerService {
  constructor(
    private repo: ICustomerRepository,
    private auditService: IAuditLogService,
  ) {}

  async Filter(
    input: FilterRequestInput,
  ): Promise<{ data: CustomerResponse[]; pagination: PaginationResponse }> {
    const result = await this.repo.FindFiltered(input);
    const pagination = CalculatePagination(
      input.page,
      input.pageSize,
      result.total,
    );

    return {
      data: result.data.map((c) => this.toResponse(c)),
      pagination,
    };
  }

  async GetById(id: string): Promise<CustomerWithVehiclesResponse> {
    const result = await this.repo.FindByIdWithVehicles(id);
    if (!result) throw new NotFoundError("Customer not found");

    return {
      ...this.toResponse(result.customer),
      vehicles: result.vehicles.map((v) => this.toVehicleResponse(v)),
    };
  }

  async Create(
    input: CreateCustomerInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<CustomerResponse> {
    const existing = await this.repo.FindByPhone(input.phone);
    if (existing) throw new AppError(409, "Phone number already exists");

    const entity = await this.repo.Create({
      id: uuidv4(),
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      email: input.email ?? null,
      address: input.address ?? null,
      version: 1,
    });

    this.auditService.Insert(
      "CREATE",
      "customers",
      entity.id,
      userId,
      null,
      entity,
      meta,
    );

    return this.toResponse(entity);
  }

  async Update(
    id: string,
    input: UpdateCustomerInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<CustomerResponse> {
    const existing = await this.repo.FindById(id);
    if (!existing) throw new NotFoundError("Customer not found");

    const { version, ...fields } = input;

    const phone = fields.phone;
    if (typeof phone === "string") {
      const existingPhone = await this.repo.FindByPhone(phone);
      if (existingPhone && existingPhone.id !== id) {
        throw new AppError(409, "Phone number already exists");
      }
    }

    const updated = await this.repo.Update(id, fields, version);
    if (!updated) throw new ConflictError("Version mismatch");

    this.auditService.Insert(
      "UPDATE",
      "customers",
      id,
      userId,
      existing,
      updated,
      meta,
    );

    return this.toResponse(updated);
  }

  async SoftDelete(
    id: string,
    input: DeleteCustomerInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<void> {
    const before = await this.repo.FindById(id);
    if (!before) throw new NotFoundError("Customer not found");

    const deleted = await this.repo.SoftDelete(id, input.version);
    if (!deleted) throw new ConflictError("Version mismatch or customer not found");

    const after = await this.repo.FindById(id);
    this.auditService.Insert(
      "DELETE",
      "customers",
      id,
      userId,
      before,
      after ?? before,
      meta,
    );
  }

  async CreateVehicle(
    input: CreateVehicleInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<VehicleResponse> {
    const customer = await this.repo.FindById(input.customerId);
    if (!customer) throw new NotFoundError("Customer not found");

    const entity = await this.repo.CreateVehicle({
      id: uuidv4(),
      customerId: input.customerId,
      licensePlate: input.licensePlate,
      brand: input.brand ?? null,
      model: input.model ?? null,
      year: input.year ?? null,
      engineType: input.engineType ?? null,
      fuelType: input.fuelType ?? null,
    });

    this.auditService.Insert(
      "CREATE",
      "vehicles",
      entity.id,
      userId,
      null,
      entity,
      meta,
    );
    return this.toVehicleResponse(entity);
  }

  async UpdateVehicle(
    id: string,
    input: UpdateVehicleInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<VehicleResponse> {
    const existing = await this.repo.FindVehicleById(id);
    if (!existing) throw new NotFoundError("Vehicle not found");

    const updated = await this.repo.UpdateVehicle(id, {
      licensePlate: input.licensePlate,
      brand: input.brand,
      model: input.model,
      year: input.year,
      engineType: input.engineType,
      fuelType: input.fuelType,
    });
    if (!updated) throw new NotFoundError("Vehicle not found after update");

    this.auditService.Insert(
      "UPDATE",
      "vehicles",
      id,
      userId,
      existing,
      updated,
      meta,
    );
    return this.toVehicleResponse(updated);
  }

  async DeleteVehicle(
    id: string,
    _input: DeleteVehicleInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<void> {
    const existing = await this.repo.FindVehicleById(id);
    if (!existing) throw new NotFoundError("Vehicle not found");

    await this.repo.DeleteVehicle(id);
    this.auditService.Insert(
      "DELETE",
      "vehicles",
      id,
      userId,
      existing,
      null,
      meta,
    );
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
