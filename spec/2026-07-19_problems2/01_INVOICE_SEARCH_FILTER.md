# Phase 01 — Invoice: Search + Filter + Payment Update

> **Priority**: 🔴 P0 — UX บกพร่อง ไม่มีค้นหา/กรอง ไม่มีปุ่มอัพเดทสถานะ
> **Estimate**: 1.5 day
> **Depends on**: Nothing

---

## Task 1.1 — Backend: Add Payment Update Endpoint (0.5 day)

### ปัญหา
ปัจจุบัน invoice มี 4 routes: `POST /filter`, `GET /today-summary`, `GET /:id`, `POST /` — ไม่มี PATCH สำหรับอัพเดท payment status

### `backend/src/modules/invoice/schema.ts`

เพิ่ม:
```ts
export const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(["PENDING", "PAID", "PARTIAL", "REFUNDED"]),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CREDIT", "PROMPTPAY"]).optional().nullable(),
  version: z.number().int().min(1),
});

export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;
```

### `backend/src/modules/invoice/repo.ts`

เพิ่ม interface และ implement:
```ts
export interface IInvoiceRepository {
  // ... existing ...
  updatePaymentStatus(
    id: string,
    data: { paymentStatus: string; paymentMethod: string | null },
    version: number,
  ): Promise<InvoiceEntity | null>;
}

async updatePaymentStatus(
  id: string,
  data: { paymentStatus: string; paymentMethod: string | null },
  version: number,
): Promise<InvoiceEntity | null> {
  const result = await this.db
    .update(invoices)
    .set({
      paymentStatus: data.paymentStatus as 'PENDING' | 'PAID' | 'PARTIAL' | 'REFUNDED',
      paymentMethod: data.paymentMethod as 'CASH' | 'BANK_TRANSFER' | 'CREDIT' | 'PROMPTPAY' | null,
      version: version + 1,
      updatedAt: new Date(),
    })
    .where(and(eq(invoices.id, id), eq(invoices.version, version)));

  if (result[0].affectedRows === 0) return null;
  return this.findById(id);
}
```

### `backend/src/modules/invoice/service.ts`

เพิ่ม interface และ implement:
```ts
export interface IInvoiceService {
  // ... existing ...
  updatePaymentStatus(
    id: string,
    input: UpdatePaymentStatusInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<InvoiceResponse>;
}

async updatePaymentStatus(
  id: string,
  input: UpdatePaymentStatusInput,
  userId: string,
  meta?: AuditMeta,
): Promise<InvoiceResponse> {
  const existing = await this.repo.findById(id);
  if (!existing) throw new NotFoundError("Invoice not found");

  const updated = await this.repo.updatePaymentStatus(id, {
    paymentStatus: input.paymentStatus,
    paymentMethod: input.paymentMethod ?? null,
  }, input.version);

  if (!updated) throw new ConflictError("Version mismatch");

  this.auditService.insertAuditLog(
    "UPDATE",
    "invoices",
    id,
    userId,
    existing,
    updated,
    meta,
  );

  return this.toInvoiceResponse(updated);
}
```

### `backend/src/modules/invoice/handler.ts`

เพิ่ม handler:
```ts
updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = extractId(req.params.id);
    const input = updatePaymentStatusSchema.parse(req.body);
    const userId = req.user?.userId ?? "system";
    const meta = req.auditMeta;
    const result = await this.svc.updatePaymentStatus(id, input, userId, meta);
    sendSuccess(res, 200, "success", { data: result });
  } catch (err: unknown) {
    if (err instanceof AppError) { sendError(res, err.statusCode, err.message, err.details); return; }
    if (err instanceof ZodError) { sendError(res, 400, formatZodError(err)); return; }
    logger.error({ err }, "Invoice updatePaymentStatus failed");
    sendError(res, 500, "Internal server error");
  }
};
```

### `backend/src/modules/invoice/route.ts`

เพิ่ม route:
```ts
router.patch("/:id/payment-status", auth(), handler.updatePaymentStatus);
```

