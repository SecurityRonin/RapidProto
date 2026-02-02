'use client'

import { useState } from 'react'
import { TEMPLATES, TEMPLATE_CATEGORIES, getTemplatesByCategory } from '@/lib/demos-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  GraduationCap, DollarSign, Users, Scale, Truck,
  TrendingUp, Calendar, Briefcase, Settings, Package,
  Sparkles, Code, ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap,
  DollarSign,
  Users,
  Scale,
  Truck,
  TrendingUp,
  Calendar,
  Briefcase,
  Settings,
  Package,
}

const complexityColors = {
  starter: 'bg-green-500/10 text-green-700 border-green-200',
  intermediate: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  advanced: 'bg-red-500/10 text-red-700 border-red-200',
}

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredTemplates = selectedCategory
    ? getTemplatesByCategory(selectedCategory)
    : TEMPLATES

  const categoriesWithCounts = TEMPLATE_CATEGORIES.map(cat => ({
    ...cat,
    count: getTemplatesByCategory(cat.id).length
  })).filter(cat => cat.count > 0)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Templates</h1>
        <p className="text-muted-foreground text-lg">
          Production-ready templates for rapid prototyping across industries
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar - Categories */}
        <aside className="lg:w-64 shrink-0">
          <div className="sticky top-4">
            <h2 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
              Categories
            </h2>
            <div className="space-y-1">
              <Button
                variant={selectedCategory === null ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedCategory(null)}
              >
                <Package className="mr-2 h-4 w-4" />
                All Templates
                <Badge variant="outline" className="ml-auto">
                  {TEMPLATES.length}
                </Badge>
              </Button>

              {categoriesWithCounts.map((category) => {
                const Icon = iconMap[category.icon] || Package
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {category.name}
                    <Badge variant="outline" className="ml-auto">
                      {category.count}
                    </Badge>
                  </Button>
                )
              })}
            </div>
          </div>
        </aside>

        {/* Main content - Template cards */}
        <main className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
              {selectedCategory && ` in ${TEMPLATE_CATEGORIES.find(c => c.id === selectedCategory)?.name}`}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="flex flex-col hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{template.title}</CardTitle>
                    {template.hasAI && (
                      <Badge variant="default" className="shrink-0">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 pt-0">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {template.techStack.map((tech) => (
                      <Badge key={tech} variant="outline" className="text-xs">
                        <Code className="h-3 w-3 mr-1" />
                        {tech}
                      </Badge>
                    ))}
                  </div>

                  <Badge
                    variant="outline"
                    className={cn('text-xs capitalize', complexityColors[template.complexity])}
                  >
                    {template.complexity}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No templates in this category yet.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
