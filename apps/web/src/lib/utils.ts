/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a property slug with ID for uniqueness
 */
export function generatePropertySlug(id: string, title: string): string {
  const titleSlug = generateSlug(title);
  // Use full ID to ensure we can extract it properly
  return `${titleSlug}-${id}`;
}

/**
 * Extract ID from a property slug
 */
export function extractIdFromSlug(slug: string): string {
  // If slug contains dashes, it's likely a generated slug
  if (slug.includes('-')) {
    const parts = slug.split('-');
    const lastPart = parts[parts.length - 1];
    
    // The last part should be our full property ID
    if (lastPart) {
      return lastPart;
    }
  }
  
  // Fallback - treat the whole slug as potential ID (for direct ID links)
  return slug;
}

/**
 * Format currency display
 */
export function formatCurrency(amount: number, currency: 'EUR' | 'ALL'): string {
  if (currency === 'EUR') {
    return `€${amount.toLocaleString()}`;
  }
  return `${amount.toLocaleString()} ALL`;
}

/**
 * Format property type for display
 */
export function formatPropertyType(type: string): string {
  const typeMap: Record<string, string> = {
    'APARTMENT': 'Apartament',
    'HOUSE': 'Shtëpi',
    'VILLA': 'Vilë',
    'DUPLEX': 'Dupleks',
    'AMBIENT': 'Ambient',
    'COMMERCIAL': 'Komerciale',
    'OFFICE': 'Zyrë',
    'LAND': 'Tokë'
  };
  
  return typeMap[type] || type;
}

/**
 * Format user role for display
 */
export function formatUserRole(role: string): string {
  const roleMap: Record<string, string> = {
    'SUPER_ADMIN': 'Super Admin',
    'OFFICE_ADMIN': 'Admin Zyre',
    'MANAGER': 'Menaxher',
    'AGENT': 'Agjent',
    'PUBLIC_USER': 'Përdorues Publik'
  };
  
  return roleMap[role] || role;
}
