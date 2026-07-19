# Phase 03 — Login Validation + Error Display

> **Priority**: 🔴 P0 — User-facing
> **Estimate**: 0.5 day
> **Depends on**: Nothing (standalone frontend fix)

---

## Problem Summary

**Current:** `frontend/src/modules/auth/view.tsx` — ใช้เฉพาะ HTML5 `required` attribute:
- ไม่มี Zod validation
- `TextField` ไม่มี `error`/`helperText` props
- กด submit พร้อม blank fields → ไม่มีอะไรเกิดขึ้นนอกจาก HTML5 tooltip
- API error (รหัสผ่านผิด) แสดงเป็น `<Alert>` แยก — ไม่ได้ผูกกับ input field

### Current Code
```tsx
<TextField label="ชื่อผู้ใช้" value={username} required />
// ❌ No error prop, no helperText
// ❌ No client-side validation before submit
<TextField label="รหัสผ่าน" type="password" value={password} required />
```

---

## Task 3.1 — Zod Schema + Client Validation (0.2 day)

### Add validation schema in `auth/model.ts` or shared

```ts
import { z } from 'zod';

export const loginFormSchema = z.object({
  username: z.string().min(1, 'กรุณากรอกชื่อผู้ใช้'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
});

export type LoginFormInput = z.infer<typeof loginFormSchema>;

export interface LoginFieldErrors {
  username?: string;
  password?: string;
  form?: string;   // general API error
}
```

### Update `auth/view.tsx`

```tsx
import { loginFormSchema } from './model';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    // Step 1: Zod client-side validation
    const result = loginFormSchema.safeParse({ username, password });
    if (!result.success) {
      const errors: LoginFieldErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof LoginFieldErrors;
        errors[field] = err.message;
      });
      setFieldErrors(errors);
      return; // ไม่ call API ถ้า validate ไม่ผ่าน
    }

    // Step 2: Call API
    login({ username, password });
  };

  // Step 3: Map API error to fields
  useEffect(() => {
    if (error) {
      if (error.includes('Invalid credentials') || error.includes('รหัสผ่าน')) {
        setFieldErrors({ password: 'รหัสผ่านไม่ถูกต้อง' });
      } else if (error.includes('not found') || error.includes('ไม่พบ')) {
        setFieldErrors({ username: 'ไม่พบผู้ใช้นี้' });
      } else {
        setFieldErrors({ form: error });
      }
    }
  }, [error]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
      <Paper sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h5" align="center">Versus ERP</Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          เข้าสู่ระบบ
        </Typography>

        {fieldErrors.form && <Alert severity="error" sx={{ mb: 2 }}>{fieldErrors.form}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="ชื่อผู้ใช้"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setFieldErrors((prev) => ({ ...prev, username: undefined })); }}
            margin="normal"
            error={!!fieldErrors.username}
            helperText={fieldErrors.username}
            autoComplete="username"
          />
          <TextField
            fullWidth
            label="รหัสผ่าน"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setFieldErrors((prev) => ({ ...prev, password: undefined })); }}
            margin="normal"
            error={!!fieldErrors.password}
            helperText={fieldErrors.password}
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 2 }}
            disabled={loading || !username.trim() || !password.trim()}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'เข้าสู่ระบบ'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
```

---

## Task 3.2 — UX Improvements (0.3 day)

### 3.2.1 Show Password Toggle
- Visibility icon button ใน `InputProps.endAdornment`
- Toggle `type="password"` / `type="text"`

### 3.2.2 Disable Submit When Empty
- `disabled={loading || !username.trim() || !password.trim()}` — ไม่ใช่แค่ตอน loading

### 3.2.3 Auto-focus First Field
- `autoFocus` prop บน username `TextField`

### 3.2.4 Error on Blur
- `onBlur` validate เฉพาะ field นั้น (ไม่ต้องรอกด submit)

### 3.2.5 Keyboard Submit
- `onKeyDown` on password field: Enter → submit

---

## Phase 03 Checklist

- [x] Add Zod `loginFormSchema` in `auth/model.ts`
- [x] `TextField` — `error={!!fieldErrors.xxx}` + `helperText={fieldErrors.xxx}`
- [x] Zod parse before API call — block submit if invalid
- [x] Map API error string to field-level errors
- [x] Clear field errors on typing
- [x] Show password toggle button
- [x] Disable submit when fields empty (not just loading)
- [x] Auto-focus username field
- [x] Blur validation (optional)
- [x] Run `npm run typecheck` — pass
