/**
 * Utility function to get the display name for offices
 * Maps email addresses to proper display names
 */
export function getOfficeDisplayName(office: { 
  name: string; 
  email?: string | null;
}): string {
  // Map specific emails to display names
  const emailToDisplayName: Record<string, string> = {
    'adminwayavenue@gmail.com': 'Wayhome Avenue',
    // Add more mappings as needed
  };

  // Check if there's a mapping for this email
  if (office.email && emailToDisplayName[office.email]) {
    return emailToDisplayName[office.email];
  }

  // Return the original name if no mapping exists
  return office.name;
}

