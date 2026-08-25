import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from './controller';
import { loginFormSchema } from './model';
import type { LoginFieldErrors } from './model';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { ThemeToggle } from '../../components/ui/theme-toggle';

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
    <div className="relative flex min-h-screen items-center justify-center bg-neutral-100 p-4 dark:bg-neutral-950">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-sm shadow-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Versus ERP</CardTitle>
          <CardDescription>เข้าสู่ระบบ</CardDescription>
        </CardHeader>
        <CardContent>
          {fieldErrors.form && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
            >
              {fieldErrors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">ชื่อผู้ใช้</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, username: undefined }));
                }}
                onBlur={() => validateField('username')}
                error={!!fieldErrors.username}
                autoComplete="username"
                autoFocus
              />
              {fieldErrors.username && (
                <p className="text-xs text-red-500">{fieldErrors.username}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  onBlur={() => validateField('password')}
                  error={!!fieldErrors.password}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                  <span className="sr-only">
                    {showPassword ? 'Hide password' : 'Show password'}
                  </span>
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-red-500">{fieldErrors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              disabled={loading || !username.trim() || !password.trim()}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" role="progressbar" />
              ) : (
                'เข้าสู่ระบบ'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
