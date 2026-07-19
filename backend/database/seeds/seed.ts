import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { createDb } from '../../src/config/database';
import * as schema from '../../src/config/schema';
import { logger } from '../../src/config/logger';

async function seed(): Promise<void> {
  logger.info('Seeding database...');
  const { db } = createDb();

  // Clear existing data in FK-safe order
  await db.delete(schema.invoiceItems);
  await db.delete(schema.invoices);
  await db.delete(schema.stockMovements);
  await db.delete(schema.jobStatusLogs);
  await db.delete(schema.jobs);
  await db.delete(schema.vehicles);
  await db.delete(schema.products);
  await db.delete(schema.categories);
  await db.delete(schema.customers);
  await db.delete(schema.users);

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
    { categoryId: catId, sku: 'TNK-120L', name: 'ถังแก๊ส 120L', unit: 'ใบ', costPrice: '6500', sellPrice: '9500', minStock: 2, currentStock: 6 },
    { categoryId: cat2Id, sku: 'INJ-8CYL', name: 'หัวฉีด 8 สูบ', unit: 'ชุด', costPrice: '5200', sellPrice: '7800', minStock: 2, currentStock: 5 },
    { categoryId: cat3Id, sku: 'ECU-GEN5', name: 'ECU รุ่น 5', unit: 'ตัว', costPrice: '8500', sellPrice: '12000', minStock: 2, currentStock: 3 },
    { categoryId: cat4Id, sku: 'HOSE-3M', name: 'สายท่อ 3 เมตร', unit: 'เส้น', costPrice: '350', sellPrice: '750', minStock: 10, currentStock: 30 },
    { categoryId: catId, sku: 'BRK-01', name: 'ชุดขายึดถัง', unit: 'ชุด', costPrice: '250', sellPrice: '550', minStock: 10, currentStock: 20 },
    { categoryId: cat2Id, sku: 'REG-01', name: 'ชุดเรกูเลเตอร์', unit: 'ชุด', costPrice: '1800', sellPrice: '3200', minStock: 5, currentStock: 12 },
    { categoryId: cat3Id, sku: 'WIR-01', name: 'ชุดสายไฟ ECU', unit: 'ชุด', costPrice: '1200', sellPrice: '2200', minStock: 5, currentStock: 15 },
    { categoryId: cat4Id, sku: 'VAL-01', name: 'วาล์วถังแก๊ส', unit: 'ตัว', costPrice: '800', sellPrice: '1500', minStock: 5, currentStock: 10 },
    { categoryId: catId, sku: 'GAS-01', name: 'มิเตอร์วัดแก๊ส', unit: 'ตัว', costPrice: '600', sellPrice: '1200', minStock: 5, currentStock: 8 },
    { categoryId: cat2Id, sku: 'MAP-01', name: 'เซ็นเซอร์ MAP', unit: 'ตัว', costPrice: '900', sellPrice: '1800', minStock: 5, currentStock: 10 },
    { categoryId: catId, sku: 'TNK-150L', name: 'ถังแก๊ส 150L', unit: 'ใบ', costPrice: '7500', sellPrice: '11000', minStock: 2, currentStock: 4 },
    { categoryId: catId, sku: 'TNK-200L', name: 'ถังแก๊ส 200L', unit: 'ใบ', costPrice: '9500', sellPrice: '14000', minStock: 1, currentStock: 3 },
    { categoryId: catId, sku: 'BRK-02', name: 'ชุดขายึดถังเสริม', unit: 'ชุด', costPrice: '180', sellPrice: '400', minStock: 15, currentStock: 25 },
    { categoryId: catId, sku: 'GAS-02', name: 'ชุดท่อแก๊ส', unit: 'ชุด', costPrice: '350', sellPrice: '700', minStock: 10, currentStock: 18 },
    { categoryId: catId, sku: 'GAS-FIL', name: 'ไส้กรองแก๊ส', unit: 'ตัว', costPrice: '250', sellPrice: '550', minStock: 10, currentStock: 15 },
    { categoryId: cat2Id, sku: 'INJ-SGL', name: 'หัวฉีดเดี่ยว', unit: 'ตัว', costPrice: '750', sellPrice: '1400', minStock: 10, currentStock: 20 },
    { categoryId: cat2Id, sku: 'INJ-FIL', name: 'ไส้กรองหัวฉีด', unit: 'ตัว', costPrice: '200', sellPrice: '450', minStock: 20, currentStock: 35 },
    { categoryId: cat2Id, sku: 'INJ-RAIL', name: 'ชุดรางหัวฉีด', unit: 'ชุด', costPrice: '1500', sellPrice: '2800', minStock: 5, currentStock: 8 },
    { categoryId: cat2Id, sku: 'INJ-SEL', name: 'ชุดซีลหัวฉีด', unit: 'ชุด', costPrice: '120', sellPrice: '300', minStock: 15, currentStock: 30 },
    { categoryId: cat2Id, sku: 'REG-HP', name: 'เรกูเลเตอร์แรงดันสูง', unit: 'ตัว', costPrice: '2200', sellPrice: '3800', minStock: 3, currentStock: 7 },
    { categoryId: cat3Id, sku: 'ECU-GEN2', name: 'ECU รุ่น 2', unit: 'ตัว', costPrice: '3200', sellPrice: '5500', minStock: 3, currentStock: 6 },
    { categoryId: cat3Id, sku: 'ECU-CBL', name: 'สายต่อ ECU', unit: 'เส้น', costPrice: '350', sellPrice: '700', minStock: 10, currentStock: 15 },
    { categoryId: cat3Id, sku: 'ECU-SEN', name: 'ชุดเซ็นเซอร์ ECU', unit: 'ชุด', costPrice: '2800', sellPrice: '4800', minStock: 3, currentStock: 7 },
    { categoryId: cat3Id, sku: 'ECU-LAM', name: 'เซ็นเซอร์แลมบ์ดา', unit: 'ตัว', costPrice: '1500', sellPrice: '2800', minStock: 5, currentStock: 9 },
    { categoryId: cat3Id, sku: 'ECU-DIS', name: 'จอแสดงผล ECU', unit: 'ตัว', costPrice: '1800', sellPrice: '3500', minStock: 3, currentStock: 5 },
    { categoryId: cat4Id, sku: 'HOSE-05M', name: 'สายท่อ 0.5 เมตร', unit: 'เส้น', costPrice: '100', sellPrice: '200', minStock: 25, currentStock: 60 },
    { categoryId: cat4Id, sku: 'HOSE-ELB', name: 'ข้องอสายท่อ', unit: 'ตัว', costPrice: '80', sellPrice: '180', minStock: 20, currentStock: 45 },
    { categoryId: cat4Id, sku: 'HOSE-CLP', name: 'ที่หนีบสายท่อ', unit: 'ตัว', costPrice: '30', sellPrice: '80', minStock: 50, currentStock: 100 },
    { categoryId: cat4Id, sku: 'HOSE-TEE', name: 'ข้อต่อสามทาง', unit: 'ตัว', costPrice: '60', sellPrice: '150', minStock: 20, currentStock: 35 },
    { categoryId: cat4Id, sku: 'VAL-SAF', name: 'วาล์วนิรภัย', unit: 'ตัว', costPrice: '600', sellPrice: '1200', minStock: 5, currentStock: 10 },
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
    { firstName: 'ประยุทธ', lastName: 'ตั้งใจ', phone: '0867890123', email: 'prayut@email.com', address: '78 ถ.ศรีอยุธยา กรุงเทพฯ' },
    { firstName: 'นภาพร', lastName: 'สุขสวัสดิ์', phone: '0878901234', email: null, address: '99 ถ.วิภาวดี กรุงเทพฯ' },
    { firstName: 'อดุลย์', lastName: 'เดชา', phone: '0889012345', email: 'adun@email.com', address: '111 ถ.รามคำแหง กรุงเทพฯ' },
    { firstName: 'กนกพร', lastName: 'รักเรียน', phone: '0890123456', email: 'kanokporn@email.com', address: '222 ถ.ลาดพร้าว กรุงเทพฯ' },
    { firstName: 'สมศักดิ์', lastName: 'ศรีวิไล', phone: '0901234567', email: null, address: '333 ถ.บางนา กรุงเทพฯ' },
    { firstName: 'รัตนา', lastName: 'มั่งคั่ง', phone: '0912345678', email: 'rattana@email.com', address: '444 ถ.เพชรบุรี กรุงเทพฯ' },
    { firstName: 'ธนากร', lastName: 'กล้าหาญ', phone: '0923456789', email: null, address: '555 ถ.รัชดาภิเษก กรุงเทพฯ' },
    { firstName: 'สุภาพร', lastName: 'มีสุข', phone: '0934567890', email: 'supaporn@email.com', address: '666 ถ.สาทร กรุงเทพฯ' },
    { firstName: 'พิชัย', lastName: 'สง่า', phone: '0945678901', email: null, address: '777 ถ.นราธิวาส กรุงเทพฯ' },
    { firstName: 'อารีย์', lastName: 'วัฒนา', phone: '0956789012', email: 'aree@email.com', address: '888 ถ.พระราม 3 กรุงเทพฯ' },
    { firstName: 'ดำรง', lastName: 'มั่นคง', phone: '0967890123', email: null, address: '999 ถ.สุขสวัสดิ์ กรุงเทพฯ' },
    { firstName: 'ผกามาศ', lastName: 'จันทร์แจ่ม', phone: '0978901234', email: 'pkamas@email.com', address: '100 ถ.จันทน์ กรุงเทพฯ' },
    { firstName: 'บรรจบ', lastName: 'เจริญสุข', phone: '0989012345', email: 'banjob@email.com', address: '200 ถ.เจริญราษฎร์ กรุงเทพฯ' },
    { firstName: 'สุนีย์', lastName: 'เรืองศรี', phone: '0990123456', email: null, address: '300 ถ.ประชาชื่น กรุงเทพฯ' },
    { firstName: 'ทวี', lastName: 'ชัยชนะ', phone: '0800123456', email: 'tawee@email.com', address: '400 ถ.บางแค กรุงเทพฯ' },
    { firstName: 'ชลิต', lastName: 'ก้องเกียรติ', phone: '0612345678', email: 'chalit@email.com', address: '500 ถ.ศรีนครินทร์ กรุงเทพฯ' },
    { firstName: 'รุ่งนภา', lastName: 'แจ่มจันทร์', phone: '0623456789', email: null, address: '600 ถ.พัฒนาการ กรุงเทพฯ' },
    { firstName: 'ธวัชชัย', lastName: 'บุญมา', phone: '0634567890', email: 'thawatchai@email.com', address: '700 ถ.ประดิษฐ์มนูญธรรม กรุงเทพฯ' },
    { firstName: 'ปราณี', lastName: 'ทองดี', phone: '0645678901', email: 'pranee@email.com', address: '800 ถ.ร่มเกล้า กรุงเทพฯ' },
    { firstName: 'มณฑล', lastName: 'ไชยศรี', phone: '0656789012', email: null, address: '900 ถ.เสรีไทย กรุงเทพฯ' },
    { firstName: 'สายฝน', lastName: 'บุญช่วย', phone: '0667890123', email: 'saifon@email.com', address: '1000 ถ.นวมินทร์ กรุงเทพฯ' },
    { firstName: 'ประเสริฐ', lastName: 'ศักดิ์ศรี', phone: '0678901234', email: null, address: '1100 ถ.รามอินทรา กรุงเทพฯ' },
    { firstName: 'วันเพ็ญ', lastName: 'จันทร์เพ็ญ', phone: '0689012345', email: 'wanpen@email.com', address: '1200 ถ.ห้วยขวาง กรุงเทพฯ' },
    { firstName: 'สมพร', lastName: 'ทรัพย์ทวี', phone: '0690123456', email: 'somporn@email.com', address: '1300 ถ.ประชาสงเคราะห์ กรุงเทพฯ' },
    { firstName: 'ชูเกียรติ', lastName: 'เดชะ', phone: '0601234567', email: null, address: '1400 ถ.สุทธิสาร กรุงเทพฯ' },
    { firstName: 'กัลยา', lastName: 'ศรีสกุล', phone: '0611122334', email: 'kanya@email.com', address: '1500 ถ.ลาดปลาเค้า กรุงเทพฯ' },
    { firstName: 'วรวุฒิ', lastName: 'ชำนาญ', phone: '0622233445', email: 'worrawut@email.com', address: '1600 ถ.พหลโยธิน เขตจตุจักร กรุงเทพฯ' },
    { firstName: 'จินตนา', lastName: 'พรหมมา', phone: '0633344556', email: null, address: '1700 ถ.วิภาวดีรังสิต กรุงเทพฯ' },
    { firstName: 'ไพโรจน์', lastName: 'แก้ววิไล', phone: '0644455667', email: 'pairoj@email.com', address: '1800 ถ.แจ้งวัฒนะ กรุงเทพฯ' },
    { firstName: 'พิมพา', lastName: 'วงศ์คำ', phone: '0655566778', email: 'pimpa@email.com', address: '1900 ถ.รัตนาธิเบศร์ นนทบุรี' },
    { firstName: 'คำรณ', lastName: 'สว่างศรี', phone: '0666677889', email: null, address: '2000 ถ.ติวานนท์ นนทบุรี' },
    { firstName: 'รัชดา', lastName: 'มงคล', phone: '0677788990', email: 'ratchada@email.com', address: '2100 ถ.พระราม 5 กรุงเทพฯ' },
    { firstName: 'บุญเลิศ', lastName: 'ชูช่วย', phone: '0688899001', email: 'boonlert@email.com', address: '2200 ถ.จรัญสนิทวงศ์ กรุงเทพฯ' },
    { firstName: 'สายชล', lastName: 'วัฒนะ', phone: '0699900112', email: null, address: '2300 ถ.เพชรเกษม กรุงเทพฯ' },
    { firstName: 'ธีรพล', lastName: 'ศิริวัฒน์', phone: '0600112233', email: 'teerapol@email.com', address: '2400 ถ.บางขุนเทียน กรุงเทพฯ' },
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
