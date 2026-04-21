import { SignatureWithUser } from '@/server/database/schemas/signatures'

/**
 * Fetch user's profile signature
 */
export async function fetchUserProfileSignature(userId: string): Promise<SignatureWithUser | null> {
  try {
    // Determine the base URL for the API call
    const baseUrl = typeof window !== 'undefined' 
      ? '' // Client-side: use relative URL
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000' // Server-side: use full URL
    
    const response = await fetch(`${baseUrl}/api/signatures?user_id=${userId}&document_type=profile`)
    const data = await response.json()
    
    if (response.ok && data.signatures && data.signatures.length > 0) {
      // Return the most recent signature
      return data.signatures[0]
    }
    
    return null
  } catch (error) {
    console.error('Error fetching profile signature:', error)
    return null
  }
}

/**
 * Fetch signatures for multiple users
 */
export async function fetchUserProfileSignatures(userIds: string[]): Promise<Record<string, SignatureWithUser | null>> {
  const signatures: Record<string, SignatureWithUser | null> = {}
  
  try {
    // Fetch all signatures in parallel
    const promises = userIds.map(async (userId) => {
      const signature = await fetchUserProfileSignature(userId)
      return { userId, signature }
    })
    
    const results = await Promise.all(promises)
    
    results.forEach(({ userId, signature }) => {
      signatures[userId] = signature
    })
    
    return signatures
  } catch (error) {
    console.error('Error fetching user profile signatures:', error)
    return signatures
  }
}

/**
 * Check if signature is valid and verified
 */
export function isSignatureValid(signature: SignatureWithUser | null): boolean {
  if (!signature) return false
  
  return signature.status === 'signed' || signature.status === 'verified'
}

/**
 * Get signature display name
 */
export function getSignatureDisplayName(signature: SignatureWithUser | null, fallbackName: string): string {
  if (!signature) return fallbackName
  return signature.signer_name || fallbackName
}
