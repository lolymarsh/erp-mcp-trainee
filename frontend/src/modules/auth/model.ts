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

export const authApi = {
  login: async (input: LoginInput): Promise<LoginResult> => {
    const { data } = await api.post('/auth/login', input);
    return data.data;
  },

  getProfile: async (): Promise<UserResponse> => {
    const { data } = await api.get('/auth/profile');
    return data.data;
  },
};
