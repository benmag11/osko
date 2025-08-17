/**
 * Formats a name with proper capitalization
 * Handles common patterns like O'Brien, McDonald, van der Berg, etc.
 */
export function formatName(name: string): string {
  if (!name) return ''
  
  // If the name appears to already have intentional capitalization, preserve it
  // (has at least one uppercase letter that's not at the start)
  if (/[a-z][A-Z]/.test(name)) {
    return name
  }
  
  // Common prefixes that should remain lowercase
  const lowercasePrefixes = ['van', 'der', 'de', 'la', 'du', 'da', 'von', 'den', 'del', 'di', 'le']
  
  // Split by spaces and hyphens while keeping the delimiters
  const parts = name.split(/(\s+|-+)/)
  
  return parts.map((part, index) => {
    // Keep delimiters as-is
    if (/^[\s-]+$/.test(part)) return part
    
    const lowerPart = part.toLowerCase()
    
    // Check if this is a lowercase prefix (but not at the start of the name)
    if (index > 0 && lowercasePrefixes.includes(lowerPart)) {
      return lowerPart
    }
    
    // Handle O' and L' prefixes (O'Brien, L'Amour)
    if (/^[ol]'/i.test(lowerPart)) {
      return lowerPart.charAt(0).toUpperCase() + "'" + 
             lowerPart.charAt(2).toUpperCase() + 
             lowerPart.slice(3)
    }
    
    // Handle Mc and Mac prefixes (McDonald, MacLeod)
    if (/^mc/i.test(lowerPart) && lowerPart.length > 2) {
      return 'Mc' + lowerPart.charAt(2).toUpperCase() + lowerPart.slice(3)
    }
    if (/^mac/i.test(lowerPart) && lowerPart.length > 3) {
      return 'Mac' + lowerPart.charAt(3).toUpperCase() + lowerPart.slice(4)
    }
    
    // Standard title case
    return lowerPart.charAt(0).toUpperCase() + lowerPart.slice(1)
  }).join('')
}

/**
 * Formats initials from a name
 */
export function formatInitials(name: string): string {
  if (!name) return ''
  
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}