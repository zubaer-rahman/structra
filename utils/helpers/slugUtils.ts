/**
 * Utility functions for generating and validating URL slugs
 */

/**
 * Generates a URL-friendly slug from a given string
 * @param text - The text to convert to a slug
 * @param maxLength - Maximum length of the slug (default: 100)
 * @returns A URL-friendly slug
 */
export function generateSlug(text: string, maxLength: number = 100): string {
  if (!text || typeof text !== 'string') {
    throw new Error('Text must be a non-empty string');
  }

  return text
    .toLowerCase()
    .trim()
    // Replace spaces and special characters with hyphens
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Truncate to max length
    .substring(0, maxLength)
    // Remove trailing hyphen if truncated
    .replace(/-+$/, '');
}

/**
 * Generates a unique slug by appending a number if the slug already exists
 * @param baseSlug - The base slug to make unique
 * @param existingSlugs - Array of existing slugs to check against
 * @param maxLength - Maximum length of the slug
 * @returns A unique slug
 */
export function generateUniqueSlug(
  baseSlug: string, 
  existingSlugs: string[], 
  maxLength: number = 100
): string {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let counter = 1;
  let uniqueSlug = baseSlug;
  
  // Truncate base slug to leave room for counter
  const baseLength = Math.min(baseSlug.length, maxLength - 10); // Leave room for "-123"
  const truncatedBase = baseSlug.substring(0, baseLength);
  
  do {
    uniqueSlug = `${truncatedBase}-${counter}`;
    counter++;
  } while (existingSlugs.includes(uniqueSlug) && counter < 10000);

  if (counter >= 10000) {
    throw new Error('Unable to generate unique slug after 10000 attempts');
  }

  return uniqueSlug;
}

/**
 * Validates if a string is a valid slug
 * @param slug - The slug to validate
 * @returns True if the slug is valid, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false;
  }

  // Check if slug matches the expected pattern
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugPattern.test(slug) && slug.length > 0 && slug.length <= 255;
}

/**
 * Generates a project slug from project title only
 * @param title - The project title
 * @param location - The project location object (unused, kept for backward compatibility)
 * @returns A project-specific slug
 */
export function generateProjectSlug(title: string, location?: { city?: string; province?: string }): string {
  // Only use the title for slug generation
  return generateSlug(title, 100);
}

/**
 * Generates a contractor profile slug from contractor name and business name
 * @param fullName - The contractor's full name
 * @param businessName - The contractor's business name
 * @returns A contractor-specific slug
 */
export function generateContractorSlug(fullName: string, businessName?: string): string {
  let slugText = fullName;
  
  if (businessName && businessName.trim() && businessName.trim() !== fullName.trim()) {
    slugText = `${fullName} ${businessName}`;
  }
  
  return generateSlug(slugText, 100);
}

/**
 * Sanitizes a slug by removing invalid characters and ensuring it's URL-safe
 * @param slug - The slug to sanitize
 * @returns A sanitized slug
 */
export function sanitizeSlug(slug: string): string {
  if (!slug || typeof slug !== 'string') {
    return '';
  }

  return slug
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 255);
}
