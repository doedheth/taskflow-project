/**
 * useInspection Hook
 *
 * React Query hooks for Incoming Material Inspection System
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inspectionAPI } from '@/services/api';
import {
  InspectionWithDetails,
  InspectionFilter,
  CreateInspectionDTO,
  Supplier,
  Producer
} from '@/types/inspection';

// Query keys
export const inspectionKeys = {
  all: ['inspections'] as const,
  lists: () => [...inspectionKeys.all, 'list'] as const,
  list: (filters?: InspectionFilter) => [...inspectionKeys.all, 'list', filters] as const,
  details: () => [...inspectionKeys.all, 'detail'] as const,
  detail: (id: number) => [...inspectionKeys.details(), id] as const,
  suppliers: ['suppliers'] as const,
  supplierSearch: (q: string) => ['suppliers', 'search', q] as const,
  producers: ['producers'] as const,
  producerSearch: (q: string) => ['producers', 'search', q] as const,
  materials: ['materials'] as const,
  materialSearch: (q: string) => ['materials', 'search', q] as const,
  plants: ['plants'] as const,
  plantSearch: (q: string) => ['plants', 'search', q] as const,
};

/**
 * Hook to get all inspections
 */
export function useInspectionList(filters?: InspectionFilter & { page?: number; limit?: number }) {
  return useQuery({
    queryKey: inspectionKeys.list(filters),
    queryFn: async () => {
      const response = await inspectionAPI.getAll(filters);
      return response.data;
    },
    staleTime: 10000,
  });
}

/**
 * Hook to get a single inspection with details
 */
export function useInspection(id: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: inspectionKeys.detail(id),
    queryFn: async () => {
      const response = await inspectionAPI.getById(id);
      return (response.data.data || response.data) as InspectionWithDetails;
    },
    enabled: options?.enabled !== false && !!id,
  });
}

/**
 * Hook to create a new inspection
 */
export function useCreateInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInspectionDTO) => {
      const response = await inspectionAPI.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.all });
    },
  });
}

/**
 * Hook to update an inspection
 */
export function useUpdateInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CreateInspectionDTO }) => {
      const response = await inspectionAPI.update(id, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.all });
      queryClient.invalidateQueries({ queryKey: inspectionKeys.detail(variables.id) });
    },
  });
}

/**
 * Hook to delete an inspection
 */
export function useDeleteInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await inspectionAPI.delete(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.all });
    },
  });
}

/**
 * Hook to create a new supplier
 */
export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { code: string; name: string; contact_person?: string; phone?: string; email?: string; address?: string }) => {
      const response = await inspectionAPI.createSupplier(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.suppliers });
    },
  });
}

/**
 * Hook to create a new producer
 */
export function useCreateProducer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { code: string; name: string; contact_person?: string; phone?: string; email?: string; address?: string }) => {
      const response = await inspectionAPI.createProducer(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.producers });
    },
  });
}

/**
 * Hook to create a new material
 */
export function useCreateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { code: string; name: string; description?: string }) => {
      const response = await inspectionAPI.createMaterial(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.materials });
    },
  });
}

/**
 * Hook to search suppliers
 */
export function useSupplierSearch(query: string) {
  return useQuery({
    queryKey: inspectionKeys.supplierSearch(query),
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const response = await inspectionAPI.searchSuppliers(query);
      return response.data as Supplier[];
    },
    enabled: query.length >= 2,
  });
}

/**
 * Hook to search producers
 */
export function useProducerSearch(query: string) {
  return useQuery({
    queryKey: inspectionKeys.producerSearch(query),
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const response = await inspectionAPI.searchProducers(query);
      return response.data as Producer[];
    },
    enabled: query.length >= 2,
  });
}

/**
 * Hook to search materials
 */
export function useMaterialSearch(query: string) {
  return useQuery({
    queryKey: inspectionKeys.materialSearch(query),
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const response = await inspectionAPI.searchMaterials(query);
      return response.data as any[];
    },
    enabled: query.length >= 2,
  });
}

// Preload lists for pickers (first page, no search)
export function useSuppliersList() {
  return useQuery({
    queryKey: inspectionKeys.suppliers,
    queryFn: async () => {
      const res = await inspectionAPI.getSuppliers();
      return (res.data.data || res.data) as Supplier[];
    },
    staleTime: 30_000,
  });
}

export function useMaterialsList() {
  return useQuery({
    queryKey: inspectionKeys.materials,
    queryFn: async () => {
      const res = await inspectionAPI.getMaterials();
      return (res.data.data || res.data) as any[];
    },
    staleTime: 30_000,
  });
}

export function useCreatePlant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { code?: string; name: string; address?: string; contact_person?: string; phone?: string }) => {
      const res = await inspectionAPI.createPlant(data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: inspectionKeys.plants }),
  });
}

export function usePlantSearch(query: string) {
  return useQuery({
    queryKey: inspectionKeys.plantSearch(query),
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const res = await inspectionAPI.searchPlants(query);
      return res.data as any[];
    },
    enabled: query.length >= 2,
  });
}
