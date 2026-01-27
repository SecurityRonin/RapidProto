/**
 * POST /api/session
 * Create a new session (as builder)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSession } from '@/lib/actions/session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { title } = body

    const result = await createSession({ title })

    if (result.success) {
      return NextResponse.json(result, { status: 201 })
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error('POST /api/session error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
