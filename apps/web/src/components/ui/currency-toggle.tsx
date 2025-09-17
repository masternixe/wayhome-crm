'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@headlessui/react';
import { getPreferredCurrency, setPreferredCurrency, initializeExchangeRates, type Currency } from '@/lib/currency';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function CurrencyToggle() {
  const [currency, setCurrency] = useState<Currency>('EUR');

  useEffect(() => {
    // Load preferred currency from localStorage on mount
    setCurrency(getPreferredCurrency());
    
    // Listen for exchange rate updates from settings page
    const handleExchangeRateUpdate = () => {
      // Refresh exchange rates when they're updated
      initializeExchangeRates().catch(console.error);
    };

    window.addEventListener('exchange-rate-updated', handleExchangeRateUpdate);

    return () => {
      window.removeEventListener('exchange-rate-updated', handleExchangeRateUpdate);
    };
  }, []);

  const toggleCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    setPreferredCurrency(newCurrency);
    
    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent('currency-changed', { 
      detail: { currency: newCurrency } 
    }));
  };

  return (
    <div className="flex items-center space-x-2">
      <span className={classNames(
        currency === 'EUR' ? 'text-primary-600 font-medium' : 'text-gray-500',
        'text-sm'
      )}>
        EUR
      </span>
      <Switch
        checked={currency === 'ALL'}
        onChange={(checked) => toggleCurrency(checked ? 'ALL' : 'EUR')}
        className={classNames(
          currency === 'ALL' ? 'bg-primary-600' : 'bg-gray-200',
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
        )}
      >
        <span className="sr-only">Toggle currency</span>
        <span
          className={classNames(
            currency === 'ALL' ? 'translate-x-6' : 'translate-x-1',
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform'
          )}
        />
      </Switch>
      <span className={classNames(
        currency === 'ALL' ? 'text-primary-600 font-medium' : 'text-gray-500',
        'text-sm'
      )}>
        ALL
      </span>
    </div>
  );
}
