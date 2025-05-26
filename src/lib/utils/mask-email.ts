/**
 * Masks an email address for display, preserving the first few characters and domain
 * Example: john.doe@example.com -> jo***@example.com
 */
export function maskEmail(email: string): string {
  if (!email) return '';
  
  try {
    const [username, domain] = email.split('@');
    
    if (!username || !domain) {
      return email; // Not a valid email format, return as is
    }
    
    // Show first 2 characters of username and mask the rest
    const maskedUsername = username.length <= 2 
      ? username 
      : username.substring(0, 2) + '*'.repeat(Math.min(username.length - 2, 3));
    
    return `${maskedUsername}@${domain}`;
  } catch (error) {
    console.error('Error masking email:', error);
    return email;
  }
}
