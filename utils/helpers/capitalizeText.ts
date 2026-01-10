/**
 * Capitalizes the first letter of each word in a string
 * @param str - The input string to capitalize
 * @returns The string with first letter of each word capitalized
 */
export function capitalizeWords(str: string): string {
  if (!str) return str
  
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Capitalizes the first letter of a string
 * @param str - The input string to capitalize
 * @returns The string with first letter capitalized
 */
export function capitalizeFirst(str: string): string {
  if (!str) return str
  
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}
