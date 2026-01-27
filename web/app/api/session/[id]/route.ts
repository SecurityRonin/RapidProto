/**
 * GET /api/session/[id]
 * Get session data for polling
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/actions/session'
import type { Role } from '@/lib/db/schema'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') as Role | null

    if (!role || !['builder', 'facilitator'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing role parameter' },
        { status: 400 }
      )
    }

    const result = await getSession(id, role)

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 404 })
    }
  } catch (error) {
    console.error('GET /api/session/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
