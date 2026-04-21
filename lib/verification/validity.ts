import { createClient } from '@/lib/supabase/server'

/**
 * Check if a contractor's verification is still valid and update their status
 * @param userId - The user ID to check
 * @returns Promise<boolean> - True if verification is valid, false otherwise
 */
export async function isContractorVerificationValid(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    // Get the most recent contractor verification transaction (only succeeded)
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('valid_until, status')
      .eq('user_id', userId)
      .in('transaction_type', ['contractor_verification_fee', 'contractor_verification_subscription'])
      .eq('status', 'succeeded')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error || !transaction) {
      // No verification transaction found, ensure user is not verified
      await supabase
        .from('users')
        .update({ is_verified_contractor: false })
        .eq('id', userId)
      return false
    }
    
    // Check if the verification is still valid
    if (!transaction.valid_until) {
      // No validity period set, ensure user is not verified
      await supabase
        .from('users')
        .update({ is_verified_contractor: false })
        .eq('id', userId)
      return false
    }
    
    const validUntil = new Date(transaction.valid_until)
    const now = new Date()
    
    const isValid = now <= validUntil
    
    // Update user verification status based on validity
    await supabase
      .from('users')
      .update({ is_verified_contractor: isValid })
      .eq('id', userId)
    
    if (!isValid) {
      console.log(`Contractor verification expired on ${validUntil.toISOString()} for user:`, userId)
    }
    
    return isValid
    
  } catch (error) {
    console.error('Error checking contractor verification validity:', error)
    return false
  }
}

/**
 * Get the expiration date of a contractor's verification
 * @param userId - The user ID to check
 * @returns Promise<Date | null> - The expiration date or null if not found
 */
export async function getContractorVerificationExpiry(userId: string): Promise<Date | null> {
  try {
    const supabase = await createClient()
    
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('valid_until')
      .eq('user_id', userId)
      .in('transaction_type', ['contractor_verification_fee', 'contractor_verification_subscription'])
      .eq('status', 'succeeded')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error || !transaction || !transaction.valid_until) {
      return null
    }
    
    return new Date(transaction.valid_until)
    
  } catch (error) {
    console.error('Error getting contractor verification expiry:', error)
    return null
  }
}