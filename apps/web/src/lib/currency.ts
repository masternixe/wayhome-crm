// Currency conversion utilities
// All properties are stored in EUR and converted to ALL on display

// Default rates (fallback if API fails)
let EUR_TO_ALL_RATE = 97.3; // 1 EUR = 97.3 ALL (real exchange rate)
let ALL_TO_EUR_RATE = 1 / 97.3; // 1 ALL = ~0.0103 EUR

export type Currency = 'EUR' | 'ALL';

// Cache for exchange rates
let exchangeRatesCache: { eurToAll: number; allToEur: number } | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch current exchange rates from API
 */
async function fetchExchangeRates(): Promise<{ eurToAll: number; allToEur: number }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/exchange-rates`);
    const data = await response.json();
    
    if (data.success) {
      exchangeRatesCache = data.data;
      lastFetchTime = Date.now();
      
      // Update global rates
      EUR_TO_ALL_RATE = data.data.eurToAll;
      ALL_TO_EUR_RATE = data.data.allToEur;
      
      return data.data;
    }
  } catch (error) {
    console.warn('Failed to fetch exchange rates, using defaults:', error);
  }
  
  // Return defaults if API fails
  return { eurToAll: EUR_TO_ALL_RATE, allToEur: ALL_TO_EUR_RATE };
}

/**
 * Get current exchange rates (with caching)
 */
async function getExchangeRates(): Promise<{ eurToAll: number; allToEur: number }> {
  // Return cached rates if they're fresh
  if (exchangeRatesCache && (Date.now() - lastFetchTime) < CACHE_DURATION) {
    return exchangeRatesCache;
  }
  
  // Fetch fresh rates
  return await fetchExchangeRates();
}

/**
 * Convert price from EUR to ALL
 */
export function convertEurToAll(euroAmount: number): number {
  return Math.round(euroAmount * EUR_TO_ALL_RATE);
}

/**
 * Convert price from ALL to EUR  
 */
export function convertAllToEur(allAmount: number): number {
  return Math.round((allAmount * ALL_TO_EUR_RATE) * 100) / 100;
}

/**
 * Convert price based on target currency
 * All prices in database are stored in EUR
 */
export function convertPrice(eurPrice: number, targetCurrency: Currency): number {
  if (targetCurrency === 'EUR') {
    return eurPrice;
  }
  return convertEurToAll(eurPrice);
}

/**
 * Format currency with proper symbol and locale
 */
export function formatCurrency(amount: number, currency: Currency): string {
  if (currency === 'EUR') {
    return new Intl.NumberFormat('sq-AL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  } else {
    return new Intl.NumberFormat('sq-AL', {
      style: 'currency', 
      currency: 'ALL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}

/**
 * Get current user's preferred currency from localStorage
 */
export function getPreferredCurrency(): Currency {
  if (typeof window === 'undefined') return 'EUR';
  return (localStorage.getItem('preferred-currency') as Currency) || 'EUR';
}

/**
 * Set user's preferred currency in localStorage
 */
export function setPreferredCurrency(currency: Currency): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('preferred-currency', currency);
}

/**
 * Format and convert price based on user's preference (sync version using cached rates)
 */
export function formatPriceWithPreference(eurPrice: number): string {
  const preferredCurrency = getPreferredCurrency();
  const convertedPrice = convertPrice(eurPrice, preferredCurrency);
  return formatCurrency(convertedPrice, preferredCurrency);
}

/**
 * Format and convert price with fresh exchange rates (async version)
 */
export async function formatPriceWithPreferenceAsync(eurPrice: number): Promise<string> {
  const rates = await getExchangeRates();
  const preferredCurrency = getPreferredCurrency();
  
  let convertedPrice = eurPrice;
  if (preferredCurrency === 'ALL') {
    convertedPrice = Math.round(eurPrice * rates.eurToAll);
  }
  
  return formatCurrency(convertedPrice, preferredCurrency);
}

/**
 * Initialize exchange rates cache (call this on app startup)
 */
export async function initializeExchangeRates(): Promise<void> {
  await fetchExchangeRates();
}
