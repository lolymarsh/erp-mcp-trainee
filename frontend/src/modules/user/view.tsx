import {
  Box,
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
  TextField,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Skeleton,
  InputLabel,
  FormControl,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useState, useEffect } from 'react';
import type { UserEntity, PaginationResponse } from './model';
import { GetRoleLabel } from './model';

// ============== User List ==============

interface UserListViewProps {
  users: UserEntity[];
  loading: boolean;
  error: string | null;
  pagination: PaginationResponse | null;
  roleFilter: string | null;
  onPageChange: (page: number) => void;
  onRoleFilterChange: (role: string | null) => void;
  onEdit: (user: UserEntity) => void;
  onDelete: (user: UserEntity) => void;
  onToggleActive: (id: string) => void;
  onHistory: (user: UserEntity) => void;
  onCreateClick: () => void;
  onSearch: (q: string) => void;
  search: string;
}

export function UserListView({
  users,
  loading,
  error,
  pagination,
  roleFilter,
  onPageChange,
  onRoleFilterChange,
  onEdit,
  onDelete,
  onToggleActive,
  onHistory,
  onCreateClick,
  onSearch,
  search,
}: UserListViewProps) {
  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">จัดการผู้ใช้งาน</Typography>
        <Button variant="contained" onClick={onCreateClick}>
          เพิ่มผู้ใช้งาน
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField
          label="ค้นหาชื่อผู้ใช้หรือชื่อที่แสดง"
          variant="outlined"
          size="small"
          sx={{ flex: 1 }}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>บทบาท</InputLabel>
          <Select
            label="บทบาท"
            value={roleFilter ?? ''}
            onChange={(e) => onRoleFilterChange(e.target.value || null)}
          >
            <MenuItem value="">ทั้งหมด</MenuItem>
            <MenuItem value="ADMIN">{GetRoleLabel('ADMIN')}</MenuItem>
            <MenuItem value="MANAGER">{GetRoleLabel('MANAGER')}</MenuItem>
            <MenuItem value="STAFF">{GetRoleLabel('STAFF')}</MenuItem>
            <MenuItem value="TECHNICIAN">{GetRoleLabel('TECHNICIAN')}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={40} />
          ))}
        </Box>
      ) : users.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 2 }}>
          ไม่พบข้อมูลผู้ใช้งาน
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ชื่อผู้ใช้</TableCell>
                <TableCell>ชื่อที่แสดง</TableCell>
                <TableCell>บทบาท</TableCell>
                <TableCell>สถานะ</TableCell>
                <TableCell align="right">จัดการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.displayName}</TableCell>
                  <TableCell>{GetRoleLabel(user.role)}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? 'Active' : 'Inactive'}
                      color={user.isActive ? 'success' : 'default'}
                      size="small"
                      icon={user.isActive ? <CheckCircleIcon /> : <BlockIcon />}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      <Button size="small" variant="outlined" onClick={() => onHistory(user)}>
                        ประวัติ
                      </Button>
                      <Button size="small" variant="contained" onClick={() => onEdit(user)}>
                        แก้ไข
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color={user.isActive ? 'warning' : 'success'}
                        onClick={() => onToggleActive(user.id)}
                      >
                        {user.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                      </Button>
                      <Button size="small" variant="outlined" color="error" onClick={() => onDelete(user)}>
                        ลบ
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

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
    </Paper>
  );
}

// ============== Create Dialog ==============

interface UserCreateDialogProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  onSubmit: (data: { username: string; password: string; displayName: string; role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'TECHNICIAN' }) => void;
}

export function UserCreateDialog({
  open,
  onClose,
  loading,
  error,
  fieldErrors,
  onSubmit,
}: UserCreateDialogProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MANAGER' | 'STAFF' | 'TECHNICIAN'>('STAFF');

  useEffect(() => {
    if (open) {
      setUsername('');
      setPassword('');
      setDisplayName('');
      setRole('STAFF');
    }
  }, [open]);

  const handleSubmit = () => {
    onSubmit({ username, password, displayName, role });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">เพิ่มผู้ใช้งาน</Typography>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="ชื่อผู้ใช้ *"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={!!fieldErrors.username}
            helperText={fieldErrors.username}
          />
          <TextField
            label="รหัสผ่าน *"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!fieldErrors.password}
            helperText={fieldErrors.password || 'อย่างน้อย 6 ตัวอักษร'}
          />
          <TextField
            label="ชื่อที่แสดง *"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            error={!!fieldErrors.displayName}
            helperText={fieldErrors.displayName}
          />
          <FormControl fullWidth>
            <InputLabel>บทบาท *</InputLabel>
            <Select
              label="บทบาท *"
              value={role}
              onChange={(e) => setRole(e.target.value as 'ADMIN' | 'MANAGER' | 'STAFF' | 'TECHNICIAN')}
            >
              <MenuItem value="ADMIN">{GetRoleLabel('ADMIN')}</MenuItem>
              <MenuItem value="MANAGER">{GetRoleLabel('MANAGER')}</MenuItem>
              <MenuItem value="STAFF">{GetRoleLabel('STAFF')}</MenuItem>
              <MenuItem value="TECHNICIAN">{GetRoleLabel('TECHNICIAN')}</MenuItem>
            </Select>
          </FormControl>
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

interface UserEditDialogProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  initialValues: { displayName?: string; role?: 'ADMIN' | 'MANAGER' | 'STAFF' | 'TECHNICIAN'; isActive?: boolean; version: number } | null;
  onSubmit: (data: { displayName?: string; role?: 'ADMIN' | 'MANAGER' | 'STAFF' | 'TECHNICIAN'; isActive?: boolean; version: number }) => void;
}

export function UserEditDialog({
  open,
  onClose,
  loading,
  error,
  fieldErrors,
  initialValues,
  onSubmit,
}: UserEditDialogProps) {
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MANAGER' | 'STAFF' | 'TECHNICIAN'>('STAFF');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (open && initialValues) {
      setDisplayName(initialValues.displayName ?? '');
      setRole(initialValues.role ?? 'STAFF');
      setVersion(initialValues.version);
    }
  }, [open, initialValues]);

  const handleSubmit = () => {
    onSubmit({ displayName, role, version });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">แก้ไขผู้ใช้งาน</Typography>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="ชื่อที่แสดง *"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            error={!!fieldErrors.displayName}
            helperText={fieldErrors.displayName}
          />
          <FormControl fullWidth>
            <InputLabel>บทบาท *</InputLabel>
            <Select
              label="บทบาท *"
              value={role}
              onChange={(e) => setRole(e.target.value as 'ADMIN' | 'MANAGER' | 'STAFF' | 'TECHNICIAN')}
            >
              <MenuItem value="ADMIN">{GetRoleLabel('ADMIN')}</MenuItem>
              <MenuItem value="MANAGER">{GetRoleLabel('MANAGER')}</MenuItem>
              <MenuItem value="STAFF">{GetRoleLabel('STAFF')}</MenuItem>
              <MenuItem value="TECHNICIAN">{GetRoleLabel('TECHNICIAN')}</MenuItem>
            </Select>
          </FormControl>
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

interface UserDeleteConfirmDialogProps {
  open: boolean;
  userName: string;
  loading: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function UserDeleteConfirmDialog({
  open,
  userName,
  loading,
  error,
  onCancel,
  onConfirm,
}: UserDeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>ยืนยันการลบ</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography>
          คุณต้องการลบผู้ใช้งาน "{userName}" ใช่หรือไม่?
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
