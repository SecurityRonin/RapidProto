import { SessionDashboard } from '@/components/session/session-dashboard'

interface SessionPageProps {
  params: Promise<{ id: string }>
}

// Note: Server-side validation is skipped to support localStorage-only sessions
// (e.g., facilitator practice sessions). The client-side dashboard handles
// showing "session not found" if the session doesn't exist in localStorage.
export default async function SessionPage({ params }: SessionPageProps) {
  const { id } = await params
  return <SessionDashboard sessionId={id} />
}
