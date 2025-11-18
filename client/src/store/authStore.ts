import { create } from 'zustand';
import api from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';

interface User {
  id: string;
  email: string;
  name: string;
  country: string;
  languages: string[];
  languagesToLearn: string[];
  interests: string[];
  bio: string;
  age?: number;
  profilePicture?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateProfile: (data: any) => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      connectSocket(token);
      set({ user, token, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Login failed', isLoading: false });
      throw error;
    }
  },

  register: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', data);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      connectSocket(token);
      set({ user, token, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Registration failed', isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    disconnectSocket();
    set({ user: null, token: null });
  },

  updateProfile: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put('/users/profile', data);
      set({ user: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Update failed', isLoading: false });
      throw error;
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ user: null, token: null });
      return;
    }

    try {
      const response = await api.get('/auth/me');
      connectSocket(token);
      set({ user: response.data, token });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null });
    }
  }
}));
