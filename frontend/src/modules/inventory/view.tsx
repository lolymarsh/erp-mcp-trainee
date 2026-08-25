import React, { useState, useEffect } from 'react';
import {
  Tags,
  Sliders,
  Plus,
  Loader2,
  Edit,
  Trash2,
  History,
  Download,
  ArrowLeft,
} from 'lucide-react';
import type {
  ProductEntity,
  ProductWithMovements,
  CategoryEntity,
  PaginationResponse,
} from './model';
import { inventoryApi } from './model';
import type {
  CreateProductFormData,
  StockAdjustFormData,
  CreateCategoryFormData,
} from './controller';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';

// ============== Stock Badge ==============

interface StockBadgeProps {
  currentStock: number;
  minStock: number;
}

function StockBadge({ currentStock, minStock }: StockBadgeProps) {
  const isLow = currentStock <= minStock;

  return (
    <Badge
      variant={isLow ? 'destructive' : 'secondary'}
      className={`font-semibold min-w-[3.5rem] justify-center ${
        !isLow ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : ''
      }`}
    >
      {currentStock}
    </Badge>
  );
}

export { StockBadge };

// ============== Inventory List ==============

interface InventoryListViewProps {
  products: ProductEntity[];
  loading: boolean;
  error: string | null;
  pagination: PaginationResponse | null;
  onSearch: (q: string) => void;
  onPageChange: (page: number) => void;
  onSelectProduct: (product: ProductEntity) => void;
  onCreateClick: () => void;
  onManageCategoriesClick?: () => void;
  onExportCsv?: () => void;
}

export function InventoryListView({
  products,
  loading,
  error,
  pagination,
  onSearch,
  onPageChange,
  onSelectProduct,
  onCreateClick,
  onManageCategoriesClick,
  onExportCsv,
}: InventoryListViewProps) {
  const from = pagination ? (pagination.page - 1) * pagination.pageSize + 1 : 1;
  const to = pagination
    ? Math.min(pagination.page * pagination.pageSize, pagination.totalData)
    : products.length;

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">คลังสินค้า</h1>
        <div className="flex flex-wrap items-center gap-2">
          {onExportCsv && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportCsv}
              disabled={products.length === 0}
              className="flex items-center gap-1.5"
            >
              <Download className="size-4" />
              <span>ส่งออก CSV</span>
            </Button>
          )}
          {onManageCategoriesClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={onManageCategoriesClick}
              className="flex items-center gap-1.5"
            >
              <Tags className="size-4" />
              <span>จัดการหมวดหมู่</span>
            </Button>
          )}
          <Button
            size="sm"
            onClick={onCreateClick}
            className="flex items-center gap-1.5"
          >
            <Plus className="size-4" />
            <span>เพิ่มสินค้า</span>
          </Button>
        </div>
      </div>

      <div className="mb-4 space-y-1.5">
        <Label htmlFor="inventory-search">ค้นหาชื่อสินค้าหรือ SKU</Label>
        <Input
          id="inventory-search"
          placeholder="ค้นหาชื่อสินค้าหรือ SKU..."
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div role="progressbar" className="flex flex-col gap-2 py-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          ไม่พบข้อมูลสินค้า
        </p>
      ) : (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">SKU</TableHead>
                <TableHead>ชื่อสินค้า</TableHead>
                <TableHead>ราคาขาย</TableHead>
                <TableHead className="w-[100px]">สต็อก</TableHead>
                <TableHead className="w-[100px]">ขั้นต่ำ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className="cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    {Number(product.sellPrice).toLocaleString()} ฿
                  </TableCell>
                  <TableCell>
                    <StockBadge
                      currentStock={product.currentStock}
                      minStock={product.minStock}
                    />
                  </TableCell>
                  <TableCell className="text-neutral-500">{product.minStock}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pagination && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {`${from}-${to} จาก ${pagination.totalData}`}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => onPageChange(pagination.page - 1)}
                >
                  ก่อนหน้า
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!pagination.hasNextPage}
                  onClick={() => onPageChange(pagination.page + 1)}
                >
                  ถัดไป
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ============== Product Detail ==============

interface InventoryDetailViewProps {
  product: ProductWithMovements | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onEdit: (product: ProductWithMovements) => void;
  onDelete: () => void;
  onStockAdjust: () => void;
  onHistory: () => void;
}

