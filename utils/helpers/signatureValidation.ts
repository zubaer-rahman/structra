import { createClient } from '@/lib/supabase'
import { SignatureWithUser } from '@/server/database/schemas/signatures'

export interface SignatureValidationResult {
  isValid: boolean
  missingSignatures: string[]
  homeownerSignature: SignatureWithUser | null
  contractorSignature: SignatureWithUser | null
  error?: string
}

/**
 * Validates that both homeowner and contractor have valid profile signatures
 */
export async function validateProfileSignatures(
  homeownerId: string | null,
  contractorId: string | null
): Promise<SignatureValidationResult> {
  try {
    if (!homeownerId || !contractorId) {
      return {
        isValid: false,
        missingSignatures: ['Missing user IDs'],
        homeownerSignature: null,
        contractorSignature: null,
        error: 'Missing homeowner or contractor ID'
      }
    }

    const supabase = createClient()
    
    // Fetch both signatures in parallel
    const [homeownerResult, contractorResult] = await Promise.all([
      supabase
        .from('signatures')
        .select(`
          *,
          user:users(id, first_name, last_name, email)
        `)
        .eq('user_id', homeownerId)
        .eq('document_type', 'profile')
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
      
      supabase
        .from('signatures')
        .select(`
          *,
          user:users(id, first_name, last_name, email)
        `)
        .eq('user_id', contractorId)
        .eq('document_type', 'profile')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
    ])

    const homeownerSignature = homeownerResult.data as SignatureWithUser | null
    const contractorSignature = contractorResult.data as SignatureWithUser | null

    const missingSignatures: string[] = []
    
    // Check if signatures exist and are valid
    if (!homeownerSignature || homeownerSignature.status !== 'signed') {
      missingSignatures.push('Homeowner signature')
    }
    
    if (!contractorSignature || contractorSignature.status !== 'signed') {
      missingSignatures.push('Contractor signature')
    }

    return {
      isValid: missingSignatures.length === 0,
      missingSignatures,
      homeownerSignature,
      contractorSignature
    }
  } catch (error) {
    console.error('Error validating profile signatures:', error)
    return {
      isValid: false,
      missingSignatures: ['Error checking signatures'],
      homeownerSignature: null,
      contractorSignature: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Gets user-friendly error message for missing signatures
 */
export function getSignatureValidationMessage(result: SignatureValidationResult): string {
  if (result.isValid) {
    return 'All signatures are valid'
  }

  if (result.error) {
    return `Error checking signatures: ${result.error}`
  }

  if (result.missingSignatures.length === 2) {
    return 'Both homeowner and contractor must have valid profile signatures before downloading the PDF. Please ensure both parties have created their digital signatures in their profile settings.'
  }

  if (result.missingSignatures.length === 1) {
    const missing = result.missingSignatures[0]
    return `The ${missing.toLowerCase()} is required before downloading the PDF. Please ensure the ${missing.toLowerCase()} has created their digital signature in their profile settings.`
  }

  return 'Signatures are required before downloading the PDF'
}

/**
 * Checks if a signature is valid and ready for use
 */
export function isSignatureReady(signature: SignatureWithUser | null): boolean {
  return signature !== null && signature.status === 'signed'
}
