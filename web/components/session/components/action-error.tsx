/**
 * Action Error Component
 *
 * Displays error messages from failed session actions.
 */

import { Card, CardContent } from '@/components/ui/card'

interface ActionErrorProps {
  message: string
}

export function ActionError({ message }: ActionErrorProps) {
  return (
    <Card className="border-destructive bg-destructive/5">
      <CardContent className="py-4 text-center">
        <p className="text-sm text-destructive">{message}</p>
      </CardContent>
    </Card>
  )
}
