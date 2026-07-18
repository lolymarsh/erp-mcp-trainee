export interface CustomerEntity {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  address: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface VehicleEntity {
  id: string;
  customerId: string;
  licensePlate: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  engineType:
    "GASOLINE" | "DIESEL" | "LPG" | "CNG" | "ELECTRIC" | "HYBRID" | null;
  fuelType:
    "GASOLINE" | "DIESEL" | "LPG" | "CNG" | "ELECTRIC" | "HYBRID" | null;
}
