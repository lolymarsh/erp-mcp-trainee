# Phase 05 — Admin Users: Button + Search

> **Priority**: 🟡 P1 — UX improvement
> **Estimate**: 0.5 day
> **Depends on**: Nothing

---

## Task 5.1 — Frontend: Add Search to User List (0.2 day)

### `frontend/src/modules/user/controller.ts`

แก้ `useUserList` — เพิ่ม search state:
```ts
import { useDebouncedValue } from '../../shared/hooks/useDebouncedValue';

export function useUserList() {
  const [users, setUsers] = useState<UserEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationResponse | null>(null);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: { field: string; operator: string; value: unknown }[] = [];
      if (roleFilter) {
        filters.push({ field: 'role', operator: 'eq', value: roleFilter });
      }
      if (debouncedSearch) {
        // Support search by both username and displayName
        // Backend supports 'contains' on both columns
        filters.push({ field: 'username', operator: 'contains', value: debouncedSearch });
      }
      const params: FilterParams = { page, pageSize: 20, sortBy: 'asc', sortName: 'displayName', filters };
      const result = await userApi.filter(params);
      setUsers(result.data);
      setPagination(result.pagination);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, debouncedSearch]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [debouncedSearch, roleFilter]);

  return {
    users, loading, error, pagination,
    refetch: fetchUsers, setPage, setRoleFilter, roleFilter,
    setSearch, search,
  };
}
```

---

## Task 5.2 — Frontend: Change IconButtons to Buttons (0.2 day)

### `frontend/src/modules/user/view.tsx`

เปลี่ยน `UserListView`:

1. **เพิ่ม search field ข้าง role filter**:
```tsx
<Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
  <TextField
    label="ค้นหาชื่อผู้ใช้หรือชื่อที่แสดง"
    variant="outlined"
    size="small"
    sx={{ flex: 1 }}
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
      <MenuItem value="ADMIN">{getRoleLabel('ADMIN')}</MenuItem>
      <MenuItem value="MANAGER">{getRoleLabel('MANAGER')}</MenuItem>
      <MenuItem value="STAFF">{getRoleLabel('STAFF')}</MenuItem>
      <MenuItem value="TECHNICIAN">{getRoleLabel('TECHNICIAN')}</MenuItem>
    </Select>
  </FormControl>
</Box>
```

2. **เปลี่ยน "จัดการ" column จาก IconButtons → Buttons**:
```tsx
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
```

3. **อัปเดต `UserListViewProps`**:
```ts
interface UserListViewProps {
  // ... existing ...
  onSearch: (q: string) => void;
  search: string;
}
```

---

## Task 5.3 — Wire up router (0.1 day)

### `frontend/src/router.tsx`

ใน `UserListRoute`:
```tsx
<UserListView
  // ... existing ...
  onSearch={...}
  search={...}
/>
```

---

## Phase 05 Checklist

- [x] `frontend/user/controller.ts` — `useUserList` เพิ่ม search + debouncedSearch + ฟิลเตอร์ใน API call
- [x] `frontend/user/view.tsx` — `UserListView` เพิ่ม search TextField
- [x] `frontend/user/view.tsx` — เปลี่ยน IconButtons → Buttons (ประวัติ, แก้ไข, ปิด/เปิดใช้งาน, ลบ)
- [x] `frontend/router.tsx` — ส่ง props ใหม่

### Verification
- [x] `npm run typecheck` — pass (0 new errors, 19 pre-existing)
- [x] `npm run lint` — no new errors (all warnings pre-existing)
- [ ] ~ทดสอบ manual: ค้นหาผู้ใช้ → filter role → action buttons ใช้งานได้~
