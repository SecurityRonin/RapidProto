/**
 * Synced Inputs Card Component
 *
 * Displays information shared from the builder to the facilitator.
 */

import { Card, CardContent } from '@/components/ui/card'
import type { SyncedInputs } from '../types'

interface SyncedInputsCardProps {
  inputs: SyncedInputs
}

export function SyncedInputsCard({ inputs }: SyncedInputsCardProps) {
  const { coreFeature, template } = inputs

  // Don't render if no inputs
  if (!coreFeature && !template) {
    return null
  }

  return (
    <Card className="bg-muted/50">
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          From Builder
        </h3>
        <div className="space-y-3">
          {coreFeature && (
            <div>
              <p className="text-xs text-muted-foreground">Core Feature</p>
              <p className="font-medium">{coreFeature}</p>
            </div>
          )}
          {template && (
            <div>
              <p className="text-xs text-muted-foreground">Template</p>
              <p className="font-medium">{template}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
