/**
 * RapidProto Landing Page
 * Dual-mode: Start as Builder or Join as Facilitator
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Code2, Users, Clock, Zap, Target, Rocket } from 'lucide-react'
import { SessionHistory } from '@/components/session/session-history'
import { Logo } from '@/components/ui/logo'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-12 pb-16 text-center">
        <div className="flex justify-center mb-8">
          <Logo size="xl" showText={false} />
        </div>
        <Badge variant="secondary" className="mb-6">
          50-minute prototype sprints
        </Badge>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
          Build prototypes.
          <br />
          <span className="text-muted-foreground">Together.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
          A synchronized timer for builder-facilitator teams.
          Builder codes while facilitator handles business discussions.
          Same sprint, different workflows.
        </p>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Builder Card */}
          <Card className="text-left hover:shadow-lg transition-shadow border-2 hover:border-primary/50">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Code2 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Start as Builder</CardTitle>
              <CardDescription>
                Create a new session and get a code to share with your facilitator
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  50-minute structured sprint
                </li>
                <li className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Discovery → Build → Verify
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Template-accelerated development
                </li>
              </ul>
              <Button asChild className="w-full">
                <Link href="/session/new">
                  Start Building
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Facilitator Card */}
          <Card className="text-left hover:shadow-lg transition-shadow border-2 hover:border-primary/50">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Join as Facilitator</CardTitle>
              <CardDescription>
                Enter a session code to join an existing sprint
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Synced timer with builder
                </li>
                <li className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Expectations → Long Term → Close
                </li>
                <li className="flex items-center gap-2">
                  <Rocket className="w-4 h-4" />
                  Handle business while builder codes
                </li>
              </ul>
              <Button asChild variant="outline" className="w-full">
                <Link href="/join">
                  Join Session
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Session History */}
        <div className="max-w-3xl mx-auto mt-12">
          <SessionHistory maxItems={3} />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-semibold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold">1</span>
            </div>
            <h3 className="font-semibold mb-2">Builder Starts</h3>
            <p className="text-sm text-muted-foreground">
              Create a session, get a 6-character code, share with your facilitator
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold">2</span>
            </div>
            <h3 className="font-semibold mb-2">Facilitator Joins</h3>
            <p className="text-sm text-muted-foreground">
              Enter the code to sync timers. Both see the same countdown.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold">3</span>
            </div>
            <h3 className="font-semibold mb-2">Work in Parallel</h3>
            <p className="text-sm text-muted-foreground">
              Builder codes the prototype while facilitator manages client expectations
            </p>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-semibold text-center mb-12">The 50-Minute Sprint</h2>
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            {/* Builder Timeline */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                BUILDER
              </h3>
              <div className="flex gap-2">
                <div className="flex-1 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Badge variant="outline" className="mb-2">10 min</Badge>
                  <p className="text-sm font-medium">Discovery</p>
                  <p className="text-xs text-muted-foreground">Define & pick template</p>
                </div>
                <div className="flex-[3] p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <Badge variant="outline" className="mb-2">30 min</Badge>
                  <p className="text-sm font-medium">Build</p>
                  <p className="text-xs text-muted-foreground">Code the prototype</p>
                </div>
                <div className="flex-1 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <Badge variant="outline" className="mb-2">10 min</Badge>
                  <p className="text-sm font-medium">Verify</p>
                  <p className="text-xs text-muted-foreground">Test & ship</p>
                </div>
              </div>
            </div>

            {/* Facilitator Timeline */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                FACILITATOR
              </h3>
              <div className="flex gap-2">
                <div className="flex-1 p-4 rounded-lg bg-muted/50 border border-muted">
                  <p className="text-xs text-muted-foreground">Waiting...</p>
                </div>
                <div className="flex-[3] p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <Badge variant="outline" className="mb-2">30 min</Badge>
                  <div className="flex gap-1 text-xs">
                    <span className="px-2 py-1 bg-background rounded">Expectations</span>
                    <span className="px-2 py-1 bg-background rounded">Long Term</span>
                    <span className="px-2 py-1 bg-background rounded">Close</span>
                  </div>
                </div>
                <div className="flex-1 p-4 rounded-lg bg-muted/50 border border-muted">
                  <p className="text-xs text-muted-foreground">Demo time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground border-t">
        <div className="flex items-center justify-center gap-2">
          <Logo size="sm" showText={false} />
          <span>RapidProto - Build prototypes in 50 minutes</span>
        </div>
      </footer>
    </main>
  )
}
