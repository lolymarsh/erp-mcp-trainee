import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
  FormHelperText,
  TablePagination,
  Skeleton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useState, useEffect } from 'react';
import type { ProductEntity, ProductWithMovements, CategoryEntity, PaginationResponse } from './model';
import { inventoryApi } from './model';
import type { CreateProductFormData, StockAdjustFormData } from './controller';

// ============== Stock Badge ==============

interface StockBadgeProps {
  currentStock: number;
  minStock: number;
}

function StockBadge({ currentStock, minStock }: StockBadgeProps) {
  const isLow = currentStock <= minStock;

  return (
    <Chip
      label={`${currentStock}`}
      size="small"
      color={isLow ? 'error' : 'success'}
      variant={isLow ? 'filled' : 'outlined'}
      sx={{ minWidth: 60 }}
    />
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
}: InventoryListViewProps) {
  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">คลังสินค้า</Typography>
        <Button variant="contained" onClick={onCreateClick}>
          เพิ่มสินค้า
        </Button>
      </Box>

      <TextField
        label="ค้นหาชื่อสินค้าหรือ SKU"
        variant="outlined"
        fullWidth
        sx={{ mb: 2 }}
        onChange={(e) => onSearch(e.target.value)}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr 100px 120px', gap: 1 }}>
              <Skeleton variant="text" height={24} />
              <Skeleton variant="text" height={24} />
              <Skeleton variant="text" height={24} />
              <Skeleton variant="text" height={24} />
              <Skeleton variant="text" height={24} />
            </Box>
          ))}
        </Box>
      ) : products.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 2 }}>
          ไม่พบข้อมูลสินค้า
        </Typography>
      ) : (
        <Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '180px 1fr 1fr 100px 120px',
              gap: 1,
              mb: 1,
              px: 1,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              SKU
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              ชื่อสินค้า
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              ราคาขาย
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              สต็อก
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              ขั้นต่ำ
            </Typography>
          </Box>

          {products.map((product) => (
            <Box
              key={product.id}
              onClick={() => onSelectProduct(product)}
              sx={{
                display: 'grid',
                gridTemplateColumns: '180px 1fr 1fr 100px 120px',
                gap: 1,
                px: 1,
                py: 1.5,
                cursor: 'pointer',
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
                borderBottom: '1px solid',
                borderColor: 'divider',
                alignItems: 'center',
              }}
            >
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {product.sku}
              </Typography>
              <Typography>{product.name}</Typography>
              <Typography>
                {Number(product.sellPrice).toLocaleString()} ฿
              </Typography>
              <StockBadge
                currentStock={product.currentStock}
                minStock={product.minStock}
              />
              <Typography variant="body2" color="text.secondary">
                {product.minStock}
              </Typography>
            </Box>
          ))}

          {pagination && (
            <TablePagination
              component="div"
              count={pagination.totalData}
              page={pagination.page - 1}
              onPageChange={(_, newPage) => onPageChange(newPage + 1)}
              rowsPerPage={pagination.pageSize}
              rowsPerPageOptions={[pagination.pageSize]}
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count}`}
            />
          )}
        </Box>
      )}
    </Paper>
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
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!product) {
    return <Alert severity="info">ไม่พบข้อมูลสินค้า</Alert>;
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button variant="outlined" onClick={onBack}>
            กลับ
          </Button>
          <Typography variant="h5">{product.name}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" onClick={() => onEdit(product)}>
            แก้ไข
          </Button>
          <Button variant="contained" color="warning" onClick={onStockAdjust}>
            ปรับสต็อก
          </Button>
          <Button variant="outlined" color="error" onClick={onDelete}>
            ลบ
          </Button>
          <Button variant="outlined" onClick={onHistory}>
            ประวัติการแก้ไข
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">SKU</Typography>
          <Typography sx={{ fontFamily: 'monospace' }}>{product.sku}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">หมวดหมู่</Typography>
          <Typography>{product.categoryId}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">คำอธิบาย</Typography>
          <Typography>{product.description || '-'}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">หน่วย</Typography>
          <Typography>{product.unit}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">ราคาทุน</Typography>
          <Typography>{Number(product.costPrice).toLocaleString()} ฿</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">ราคาขาย</Typography>
          <Typography>{Number(product.sellPrice).toLocaleString()} ฿</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">สต็อกคงเหลือ</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StockBadge currentStock={product.currentStock} minStock={product.minStock} />
          </Box>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">สต็อกขั้นต่ำ</Typography>
          <Typography>{product.minStock}</Typography>
        </Box>
      </Box>

      <Typography variant="h6" gutterBottom>
        ประวัติการเคลื่อนไหว
      </Typography>
      {product.movements.length === 0 ? (
        <Typography color="text.secondary">ไม่พบรายการเคลื่อนไหว</Typography>
      ) : (
        <Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '100px 80px 80px 1fr 150px',
              gap: 1,
              px: 1,
              py: 0.5,
              bgcolor: 'grey.100',
              borderRadius: 1,
              mb: 1,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary">ประเภท</Typography>
            <Typography variant="subtitle2" color="text.secondary">จำนวน</Typography>
            <Typography variant="subtitle2" color="text.secondary">คงเหลือ</Typography>
            <Typography variant="subtitle2" color="text.secondary">หมายเหตุ</Typography>
            <Typography variant="subtitle2" color="text.secondary">วันที่</Typography>
          </Box>
          {product.movements.map((m) => (
            <Box
              key={m.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: '100px 80px 80px 1fr 150px',
                gap: 1,
                px: 1,
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                alignItems: 'center',
              }}
            >
              <Chip
                label={m.type}
                size="small"
                color={m.type === 'IN' ? 'success' : m.type === 'OUT' ? 'error' : 'warning'}
                variant="outlined"
                sx={{ width: 70 }}
              />
              <Typography>{m.quantity}</Typography>
              <Typography>-</Typography>
              <Typography variant="body2" color="text.secondary">
                {m.note || '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(m.createdAt).toLocaleString('th-TH')}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
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
      inventoryApi.listCategories().then((res) => {
        setCategories(res.data);
      }).catch(() => {
        setCategories([]);
      });
    }
  }, [open]);

  const selectedCategory = categories.find((c) => c.id === categoryId) || null;

  const handleSubmit = () => {
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">เพิ่มสินค้าใหม่</Typography>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="SKU *"
            required
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            error={!!fieldErrors.sku}
            helperText={fieldErrors.sku}
          />
          <TextField
            label="ชื่อสินค้า *"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!fieldErrors.name}
            helperText={fieldErrors.name}
          />
          <Autocomplete
            options={categories}
            getOptionLabel={(option) => option.name}
            value={selectedCategory}
            onChange={(_event, newValue) => {
              setCategoryId(newValue?.id ?? '');
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="หมวดหมู่ *"
                required
                error={!!fieldErrors.categoryId}
                helperText={fieldErrors.categoryId}
              />
            )}
          />
          <TextField
            label="คำอธิบาย"
            multiline
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <TextField
            label="หน่วย"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          />
          <TextField
            label="ราคาทุน"
            type="number"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            error={!!fieldErrors.costPrice}
            helperText={fieldErrors.costPrice}
          />
          <TextField
            label="ราคาขาย"
            type="number"
            value={sellPrice}
            onChange={(e) => setSellPrice(e.target.value)}
            error={!!fieldErrors.sellPrice}
            helperText={fieldErrors.sellPrice}
          />
          <TextField
            label="สต็อกขั้นต่ำ"
            type="number"
            value={minStock}
            onChange={(e) => setMinStock(e.target.value)}
            error={!!fieldErrors.minStock}
            helperText={fieldErrors.minStock}
          />
          <TextField
            label="สต็อกคงเหลือ"
            type="number"
            value={currentStock}
            onChange={(e) => setCurrentStock(e.target.value)}
            error={!!fieldErrors.currentStock}
            helperText={fieldErrors.currentStock}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>ยกเลิก</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'บันทึก'}
        </Button>
      </DialogActions>
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
      inventoryApi.listCategories().then((res) => {
        setCategories(res.data);
      }).catch(() => {
        setCategories([]);
      });
    }
  }, [open, initialValues]);

  const selectedCategory = categories.find((c) => c.id === categoryId) || null;

  const handleSubmit = () => {
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">แก้ไขสินค้า</Typography>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="SKU *"
            required
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            error={!!fieldErrors.sku}
            helperText={fieldErrors.sku}
          />
          <TextField
            label="ชื่อสินค้า *"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!fieldErrors.name}
            helperText={fieldErrors.name}
          />
          <Autocomplete
            options={categories}
            getOptionLabel={(option) => option.name}
            value={selectedCategory}
            onChange={(_event, newValue) => {
              setCategoryId(newValue?.id ?? '');
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="หมวดหมู่ *"
                required
                error={!!fieldErrors.categoryId}
                helperText={fieldErrors.categoryId}
              />
            )}
          />
          <TextField
            label="คำอธิบาย"
            multiline
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <TextField
            label="หน่วย"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          />
          <TextField
            label="ราคาทุน"
            type="number"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            error={!!fieldErrors.costPrice}
            helperText={fieldErrors.costPrice}
          />
          <TextField
            label="ราคาขาย"
            type="number"
            value={sellPrice}
            onChange={(e) => setSellPrice(e.target.value)}
            error={!!fieldErrors.sellPrice}
            helperText={fieldErrors.sellPrice}
          />
          <TextField
            label="สต็อกขั้นต่ำ"
            type="number"
            value={minStock}
            onChange={(e) => setMinStock(e.target.value)}
            error={!!fieldErrors.minStock}
            helperText={fieldErrors.minStock}
          />
          <TextField
            label="สต็อกคงเหลือ"
            type="number"
            value={currentStock}
            onChange={(e) => setCurrentStock(e.target.value)}
            disabled
            helperText="ปรับสต็อกผ่านเมนูปรับสต็อก"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>ยกเลิก</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'บันทึก'}
        </Button>
      </DialogActions>
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

  const handleSubmit = () => {
    onSubmit({
      type,
      quantity: Number(quantity),
      note: note || undefined,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">ปรับสต็อก</Typography>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <FormControl fullWidth error={!!fieldErrors.type}>
            <InputLabel>ประเภท *</InputLabel>
            <Select
              value={type}
              label="ประเภท *"
              onChange={(e) => setType(e.target.value as 'IN' | 'OUT' | 'ADJUST')}
            >
              <MenuItem value="IN">เพิ่มสต็อก (IN)</MenuItem>
              <MenuItem value="OUT">ตัดสต็อก (OUT)</MenuItem>
              <MenuItem value="ADJUST">ปรับยอด (ADJUST)</MenuItem>
            </Select>
            {fieldErrors.type && <FormHelperText>{fieldErrors.type}</FormHelperText>}
          </FormControl>
          <TextField
            label="จำนวน *"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            slotProps={{ htmlInput: { min: 1 } }}
            error={!!fieldErrors.quantity}
            helperText={fieldErrors.quantity}
          />
          <TextField
            label="หมายเหตุ"
            multiline
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>ยกเลิก</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'บันทึก'}
        </Button>
      </DialogActions>
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

export function ProductDeleteConfirmDialog({
  open,
  productName,
  loading,
  error,
  onCancel,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>ยืนยันการลบ</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography>
          คุณต้องการลบสินค้า "{productName}" ใช่หรือไม่?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>ยกเลิก</Button>
        <Button color="error" variant="contained" onClick={onConfirm} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'ลบ'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
