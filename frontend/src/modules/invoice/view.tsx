import React, { useState, useEffect } from 'react';
import {
  Printer,
  Plus,
  Trash2,
  Loader2,
  ArrowLeft,
  History,
  CreditCard,
} from 'lucide-react';
import type {
  InvoiceResponse,
  InvoiceWithItemsResponse,
  PaginationInfo,
} from './model';
import type { CustomerEntity } from '../customer/model';
import type { ProductEntity } from '../inventory/model';
import type { CreateInvoiceItemInput } from './model';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
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

// ============== Formatters ==============

const formatCurrency = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value) || 0 : value;
  return num.toLocaleString('th-TH', {
    style: 'currency',
    currency: 'THB',
  });
};

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'PAID':
      return 'secondary';
    case 'PARTIAL':
      return 'outline';
    case 'REFUNDED':
      return 'destructive';
    default:
      return 'default';
  }
}

// ============== Invoice List ==============

interface InvoiceListViewProps {
  invoices: InvoiceResponse[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  onPageChange: (page: number) => void;
  onCreateClick: () => void;
  onSelectInvoice: (invoice: InvoiceResponse) => void;
  onSearch: (q: string) => void;
  onStatusFilterChange: (status: string | null) => void;
  onPaymentMethodFilterChange: (method: string | null) => void;
  statusFilter: string | null;
  paymentMethodFilter: string | null;
}

export function InvoiceListView({
  invoices,
  loading,
  error,
  pagination,
  onPageChange,
  onCreateClick,
  onSelectInvoice,
  onSearch,
  onStatusFilterChange,
  onPaymentMethodFilterChange,
  statusFilter,
  paymentMethodFilter,
}: InvoiceListViewProps) {
  const from = pagination ? (pagination.page - 1) * pagination.pageSize + 1 : 1;
  const to = pagination
    ? Math.min(pagination.page * pagination.pageSize, pagination.totalData)
    : invoices.length;

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">ใบแจ้งหนี้</h1>
        <Button onClick={onCreateClick} className="flex items-center gap-1.5">
          <Plus className="size-4" />
          <span>สร้างใบแจ้งหนี้</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="space-y-1">
          <Label htmlFor="inv-search">ค้นหาเลขที่ใบแจ้งหนี้</Label>
          <Input
            id="inv-search"
            placeholder="ค้นหาเลขที่ใบแจ้งหนี้..."
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="inv-status-filter">สถานะชำระเงิน</Label>
          <Select
            id="inv-status-filter"
            value={statusFilter ?? ''}
            onChange={(e) => onStatusFilterChange(e.target.value || null)}
          >
            <option value="">ทั้งหมด</option>
            <option value="PENDING">รอชำระ</option>
            <option value="PAID">ชำระแล้ว</option>
            <option value="PARTIAL">ชำระบางส่วน</option>
            <option value="REFUNDED">คืนเงิน</option>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="inv-method-filter">วิธีการชำระ</Label>
          <Select
            id="inv-method-filter"
            value={paymentMethodFilter ?? ''}
            onChange={(e) => onPaymentMethodFilterChange(e.target.value || null)}
          >
            <option value="">ทั้งหมด</option>
            <option value="CASH">เงินสด</option>
            <option value="BANK_TRANSFER">โอนเงิน</option>
            <option value="CREDIT">เครดิต</option>
            <option value="PROMPTPAY">พร้อมเพย์</option>
          </Select>
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
      ) : invoices.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          ไม่พบใบแจ้งหนี้
        </p>
      ) : (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขที่ใบแจ้งหนี้</TableHead>
                <TableHead>ยอดรวม</TableHead>
                <TableHead>สถานะชำระเงิน</TableHead>
                <TableHead>วิธีการชำระ</TableHead>
                <TableHead>วันที่</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow
                  key={inv.id}
                  onClick={() => onSelectInvoice(inv)}
                  className="cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                  <TableCell>{formatCurrency(inv.grandTotal)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusBadgeVariant(inv.paymentStatus)}
                      className={
                        inv.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : ''
                      }
                    >
                      {inv.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{inv.paymentMethod ?? '-'}</TableCell>
                  <TableCell>
                    {new Date(inv.createdAt).toLocaleDateString('th-TH')}
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

// ============== Invoice Create Dialog ==============

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
  customerLoading: boolean;
  productLoading: boolean;
  onCustomerChange: (id: string) => void;
  onPaymentMethodChange: (method: string) => void;
  onDiscountChange: (d: number) => void;
  onAddItem: (productId: string, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onUpdateItemQuantity: (index: number, quantity: number) => void;
  onSubmit: () => void;
  onLoadLookups: () => void;
  onCustomerSearch: (search: string) => void;
  onProductSearch: (search: string) => void;
  onLoadMoreCustomers: () => void;
  onLoadMoreProducts: () => void;
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

  useEffect(() => {
    if (open) {
      onLoadLookups();
    }
  }, [open, onLoadLookups]);

  const handleAddItem = () => {
    if (!selectedProductId || itemQty < 1) return;
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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>สร้างใบแจ้งหนี้</DialogTitle>
        </DialogHeader>

        {error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="inv-customer">ลูกค้า *</Label>
            <Select
              id="inv-customer"
              value={selectedCustomerId}
              onChange={(e) => onCustomerChange(e.target.value)}
            >
              <option value="">-- เลือกลูกค้า --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.phone})
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inv-pay-method">วิธีการชำระ</Label>
            <Select
              id="inv-pay-method"
              value={selectedPaymentMethod}
              onChange={(e) => onPaymentMethodChange(e.target.value)}
            >
              <option value="">ไม่มี</option>
              <option value="CASH">เงินสด</option>
              <option value="BANK_TRANSFER">โอนเงิน</option>
              <option value="CREDIT">เครดิต</option>
              <option value="PROMPTPAY">พร้อมเพย์</option>
            </Select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-end p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <div className="flex-1 space-y-1.5 w-full">
            <Label htmlFor="inv-product-select">สินค้า</Label>
            <Select
              id="inv-product-select"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              <option value="">-- เลือกสินค้า --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) - {p.sellPrice} THB
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5 w-24">
            <Label htmlFor="inv-product-qty">จำนวน</Label>
            <Input
              id="inv-product-qty"
              type="number"
              min={1}
              value={itemQty}
              onChange={(e) => setItemQty(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleAddItem}
            disabled={!selectedProductId}
            className="shrink-0"
          >
            เพิ่มสินค้า
          </Button>
        </div>

        {items.length > 0 && (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>สินค้า</TableHead>
                  <TableHead className="text-right">ราคาต่อหน่วย</TableHead>
                  <TableHead className="text-right w-24">Qty</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {getProductName(item.productId)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(getProductPrice(item.productId))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min={1}
                        className="h-8 text-right"
                        value={item.quantity}
                        onChange={(e) =>
                          onUpdateItemQuantity(
                            idx,
                            Math.max(1, parseInt(e.target.value) || 1)
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(
                        (
                          parseFloat(getProductPrice(item.productId)) *
                          item.quantity
                        ).toFixed(2)
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveItem(idx)}
                        className="size-8 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end items-end sm:items-center gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="inv-discount" className="whitespace-nowrap">
              ส่วนลด:
            </Label>
            <Input
              id="inv-discount"
              type="number"
              min={0}
              className="w-32 text-right"
              value={discount}
              onChange={(e) =>
                onDiscountChange(Math.max(0, parseFloat(e.target.value) || 0))
              }
            />
          </div>
          <div className="text-lg font-bold">
            Total: {formatCurrency(grandTotal.toFixed(2))}
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={submitting || items.length === 0 || !selectedCustomerId}
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'สร้างใบแจ้งหนี้'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============== Invoice Detail & Printable View ==============

interface InvoiceDetailViewProps {
  invoice: InvoiceWithItemsResponse | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onHistory: () => void;
  onUpdatePayment: () => void;
}

export function InvoiceDetailView({
  invoice,
  loading,
  error,
  onBack,
  onHistory,
  onUpdatePayment,
}: InvoiceDetailViewProps) {
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

  if (!invoice) {
    return (
      <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
        ไม่พบข้อมูลใบแจ้งหนี้
      </div>
    );
  }

  return (
    <Card className="p-6 print:shadow-none print:border-none print:p-0">
      {/* Top action bar (hidden in print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack} className="flex items-center gap-1">
            <ArrowLeft className="size-4" />
            <span>กลับ</span>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{invoice.invoiceNumber}</h1>
          <Badge
            variant={getStatusBadgeVariant(invoice.paymentStatus)}
            className={
              invoice.paymentStatus === 'PAID'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : ''
            }
          >
            {invoice.paymentStatus}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="flex items-center gap-1.5"
          >
            <Printer className="size-4" />
            <span>พิมพ์ใบแจ้งหนี้</span>
          </Button>
          <Button
            size="sm"
            onClick={onUpdatePayment}
            className="flex items-center gap-1.5"
          >
            <CreditCard className="size-4" />
            <span>อัพเดทสถานะชำระเงิน</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onHistory}
            className="flex items-center gap-1.5"
          >
            <History className="size-4" />
            <span>ประวัติการแก้ไข</span>
          </Button>
        </div>
      </div>

      {/* Printable Receipt Header */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Versus Thailand</h2>
            <p className="text-xs text-neutral-500">ใบแจ้งหนี้ / ใบเสร็จรับเงิน</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{invoice.invoiceNumber}</p>
            <p className="text-xs text-neutral-500">
              {new Date(invoice.createdAt).toLocaleDateString('th-TH')}
            </p>
          </div>
        </div>
      </div>

      {/* Invoice Meta Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 print:bg-transparent print:border print:p-3">
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">รหัสลูกค้า</span>
          <p className="font-medium text-sm">{invoice.customerId}</p>
        </div>
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">วันที่</span>
          <p className="text-sm">{new Date(invoice.createdAt).toLocaleDateString('th-TH')}</p>
        </div>
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">ชำระเงิน</span>
          <p className="text-sm">{invoice.paymentMethod ?? '-'}</p>
        </div>
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">ยอดรวม</span>
          <p className="text-sm font-semibold">{formatCurrency(invoice.totalAmount)}</p>
        </div>
      </div>

      {/* Invoice Items Table */}
      <h2 className="text-lg font-semibold mb-4">รายการสินค้า</h2>
      {invoice.items.length === 0 ? (
        <p className="py-4 text-center text-sm text-neutral-500 dark:text-neutral-400 border border-dashed rounded-md">
          ไม่มีรายการสินค้า
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>สินค้า</TableHead>
              <TableHead className="text-right">จำนวน</TableHead>
              <TableHead className="text-right">ราคาต่อหน่วย</TableHead>
              <TableHead className="text-right">รวม</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.productId}</TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Summary calculation totals */}
      <div className="flex flex-col items-end gap-1.5 mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex justify-between w-64 text-sm text-neutral-600 dark:text-neutral-400">
          <span>ยอดรวม:</span>
          <span>{formatCurrency(invoice.totalAmount)}</span>
        </div>
        <div className="flex justify-between w-64 text-sm text-neutral-600 dark:text-neutral-400">
          <span>ส่วนลด:</span>
          <span>{formatCurrency(invoice.discount)}</span>
        </div>
        <div className="flex justify-between w-64 text-sm text-neutral-600 dark:text-neutral-400">
          <span>ภาษี:</span>
          <span>{formatCurrency(invoice.tax)}</span>
        </div>
        <div className="flex justify-between w-64 text-base font-bold text-neutral-900 dark:text-neutral-50 pt-2 border-t">
          <span>ยอดสุทธิ:</span>
          <span>{formatCurrency(invoice.grandTotal)}</span>
        </div>
      </div>
    </Card>
  );
}

// ============== Payment Update Dialog ==============

interface InvoicePaymentUpdateDialogProps {
  open: boolean;
  onClose: () => void;
  invoice: InvoiceWithItemsResponse | null;
  submitting: boolean;
  error: string | null;
  onSubmit: (data: { paymentStatus: string; paymentMethod: string | null; version: number }) => void;
}

export function InvoicePaymentUpdateDialog({
  open,
  onClose,
  invoice,
  submitting,
  error,
  onSubmit,
}: InvoicePaymentUpdateDialogProps) {
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  useEffect(() => {
    if (open && invoice) {
      setPaymentStatus(invoice.paymentStatus);
      setPaymentMethod(invoice.paymentMethod ?? '');
    }
  }, [open, invoice]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!invoice) return;
    onSubmit({
      paymentStatus,
      paymentMethod: paymentMethod || null,
      version: invoice.version,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>อัพเดทสถานะชำระเงิน</DialogTitle>
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
            <Label htmlFor="update-pay-status">สถานะชำระเงิน *</Label>
            <Select
              id="update-pay-status"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
            >
              <option value="PENDING">รอชำระ</option>
              <option value="PAID">ชำระแล้ว</option>
              <option value="PARTIAL">ชำระบางส่วน</option>
              <option value="REFUNDED">คืนเงิน</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="update-pay-method">วิธีการชำระ</Label>
            <Select
              id="update-pay-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="">ไม่มี</option>
              <option value="CASH">เงินสด</option>
              <option value="BANK_TRANSFER">โอนเงิน</option>
              <option value="CREDIT">เครดิต</option>
              <option value="PROMPTPAY">พร้อมเพย์</option>
            </Select>
          </div>

          {invoice && (
            <p className="text-xs text-neutral-500">
              Invoice: {invoice.invoiceNumber}
            </p>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={submitting || !paymentStatus}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : 'บันทึก'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
