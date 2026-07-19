# Phase 04 — Vehicle CRUD: Frontend + Seed

> **Priority**: 🔴 P0 — UX ไม่มีปุ่มเพิ่ม/แก้ไข/ลบรถของลูกค้า
> **Estimate**: 1.5 day
> **Depends on**: Phase 03 (Vehicle Backend)

---

## Task 4.1 — Frontend model.ts: เพิ่ม vehicle API (0.15 day)

### `frontend/src/modules/customer/model.ts`

เพิ่ม API calls:
```ts
export const customerApi = {
  // ... existing ...

  createVehicle: async (input: {
    customerId: string;
    licensePlate: string;
    brand?: string | null;
    model?: string | null;
    year?: number | null;
    engineType?: string | null;
    fuelType?: string | null;
  }): Promise<{ code: number; message: string; data: VehicleEntity }> => {
    const { data } = await api.post('/customers/vehicles', input);
    return data;
  },

  updateVehicle: async (id: string, input: {
    licensePlate?: string;
    brand?: string | null;
    model?: string | null;
    year?: number | null;
    engineType?: string | null;
    fuelType?: string | null;
  }): Promise<{ code: number; message: string; data: VehicleEntity }> => {
    const { data } = await api.patch(`/customers/vehicles/${id}`, input);
    return data;
  },

  deleteVehicle: async (id: string): Promise<{ code: number; message: string }> => {
    const { data } = await api.delete(`/customers/vehicles/${id}`);
    return data;
  },
};
```

---

## Task 4.2 — Frontend controller.ts: เพิ่ม vehicle hooks (0.3 day)

### `frontend/src/modules/customer/controller.ts`

เพิ่ม hooks:

```ts
// ====== Vehicle Create ======

export interface UseVehicleCreateReturn {
  open: boolean;
  setOpen: (v: boolean) => void;
  handleClose: () => void;
  loading: boolean;
  error: string | null;
  submit: (input: {
    customerId: string;
    licensePlate: string;
    brand?: string | null;
    model?: string | null;
    year?: number | null;
    engineType?: string | null;
    fuelType?: string | null;
  }) => Promise<void>;
}

export function useVehicleCreate(onSuccess: () => void): UseVehicleCreateReturn {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setOpen(false);
    setError(null);
  }, []);

  const submit = useCallback(async (input: {
    customerId: string;
    licensePlate: string;
    brand?: string | null;
    model?: string | null;
    year?: number | null;
    engineType?: string | null;
    fuelType?: string | null;
  }) => {
    setLoading(true);
    setError(null);
    try {
      await customerApi.createVehicle(input);
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create vehicle';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [onSuccess, handleClose]);

  return { open, setOpen, handleClose, loading, error, submit };
}

// ====== Vehicle Update ======

export interface UseVehicleUpdateReturn {
  open: boolean;
  setOpen: (v: boolean) => void;
  handleClose: () => void;
  openWithData: (vehicle: VehicleEntity) => void;
  loading: boolean;
  error: string | null;
  initialValues: {
    licensePlate: string;
    brand: string | null;
    model: string | null;
    year: number | null;
    engineType: string | null;
    fuelType: string | null;
  } | null;
  vehicleId: string | null;
  submit: (input: {
    licensePlate?: string;
    brand?: string | null;
    model?: string | null;
    year?: number | null;
    engineType?: string | null;
    fuelType?: string | null;
  }) => Promise<void>;
}

export function useVehicleUpdate(onSuccess: () => void): UseVehicleUpdateReturn {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<{
    licensePlate: string;
    brand: string | null;
    model: string | null;
    year: number | null;
    engineType: string | null;
    fuelType: string | null;
  } | null>(null);

  const handleClose = useCallback(() => {
    setOpen(false);
    setError(null);
    setVehicleId(null);
  }, []);

  const openWithData = useCallback((vehicle: VehicleEntity) => {
    setVehicleId(vehicle.id);
    setInitialValues({
      licensePlate: vehicle.licensePlate,
      brand: vehicle.brand ?? '',
      model: vehicle.model ?? '',
      year: vehicle.year,
      engineType: vehicle.engineType ?? '',
      fuelType: vehicle.fuelType ?? '',
    });
    setOpen(true);
  }, []);

  const submit = useCallback(async (input: {
    licensePlate?: string;
    brand?: string | null;
    model?: string | null;
    year?: number | null;
    engineType?: string | null;
    fuelType?: string | null;
  }) => {
    if (!vehicleId) return;
    setLoading(true);
    setError(null);
    try {
      await customerApi.updateVehicle(vehicleId, input);
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update vehicle';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [vehicleId, onSuccess, handleClose]);

  return { open, setOpen, handleClose, openWithData, loading, error, initialValues, vehicleId, submit };
}

// ====== Vehicle Delete ======

export interface UseVehicleDeleteReturn {
  open: boolean;
  setOpen: (v: boolean) => void;
  handleClose: () => void;
  loading: boolean;
  error: string | null;
  vehicleInfo: { id: string; licensePlate: string } | null;
  openWithData: (vehicle: VehicleEntity) => void;
  submit: () => Promise<void>;
}

export function useVehicleDelete(onSuccess: () => void): UseVehicleDeleteReturn {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicleInfo, setVehicleInfo] = useState<{ id: string; licensePlate: string } | null>(null);

  const handleClose = useCallback(() => {
    setOpen(false);
    setError(null);
    setVehicleInfo(null);
  }, []);

  const openWithData = useCallback((vehicle: VehicleEntity) => {
    setVehicleInfo({ id: vehicle.id, licensePlate: vehicle.licensePlate });
    setOpen(true);
  }, []);

  const submit = useCallback(async () => {
    if (!vehicleInfo) return;
    setLoading(true);
    setError(null);
    try {
      await customerApi.deleteVehicle(vehicleInfo.id);
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete vehicle';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [vehicleInfo, onSuccess, handleClose]);

  return { open, setOpen, handleClose, loading, error, vehicleInfo, openWithData, submit };
}
```

