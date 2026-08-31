import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { QueryRequest, QueryResponse, HistoryItem, DataSourceInfo, SchemaInfo } from '@/types';

export function useQueryData() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (req: QueryRequest) => api.query(req.question, {
      temperature: req.temperature,
      maxTokens: req.max_tokens,
      sessionId: req.session_id,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });

  return mutation;
}

export function useHistory() {
  return useQuery({
    queryKey: ['history'],
    queryFn: api.getHistory,
    staleTime: 1000 * 30,
  });
}

export function useDatasourceInfo() {
  return useQuery({
    queryKey: ['datasourceInfo'],
    queryFn: api.getDatasourceInfo,
    staleTime: 1000 * 60,
  });
}

export function useSchema() {
  return useQuery({
    queryKey: ['schema'],
    queryFn: api.getSchema,
    staleTime: 1000 * 60,
  });
}

export function useDeleteHistoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteHistoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}

export function useDeleteHistorySession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteHistorySession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}

export function useClearHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.clearHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}

export function useUploadDatasource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.uploadDatasource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schema'] });
      queryClient.invalidateQueries({ queryKey: ['datasourceInfo'] });
    },
  });
}

export function useResetDatasource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.resetDatasource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schema'] });
      queryClient.invalidateQueries({ queryKey: ['datasourceInfo'] });
    },
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: api.getSettings,
    staleTime: 1000 * 60,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}


