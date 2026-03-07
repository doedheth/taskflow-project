import { useQueryClient } from '@tanstack/react-query';

/**
 * Test hook to verify React Query configuration is working correctly.
 * This hook exposes the QueryClient's default options for verification purposes.
 * Can be used to verify that global configuration is applied correctly.
 */
export function useQueryConfig() {
  const queryClient = useQueryClient();
  const defaultOptions = queryClient.getDefaultOptions();

  return {
    staleTime: defaultOptions.queries?.staleTime,
    refetchInterval: defaultOptions.queries?.refetchInterval,
    retry: defaultOptions.queries?.retry,
    refetchOnWindowFocus: defaultOptions.queries?.refetchOnWindowFocus,
    isConfigured: Boolean(
      defaultOptions.queries?.staleTime === 10000 &&
      defaultOptions.queries?.refetchInterval === 30000 &&
      defaultOptions.queries?.retry === 2
    ),
  };
}