---

## Task 4.3 — Frontend view.tsx: เพิ่ม vehicle CRUD dialogs (0.5 day)

### `frontend/src/modules/customer/view.tsx`

1. **เพิ่มปุ่ม "เพิ่มรถ" ใน `CustomerDetailView`** ใต้หัวข้อ "รถที่ลงทะเบียน":
```tsx
<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
  <Typography variant="h6">รถที่ลงทะเบียน</Typography>
  <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={onAddVehicle}>
    เพิ่มรถ
  </Button>
</Box>
```

2. **เพิ่มปุ่มแก้ไข/ลบในแต่ละแถว** ใน vehicles table:
```tsx
<TableCell>
  <IconButton size="small" onClick={() => onEditVehicle(v)} title="แก้ไข">
    <EditIcon fontSize="small" />
  </IconButton>
  <IconButton size="small" onClick={() => onDeleteVehicle(v)} title="ลบ" color="error">
    <DeleteIcon fontSize="small" />
  </IconButton>
</TableCell>
```

3. **สร้าง `VehicleCreateDialog`**:
```tsx
interface VehicleCreateDialogProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  customerId: string;
  onSubmit: (data: {
    customerId: string;
    licensePlate: string;
    brand?: string | null;
    model?: string | null;
    year?: number | null;
    engineType?: string | null;
    fuelType?: string | null;
  }) => void;
}

export function VehicleCreateDialog({
  open, onClose, loading, error, customerId, onSubmit,
}: VehicleCreateDialogProps) {
  const [licensePlate, setLicensePlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [engineType, setEngineType] = useState('');
  const [fuelType, setFuelType] = useState('');

  useEffect(() => {
    if (open) {
      setLicensePlate('');
      setBrand('');
      setModel('');
      setYear('');
      setEngineType('');
      setFuelType('');
    }
  }, [open]);

  const handleSubmit = () => {
    onSubmit({
      customerId,
      licensePlate,
      brand: brand || null,
      model: model || null,
      year: year || null,
      engineType: engineType || null,
      fuelType: fuelType || null,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>เพิ่มรถ</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="ทะเบียนรถ *"
            required
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value)}
          />
          <TextField
            label="ยี่ห้อ"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
          <TextField
            label="รุ่น"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
          <TextField
            label="ปี"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : '')}
          />
          <TextField
            label="ประเภทเครื่องยนต์"
            value={engineType}
            onChange={(e) => setEngineType(e.target.value)}
          />
          <TextField
            label="ประเภทเชื้อเพลิง"
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>ยกเลิก</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading || !licensePlate}>
          {loading ? <CircularProgress size={20} /> : 'บันทึก'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

4. **สร้าง `VehicleEditDialog`** — คล้าย Create แต่ pre-fill ค่า:
```tsx
interface VehicleEditDialogProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  initialValues: {
    licensePlate: string;
    brand: string | null;
    model: string | null;
    year: number | null;
    engineType: string | null;
    fuelType: string | null;
  } | null;
  onSubmit: (data: {
    licensePlate?: string;
    brand?: string | null;
    model?: string | null;
    year?: number | null;
    engineType?: string | null;
    fuelType?: string | null;
  }) => void;
}
```

5. **สร้าง `VehicleDeleteConfirmDialog`**:
```tsx
interface VehicleDeleteConfirmDialogProps {
  open: boolean;
  licensePlate: string;
  loading: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}
