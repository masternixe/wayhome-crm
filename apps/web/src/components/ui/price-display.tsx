'use client';

import { useState, useEffect } from 'react';
import { formatPriceWithPreference, getPreferredCurrency } from '@/lib/currency';

interface PriceDisplayProps {
  /** Price in EUR (all prices in DB are stored in EUR) */
  price: number;
  /** Whether price is on request */
  priceOnRequest?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Custom styling */
  style?: React.CSSProperties;
  /** Show currency icon */
  showIcon?: boolean;
  /** Icon component to use */
  IconComponent?: React.ComponentType<{ className?: string }>;
}

export function PriceDisplay({ 
  price, 
  priceOnRequest = false,
  className = '', 
  style = {},
  showIcon = false,
  IconComponent
}: PriceDisplayProps) {
  const [formattedPrice, setFormattedPrice] = useState('');
  const [currentCurrency, setCurrentCurrency] = useState(getPreferredCurrency());

  // Update price display when currency changes
  const updatePrice = () => {
    const newCurrency = getPreferredCurrency();
    setCurrentCurrency(newCurrency);
    setFormattedPrice(formatPriceWithPreference(price));
  };

  useEffect(() => {
    // Only format price if not price on request
    if (!priceOnRequest) {
      updatePrice();

      // Listen for currency changes
      const handleCurrencyChange = () => {
        updatePrice();
      };

      window.addEventListener('currency-changed', handleCurrencyChange);

      return () => {
        window.removeEventListener('currency-changed', handleCurrencyChange);
      };
    }
  }, [price, priceOnRequest]);

  // If price is on request, show that instead of the actual price
  if (priceOnRequest) {
    return (
      <span className={className} style={style}>
        {showIcon && IconComponent && (
          <IconComponent className="w-5 h-5 inline mr-1" />
        )}
        Çmimi sipas kërkesës
      </span>
    );
  }

  return (
    <span className={className} style={style}>
      {showIcon && IconComponent && (
        <IconComponent className="w-5 h-5 inline mr-1" />
      )}
      {formattedPrice}
    </span>
  );
}

// Convenience components for common use cases
export function PriceDisplayLarge({ price, priceOnRequest, className = '', ...props }: Omit<PriceDisplayProps, 'className'> & { className?: string }) {
  return (
    <PriceDisplay 
      price={price} 
      priceOnRequest={priceOnRequest}
      className={`text-2xl font-bold text-orange-600 ${className}`}
      {...props}
    />
  );
}

export function PriceDisplaySmall({ price, priceOnRequest, className = '', ...props }: Omit<PriceDisplayProps, 'className'> & { className?: string }) {
  return (
    <PriceDisplay 
      price={price} 
      priceOnRequest={priceOnRequest}
      className={`text-sm text-gray-600 ${className}`}
      {...props}
    />
  );
}

export function PriceDisplayHuge({ price, priceOnRequest, className = '', ...props }: Omit<PriceDisplayProps, 'className'> & { className?: string }) {
  return (
    <PriceDisplay 
      price={price} 
      priceOnRequest={priceOnRequest}
      className={`text-4xl md:text-5xl font-bold text-orange-600 ${className}`}
      {...props}
    />
  );
}
