import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Skeleton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useState, useEffect } from 'react';
import type { CustomerEntity, CustomerWithVehicles, PaginationResponse } from './model';

// ============== Customer List ==============

interface CustomerListViewProps {
  customers: CustomerEntity[];
  loading: boolean;
  error: string | null;
  pagination: PaginationResponse | null;
  onSearch: (q: string) => void;
  onPageChange: (page: number) => void;
  onSelectCustomer: (customer: CustomerEntity) => void;
  onCreateClick: () => void;
}

export function CustomerListView({
  customers,
  loading,
  error,
  pagination,
  onSearch,
  onPageChange,
  onSelectCustomer,
  onCreateClick,
}: CustomerListViewProps) {
  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">รายชื่อลูกค้า</Typography>
        <Button variant="contained" onClick={onCreateClick}>
          เพิ่มลูกค้า
        </Button>
      </Box>

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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
              <Skeleton variant="text" height={24} />
              <Skeleton variant="text" height={24} />
              <Skeleton variant="text" height={24} />
            </Box>
          ))}
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

// ============== Customer Detail ==============

interface CustomerDetailViewProps {
  customer: CustomerWithVehicles | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onEdit: (customer: CustomerWithVehicles) => void;
  onDelete: () => void;
  onHistory: () => void;
}

export function CustomerDetailView({
  customer,
  loading,
  error,
  onBack,
  onEdit,
  onDelete,
  onHistory,
}: CustomerDetailViewProps) {
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

  if (!customer) {
    return <Alert severity="info">ไม่พบข้อมูลลูกค้า</Alert>;
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button variant="outlined" onClick={onBack}>
            กลับ
          </Button>
          <Typography variant="h5">
            {customer.firstName} {customer.lastName}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" onClick={() => onEdit(customer)}>
            แก้ไข
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
          <Typography variant="subtitle2" color="text.secondary">ชื่อ</Typography>
          <Typography>{customer.firstName}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">นามสกุล</Typography>
          <Typography>{customer.lastName}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">เบอร์โทร</Typography>
          <Typography>{customer.phone}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">อีเมล</Typography>
          <Typography>{customer.email || '-'}</Typography>
        </Box>
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Typography variant="subtitle2" color="text.secondary">ที่อยู่</Typography>
          <Typography>{customer.address || '-'}</Typography>
        </Box>
      </Box>

      <Typography variant="h6" gutterBottom>รถที่ลงทะเบียน</Typography>
      {customer.vehicles.length === 0 ? (
        <Typography color="text.secondary">ไม่พบข้อมูลรถ</Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ทะเบียนรถ</TableCell>
                <TableCell>ยี่ห้อ</TableCell>
                <TableCell>รุ่น</TableCell>
                <TableCell>ปี</TableCell>
                <TableCell>ประเภทเครื่องยนต์</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customer.vehicles.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{v.licensePlate}</TableCell>
                  <TableCell>{v.brand || '-'}</TableCell>
                  <TableCell>{v.model || '-'}</TableCell>
                  <TableCell>{v.year ?? '-'}</TableCell>
                  <TableCell>{v.engineType || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}

// ============== Create Dialog ==============

interface CustomerCreateDialogProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    address?: string;
  }) => void;
}

export function CustomerCreateDialog({
  open,
  onClose,
  loading,
  error,
  fieldErrors,
  onSubmit,
}: CustomerCreateDialogProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (open) {
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setAddress('');
    }
  }, [open]);

  const handleSubmit = () => {
    onSubmit({ firstName, lastName, phone, email: email || undefined, address: address || undefined });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">เพิ่มลูกค้าใหม่</Typography>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="ชื่อ *"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            error={!!fieldErrors.firstName}
            helperText={fieldErrors.firstName}
          />
          <TextField
            label="นามสกุล *"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            error={!!fieldErrors.lastName}
            helperText={fieldErrors.lastName}
          />
          <TextField
            label="เบอร์โทร *"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={!!fieldErrors.phone}
            helperText={fieldErrors.phone || 'เช่น 0812345678'}
          />
          <TextField
            label="อีเมล"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!fieldErrors.email}
            helperText={fieldErrors.email}
          />
          <TextField
            label="ที่อยู่"
            multiline
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
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

// ============== Edit Dialog ==============

interface CustomerEditDialogProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  initialValues: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    address?: string;
  } | null;
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    address?: string;
  }) => void;
}

export function CustomerEditDialog({
  open,
  onClose,
  loading,
  error,
  fieldErrors,
  initialValues,
  onSubmit,
}: CustomerEditDialogProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (open && initialValues) {
      setFirstName(initialValues.firstName);
      setLastName(initialValues.lastName);
      setPhone(initialValues.phone);
      setEmail(initialValues.email ?? '');
      setAddress(initialValues.address ?? '');
    }
  }, [open, initialValues]);

  const handleSubmit = () => {
    onSubmit({ firstName, lastName, phone, email: email || undefined, address: address || undefined });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">แก้ไขลูกค้า</Typography>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="ชื่อ *"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            error={!!fieldErrors.firstName}
            helperText={fieldErrors.firstName}
          />
          <TextField
            label="นามสกุล *"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            error={!!fieldErrors.lastName}
            helperText={fieldErrors.lastName}
          />
          <TextField
            label="เบอร์โทร *"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={!!fieldErrors.phone}
            helperText={fieldErrors.phone || 'เช่น 0812345678'}
          />
          <TextField
            label="อีเมล"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!fieldErrors.email}
            helperText={fieldErrors.email}
          />
          <TextField
            label="ที่อยู่"
            multiline
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
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
  customerName: string;
  loading: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({
  open,
  customerName,
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
          คุณต้องการลบลูกค้า "{customerName}" ใช่หรือไม่?
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
