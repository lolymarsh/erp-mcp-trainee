# Phase 02 — Job: Search + JobType Filter

> **Priority**: 🔴 P0 — UX บกพร่อง ไม่มีค้นหาและกรองประเภทงาน
> **Estimate**: 0.5 day
> **Depends on**: Nothing

---

## Task 2.1 — Frontend: Add Search + JobType Filter to Job List (0.4 day)

### `frontend/src/modules/job/controller.ts`

แก้ `useJobQueue` — เพิ่ม search + jobTypeFilter:
```ts
import { useDebouncedValue } from '../../shared/hooks/useDebouncedValue';

interface UseJobQueueReturn {
  jobs: JobResponse[];
  loading: boolean;
  error: string | null;
  pagination: PaginatedJobs['pagination'] | null;
  refetch: () => void;
  setPage: (page: number) => void;
  setStatusFilter: (status: string | null) => void;
  statusFilter: string | null;
  setJobTypeFilter: (jobType: string | null) => void;
  jobTypeFilter: string | null;
  setSearch: (search: string) => void;
  search: string;
}

export function useJobQueue(): UseJobQueueReturn {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginatedJobs['pagination'] | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [jobTypeFilter, setJobTypeFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: { field: string; operator: string; value: unknown }[] = [];
      if (statusFilter) {
        filters.push({ field: 'status', operator: 'eq', value: statusFilter });
      }
      if (jobTypeFilter) {
        filters.push({ field: 'jobType', operator: 'eq', value: jobTypeFilter });
      }
      // search ใช้ customerId แทน (หรือเพิ่ม full-text search backend)
      // แต่ backend job filter ไม่มี customer name — ใช้ search เฉพาะ customerId
      // TODO: ถ้าต้องการ search โดย customer name ต้องแก้ backend

      const filter: FilterRequest = {
        page,
        pageSize: 20,
        sortBy: 'desc',
        filters,
      };
      const result = await jobApi.filter(filter);
      setJobs(result.data);
      setPagination(result.pagination);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load jobs';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, jobTypeFilter]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);
  useEffect(() => { setPage(1); }, [statusFilter, jobTypeFilter]);

  return {
    jobs, loading, error, pagination,
    refetch: fetchJobs, setPage,
    setStatusFilter, statusFilter,
    setJobTypeFilter, jobTypeFilter,
    setSearch, search,
  };
}
```

> **Note**: search จะใช้ filter ที่ backend รองรับ (customerId) หรือจะ implemented เป็น client-side filter ก็ได้ ขึ้นอยู่กับ spec จริง. แต่ถ้าต้องการ search ด้วย customer name → ต้องเพิ่ม `customerName` virtual column หรือ join customers ใน backend repo

### `frontend/src/modules/job/view.tsx`

แก้ `JobQueueView` — เพิ่ม search + jobType filter:

อัปเดต props:
```ts
interface JobQueueViewProps {
  // ... existing ...
  jobTypeFilter: string | null;
  onJobTypeFilterChange: (jobType: string | null) => void;
  onSearch: (q: string) => void;
  search: string;
}
```

อัปเดต header section:
```tsx
<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
    <Typography variant="h5">คิวงาน</Typography>
    <Button variant="contained" startIcon={<AddIcon />} onClick={onCreateClick}>
      สร้างงาน
    </Button>
  </Box>
</Box>

<Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
  <TextField
    label="ค้นหาลูกค้า"
    variant="outlined"
    size="small"
    sx={{ flex: 1 }}
    onChange={(e) => onSearch(e.target.value)}
  />
  <FormControl sx={{ minWidth: 160 }} size="small">
    <InputLabel>กรองสถานะ</InputLabel>
    <Select
      value={statusFilter ?? ''}
      label="กรองสถานะ"
      onChange={(e) => onStatusFilterChange(e.target.value || null)}
    >
      <MenuItem value="">ทั้งหมด</MenuItem>
      <MenuItem value="QUEUED">รอดำเนินการ</MenuItem>
      <MenuItem value="IN_PROGRESS">กำลังดำเนินการ</MenuItem>
      <MenuItem value="COMPLETED">เสร็จแล้ว</MenuItem>
      <MenuItem value="CANCELLED">ยกเลิก</MenuItem>
    </Select>
  </FormControl>
  <FormControl sx={{ minWidth: 160 }} size="small">
    <InputLabel>ประเภทงาน</InputLabel>
    <Select
      value={jobTypeFilter ?? ''}
      label="ประเภทงาน"
      onChange={(e) => onJobTypeFilterChange(e.target.value || null)}
    >
      <MenuItem value="">ทั้งหมด</MenuItem>
      <MenuItem value="INSTALL">ติดตั้ง</MenuItem>
      <MenuItem value="REPAIR">ซ่อม</MenuItem>
      <MenuItem value="INSPECT">ตรวจสอบ</MenuItem>
    </Select>
  </FormControl>
</Box>
```

---

## Task 2.2 — Frontend: Wire up router (0.1 day)

### `frontend/src/router.tsx`

ใน `JobListRoute`:
```tsx
<JobQueueView
  // ... existing ...
  jobTypeFilter={...}
  onJobTypeFilterChange={...}
  onSearch={...}
  search={...}
/>
```

---

## Phase 02 Checklist

- [ ] `frontend/job/controller.ts` — `useJobQueue` เพิ่ม search, jobTypeFilter, debouncedSearch
- [ ] `frontend/job/controller.ts` — รวม filters ส่งไป API
- [ ] `frontend/job/view.tsx` — `JobQueueViewProps` เพิ่ม props
- [ ] `frontend/job/view.tsx` — เพิ่ม search TextField + jobType Select dropdown
- [ ] `frontend/router.tsx` — ส่ง props ใหม่

### Verification
- [ ] `npm run typecheck` — pass
- [ ] `npm run lint` — no new errors
- [ ] ทดสอบ manual: ค้นหา job → filter status → filter jobType
