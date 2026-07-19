import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  Alert,
  TablePagination,
  Autocomplete,
  Skeleton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type { InvoiceResponse, InvoiceWithItemsResponse, PaginationInfo } from './model';
import type { CustomerEntity } from '../customer/model';
import type { ProductEntity } from '../inventory/model';
import type { CreateInvoiceItemInput } from './model';

interface InvoiceListViewProps {
  invoices: InvoiceResponse[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  onPageChange: (page: number) => void;
  onCreateClick: () => void;
  onSelectInvoice: (invoice: InvoiceResponse) => void;
}

export function InvoiceListView({
  invoices,
  loading,
  error,
  pagination,
  onPageChange,
  onCreateClick,
  onSelectInvoice,
}: InvoiceListViewProps) {
  const formatCurrency = (value: string) => {
    return parseFloat(value).toLocaleString('th-TH', {
      style: 'currency',
      currency: 'THB',
    });
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PARTIAL':
        return 'warning';
      case 'REFUNDED':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Invoices</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onCreateClick}>
          New Invoice
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Invoice Number</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Payment Status</TableCell>
              <TableCell>Payment Method</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                </TableRow>
              ))
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id} hover sx={{ cursor: "pointer" }} onClick={() => onSelectInvoice(inv)}>
                  <TableCell>{inv.invoiceNumber}</TableCell>
                  <TableCell>{formatCurrency(inv.grandTotal)}</TableCell>
                  <TableCell>
                    <Chip label={inv.paymentStatus} color={statusColor(inv.paymentStatus) as 'success' | 'warning' | 'error' | 'default'} size="small" />
                  </TableCell>
                  <TableCell>{inv.paymentMethod ?? '-'}</TableCell>
                  <TableCell>
                    {new Date(inv.createdAt).toLocaleDateString('th-TH')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
      </TableContainer>
    </Box>
  );
}

interface InvoiceCreateViewProps {
  open: boolean;
  onClose: () => void;
  customers: CustomerEntity[];
  products: ProductEntity[];
  items: CreateInvoiceItemInput[];
  selectedCustomerId: string;
  selectedPaymentMethod: string;
  discount: number;
  grandTotal: number;
  submitting: boolean;
  error: string | null;
  onCustomerChange: (id: string) => void;
  onPaymentMethodChange: (method: string) => void;
  onDiscountChange: (d: number) => void;
  onAddItem: (productId: string, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onUpdateItemQuantity: (index: number, quantity: number) => void;
  onSubmit: () => void;
  onLoadLookups: () => void;
}

export function InvoiceCreateView({
  open,
  onClose,
  customers,
  products,
  items,
  selectedCustomerId,
  selectedPaymentMethod,
  discount,
  grandTotal,
  submitting,
  error,
  onCustomerChange,
  onPaymentMethodChange,
  onDiscountChange,
  onAddItem,
  onRemoveItem,
  onUpdateItemQuantity,
  onSubmit,
  onLoadLookups,
}: InvoiceCreateViewProps) {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQty, setItemQty] = useState(1);

  const handleOpen = () => {
    onLoadLookups();
  };

  const handleAddItem = () => {
    if (!selectedProductId || itemQty < 1) {
      return;
    }
    onAddItem(selectedProductId, itemQty);
    setSelectedProductId('');
    setItemQty(1);
  };

  const getProductName = (productId: string) => {
    return products.find((p) => p.id === productId)?.name ?? productId;
  };

  const getProductPrice = (productId: string) => {
    return products.find((p) => p.id === productId)?.sellPrice ?? '0';
  };

