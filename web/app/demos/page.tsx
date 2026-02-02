'use client'

import Link from 'next/link'
import { DEMOS } from '@/lib/demos-data'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Brain, Users, TestTube, ArrowRight, Sparkles } from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Brain,
  Users,
  TestTube,
}

export default function DemosPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Demo Gallery</h1>
        <p className="text-muted-foreground text-lg">
          Interactive demos showcasing rapid prototyping capabilities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DEMOS.map((demo) => {
          const Icon = iconMap[demo.icon] || FileText
          const isLive = demo.status === 'live'

          return (
            <Card key={demo.slug} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{demo.title}</CardTitle>
                      {demo.titleChinese && (
                        <p className="text-sm text-muted-foreground">{demo.titleChinese}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={isLive ? 'default' : 'secondary'}>
                    {isLive ? (
                      <><Sparkles className="h-3 w-3 mr-1" /> Live</>
                    ) : (
                      'Prototype'
                    )}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <CardDescription className="text-base mb-4">
                  {demo.description}
                </CardDescription>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {demo.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">Features:</p>
                  <ul className="text-sm text-muted-foreground space-y-0.5">
                    {demo.features.slice(0, 3).map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                        {feature}
                      </li>
                    ))}
                    {demo.features.length > 3 && (
                      <li className="text-xs text-muted-foreground/70">
                        +{demo.features.length - 3} more
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>

              <CardFooter>
                <Link href={`/demos/${demo.slug}`} className="w-full">
                  <Button className="w-full" variant={isLive ? 'default' : 'outline'}>
                    {isLive ? 'Try Demo' : 'View Details'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
