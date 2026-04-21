import { createClient } from '@/lib/supabase/server'
import { 
  Signature, 
  CreateSignatureInput, 
  UpdateSignatureInput, 
  VerifySignatureInput,
  SignatureWithUser,
  SignatureWithDocument 
} from '@/server/database/schemas/signatures'
import { SIGNATURE_STATUSES } from '@/utils/constants/signatures'
import { v4 as uuidv4 } from 'uuid'

export class SignatureService {
  /**
   * Create a new signature
   */
  static async createSignature(
    input: CreateSignatureInput,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Signature> {
    const supabase = await createClient()
    const signatureData = {
      ...input,
      user_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
      signature_hash: await this.generateSignatureHash(input.signature_data),
      status: SIGNATURE_STATUSES.PENDING,
      created_at: new Date(),
      updated_at: new Date()
    }

    const { data, error } = await supabase
      .from('signatures')
      .insert(signatureData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create signature: ${error.message}`)
    }

    return data
  }

  /**
   * Get signature by ID
   */
  static async getSignatureById(signatureId: string): Promise<SignatureWithUser | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('signatures')
      .select(`
        *,
        user:users(id, first_name, last_name, email)
      `)
      .eq('id', signatureId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to get signature: ${error.message}`)
    }

    return data
  }

  /**
   * Get signatures by document
   */
  static async getSignaturesByDocument(
    documentId: string, 
    documentType?: string
  ): Promise<SignatureWithUser[]> {
    const supabase = await createClient()
    let query = supabase
      .from('signatures')
      .select(`
        *,
        user:users(id, first_name, last_name, email)
      `)
      .eq('document_id', documentId)

    if (documentType) {
      query = query.eq('document_type', documentType)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get signatures: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get signatures by user
   */
  static async getSignaturesByUser(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<SignatureWithUser[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('signatures')
      .select(`
        *,
        user:users(id, first_name, last_name, email)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to get user signatures: ${error.message}`)
    }

    return data || []
  }

  /**
   * Update signature
   */
  static async updateSignature(
    signatureId: string,
    input: UpdateSignatureInput,
    actorId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Signature> {
    const supabase = await createClient()
    const updateData = {
      ...input,
      updated_at: new Date()
    }

    const { data, error } = await supabase
      .from('signatures')
      .update(updateData)
      .eq('id', signatureId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update signature: ${error.message}`)
    }

    // Log the update
    await this.logSignatureEvent(signatureId, 'modified', actorId, undefined, ipAddress, userAgent)

    return data
  }

  /**
   * Verify signature
   */
  static async verifySignature(
    input: VerifySignatureInput,
    actorId?: string
  ): Promise<Signature> {
    const supabase = await createClient()
    const { signature_id, ip_address, user_agent } = input

    const updateData = {
      status: SIGNATURE_STATUSES.VERIFIED,
      is_verified: true,
      verified_at: new Date(),
      updated_at: new Date()
    }

    const { data, error } = await supabase
      .from('signatures')
      .update(updateData)
      .eq('id', signature_id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to verify signature: ${error.message}`)
    }

    // Log the verification
    await this.logSignatureEvent(signature_id, 'verified', actorId, undefined, ip_address, user_agent)

    return data
  }

  /**
   * Reject signature
   */
  static async rejectSignature(
    signatureId: string,
    reason?: string,
    actorId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Signature> {
    const supabase = await createClient()
    const updateData = {
      status: SIGNATURE_STATUSES.REJECTED,
      updated_at: new Date(),
      metadata: { rejection_reason: reason }
    }

    const { data, error } = await supabase
      .from('signatures')
      .update(updateData)
      .eq('id', signatureId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to reject signature: ${error.message}`)
    }

    // Log the rejection
    await this.logSignatureEvent(signatureId, 'rejected', actorId, undefined, ipAddress, userAgent, { reason })

    return data
  }

  /**
   * Mark signature as signed
   */
  static async markSignatureAsSigned(
    signatureId: string,
    actorId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Signature> {
    const supabase = await createClient()
    const updateData = {
      status: SIGNATURE_STATUSES.SIGNED,
      updated_at: new Date()
    }

    const { data, error } = await supabase
      .from('signatures')
      .update(updateData)
      .eq('id', signatureId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to mark signature as signed: ${error.message}`)
    }

    // Log the signing
    await this.logSignatureEvent(signatureId, 'signed', actorId, undefined, ipAddress, userAgent)

    return data
  }

  /**
   * Delete signature
   */
  static async deleteSignature(signatureId: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('signatures')
      .delete()
      .eq('id', signatureId)

    if (error) {
      throw new Error(`Failed to delete signature: ${error.message}`)
    }
  }

  /**
   * Check if signature is expired
   */
  static async checkSignatureExpiry(signatureId: string): Promise<boolean> {
    const signature = await this.getSignatureById(signatureId)
    if (!signature || !signature.expires_at) {
      return false
    }

    const now = new Date()
    const expiresAt = new Date(signature.expires_at)
    
    if (now > expiresAt && signature.status === SIGNATURE_STATUSES.PENDING) {
      // Mark as expired
      await this.updateSignature(signatureId, { status: SIGNATURE_STATUSES.EXPIRED })
      return true
    }

    return false
  }

  /**
   * Get signature audit logs
   */
  static async getSignatureAuditLogs(signatureId: string): Promise<any[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('signature_audit_logs')
      .select(`
        *,
        actor:users(id, first_name, last_name, email)
      `)
      .eq('signature_id', signatureId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get signature audit logs: ${error.message}`)
    }

    return data || []
  }

  /**
   * Generate signature hash for verification
   */
  private static async generateSignatureHash(signatureData: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(signatureData)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Log signature event
   */
  private static async logSignatureEvent(
    signatureId: string,
    action: string,
    actorId?: string,
    actorRole?: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const supabase = await createClient()
    const logData = {
      signature_id: signatureId,
      action,
      actor_id: actorId,
      actor_role: actorRole,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: metadata || {},
      created_at: new Date()
    }

    const { error } = await supabase
      .from('signature_audit_logs')
      .insert(logData)

    if (error) {
      console.error('Failed to log signature event:', error)
    }
  }
}
