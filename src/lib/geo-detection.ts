/**
 * Utility functions for geo-location detection and EU-specific compliance.
 */

// List of EU country codes
const EU_COUNTRIES = [
  'AT', // Austria
  'BE', // Belgium
  'BG', // Bulgaria
  'HR', // Croatia
  'CY', // Cyprus
  'CZ', // Czech Republic
  'DK', // Denmark
  'EE', // Estonia
  'FI', // Finland
  'FR', // France
  'DE', // Germany
  'GR', // Greece
  'HU', // Hungary
  'IE', // Ireland
  'IT', // Italy
  'LV', // Latvia
  'LT', // Lithuania
  'LU', // Luxembourg
  'MT', // Malta
  'NL', // Netherlands
  'PL', // Poland
  'PT', // Portugal
  'RO', // Romania
  'SK', // Slovakia
  'SI', // Slovenia
  'ES', // Spain
  'SE', // Sweden
];

/**
 * Determines if a user is likely from the European Union based on their country code.
 * In a real implementation, you would use a service like ipinfo.io or similar to get the user's location.
 * Here we're using a simple check for demo purposes.
 * 
 * @param countryCode - The two-letter country code (ISO 3166-1 alpha-2)
 * @returns boolean - Whether the user is likely from the EU
 */
export function isEuUser(countryCode?: string): boolean {
  // If no country code is provided, default to treating as an EU user for maximum compliance
  if (!countryCode) return true;
  
  // Check if the country code is in the list of EU countries
  return EU_COUNTRIES.includes(countryCode.toUpperCase());
}

/**
 * Gets the user's country code from request headers or other sources.
 * In a real implementation, this would use geoIP lookup or similar.
 * 
 * @returns string | null - The two-letter country code or null if unknown
 */
export async function getUserCountryCode(): Promise<string | null> {
  // In a real implementation, you'd use a service to determine the user's location
  // For demo purposes, we'll assume all users are from the EU
  return 'BE'; // Belgium as default for testing
}
