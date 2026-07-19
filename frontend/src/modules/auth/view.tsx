import React, { useState, useEffect } from 'react';
import {
  Box, TextField, Button, Typography, Alert, Paper,
  InputAdornment, IconButton, CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from './controller';
import { loginFormSchema } from './model';
import type { LoginFieldErrors } from './model';

export function LoginPage(): React.ReactElement {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error } = useAuth();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const result = loginFormSchema.safeParse({ username, password });
    if (!result.success) {
      const errors: LoginFieldErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof LoginFieldErrors;
        errors[field] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    login({ username, password });
  };

  const validateField = (field: 'username' | 'password') => {
    const result = loginFormSchema.safeParse({ username, password });
    if (!result.success) {
      const fieldErr = result.error.issues.find((e) => e.path[0] === field);
      setFieldErrors((prev) => ({ ...prev, [field]: fieldErr?.message }));
    } else {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'grey.100',
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h5" gutterBottom align="center">
          Versus ERP
        </Typography>
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
            onBlur={() => validateField('username')}
            margin="normal"
            error={!!fieldErrors.username}
            helperText={fieldErrors.username}
            autoComplete="username"
            autoFocus
          />
          <TextField
            fullWidth
            label="รหัสผ่าน"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setFieldErrors((prev) => ({ ...prev, password: undefined })); }}
            onBlur={() => validateField('password')}
            margin="normal"
            error={!!fieldErrors.password}
            helperText={fieldErrors.password}
            autoComplete="current-password"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
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
