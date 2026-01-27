/**
 * POST /api/session/[id]/resume
 * Resume paused session timer
 */

import { NextRequest, NextResponse } from 'next/server'
import { resumeSession } from '@/lib/actions/session'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const result = await resumeSession(id)

    if (result.success) {
      return NextResponse.json(result)
    } else {
      const status = result.error === 'Session not found' ? 404 : 400
      return NextResponse.json(result, { status })
    }
  } catch (error) {
    console.error('POST /api/session/[id]/resume error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
