import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const GUARDIAN_TOKEN_KEY = 'rcms_guardian_token';

export function getGuardianToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(GUARDIAN_TOKEN_KEY);
}

export function setGuardianToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(GUARDIAN_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(GUARDIAN_TOKEN_KEY);
  }
}

export const guardianApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1',
  headers: { Accept: 'application/json' },
});

guardianApi.interceptors.request.use((config) => {
  const token = getGuardianToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface AccessiblePatient {
  id: number;
  patient_number: string;
  name: string;
  status: string;
  relationship: string;
}

export interface GuardianUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  relationship: string;
  status: string;
  last_login_at: string | null;
  patients: AccessiblePatient[];
}

export interface GuardianMessageItem {
  id: number;
  patient_id: number;
  guardian_id: number;
  sender_user_id: number | null;
  sender_type: 'guardian' | 'staff';
  sender_name: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

export interface SupportStatusResponse {
  is_online: boolean;
  status_message: string;
  working_hours: string;
}

export function useGuardian() {
  return useQuery<GuardianUser | null>({
    queryKey: ['guardian_me'],
    queryFn: async () => {
      const token = getGuardianToken();
      if (!token) return null;
      try {
        const res = await guardianApi.get('/guardian/me');
        return res.data.guardian;
      } catch {
        setGuardianToken(null);
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGuardianLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await guardianApi.post('/guardian/login', data);
      return res.data;
    },
    onSuccess: (data) => {
      setGuardianToken(data.token);
      queryClient.setQueryData(['guardian_me'], data.guardian);
      queryClient.invalidateQueries({ queryKey: ['guardian_messages'] });
    },
  });
}

export function useGuardianActivate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      email: string;
      patient_number: string;
      password: string;
      password_confirmation: string;
    }) => {
      const res = await guardianApi.post('/guardian/activate', data);
      return res.data;
    },
    onSuccess: (data) => {
      setGuardianToken(data.token);
      queryClient.setQueryData(['guardian_me'], data.guardian);
      queryClient.invalidateQueries({ queryKey: ['guardian_messages'] });
    },
  });
}

export function useGuardianLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await guardianApi.post('/guardian/logout');
      } catch {
        // Continue clearing local state regardless
      }
    },
    onSettled: () => {
      setGuardianToken(null);
      queryClient.setQueryData(['guardian_me'], null);
      queryClient.invalidateQueries({ queryKey: ['guardian_messages'] });
    },
  });
}

export function useSupportStatus() {
  return useQuery<SupportStatusResponse>({
    queryKey: ['support_status'],
    queryFn: async () => {
      const res = await guardianApi.get('/guardian/support-status');
      return res.data;
    },
    refetchInterval: 30000,
  });
}

export function useGuardianMessages(patientId?: number) {
  return useQuery<{ patient_id: number | null; messages: GuardianMessageItem[] }>({
    queryKey: ['guardian_messages', patientId],
    queryFn: async () => {
      const url = patientId ? `/guardian/messages?patient_id=${patientId}` : '/guardian/messages';
      const res = await guardianApi.get(url);
      return res.data;
    },
    enabled: !!getGuardianToken(),
    refetchInterval: 4000, // Poll every 4 seconds for reliable real-time updates
  });
}

export function useSendGuardianMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { patient_id: number; message: string }) => {
      const res = await guardianApi.post('/guardian/messages', data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guardian_messages', variables.patient_id] });
      queryClient.invalidateQueries({ queryKey: ['guardian_messages'] });
    },
  });
}

export function useMarkGuardianMessageRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (messageId: number) => {
      const res = await guardianApi.patch(`/guardian/messages/${messageId}/read`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardian_messages'] });
    },
  });
}