export function InventoryDetailView({
  product,
  loading,
  error,
  onBack,
  onEdit,
  onDelete,
  onStockAdjust,
  onHistory,
}: InventoryDetailViewProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12" role="progressbar">
        <Loader2 className="size-8 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
      >
        {error}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
        ไม่พบข้อมูลสินค้า
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack} className="flex items-center gap-1">
            <ArrowLeft className="size-4" />
            <span>กลับ</span>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => onEdit(product)} className="flex items-center gap-1">
            <Edit className="size-4" />
            <span>แก้ไข</span>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onStockAdjust}
            className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Sliders className="size-4" />
            <span>ปรับสต็อก</span>
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={onDelete}
            className="flex items-center gap-1"
          >
            <Trash2 className="size-4" />
            <span>ลบ</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onHistory}
            className="flex items-center gap-1"
          >
            <History className="size-4" />
            <span>ประวัติการแก้ไข</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">SKU</span>
          <p className="font-mono text-sm">{product.sku}</p>
        </div>
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">หมวดหมู่</span>
          <p className="text-sm">{product.categoryName || product.categoryId}</p>
        </div>
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">คำอธิบาย</span>
          <p className="text-sm">{product.description || '-'}</p>
        </div>
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">หน่วย</span>
          <p className="text-sm">{product.unit}</p>
        </div>
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">ราคาทุน</span>
          <p className="text-sm">{Number(product.costPrice).toLocaleString()} ฿</p>
        </div>
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">ราคาขาย</span>
          <p className="text-sm">{Number(product.sellPrice).toLocaleString()} ฿</p>
        </div>
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">สต็อกคงเหลือ</span>
          <div className="mt-1">
            <StockBadge currentStock={product.currentStock} minStock={product.minStock} />
          </div>
        </div>
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">สต็อกขั้นต่ำ</span>
          <p className="text-sm">{product.minStock}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">ประวัติการเคลื่อนไหว</h2>
      {product.movements.length === 0 ? (
        <p className="py-4 text-center text-sm text-neutral-500 dark:text-neutral-400 border border-dashed rounded-md">
          ไม่พบรายการเคลื่อนไหว
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ประเภท</TableHead>
              <TableHead className="w-[80px]">จำนวน</TableHead>
              <TableHead className="w-[80px]">คงเหลือ</TableHead>
              <TableHead>หมายเหตุ</TableHead>
              <TableHead className="w-[160px]">วันที่</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {product.movements.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <Badge
                    variant={m.type === 'IN' ? 'secondary' : m.type === 'OUT' ? 'destructive' : 'outline'}
                    className={m.type === 'IN' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : ''}
                  >
                    {m.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{m.quantity}</TableCell>
                <TableCell>-</TableCell>
                <TableCell className="text-neutral-600 dark:text-neutral-400">{m.note || '-'}</TableCell>
                <TableCell className="text-xs text-neutral-500">
                  {new Date(m.createdAt).toLocaleString('th-TH')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

// ============== Product Create Dialog ==============

interface ProductCreateDialogProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  onSubmit: (data: CreateProductFormData) => void;
}

export function ProductCreateDialog({
  open,
  onClose,
  loading,
  error,
  fieldErrors,
  onSubmit,
}: ProductCreateDialogProps) {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('ชิ้น');
  const [costPrice, setCostPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [minStock, setMinStock] = useState('0');
  const [currentStock, setCurrentStock] = useState('0');
  const [categories, setCategories] = useState<CategoryEntity[]>([]);

  useEffect(() => {
    if (open) {
      setSku('');
      setName('');
      setCategoryId('');
      setDescription('');
      setUnit('ชิ้น');
      setCostPrice('');
      setSellPrice('');
      setMinStock('0');
      setCurrentStock('0');
      inventoryApi
        .ListCategories()
        .then((res) => {
          setCategories(res.data);
        })
        .catch(() => {
          setCategories([]);
        });
    }
  }, [open]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSubmit({
      sku,
      name,
      categoryId,
      description: description || undefined,
      unit: unit || undefined,
      costPrice: costPrice ? Number(costPrice) : undefined,
      sellPrice: sellPrice ? Number(sellPrice) : undefined,
      minStock: minStock ? Number(minStock) : undefined,
      currentStock: currentStock ? Number(currentStock) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>เพิ่มสินค้าใหม่</DialogTitle>
        </DialogHeader>
        {error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="create-prod-sku">SKU *</Label>
            <Input
              id="create-prod-sku"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              error={!!fieldErrors.sku}
            />
            {fieldErrors.sku && <p className="text-xs text-red-500">{fieldErrors.sku}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-prod-name">ชื่อสินค้า *</Label>
            <Input
              id="create-prod-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!fieldErrors.name}
            />
            {fieldErrors.name && <p className="text-xs text-red-500">{fieldErrors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-prod-cat">หมวดหมู่ *</Label>
            <Select
              id="create-prod-cat"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              error={!!fieldErrors.categoryId}
            >
              <option value="">-- เลือกหมวดหมู่ --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            {fieldErrors.categoryId && (
              <p className="text-xs text-red-500">{fieldErrors.categoryId}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-prod-desc">คำอธิบาย</Label>
            <Textarea
              id="create-prod-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-prod-unit">หน่วย</Label>
            <Input
              id="create-prod-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="create-prod-cost">ราคาทุน</Label>
              <Input
                id="create-prod-cost"
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                error={!!fieldErrors.costPrice}
              />
              {fieldErrors.costPrice && (
                <p className="text-xs text-red-500">{fieldErrors.costPrice}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-prod-sell">ราคาขาย</Label>
              <Input
                id="create-prod-sell"
                type="number"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                error={!!fieldErrors.sellPrice}
              />
              {fieldErrors.sellPrice && (
                <p className="text-xs text-red-500">{fieldErrors.sellPrice}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="create-prod-min">สต็อกขั้นต่ำ</Label>
              <Input
                id="create-prod-min"
                type="number"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                error={!!fieldErrors.minStock}
              />
              {fieldErrors.minStock && (
                <p className="text-xs text-red-500">{fieldErrors.minStock}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-prod-curr">สต็อกคงเหลือ</Label>
              <Input
                id="create-prod-curr"
                type="number"
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                error={!!fieldErrors.currentStock}
              />
              {fieldErrors.currentStock && (
                <p className="text-xs text-red-500">{fieldErrors.currentStock}</p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : 'บันทึก'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============== Product Edit Dialog ==============

interface ProductEditDialogProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  initialValues: CreateProductFormData | null;
  onSubmit: (data: CreateProductFormData) => void;
}

export function ProductEditDialog({
  open,
  onClose,
  loading,
  error,
  fieldErrors,
  initialValues,
  onSubmit,
}: ProductEditDialogProps) {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('ชิ้น');
  const [costPrice, setCostPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [minStock, setMinStock] = useState('0');
  const [currentStock, setCurrentStock] = useState('0');
  const [categories, setCategories] = useState<CategoryEntity[]>([]);

  useEffect(() => {
    if (open && initialValues) {
      setSku(initialValues.sku);
      setName(initialValues.name);
      setCategoryId(initialValues.categoryId);
      setDescription(initialValues.description ?? '');
      setUnit(initialValues.unit ?? 'ชิ้น');
      setCostPrice(initialValues.costPrice != null ? String(initialValues.costPrice) : '');
      setSellPrice(initialValues.sellPrice != null ? String(initialValues.sellPrice) : '');
      setMinStock(initialValues.minStock != null ? String(initialValues.minStock) : '0');
      setCurrentStock(initialValues.currentStock != null ? String(initialValues.currentStock) : '0');
      inventoryApi
        .ListCategories()
        .then((res) => {
          setCategories(res.data);
        })
        .catch(() => {
          setCategories([]);
        });
    }
  }, [open, initialValues]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSubmit({
      sku,
      name,
      categoryId,
      description: description || undefined,
      unit: unit || undefined,
      costPrice: costPrice ? Number(costPrice) : undefined,
      sellPrice: sellPrice ? Number(sellPrice) : undefined,
      minStock: minStock ? Number(minStock) : undefined,
      currentStock: currentStock ? Number(currentStock) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>แก้ไขสินค้า</DialogTitle>
        </DialogHeader>
        {error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-prod-sku">SKU *</Label>
            <Input
              id="edit-prod-sku"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              error={!!fieldErrors.sku}
            />
            {fieldErrors.sku && <p className="text-xs text-red-500">{fieldErrors.sku}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-prod-name">ชื่อสินค้า *</Label>
            <Input
              id="edit-prod-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!fieldErrors.name}
            />
            {fieldErrors.name && <p className="text-xs text-red-500">{fieldErrors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-prod-cat">หมวดหมู่ *</Label>
            <Select
              id="edit-prod-cat"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              error={!!fieldErrors.categoryId}
            >
              <option value="">-- เลือกหมวดหมู่ --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            {fieldErrors.categoryId && (
              <p className="text-xs text-red-500">{fieldErrors.categoryId}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-prod-desc">คำอธิบาย</Label>
            <Textarea
              id="edit-prod-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-prod-unit">หน่วย</Label>
            <Input
              id="edit-prod-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-prod-cost">ราคาทุน</Label>
              <Input
                id="edit-prod-cost"
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                error={!!fieldErrors.costPrice}
              />
              {fieldErrors.costPrice && (
                <p className="text-xs text-red-500">{fieldErrors.costPrice}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-prod-sell">ราคาขาย</Label>
              <Input
                id="edit-prod-sell"
                type="number"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                error={!!fieldErrors.sellPrice}
              />
              {fieldErrors.sellPrice && (
                <p className="text-xs text-red-500">{fieldErrors.sellPrice}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-prod-min">สต็อกขั้นต่ำ</Label>
              <Input
                id="edit-prod-min"
                type="number"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                error={!!fieldErrors.minStock}
              />
              {fieldErrors.minStock && (
                <p className="text-xs text-red-500">{fieldErrors.minStock}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-prod-curr">สต็อกคงเหลือ</Label>
              <Input
                id="edit-prod-curr"
                type="number"
                value={currentStock}
                disabled
                className="bg-neutral-100 dark:bg-neutral-800"
              />
              <p className="text-xs text-neutral-500">ปรับสต็อกผ่านเมนูปรับสต็อก</p>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : 'บันทึก'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============== Stock Adjust Dialog ==============

interface StockAdjustDialogProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  onSubmit: (data: StockAdjustFormData) => void;
}

export function StockAdjustDialog({
  open,
  onClose,
  loading,
  error,
  fieldErrors,
  onSubmit,
}: StockAdjustDialogProps) {
  const [type, setType] = useState<'IN' | 'OUT' | 'ADJUST'>('IN');
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setType('IN');
      setQuantity('1');
      setNote('');
    }
  }, [open]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSubmit({
      type,
      quantity: Number(quantity),
      note: note || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ปรับสต็อก</DialogTitle>
        </DialogHeader>
        {error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="adjust-type">ประเภท *</Label>
            <Select
              id="adjust-type"
              value={type}
              onChange={(e) => setType(e.target.value as 'IN' | 'OUT' | 'ADJUST')}
              error={!!fieldErrors.type}
            >
              <option value="IN">เพิ่มสต็อก (IN)</option>
              <option value="OUT">ตัดสต็อก (OUT)</option>
              <option value="ADJUST">ปรับยอด (ADJUST)</option>
            </Select>
            {fieldErrors.type && <p className="text-xs text-red-500">{fieldErrors.type}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adjust-qty">จำนวน *</Label>
            <Input
              id="adjust-qty"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              error={!!fieldErrors.quantity}
            />
            {fieldErrors.quantity && (
              <p className="text-xs text-red-500">{fieldErrors.quantity}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adjust-note">หมายเหตุ</Label>
            <Textarea
              id="adjust-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : 'บันทึก'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============== Delete Confirm Dialog ==============

interface DeleteConfirmDialogProps {
  open: boolean;
  productName: string;
  loading: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

// ============== Category Manage View (full page) ==============

interface CategoryManageViewProps {
  categories: CategoryEntity[];
  loading: boolean;
  error: string | null;
  pagination: PaginationResponse | null;
  onBack: () => void;
  onAddClick: () => void;
  onEditClick: (category: CategoryEntity) => void;
  onDeleteClick: (category: CategoryEntity) => void;
  onHistoryClick: (category: CategoryEntity) => void;
  onSearch: (q: string) => void;
  onPageChange: (page: number) => void;
}

export function CategoryManageView({
  categories,
  loading,
  error,
  pagination,
  onBack,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onHistoryClick,
  onSearch,
  onPageChange,
}: CategoryManageViewProps) {
  const from = pagination ? (pagination.page - 1) * pagination.pageSize + 1 : 1;
  const to = pagination
    ? Math.min(pagination.page * pagination.pageSize, pagination.totalData)
    : categories.length;

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack} className="flex items-center gap-1">
            <ArrowLeft className="size-4" />
            <span>กลับ</span>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">จัดการหมวดหมู่</h1>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <Input
            placeholder="ค้นหาหมวดหมู่..."
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <Button onClick={onAddClick} className="flex items-center gap-1.5 shrink-0">
          <Plus className="size-4" />
          <span>เพิ่มหมวดหมู่</span>
        </Button>
      </div>

      {loading ? (
        <div role="progressbar" className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-neutral-500" />
        </div>
      ) : categories.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          ไม่พบหมวดหมู่
        </p>
      ) : (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อหมวดหมู่</TableHead>
                <TableHead>คำอธิบาย</TableHead>
                <TableHead className="text-right w-[200px]">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-neutral-600 dark:text-neutral-400">
                    {cat.description || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEditClick(cat)}
                        className="h-8 px-2"
                      >
                        แก้ไข
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDeleteClick(cat)}
                        className="h-8 px-2"
                      >
                        ลบ
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onHistoryClick(cat)}
                        className="h-8 px-2"
                      >
                        ประวัติ
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pagination && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {`${from}-${to} จาก ${pagination.totalData}`}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => onPageChange(pagination.page - 1)}
                >
                  ก่อนหน้า
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!pagination.hasNextPage}
                  onClick={() => onPageChange(pagination.page + 1)}
                >
                  ถัดไป
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ============== Category Create Dialog ==============

interface CategoryCreateDialogProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  onSubmit: (data: CreateCategoryFormData) => void;
}

export function CategoryCreateDialog({
  open,
  onClose,
  loading,
  error,
  fieldErrors,
  onSubmit,
}: CategoryCreateDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
    }
  }, [open]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSubmit({
      name,
      description: description || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>เพิ่มหมวดหมู่</DialogTitle>
        </DialogHeader>
        {error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="create-cat-name">ชื่อหมวดหมู่ *</Label>
            <Input
              id="create-cat-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!fieldErrors.name}
            />
            {fieldErrors.name && <p className="text-xs text-red-500">{fieldErrors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-cat-desc">คำอธิบาย</Label>
            <Textarea
              id="create-cat-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : 'บันทึก'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============== Category Edit Dialog ==============

interface CategoryEditDialogProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  initialValues: { name: string; description: string } | null;
  onSubmit: (data: CreateCategoryFormData) => void;
}

export function CategoryEditDialog({
  open,
  onClose,
  loading,
  error,
  fieldErrors,
  initialValues,
  onSubmit,
}: CategoryEditDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open && initialValues) {
      setName(initialValues.name);
      setDescription(initialValues.description ?? '');
    }
  }, [open, initialValues]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSubmit({
      name,
      description: description || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>แก้ไขหมวดหมู่</DialogTitle>
        </DialogHeader>
        {error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-cat-name">ชื่อหมวดหมู่ *</Label>
            <Input
              id="edit-cat-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!fieldErrors.name}
            />
            {fieldErrors.name && <p className="text-xs text-red-500">{fieldErrors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-cat-desc">คำอธิบาย</Label>
            <Textarea
              id="edit-cat-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : 'บันทึก'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============== Category Delete Confirm Dialog ==============

interface CategoryDeleteConfirmDialogProps {
  open: boolean;
  categoryName: string;
  loading: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function CategoryDeleteConfirmDialog({
  open,
  categoryName,
  loading,
  error,
  onCancel,
  onConfirm,
}: CategoryDeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ยืนยันการลบ</DialogTitle>
        </DialogHeader>
        {error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </div>
        )}
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          คุณต้องการลบหมวดหมู่ "{categoryName}" ใช่หรือไม่?
        </p>
        <DialogFooter className="pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : 'ลบ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============== Product Delete Confirm Dialog ==============

export function ProductDeleteConfirmDialog({
  open,
  productName,
  loading,
  error,
  onCancel,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ยืนยันการลบ</DialogTitle>
        </DialogHeader>
        {error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </div>
        )}
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          คุณต้องการลบสินค้า "{productName}" ใช่หรือไม่?
        </p>
        <DialogFooter className="pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : 'ลบ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
