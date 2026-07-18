import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { db } from '../../src/config/database';
import * as schema from '../../src/config/schema';
import { logger } from '../../src/config/logger';

async function seed(): Promise<void> {
  logger.info('Seeding database...');

  const adminId = uuidv4();
  const hash = await bcrypt.hash('admin123', 12);

  await db.insert(schema.users).values({
    id: adminId,
    username: 'admin',
    passwordHash: hash,
    displayName: 'Admin',
    role: 'ADMIN',
    isActive: true,
    version: 1,
  });

  const catId = uuidv4();
  await db.insert(schema.categories).values({
    id: catId,
    name: 'ถังแก๊ส',
    description: 'ถังแก๊ส CNG/LPG',
  });
  const cat2Id = uuidv4();
  await db.insert(schema.categories).values({
    id: cat2Id,
    name: 'อุปกรณ์หัวฉีด',
    description: 'หัวฉีดและชุด Injector',
  });
  const cat3Id = uuidv4();
  await db.insert(schema.categories).values({
    id: cat3Id,
    name: 'ECU',
    description: 'ชุดควบคุมเครื่องยนต์',
  });
  const cat4Id = uuidv4();
  await db.insert(schema.categories).values({
    id: cat4Id,
    name: 'สายท่อ',
    description: 'สายท่อและข้อต่อ',
  });

  const products = [
    { categoryId: catId, sku: 'TNK-58L', name: 'ถังแก๊ส 58L', unit: 'ใบ', costPrice: '3500', sellPrice: '5500', minStock: 5, currentStock: 12 },
    { categoryId: catId, sku: 'TNK-75L', name: 'ถังแก๊ส 75L', unit: 'ใบ', costPrice: '4200', sellPrice: '6500', minStock: 3, currentStock: 8 },
    { categoryId: catId, sku: 'TNK-100L', name: 'ถังแก๊ส 100L', unit: 'ใบ', costPrice: '5500', sellPrice: '8500', minStock: 2, currentStock: 5 },
    { categoryId: cat2Id, sku: 'INJ-4CYL', name: 'หัวฉีด 4 สูบ', unit: 'ชุด', costPrice: '2800', sellPrice: '4500', minStock: 5, currentStock: 15 },
    { categoryId: cat2Id, sku: 'INJ-6CYL', name: 'หัวฉีด 6 สูบ', unit: 'ชุด', costPrice: '3800', sellPrice: '5800', minStock: 3, currentStock: 10 },
    { categoryId: cat3Id, sku: 'ECU-GEN3', name: 'ECU รุ่น 3', unit: 'ตัว', costPrice: '4500', sellPrice: '7500', minStock: 3, currentStock: 7 },
    { categoryId: cat3Id, sku: 'ECU-GEN4', name: 'ECU รุ่น 4', unit: 'ตัว', costPrice: '6500', sellPrice: '9500', minStock: 2, currentStock: 4 },
    { categoryId: cat4Id, sku: 'HOSE-1M', name: 'สายท่อ 1 เมตร', unit: 'เส้น', costPrice: '150', sellPrice: '350', minStock: 20, currentStock: 50 },
    { categoryId: cat4Id, sku: 'HOSE-2M', name: 'สายท่อ 2 เมตร', unit: 'เส้น', costPrice: '250', sellPrice: '550', minStock: 15, currentStock: 40 },
    { categoryId: cat4Id, sku: 'FIT-SET', name: 'ชุดข้อต่อ', unit: 'ชุด', costPrice: '450', sellPrice: '850', minStock: 10, currentStock: 25 },
  ];

  const productIds: string[] = [];
  for (const p of products) {
    const id = uuidv4();
    productIds.push(id);
    await db.insert(schema.products).values({
      id,
      ...p,
      version: 1,
    });
  }

  const customerData = [
    { firstName: 'สมชาย', lastName: 'ใจดี', phone: '0812345678', email: 'somchai@email.com', address: '123 ถ.สุขุมวิท กรุงเทพฯ' },
    { firstName: 'สมหญิง', lastName: 'รักดี', phone: '0823456789', email: 'somying@email.com', address: '45 ถ.พหลโยธิน กรุงเทพฯ' },
    { firstName: 'มานะ', lastName: 'ตั้งใจ', phone: '0834567890', email: null, address: '789 ถ.รัชดา กรุงเทพฯ' },
    { firstName: 'วิไล', lastName: 'สุขใจ', phone: '0845678901', email: 'wilai@email.com', address: '12 ถ.เจริญกรุง กรุงเทพฯ' },
    { firstName: 'ประสิทธิ์', lastName: 'เก่งงาน', phone: '0856789012', email: null, address: '56 ถ.พระราม 2 กรุงเทพฯ' },
  ];

  const customerIds: string[] = [];
  for (const c of customerData) {
    const id = uuidv4();
    customerIds.push(id);
    await db.insert(schema.customers).values({
      id,
      ...c,
      version: 1,
    });
  }

  const vehicleData = [
    { customerId: customerIds[0], licensePlate: 'กข1234', brand: 'Toyota', model: 'Hilux Revo', year: 2022, engineType: 'VVT-i', fuelType: 'Gasoline' },
    { customerId: customerIds[0], licensePlate: 'คง5678', brand: 'Honda', model: 'Civic', year: 2021, engineType: 'i-VTEC', fuelType: 'Gasoline' },
    { customerId: customerIds[1], licensePlate: 'ซฌ9012', brand: 'Isuzu', model: 'D-Max', year: 2023, engineType: '4JJ1', fuelType: 'Diesel' },
    { customerId: customerIds[2], licensePlate: 'ตถ3456', brand: 'Mitsubishi', model: 'Triton', year: 2022, engineType: '4N15', fuelType: 'Diesel' },
    { customerId: customerIds[3], licensePlate: 'ทน7890', brand: 'Ford', model: 'Ranger', year: 2023, engineType: '2.0L TDCi', fuelType: 'Diesel' },
  ];

  for (const v of vehicleData) {
    await db.insert(schema.vehicles).values({ id: uuidv4(), ...v });
  }

  const invoiceId = uuidv4();
  await db.insert(schema.invoices).values({
    id: invoiceId,
    invoiceNumber: 'INV-202607-001',
    customerId: customerIds[0],
    vehicleId: vehicleData[0].licensePlate,
    totalAmount: '13500',
    discount: '500',
    tax: '910',
    grandTotal: '13910',
    paymentStatus: 'PAID',
    paymentMethod: 'CASH',
    createdBy: adminId,
    version: 1,
  });

  await db.insert(schema.invoiceItems).values([
    { id: uuidv4(), invoiceId, productId: productIds[0], quantity: 1, unitPrice: '5500', total: '5500' },
    { id: uuidv4(), invoiceId, productId: productIds[3], quantity: 1, unitPrice: '4500', total: '4500' },
    { id: uuidv4(), invoiceId, productId: productIds[5], quantity: 1, unitPrice: '3500', total: '3500' },
  ]);

  const invoiceId2 = uuidv4();
  await db.insert(schema.invoices).values({
    id: invoiceId2,
    invoiceNumber: 'INV-202607-002',
    customerId: customerIds[1],
    vehicleId: vehicleData[2].licensePlate,
    totalAmount: '18500',
    discount: '0',
    tax: '1295',
    grandTotal: '19795',
    paymentStatus: 'PENDING',
    paymentMethod: 'BANK_TRANSFER',
    createdBy: adminId,
    version: 1,
  });

  await db.insert(schema.invoiceItems).values([
    { id: uuidv4(), invoiceId: invoiceId2, productId: productIds[1], quantity: 1, unitPrice: '6500', total: '6500' },
    { id: uuidv4(), invoiceId: invoiceId2, productId: productIds[4], quantity: 1, unitPrice: '5800', total: '5800' },
    { id: uuidv4(), invoiceId: invoiceId2, productId: productIds[6], quantity: 1, unitPrice: '6200', total: '6200' },
  ]);

  const invoiceId3 = uuidv4();
  await db.insert(schema.invoices).values({
    id: invoiceId3,
    invoiceNumber: 'INV-202607-003',
    customerId: customerIds[2],
    vehicleId: vehicleData[3].licensePlate,
    totalAmount: '9000',
    discount: '0',
    tax: '630',
    grandTotal: '9630',
    paymentStatus: 'PAID',
    paymentMethod: 'PROMPTPAY',
    createdBy: adminId,
    version: 1,
  });

  await db.insert(schema.invoiceItems).values([
    { id: uuidv4(), invoiceId: invoiceId3, productId: productIds[0], quantity: 1, unitPrice: '5500', total: '5500' },
    { id: uuidv4(), invoiceId: invoiceId3, productId: productIds[8], quantity: 2, unitPrice: '550', total: '1100' },
    { id: uuidv4(), invoiceId: invoiceId3, productId: productIds[9], quantity: 1, unitPrice: '2400', total: '2400' },
  ]);

  logger.info('Seed completed successfully');
}

seed()
  .catch((err) => {
    logger.error('Seed failed', err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
