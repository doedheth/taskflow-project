/**
 * useProducts Hook
 *
 * React Query hooks for Product master data (SPK Production Order System)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsAPI } from '@/services/api';
import { Product, CreateProductDTO, UpdateProductDTO, ProductFilter } from '@/types';

// Query keys
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters?: ProductFilter) => [...productKeys.lists(), filters] as const,
  search: (query: string) => [...productKeys.all, 'search', query] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
};

/**
 * Hook to get all products with optional filters
 */
export function useProducts(filters?: ProductFilter & { page?: number; limit?: number }) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: async () => {
      const response = await productsAPI.getAll(filters);
      return response.data;
    },
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to search products
 */
export function useProductSearch(query: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: productKeys.search(query),
    queryFn: async () => {
      const response = await productsAPI.search(query);
      return response.data;
    },
    enabled: options?.enabled !== false && query.length >= 1,
    staleTime: 10000, // 10 seconds
  });
}

/**
 * Hook to get a single product by ID
 */
export function useProduct(id: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const response = await productsAPI.getById(id);
      return response.data;
    },
    enabled: options?.enabled !== false && !!id,
  });
}

/**
 * Hook to create a new product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductDTO) => {
      const response = await productsAPI.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

/**
 * Hook to update a product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateProductDTO }) => {
      const response = await productsAPI.update(id, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
    },
  });
}

/**
 * Hook to delete a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await productsAPI.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

/**
 * Hook to deactivate a product
 */
export function useDeactivateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await productsAPI.deactivate(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

/**
 * Hook to reactivate a product
 */
export function useReactivateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await productsAPI.reactivate(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