---

## Task 1.2 — Frontend: Invoice List Add Search + Filters (0.5 day)

### `frontend/src/modules/invoice/model.ts`

เพิ่ม API call:
```ts
export const invoiceApi = {
  // ... existing ...
  updatePaymentStatus: async (id: string, input: {
    paymentStatus: string;
    paymentMethod?: string | null;
    version: number;
  }): Promise<InvoiceResponse> => {
    const { data } = await api.patch(`/sales/invoices/${id}/payment-status`, input);
    return data.data;
  },
};
```

### `frontend/src/modules/invoice/controller.ts`

แก้ `useInvoiceList`:
```ts
export function useInvoiceList(): UseInvoiceListReturn {
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginatedInvoices['pagination'] | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 400);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: { field: string; operator: string; value: unknown }[] = [];
      if (debouncedSearch) {
        filters.push({ field: 'invoiceNumber', operator: 'contains', value: debouncedSearch });
      }
      if (statusFilter) {
        filters.push({ field: 'paymentStatus', operator: 'eq', value: statusFilter });
      }
      if (paymentMethodFilter) {
        filters.push({ field: 'paymentMethod', operator: 'eq', value: paymentMethodFilter });
      }
      const filter: FilterRequest = { page, pageSize: 20, sortBy: 'desc', filters };
      const result = await invoiceApi.filter(filter);
      setInvoices(result.data);
      setPagination(result.pagination);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load invoices';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, paymentMethodFilter]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, paymentMethodFilter]);

  return {
    invoices, loading, error, pagination,
    refetch: fetchInvoices, setPage,
    setSearch, setStatusFilter, setPaymentMethodFilter,
    search, statusFilter, paymentMethodFilter,
  };
}
```

Import `useDebouncedValue`:
```ts
import { useDebouncedValue } from '../../shared/hooks/useDebouncedValue';
```

อัปเดต return type:
```ts
interface UseInvoiceListReturn {
  invoices: InvoiceResponse[];
  loading: boolean;
  error: string | null;
  pagination: PaginatedInvoices['pagination'] | null;
  refetch: () => void;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setStatusFilter: (status: string | null) => void;
  setPaymentMethodFilter: (method: string | null) => void;
  search: string;
  statusFilter: string | null;
  paymentMethodFilter: string | null;
}
```

### `frontend/src/modules/invoice/view.tsx`

แก้ `InvoiceListView`:

เพิ่ม search + filter dropdowns ใน header:
```tsx
<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
  <Typography variant="h5">ใบแจ้งหนี้</Typography>
  <Button variant="contained" startIcon={<AddIcon />} onClick={onCreateClick}>
    สร้างใบแจ้งหนี้
  </Button>
</Box>

<Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
  <TextField
    label="ค้นหาเลขที่ใบแจ้งหนี้"
    variant="outlined"
    size="small"
    sx={{ flex: 1 }}
    onChange={(e) => onSearch(e.target.value)}
  />
  <FormControl size="small" sx={{ minWidth: 160 }}>
    <InputLabel>สถานะชำระเงิน</InputLabel>
    <Select
      value={statusFilter ?? ''}
      label="สถานะชำระเงิน"
      onChange={(e) => onStatusFilterChange(e.target.value || null)}
    >
      <MenuItem value="">ทั้งหมด</MenuItem>
      <MenuItem value="PENDING">รอชำระ</MenuItem>
      <MenuItem value="PAID">ชำระแล้ว</MenuItem>
      <MenuItem value="PARTIAL">ชำระบางส่วน</MenuItem>
      <MenuItem value="REFUNDED">คืนเงิน</MenuItem>
    </Select>
  </FormControl>
  <FormControl size="small" sx={{ minWidth: 160 }}>
    <InputLabel>วิธีการชำระ</InputLabel>
    <Select
      value={paymentMethodFilter ?? ''}
      label="วิธีการชำระ"
      onChange={(e) => onPaymentMethodFilterChange(e.target.value || null)}
    >
      <MenuItem value="">ทั้งหมด</MenuItem>
      <MenuItem value="CASH">เงินสด</MenuItem>
      <MenuItem value="BANK_TRANSFER">โอนเงิน</MenuItem>
      <MenuItem value="CREDIT">เครดิต</MenuItem>
      <MenuItem value="PROMPTPAY">พร้อมเพย์</MenuItem>
    </Select>
  </FormControl>
</Box>
```