```

อัปเดต `CustomerDetailViewProps`:
```tsx
interface CustomerDetailViewProps {
  // ... existing ...
  onAddVehicle: () => void;
  onEditVehicle: (vehicle: VehicleEntity) => void;
  onDeleteVehicle: (vehicle: VehicleEntity) => void;
}
```

---

## Task 4.4 — Wire up router.tsx (0.15 day)

### `frontend/src/router.tsx`

ใน `CustomerDetailRoute`:
```tsx
function CustomerDetailRoute() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { customer, loading, error, refetch } = useCustomerDetail(id!);
  const updateCtl = useCustomerUpdate(id!, refetch);
  const deleteCtl = useCustomerDelete(id!, refetch, refetch);
  const vehicleCreateCtl = useVehicleCreate(refetch);
  const vehicleUpdateCtl = useVehicleUpdate(refetch);
  const vehicleDeleteCtl = useVehicleDelete(refetch);
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <>
      <CustomerDetailView
        customer={customer}
        loading={loading}
        error={error}
        onBack={() => navigate('/customers')}
        onEdit={(c) => updateCtl.openWithData(c)}
        onDelete={() => deleteCtl.setOpen(true)}
        onHistory={() => setHistoryOpen(true)}
        onAddVehicle={() => vehicleCreateCtl.setOpen(true)}
        onEditVehicle={(v) => vehicleUpdateCtl.openWithData(v)}
        onDeleteVehicle={(v) => vehicleDeleteCtl.openWithData(v)}
      />
      {/* ... existing dialogs ... */}
      <VehicleCreateDialog
        open={vehicleCreateCtl.open}
        onClose={vehicleCreateCtl.handleClose}
        loading={vehicleCreateCtl.loading}
        error={vehicleCreateCtl.error}
        customerId={id!}
        onSubmit={vehicleCreateCtl.submit}
      />
      <VehicleEditDialog
        open={vehicleUpdateCtl.open}
        onClose={vehicleUpdateCtl.handleClose}
        loading={vehicleUpdateCtl.loading}
        error={vehicleUpdateCtl.error}
        initialValues={vehicleUpdateCtl.initialValues}
        onSubmit={vehicleUpdateCtl.submit}
      />
      <VehicleDeleteConfirmDialog
        open={vehicleDeleteCtl.open}
        licensePlate={vehicleDeleteCtl.vehicleInfo?.licensePlate ?? ''}
        loading={vehicleDeleteCtl.loading}
        error={vehicleDeleteCtl.error}
        onCancel={vehicleDeleteCtl.handleClose}
        onConfirm={vehicleDeleteCtl.submit}
      />
    </>
  );
}
```

---

## Phase 04 Checklist

- [x] `frontend/customer/model.ts` — เพิ่ม `createVehicle`, `updateVehicle`, `deleteVehicle` API calls
- [x] `frontend/customer/controller.ts` — เพิ่ม `useVehicleCreate`, `useVehicleUpdate`, `useVehicleDelete`
- [x] `frontend/customer/view.tsx` — เพิ่มปุ่ม "เพิ่มรถ" + `VehicleCreateDialog`, `VehicleEditDialog`, `VehicleDeleteConfirmDialog`
- [x] `frontend/customer/view.tsx` — `CustomerDetailView` เพิ่ม `onAddVehicle`, `onEditVehicle`, `onDeleteVehicle` props
- [x] `frontend/router.tsx` — เชื่อม dialogs ใน `CustomerDetailRoute`

### Verification
- [x] `npm run typecheck` — pass
- [x] `npm run lint` — no new errors
- [ ] ทดสอบ manual: เข้า customer detail → เพิ่มรถ → แก้ไข → ลบ
