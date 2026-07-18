import {
  Box,
  TextField,
  CircularProgress,
  Alert,
  Paper,
  Typography,
} from '@mui/material';
import type { CustomerEntity, PaginationResponse } from './model';

interface CustomerListViewProps {
  customers: CustomerEntity[];
  loading: boolean;
  error: string | null;
  pagination: PaginationResponse | null;
  onSearch: (q: string) => void;
  onPageChange: (page: number) => void;
  onSelectCustomer: (customer: CustomerEntity) => void;
}

export function CustomerListView({
  customers,
  loading,
  error,
  pagination,
  onSearch,
  onPageChange,
  onSelectCustomer,
}: CustomerListViewProps) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        รายชื่อลูกค้า
      </Typography>

      <TextField
        label="ค้นหาชื่อหรือเบอร์โทร"
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
      ) : customers.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 2 }}>
          ไม่พบข้อมูลลูกค้า
        </Typography>
      ) : (
        <Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 1,
              mb: 1,
              px: 1,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              ชื่อ
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              นามสกุล
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              เบอร์โทร
            </Typography>
          </Box>

          {customers.map((customer) => (
            <Box
              key={customer.id}
              onClick={() => onSelectCustomer(customer)}
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
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
              }}
            >
              <Typography>{customer.firstName}</Typography>
              <Typography>{customer.lastName}</Typography>
              <Typography>{customer.phone}</Typography>
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
                หน้า {pagination.page} / {pagination.totalPage} ({pagination.totalData} รายการ)
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
