# Prompt — Phase 02: Inventory Category Name + Category CRUD

implement phase 02 ตาม spec/2026-07-19_problems/02_INVENTORY_CATEGORY.md

อ่าน AGENTS.md ก่อนเริ่ม
ตามกฎ: R3 Version Check, R4 Unified Response, R5 TypeScript Strict, R6 Error Handling

สิ่งที่ต้องทำ:

Task 2.1 — Backend: categoryName in ProductResponse:
  modules/inventory/entity.ts: ProductEntity เพิ่ม categoryName?: string
  modules/inventory/schema.ts: ProductResponse เพิ่ม categoryName: string
  modules/inventory/repo.ts: findFiltered() JOIN categories (left join on categoryId)
  modules/inventory/repo.ts: findById() JOIN categories
  modules/inventory/repo.ts: findByIds() JOIN categories

Task 2.2 — Frontend: show categoryName:
  modules/inventory/model.ts: ProductEntity เพิ่ม categoryName: string
  modules/inventory/view.tsx: InventoryDetailView เปลี่ยน {product.categoryId} → {product.categoryName}

Task 2.3 — Backend: Category CRUD endpoints:
  modules/inventory/schema.ts: เพิ่ม createCategorySchema, updateCategorySchema, deleteCategorySchema
  modules/inventory/repo.ts: เพิ่ม findCategoryById, createCategory, updateCategory, deleteCategory
  modules/inventory/service.ts: เพิ่ม createCategory, updateCategory, deleteCategory (พร้อม audit log + version check)
  modules/inventory/handler.ts: เพิ่ม createCategory, updateCategory, deleteCategory handlers
  modules/inventory/route.ts: เพิ่ม POST /categories, PATCH /categories/:id, DELETE /categories/:id

Task 2.4 — Frontend: Category Management UI:
  modules/inventory/model.ts: เพิ่ม createCategory, updateCategory, deleteCategory API calls
  modules/inventory/controller.ts: เพิ่ม useCategoryList, useCategoryCreate, useCategoryUpdate, useCategoryDelete
  modules/inventory/view.tsx: สร้าง CategoryManageDialog (ตาราง + CRUD dialogs)
  modules/inventory/view.tsx: InventoryListView header เพิ่มปุ่ม "จัดการหมวดหมู่"
  router.tsx: เชื่อม CategoryManageDialog ใน InventoryListRoute

ห้าม:
  - สร้าง module/category แยก (อยู่ใน inventory module)
  - เปลี่ยน transaction logic

อย่าลืม:
  - categories table อาจไม่มี version column → เช็ค schema/database ก่อน ถ้าไม่มีเพิ่ม ALTER TABLE
  - npm run typecheck + npm test ต้องผ่าน
