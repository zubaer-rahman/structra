import { NextRequest, NextResponse } from 'next/server'
import { SignatureService } from '@/server/services/signatureService'
import { z } from 'zod'

const rejectSignatureSchema = z.object({
  reason: z.string().optional()
})

// POST /api/signatures/[id]/reject - Reject signature
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = rejectSignatureSchema.parse(body)

    // Get user info from request headers or auth
    const userId = request.headers.get('x-user-id')
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const signature = await SignatureService.rejectSignature(
      id,
      validatedData.reason,
      userId || undefined,
      ipAddress,
      userAgent
    )

    return NextResponse.json({ signature })
  } catch (error) {
    console.error('Error rejecting signature:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to reject signature' },
      { status: 500 }
    )
  }
}
