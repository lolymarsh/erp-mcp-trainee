import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from './model';
import type { LoginInput } from './model';
import { useAuthStore } from '../../stores/authStore';

function isErrorWithMessage(err: unknown): err is { response: { data: { message: string } } } {
  if (typeof err !== 'object' || err === null) return false;
  if (!('response' in err)) return false;
  const resp = err.response;
  if (typeof resp !== 'object' || resp === null) return false;
  if (!('data' in resp)) return false;
  const data = resp.data;
  if (typeof data !== 'object' || data === null) return false;
  if (!('message' in data)) return false;
  return typeof data.message === 'string';
}

export function useAuth() {
  const navigate = useNavigate();
  const { login: storeLogin } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (input: LoginInput) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authApi.Login(input);
      storeLogin(result.token, result.user);
      navigate('/');
    } catch (err: unknown) {
      if (isErrorWithMessage(err)) {
        setError(err.response.data.message);
      } else {
        setError('Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}
