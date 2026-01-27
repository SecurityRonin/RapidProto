/**
 * POST /api/session/[id]/step
 * Update step status/acquired value
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateStep } from '@/lib/actions/session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { stepId, status, acquiredValue, notes } = body

    if (!stepId) {
      return NextResponse.json(
        { success: false, error: 'Missing stepId' },
        { status: 400 }
      )
    }

    const result = await updateStep(stepId, { status, acquiredValue, notes })

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 404 })
    }
  } catch (error) {
    console.error('POST /api/session/[id]/step error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
