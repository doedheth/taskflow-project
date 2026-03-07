/**
 * useSPK Hook
 *
 * React Query hooks for SPK (Surat Perintah Kerja) Production Order System
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { spkAPI } from '@/services/api';
import {
  SPKWithItems,
  SPKHeaderWithDetails,
  SPKDashboardSummary,
  SPKFilter,
  CreateSPKDTO,
  UpdateSPKDTO,
  SPKStatus,
} from '@/types';

// Query keys
export const spkKeys = {
  all: ['spk'] as const,
  lists: () => [...spkKeys.all, 'list'] as const,
  list: (filters?: SPKFilter) => [...spkKeys.lists(), filters] as const,
  dashboard: (date?: string) => [...spkKeys.all, 'dashboard', date] as const,
  details: () => [...spkKeys.all, 'detail'] as const,
  detail: (id: number) => [...spkKeys.details(), id] as const,
};

/**
 * Hook to get all SPKs with optional filters
 */
export function useSPKList(filters?: SPKFilter & { page?: number; limit?: number }) {
  return useQuery({
    queryKey: spkKeys.list(filters),
    queryFn: async () => {
      const response = await spkAPI.getAll(filters);
      return response.data;
    },
    staleTime: 10000, // 10 seconds
  });
}

/**
 * Hook to get SPK dashboard summary
 */
export function useSPKDashboard(date?: string) {
  return useQuery({
    queryKey: spkKeys.dashboard(date),
    queryFn: async () => {
      const response = await spkAPI.getDashboard(date);
      return response.data as { success: boolean; data: SPKDashboardSummary };
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refresh every minute
  });
}

/**
 * Hook to get a single SPK with line items
 */
export function useSPK(id: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: spkKeys.detail(id),
    queryFn: async () => {
      const response = await spkAPI.getById(id);
      return response.data as { success: boolean; data: SPKWithItems };
    },
    enabled: options?.enabled !== false && !!id,
  });
}

/**
 * Hook to create a new SPK
 */
export function useCreateSPK() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSPKDTO) => {
      const response = await spkAPI.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: spkKeys.all });
    },
  });
}

/**
 * Hook to update a SPK
 */
export function useUpdateSPK() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateSPKDTO }) => {
      const response = await spkAPI.update(id, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: spkKeys.all });
      queryClient.invalidateQueries({ queryKey: spkKeys.detail(variables.id) });
    },
  });
}

/**
 * Hook to submit SPK for approval
 */
export function useSubmitSPK() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await spkAPI.submit(id);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: spkKeys.all });
      queryClient.invalidateQueries({ queryKey: spkKeys.detail(id) });
    },
  });
}

/**
 * Hook to approve SPK
 */
export function useApproveSPK() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await spkAPI.approve(id);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: spkKeys.all });
      queryClient.invalidateQueries({ queryKey: spkKeys.detail(id) });
    },
  });
}

/**
 * Hook to reject SPK
 */
export function useRejectSPK() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, rejection_reason }: { id: number; rejection_reason: string }) => {
      const response = await spkAPI.reject(id, rejection_reason);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: spkKeys.all });
      queryClient.invalidateQueries({ queryKey: spkKeys.detail(variables.id) });
    },
  });
}

/**
 * Hook to cancel SPK
 */
export function useCancelSPK() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await spkAPI.cancel(id);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: spkKeys.all });
      queryClient.invalidateQueries({ queryKey: spkKeys.detail(id) });
    },
  });
}

/**
 * Hook to revert SPK to draft
 */
export function useRevertSPKToDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await spkAPI.revertToDraft(id);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: spkKeys.all });
      queryClient.invalidateQueries({ queryKey: spkKeys.detail(id) });
    },
  });
}

/**
 * Hook to duplicate SPK
 */
export function useDuplicateSPK() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      new_production_date,
      new_asset_id,
    }: {
      id: number;
      new_production_date: string;
      new_asset_id?: number;
    }) => {
      const response = await spkAPI.duplicate(id, new_production_date, new_asset_id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: spkKeys.all });
    },
  });
}

/**
 * Hook to delete SPK
 */
export function useDeleteSPK() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await spkAPI.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: spkKeys.all });
    },
  });
}