อัปเดต props interface:
```ts
interface InvoiceListViewProps {
  // ... existing ...
  onSearch: (q: string) => void;
  onStatusFilterChange: (status: string | null) => void;
  onPaymentMethodFilterChange: (method: string | null) => void;
  statusFilter: string | null;
  paymentMethodFilter: string | null;
}
```

---

## Task 1.3 — Frontend: Invoice Detail Payment Update Dialog (0.5 day)

### `frontend/src/modules/invoice/view.tsx`

เพิ่มปุ่ม "อัพเดทสถานะชำระเงิน" ใน `InvoiceDetailView` header:
```tsx
<Button variant="contained" onClick={onUpdatePayment}>
  อัพเดทสถานะชำระเงิน
</Button>
```

สร้าง `InvoicePaymentUpdateDialog` component:
```tsx
interface InvoicePaymentUpdateDialogProps {
  open: boolean;
  onClose: () => void;
  invoice: InvoiceWithItemsResponse | null;
  submitting: boolean;
  error: string | null;
  onSubmit: (data: { paymentStatus: string; paymentMethod: string | null; version: number }) => void;
}

export function InvoicePaymentUpdateDialog({
  open, onClose, invoice, submitting, error, onSubmit,
}: InvoicePaymentUpdateDialogProps) {
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  useEffect(() => {
    if (open && invoice) {
      setPaymentStatus(invoice.paymentStatus);
      setPaymentMethod(invoice.paymentMethod ?? '');
    }
  }, [open, invoice]);

  const handleSubmit = () => {
    if (!invoice) return;
    onSubmit({
      paymentStatus,
      paymentMethod: paymentMethod || null,
      version: invoice.version,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>อัพเดทสถานะชำระเงิน</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>สถานะชำระเงิน *</InputLabel>
            <Select
              value={paymentStatus}
              label="สถานะชำระเงิน *"
              onChange={(e) => setPaymentStatus(e.target.value)}
            >
              <MenuItem value="PENDING">รอชำระ</MenuItem>
              <MenuItem value="PAID">ชำระแล้ว</MenuItem>
              <MenuItem value="PARTIAL">ชำระบางส่วน</MenuItem>
              <MenuItem value="REFUNDED">คืนเงิน</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>วิธีการชำระ</InputLabel>
            <Select
              value={paymentMethod}
              label="วิธีการชำระ"
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <MenuItem value="">ไม่มี</MenuItem>
              <MenuItem value="CASH">เงินสด</MenuItem>
              <MenuItem value="BANK_TRANSFER">โอนเงิน</MenuItem>
              <MenuItem value="CREDIT">เครดิต</MenuItem>
              <MenuItem value="PROMPTPAY">พร้อมเพย์</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary">
            Invoice: {invoice?.invoiceNumber}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>ยกเลิก</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting || !paymentStatus}>
          {submitting ? <CircularProgress size={20} /> : 'บันทึก'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

อัปเดต `InvoiceDetailViewProps`:
```tsx
interface InvoiceDetailViewProps {
  // ... existing ...
  onUpdatePayment: () => void;
}
```

### `frontend/src/modules/invoice/controller.ts`

เพิ่ม `useInvoicePaymentUpdate` hook:
```ts
interface UseInvoicePaymentUpdateReturn {
  open: boolean;
  setOpen: (v: boolean) => void;
  submitting: boolean;
  error: string | null;
  submit: (id: string, data: { paymentStatus: string; paymentMethod: string | null; version: number }) => Promise<boolean>;
}

