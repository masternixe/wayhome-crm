'use client';

import { useState } from 'react';
import apiService, { type ApiResponse } from '@/services/apiService';

interface UseApiOptions {
  showErrorAlert?: boolean;
  showSuccessAlert?: boolean;
}

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

/**
 * Hook for API calls with automatic loading, error, and success state management
 */
export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const { showErrorAlert = false, showSuccessAlert = false } = options;
  
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = async (...args: any[]): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiFunction(...args);
      
      if (response.success && response.data) {
        setState({
          data: response.data,
          loading: false,
          error: null,
        });

        if (showSuccessAlert) {
          alert('✅ Operation completed successfully!');
        }

        return response.data;
      } else {
        const errorMessage = response.message || 'Operation failed';
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });

        if (showErrorAlert) {
          alert(`❌ ${errorMessage}`);
        }

        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });

      if (showErrorAlert) {
        alert(`❌ ${errorMessage}`);
      }

      return null;
    }
  };

  const reset = () => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  };

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Convenience hooks for common API operations
 */

// GET operations
export function useApiGet<T>(endpoint: string, options?: UseApiOptions) {
  return useApi<T>(() => apiService.get<T>(endpoint), options);
}

// POST operations  
export function useApiPost<T>(endpoint: string, options?: UseApiOptions) {
  return useApi<T>((data: any) => apiService.post<T>(endpoint, data), options);
}

// PUT operations
export function useApiPut<T>(endpoint: string, options?: UseApiOptions) {
  return useApi<T>((data: any) => apiService.put<T>(endpoint, data), options);
}

// PATCH operations
export function useApiPatch<T>(endpoint: string, options?: UseApiOptions) {
  return useApi<T>((data: any) => apiService.patch<T>(endpoint, data), options);
}

// DELETE operations
export function useApiDelete<T>(endpoint: string, options?: UseApiOptions) {
  return useApi<T>(() => apiService.delete<T>(endpoint), options);
}

// Specific API hooks
export function useClients(params?: URLSearchParams) {
  return useApi(() => apiService.getClients(params));
}

export function useClient(id: string) {
  return useApi(() => apiService.getClient(id));
}

export function useCreateClient(options?: UseApiOptions) {
  return useApi((data: any) => apiService.createClient(data), options);
}

export function useUpdateClient(id: string, options?: UseApiOptions) {
  return useApi((data: any) => apiService.updateClient(id, data), options);
}

export function useDeleteClient(id: string, options?: UseApiOptions) {
  return useApi(() => apiService.deleteClient(id), options);
}

export function useProperties(params?: URLSearchParams) {
  return useApi(() => apiService.getProperties(params));
}

export function useProperty(id: string) {
  return useApi(() => apiService.getProperty(id));
}

export function useCreateProperty(options?: UseApiOptions) {
  return useApi((data: any) => apiService.createProperty(data), options);
}

export function useUpdateProperty(id: string, options?: UseApiOptions) {
  return useApi((data: any) => apiService.updateProperty(id, data), options);
}

export function useDeleteProperty(id: string, options?: UseApiOptions) {
  return useApi(() => apiService.deleteProperty(id), options);
}

export function useLeads(params?: URLSearchParams) {
  return useApi(() => apiService.getLeads(params));
}

export function useLead(id: string) {
  return useApi(() => apiService.getLead(id));
}

export function useCreateLead(options?: UseApiOptions) {
  return useApi((data: any) => apiService.createLead(data), options);
}

export function useUpdateLead(id: string, options?: UseApiOptions) {
  return useApi((data: any) => apiService.updateLead(id, data), options);
}

export function useConvertLead(id: string, options?: UseApiOptions) {
  return useApi((data?: any) => apiService.convertLead(id, data), options);
}

export function useOpportunities(params?: URLSearchParams) {
  return useApi(() => apiService.getOpportunities(params));
}

export function useOpportunity(id: string) {
  return useApi(() => apiService.getOpportunity(id));
}

export function useCreateOpportunity(options?: UseApiOptions) {
  return useApi((data: any) => apiService.createOpportunity(data), options);
}

export function useUpdateOpportunity(id: string, options?: UseApiOptions) {
  return useApi((data: any) => apiService.updateOpportunity(id, data), options);
}

export function useDeleteOpportunity(id: string, options?: UseApiOptions) {
  return useApi(() => apiService.deleteOpportunity(id), options);
}

export function useTransactions(params?: URLSearchParams) {
  return useApi(() => apiService.getTransactions(params));
}

export function useTransaction(id: string) {
  return useApi(() => apiService.getTransaction(id));
}

export function useCreateTransaction(options?: UseApiOptions) {
  return useApi((data: any) => apiService.createTransaction(data), options);
}

export function useUpdateTransaction(id: string, options?: UseApiOptions) {
  return useApi((data: any) => apiService.updateTransaction(id, data), options);
}

export function useUpdateTransactionStatus(id: string, options?: UseApiOptions) {
  return useApi((status: string) => apiService.updateTransactionStatus(id, status), options);
}

export function useDeleteTransaction(id: string, options?: UseApiOptions) {
  return useApi(() => apiService.deleteTransaction(id), options);
}

export function useDashboardStats() {
  return useApi(() => apiService.getDashboardStats());
}

export function useAnalytics() {
  return useApi(() => apiService.getAnalytics());
}
