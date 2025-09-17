'use client';

import { useState, useEffect } from 'react';
import { getPreferredCurrency, type Currency } from '@/lib/currency';

/**
 * Hook to manage currency preference across the app
 * Listens for currency changes and automatically updates
 */
export function useCurrency() {
  const [currency, setCurrency] = useState<Currency>('EUR');

  useEffect(() => {
    // Set initial currency from localStorage
    setCurrency(getPreferredCurrency());

    // Listen for currency changes from the toggle
    const handleCurrencyChange = (event: CustomEvent) => {
      setCurrency(event.detail.currency);
    };

    window.addEventListener('currency-changed', handleCurrencyChange as EventListener);

    return () => {
      window.removeEventListener('currency-changed', handleCurrencyChange as EventListener);
    };
  }, []);

  return currency;
}