export function useInvoicePaymentUpdate(onSuccess: () => void): UseInvoicePaymentUpdateReturn {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (
    id: string,
    data: { paymentStatus: string; paymentMethod: string | null; version: number },
  ): Promise<boolean> => {
    setSubmitting(true);
    setError(null);
    try {
      await invoiceApi.updatePaymentStatus(id, data);
      onSuccess();
      setOpen(false);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update payment status';
      setError(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [onSuccess]);

  return { open, setOpen, submitting, error, submit };
}
```

### `frontend/src/router.tsx`

ใน `InvoiceListRoute`:
```tsx
// เพิ่ม props
<InvoiceListView
  // ... existing ...
  onSearch={...}
  onStatusFilterChange={...}
  onPaymentMethodFilterChange={...}
  statusFilter={...}
  paymentMethodFilter={...}
/>
```

ใน `InvoiceDetailRoute`:
```tsx
function InvoiceDetailRoute() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { invoice, loading, error, refetch } = useInvoiceDetail(id!);
  const paymentCtl = useInvoicePaymentUpdate(() => refetch());
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (paymentCtl.error === null) return;
    // error handled by dialog
  }, [paymentCtl.error]);

  const handlePaymentUpdate = useCallback(async (data: { paymentStatus: string; paymentMethod: string | null; version: number }) => {
    await paymentCtl.submit(id!, data);
  }, [id, paymentCtl]);

  return (
    <>
      <InvoiceDetailView
        invoice={invoice}
        loading={loading}
        error={error}
        onBack={() => navigate('/sales/invoices')}
        onHistory={() => setHistoryOpen(true)}
        onUpdatePayment={() => paymentCtl.setOpen(true)}
      />
      <InvoicePaymentUpdateDialog
        open={paymentCtl.open}
        onClose={() => paymentCtl.setOpen(false)}
        invoice={invoice}
        submitting={paymentCtl.submitting}
        error={paymentCtl.error}
        onSubmit={handlePaymentUpdate}
      />
      {id && (
        <AuditLogDialog
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          tableName="invoices"
          recordId={id}
        />
      )}
    </>
  );
}
```

---

## Phase 01 Checklist

### Task 1.1 — Backend: Payment Update Endpoint
- [x] `backend/invoice/schema.ts` — เพิ่ม `updatePaymentStatusSchema`
- [x] `backend/invoice/repo.ts` — เพิ่ม `updatePaymentStatus`
- [x] `backend/invoice/service.ts` — เพิ่ม `updatePaymentStatus` (version check + audit log)
- [x] `backend/invoice/handler.ts` — เพิ่ม `updatePaymentStatus` handler
- [x] `backend/invoice/route.ts` — เพิ่ม route `PATCH /:id/payment-status`

### Task 1.2 — Frontend: Invoice List Search + Filters
- [x] `frontend/invoice/model.ts` — เพิ่ม `updatePaymentStatus` API call
- [x] `frontend/invoice/controller.ts` — `useInvoiceList` เพิ่ม search + statusFilter + paymentMethodFilter
- [x] `frontend/invoice/view.tsx` — `InvoiceListView` เพิ่ม search + filter dropdowns
- [x] `frontend/router.tsx` — ส่ง props ใหม่ให้ `InvoiceListView`

### Task 1.3 — Frontend: Invoice Detail Payment Update
- [x] `frontend/invoice/view.tsx` — เพิ่ม `onUpdatePayment` prop + `InvoicePaymentUpdateDialog`
- [x] `frontend/invoice/controller.ts` — เพิ่ม `useInvoicePaymentUpdate` hook
- [x] `frontend/router.tsx` — เชื่อม dialog ใน `InvoiceDetailRoute`

### Verification
- [x] `npm run typecheck` (backend + frontend) — pass
- [ ] `npm run lint` — no new errors
- [x] `npm test` (backend) — pass
- [ ] ทดสอบ manual: ค้นหา invoice → filter status → filter payment method
- [ ] ทดสอบ manual: เข้า invoice detail → กดอัพเดทสถานะ → เลือก status → submit