  const formatCurrency = (value: string) => {
    return parseFloat(value).toLocaleString('th-TH', {
      style: 'currency',
      currency: 'THB',
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth slotProps={{ transition: { onEnter: handleOpen } }}>
      <DialogTitle>Create Invoice</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ display: 'flex', gap: 2, mb: 2, mt: 1 }}>
          <Autocomplete
            sx={{ flex: 1 }}
            options={customers}
            getOptionLabel={(c) => `${c.firstName} ${c.lastName} (${c.phone})`}
            value={customers.find((c) => c.id === selectedCustomerId) ?? null}
            onChange={(_, val) => onCustomerChange(val?.id ?? '')}
            renderInput={(params) => <TextField {...params} label="Customer" />}
          />
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={selectedPaymentMethod}
              label="Payment Method"
              onChange={(e) => onPaymentMethodChange(e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              <MenuItem value="CASH">Cash</MenuItem>
              <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
              <MenuItem value="CREDIT">Credit</MenuItem>
              <MenuItem value="PROMPTPAY">PromptPay</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
          <Autocomplete
            sx={{ flex: 1 }}
            options={products}
            getOptionLabel={(p) => `${p.name} (${p.sku}) - ${p.sellPrice} THB`}
            value={products.find((p) => p.id === selectedProductId) ?? null}
            onChange={(_, val) => setSelectedProductId(val?.id ?? '')}
            renderInput={(params) => <TextField {...params} label="Product" />}
          />
          <TextField
            type="number"
            label="Qty"
            value={itemQty}
            onChange={(e) => setItemQty(Math.max(1, parseInt(e.target.value) || 1))}
            sx={{ width: 100 }}
            slotProps={{ htmlInput: { min: 1 } }}
          />
          <Button variant="outlined" onClick={handleAddItem} sx={{ whiteSpace: 'nowrap' }}>
            Add Item
          </Button>
        </Box>

        {items.length > 0 && (
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{getProductName(item.productId)}</TableCell>
                    <TableCell align="right">{formatCurrency(getProductPrice(item.productId))}</TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={item.quantity}
                        onChange={(e) => onUpdateItemQuantity(idx, Math.max(1, parseInt(e.target.value) || 1))}
                        sx={{ width: 70 }}
                        slotProps={{ htmlInput: { min: 1 } }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency((parseFloat(getProductPrice(item.productId)) * item.quantity).toFixed(2))}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => onRemoveItem(idx)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
          <TextField
            label="Discount"
            type="number"
            value={discount}
            onChange={(e) => onDiscountChange(Math.max(0, parseFloat(e.target.value) || 0))}
            sx={{ width: 130 }}
            slotProps={{ htmlInput: { min: 0 } }}
          />
          <Typography variant="h6">
            Total: {formatCurrency(grandTotal.toFixed(2))}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={submitting || items.length === 0 || !selectedCustomerId}
        >
          {submitting ? <CircularProgress size={20} /> : 'Create Invoice'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface InvoiceDetailViewProps {
  invoice: InvoiceWithItemsResponse | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onHistory: () => void;
}

export function InvoiceDetailView({
  invoice,
  loading,
  error,
  onBack,
  onHistory,
}: InvoiceDetailViewProps) {
  const formatCurrency = (value: string) => {
    return parseFloat(value).toLocaleString("th-TH", {
      style: "currency",
      currency: "THB",
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!invoice) {
    return <Alert severity="info">ไม่พบข้อมูลใบแจ้งหนี้</Alert>;
  }

  const statusColor: Record<string, "success" | "warning" | "error" | "default"> = {
    PAID: "success",
    PARTIAL: "warning",
    REFUNDED: "error",
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button variant="outlined" onClick={onBack}>
            กลับ
          </Button>
          <Typography variant="h5">{invoice.invoiceNumber}</Typography>
          <Chip
            label={invoice.paymentStatus}
            color={statusColor[invoice.paymentStatus] ?? "default"}
            size="small"
          />
        </Box>
        <Button variant="outlined" onClick={onHistory}>
          ประวัติการแก้ไข
        </Button>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">รหัสลูกค้า</Typography>
          <Typography>{invoice.customerId}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">วันที่</Typography>
          <Typography>{new Date(invoice.createdAt).toLocaleDateString("th-TH")}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">ชำระเงิน</Typography>
          <Typography>{invoice.paymentMethod ?? "-"}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">ยอดรวม</Typography>
          <Typography>{formatCurrency(invoice.totalAmount)}</Typography>
        </Box>
      </Box>

      <Typography variant="h6" gutterBottom>รายการสินค้า</Typography>
      {invoice.items.length === 0 ? (
        <Typography color="text.secondary">ไม่มีรายการสินค้า</Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>สินค้า</TableCell>
                <TableCell align="right">จำนวน</TableCell>
                <TableCell align="right">ราคาต่อหน่วย</TableCell>
                <TableCell align="right">รวม</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.productId}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell align="right">{formatCurrency(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 3, mt: 2 }}>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="subtitle2" color="text.secondary">ยอดรวม</Typography>
          <Typography>{formatCurrency(invoice.totalAmount)}</Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="subtitle2" color="text.secondary">ส่วนลด</Typography>
          <Typography>{formatCurrency(invoice.discount)}</Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="subtitle2" color="text.secondary">ภาษี</Typography>
          <Typography>{formatCurrency(invoice.tax)}</Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="h6">ยอดสุทธิ</Typography>
          <Typography variant="h6">{formatCurrency(invoice.grandTotal)}</Typography>
        </Box>
      </Box>
    </Paper>
  );
}
