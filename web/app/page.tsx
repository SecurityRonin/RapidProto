'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Sparkles, Timer, Layers, Rocket } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-8">
          {/* Badge */}
          <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Solo Developer Productivity
          </Badge>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            Ship a prototype
            <br />
            <span className="text-muted-foreground">in 50 minutes</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
            Stop overthinking. Start a timed session, pick a template,
            and build something real. The clock keeps you focused.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button asChild size="lg" className="text-base px-8">
              <Link href="/session/new">
                Start Session
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-base px-8" asChild>
              <Link href="#how-it-works">
                How it works
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <section id="how-it-works" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold mb-2">The 50-Minute Framework</h2>
          <p className="text-muted-foreground">A proven process to go from idea to working prototype</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <PhaseCard
            phase={1}
            title="Discover"
            duration="10 min"
            icon={<Layers className="w-5 h-5" />}
            description="Clarify what you're building. Define the core feature. Skip the nice-to-haves."
          />
          <PhaseCard
            phase={2}
            title="Build"
            duration="30 min"
            icon={<Timer className="w-5 h-5" />}
            description="Pick a template, customize it. The timer keeps you from rabbit holes."
            highlighted
          />
          <PhaseCard
            phase={3}
            title="Verify"
            duration="10 min"
            icon={<Rocket className="w-5 h-5" />}
            description="Test the happy path. Fix critical bugs. Ship or demo what you have."
          />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-2xl mx-auto border-0 bg-primary text-primary-foreground">
          <CardContent className="flex flex-col items-center text-center p-10 space-y-4">
            <h3 className="text-2xl font-semibold">Ready to build?</h3>
            <p className="text-primary-foreground/80">
              Your next prototype is 50 minutes away.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-4">
              <Link href="/session/new">
                Start Session
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>RapidProto</span>
          <span>Built for builders who ship</span>
        </div>
      </footer>
    </main>
  )
}

function PhaseCard({
  phase,
  title,
  duration,
  icon,
  description,
  highlighted = false,
}: {
  phase: number
  title: string
  duration: string
  icon: React.ReactNode
  description: string
  highlighted?: boolean
}) {
  return (
    <Card className={highlighted ? 'border-primary shadow-lg' : ''}>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center
              ${highlighted ? 'bg-primary text-primary-foreground' : 'bg-muted'}
            `}>
              {icon}
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Phase {phase}</p>
              <h3 className="font-semibold">{title}</h3>
            </div>
          </div>
          <Badge variant={highlighted ? 'default' : 'secondary'}>{duration}</Badge>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}
