const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const TOKEN_KEY = 'auth_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const token = getToken();
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (e) {
    throw new Error(
      'Unable to reach the server. Please make sure the backend is running and that VITE_API_BASE_URL is configured correctly.'
    );
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error((error as { detail: string }).detail || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  query: (question: string, options?: { temperature?: number; maxTokens?: number; sessionId?: string }) =>
    request<QueryResponse>('/api/query', {
      method: 'POST',
      body: JSON.stringify({
        question,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        session_id: options?.sessionId || null,
      }),
    }),

  getSchema: () =>
    request<SchemaInfo>('/api/schema'),

  getTables: () =>
    request<SchemaInfo>('/api/schema/tables'),

  getTableInfo: (name: string) =>
    request<TableInfo>(`/api/schema/tables/${encodeURIComponent(name)}`),

  getHistory: () =>
    request<HistoryItem[]>('/api/history'),

  deleteHistoryItem: (id: number) =>
    request<void>(`/api/history/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  deleteHistorySession: (sessionId: string) =>
    request<void>(`/api/history/session/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    }),

  clearHistory: () =>
    request<void>('/api/history', { method: 'DELETE' }),

  uploadDatasource: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/api/datasource/upload`, {
      method: 'POST',
      body: formData,
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || `Upload failed with status ${res.status}`);
    }
    return res.json() as Promise<DataSourceInfo>;
  },

  resetDatasource: () =>
    request<DataSourceInfo>('/api/datasource/reset', {
      method: 'POST',
    }),

  getDatasourceInfo: () =>
    request<DataSourceInfo>('/api/datasource/info'),

  getSettings: () =>
    request<SettingsInfo>('/api/settings'),

  updateSettings: (data: UpdateSettingsPayload) =>
    request<SettingsInfo>('/api/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: RegisterCredentials) =>
    request<TokenResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: AuthCredentials) =>
    request<TokenResponse>('/api/auth/login-json', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCurrentUser: () =>
    request<User>('/api/auth/me'),
};

import type { QueryResponse, SchemaInfo, TableInfo, DataSourceInfo, HistoryItem, AuthCredentials, RegisterCredentials, TokenResponse, User, SettingsInfo, UpdateSettingsPayload } from '@/types';
