---
trigger: always_on
---

# Service Layer Patterns

## 1. Interface + Implementation

```ts
export interface ICustomerService {
  filterCustomers(filters: FilterRequest): Promise<{ data: CustomerEntity[]; total: number }>;
  getById(id: string): Promise<CustomerEntity>;
  create(input: CreateCustomerInput): Promise<CustomerEntity>;
  update(id: string, input: UpdateCustomerInput): Promise<CustomerEntity>;
  softDelete(id: string, version: number): Promise<void>;
}

export class CustomerService implements ICustomerService {
  constructor(private repo: ICustomerRepository) {}

  // ... methods
}
```

## 2. CRUD Pattern

```ts
async getById(id: string): Promise<CustomerEntity> {
  const customer = await this.repo.findById(id);
  if (!customer) throw new NotFoundError('Customer not found');
  return customer;
}

async create(input: CreateCustomerInput): Promise<CustomerEntity> {
  const existing = await this.repo.findByPhone(input.phone);
  if (existing) throw new ConflictError('Customer with this phone already exists');
  return this.repo.create(input);
}

async update(id: string, input: UpdateCustomerInput): Promise<CustomerEntity> {
  const existing = await this.repo.findById(id);
  if (!existing) throw new NotFoundError('Customer not found');

  const updated = await this.repo.update(id, input, input.version);
  if (!updated) throw new ConflictError('Version mismatch');

  return updated;
}
```

## 3. Filter with Pagination

```ts
async filterCustomers(filters: FilterRequest): Promise<{ data: CustomerEntity[]; total: number }> {
  // Count and fetch in parallel — same as Go's pattern
  const [data, total] = await Promise.all([
    this.repo.findByFilters(filters),
    this.repo.countByFilters(filters),
  ]);
  return { data, total };
}
```

## 4. Transaction Pattern (in service)

```ts
// Service calls repo method that uses db.transaction() internally
async createInvoice(input: CreateInvoiceInput): Promise<InvoiceEntity> {
  // Validate customer exists
  const customer = await this.customerSvc.getById(input.customerId);

  // Validate stock for all items
  for (const item of input.items) {
    const stock = await this.inventoryRepo.getStock(item.productId);
    if (stock < item.quantity) {
      throw new BadRequestError(`Insufficient stock for product ${item.productId}`);
    }
  }

  // Create invoice — repo handles transaction internally
  return this.repo.createInvoice(input);
}
```

## 5. Private Helpers

```ts
// Decompose long methods into private helpers (max 50 lines/public method)
private applyCustomerChanges(existing: CustomerEntity, input: UpdateCustomerInput): Partial<CustomerEntity> {
  const changes: Partial<CustomerEntity> = {};

  if (input.firstName !== undefined) changes.firstName = input.firstName;
  if (input.lastName !== undefined) changes.lastName = input.lastName;
  if (input.phone !== undefined) changes.phone = input.phone;
  if (input.address !== undefined) changes.address = input.address;

  return changes;
}
```

## 6. Service Rules

- ✅ Public functions: map errors to AppError classes
- ✅ Guard clauses first — check existence, permissions early
- ✅ Deep copy before mutation (prevent side effects on input objects)
- ✅ Max 50 lines per public function
- ❌ No direct DB access in service — go through repo
- ❌ No `console.log` — use `logger`
