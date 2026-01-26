import { getSessionStatus } from '@/lib/actions'
import { SessionDashboard } from '@/components/session/session-dashboard'
import { notFound } from 'next/navigation'

interface SessionPageProps {
  params: Promise<{ id: string }>
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { id } = await params
  const result = await getSessionStatus(id)

  if (!result.success) {
    notFound()
  }

  return <SessionDashboard sessionId={id} />
}
