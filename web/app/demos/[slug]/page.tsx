import { notFound, redirect } from 'next/navigation'
import { getDemoBySlug } from '@/lib/demos-data'

// This page handles routing for all demos
// - 'web' source demos redirect to their dedicated pages
// - 'projects' source demos show a project info page

export default function DemoPage({ params }: { params: { slug: string } }) {
  const demo = getDemoBySlug(params.slug)

  if (!demo) {
    notFound()
  }

  // For web demos, we have dedicated pages - redirect there
  if (demo.source === 'web') {
    redirect(`/demos/${demo.slug}`)
  }

  // For project demos, show project info
  return <ProjectDemoPage demo={demo} />
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Github, Package, Code, CheckCircle } from 'lucide-react'
import type { Demo } from '@/lib/demos-data'

function ProjectDemoPage({ demo }: { demo: Demo }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Demo Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-14 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/demos">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Demos
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-lg font-bold">{demo.title}</h1>
              {demo.titleChinese && (
                <p className="text-xs text-muted-foreground">{demo.titleChinese}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Status Banner */}
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    This is a standalone project template
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Located in <code className="px-1 py-0.5 bg-yellow-100 dark:bg-yellow-900 rounded">projects/{demo.slug}/</code>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Info */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{demo.title}</CardTitle>
                  <CardDescription className="mt-2 text-base">
                    {demo.description}
                  </CardDescription>
                </div>
                <Badge variant={demo.status === 'live' ? 'default' : 'secondary'}>
                  {demo.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {demo.tags.map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>

              <Separator />

              {/* Features */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Features
                </h3>
                <ul className="grid grid-cols-2 gap-2">
                  {demo.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              {/* Project Structure */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Project Structure
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm">
                  <pre>{`projects/${demo.slug}/
├── components/      # React components
├── lib/
│   ├── actions/     # Server actions
│   ├── db/          # Database schema
│   └── ai/          # AI integrations
├── README.md        # Documentation
├── Makefile         # Build commands
└── package.json`}</pre>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button disabled className="gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Run Demo (Coming Soon)
                </Button>
                <Button variant="outline" className="gap-2" disabled>
                  <Github className="w-4 h-4" />
                  View Source
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
