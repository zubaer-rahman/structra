import { NextRequest, NextResponse } from 'next/server'
import { SignatureService } from '@/server/services/signatureService'
import { verifySignatureInputSchema } from '@/server/database/schemas/signatures'
import { z } from 'zod'

// POST /api/signatures/[id]/verify - Verify signature
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = verifySignatureInputSchema.parse({
      ...body,
      signature_id: id
    })

    // Get user info from request headers or auth
    const userId = request.headers.get('x-user-id')
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const signature = await SignatureService.verifySignature(
      validatedData,
      userId || undefined
    )

    return NextResponse.json({ signature })
  } catch (error) {
    console.error('Error verifying signature:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to verify signature' },
      { status: 500 }
    )
  }
}
