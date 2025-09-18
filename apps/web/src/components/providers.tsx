'use client';

import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { drainFlashToasts } from '@/lib/notify';
import { initializeExchangeRates } from '@/lib/currency';
import { AuthProvider } from '@/contexts/AuthContext';
import apiService from '@/services/apiService';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Component to set up API service with auth methods
function ApiServiceSetup({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // We'll set up API service auth methods after AuthProvider is initialized
    // This will be handled in a useEffect inside AuthProvider
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize exchange rates on app startup
    initializeExchangeRates().catch(console.error);
    // Drain any queued flash toasts after navigation
    drainFlashToasts();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ApiServiceSetup>
          {children}
        </ApiServiceSetup>
        
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#374151',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
