import {
  Box,
  TextField,
  CircularProgress,
  Alert,
  Paper,
  Typography,
  Chip,
} from '@mui/material';
import type { ProductEntity, PaginationResponse } from './model';

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

interface InventoryListViewProps {
  products: ProductEntity[];
  loading: boolean;
  error: string | null;
  pagination: PaginationResponse | null;
  onSearch: (q: string) => void;
  onPageChange: (page: number) => void;
  onSelectProduct: (product: ProductEntity) => void;
}

export function InventoryListView({
  products,
  loading,
  error,
  pagination,
  onSearch,
  onPageChange,
  onSelectProduct,
}: InventoryListViewProps) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        คลังสินค้า
      </Typography>

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
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
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
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 2,
                mt: 2,
              }}
            >
              <button
                disabled={!pagination.hasPreviousPage}
                onClick={() => onPageChange(pagination.page - 1)}
                style={{
                  padding: '8px 16px',
                  cursor: pagination.hasPreviousPage ? 'pointer' : 'not-allowed',
                  opacity: pagination.hasPreviousPage ? 1 : 0.4,
                }}
              >
                ก่อนหน้า
              </button>
              <Typography variant="body2">
                หน้า {pagination.page} / {pagination.totalPage} (
                {pagination.totalData} รายการ)
              </Typography>
              <button
                disabled={!pagination.hasNextPage}
                onClick={() => onPageChange(pagination.page + 1)}
                style={{
                  padding: '8px 16px',
                  cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed',
                  opacity: pagination.hasNextPage ? 1 : 0.4,
                }}
              >
                ถัดไป
              </button>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
}
