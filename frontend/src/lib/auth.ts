import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, setToken } from './api';

export interface StaffUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  roles: string[];
  last_login_at: string | null;
}

export function useUser() {
  return useQuery<StaffUser>({
    queryKey: ['me'],
    queryFn: async () => (await api.get('/auth/me')).data.user,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { email: string; password: string }) =>
      (await api.post('/auth/login', data)).data,
    onSuccess: (data) => {
      setToken(data.token);
      queryClient.setQueryData(['me'], data.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => api.post('/auth/logout'),
    onSettled: () => {
      setToken(null);
      queryClient.clear();
    },
  });
}
