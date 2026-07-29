import { z } from 'zod';
import { api } from '../../config/api';

export interface UserResponse {
  id: string;
  username: string;
  displayName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: UserResponse;
}

export const loginFormSchema = z.object({
  username: z.string().min(1, 'กรุณากรอกชื่อผู้ใช้'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
});

export type LoginFormInput = z.infer<typeof loginFormSchema>;

export interface LoginFieldErrors {
  username?: string;
  password?: string;
  form?: string;
}

export const authApi = {
  Login: async (input: LoginInput): Promise<LoginResult> => {
    const { data } = await api.post('/auth/login', input);
    return data.data;
  },

  GetProfile: async (): Promise<UserResponse> => {
    const { data } = await api.get('/auth/profile');
    return data.data;
  },
};
