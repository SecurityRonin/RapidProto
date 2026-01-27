/**
 * POST /api/session/[id]/advance
 * Advance to next phase
 */

import { NextRequest, NextResponse } from 'next/server'
import { advancePhase } from '@/lib/actions/session'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const result = await advancePhase(id)

    if (result.success) {
      return NextResponse.json(result)
    } else {
      const status = result.error === 'Session not found' ? 404 : 400
      return NextResponse.json(result, { status })
    }
  } catch (error) {
    console.error('POST /api/session/[id]/advance error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
