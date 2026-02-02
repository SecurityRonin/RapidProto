'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sparkles, Brain, Loader2, AlertCircle, ArrowLeft, BookOpen,
  Lightbulb, Target, Layers
} from 'lucide-react'

// Bloom's Taxonomy levels
const BLOOM_LEVELS = [
  { value: 'remember', label: '記憶 Remember', description: '回憶事實和基本概念', color: 'bg-blue-500' },
  { value: 'understand', label: '理解 Understand', description: '解釋想法或概念', color: 'bg-green-500' },
  { value: 'apply', label: '應用 Apply', description: '在新情況中使用信息', color: 'bg-yellow-500' },
  { value: 'analyze', label: '分析 Analyze', description: '建立聯繫，區分想法', color: 'bg-orange-500' },
  { value: 'evaluate', label: '評估 Evaluate', description: '判斷和批判性思考', color: 'bg-red-500' },
  { value: 'create', label: '創造 Create', description: '產生新的或原創的作品', color: 'bg-purple-500' },
] as const

type BloomLevel = typeof BLOOM_LEVELS[number]['value']

const SUBJECTS = [
  { value: 'chinese', label: '中文' },
  { value: 'english', label: 'English' },
  { value: 'math', label: '數學' },
  { value: 'science', label: '科學' },
  { value: 'history', label: '歷史' },
]

interface GeneratedExercise {
  question: string
  options?: string[]
  answer: string
  explanation: string
  bloomLevel: string
}

export default function ExerciseGeneratorDemo() {
  const [showInfo, setShowInfo] = useState(true)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Demo Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-14 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/demos">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Demos
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Brain className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">Bloom's Taxonomy Exercises</h1>
                  <p className="text-xs text-muted-foreground">布魯姆分類法練習生成器</p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInfo(!showInfo)}
              className="gap-2"
            >
              <Lightbulb className="w-4 h-4" />
              {showInfo ? 'Hide' : 'Show'} Info
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        <main className={`flex-1 container mx-auto px-4 py-8 transition-all ${showInfo ? 'mr-80' : ''}`}>
          <ExerciseGeneratorForm />
        </main>

        {showInfo && (
          <aside className="fixed right-0 top-[110px] bottom-0 w-80 border-l bg-background overflow-y-auto">
            <BloomInfoPanel />
          </aside>
        )}
      </div>
    </div>
  )
}

function BloomInfoPanel() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          Bloom's Taxonomy
        </h2>
        <p className="text-sm text-muted-foreground mt-1">布魯姆認知分類學</p>
      </div>

      <div className="p-3 bg-muted/50 rounded-lg">
        <p className="text-sm">
          A hierarchical framework for categorizing educational learning objectives into levels of complexity and specificity.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Target className="w-4 h-4" />
          Six Cognitive Levels
        </h3>
        {BLOOM_LEVELS.slice().reverse().map((level) => (
          <div key={level.value} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
            <div className={`w-3 h-3 rounded-full mt-1.5 ${level.color}`} />
            <div>
              <div className="font-medium text-sm">{level.label}</div>
              <div className="text-xs text-muted-foreground">{level.description}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Usage Tips
        </h3>
        <ul className="space-y-1 text-sm">
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Lower levels (Remember, Understand) suit MC questions</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Higher levels (Evaluate, Create) suit open-ended</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Mix levels for comprehensive assessments</span>
          </li>
        </ul>
      </div>

      <div className="pt-4 border-t text-xs text-muted-foreground">
        Based on Bloom's Revised Taxonomy (Anderson & Krathwohl, 2001)
      </div>
    </div>
  )
}

function ExerciseGeneratorForm() {
  const [subject, setSubject] = useState('chinese')
  const [topic, setTopic] = useState('')
  const [bloomLevel, setBloomLevel] = useState<BloomLevel>('understand')
  const [count, setCount] = useState(3)
  const [loading, setLoading] = useState(false)
  const [exercises, setExercises] = useState<GeneratedExercise[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!topic.trim()) return

    setLoading(true)
    setError(null)
    setExercises([])

    try {
      const res = await fetch('/api/generate-exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic, bloomLevel, count }),
      })

      if (!res.ok) throw new Error('Failed to generate exercises')

      const data = await res.json()
      setExercises(data.exercises)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>練習題生成器 Exercise Generator</CardTitle>
          <CardDescription>
            選擇科目、主題和 Bloom 認知層次，AI 將生成對應的練習題
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">科目 Subject</label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">題目數量 Count</label>
              <Select value={count.toString()} onValueChange={v => setCount(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 3, 5, 10].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n} 題</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">主題 Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例如：三國演義、Photosynthesis、二次方程式..."
              className="w-full p-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Bloom 認知層次 Cognitive Level</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {BLOOM_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setBloomLevel(level.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    bloomLevel === level.value
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3 h-3 rounded-full ${level.color}`} />
                    <span className="font-medium text-sm">{level.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{level.description}</p>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                生成中 Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                生成練習題 Generate Exercises
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {exercises.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">生成的練習題 Generated Exercises</h3>
          {exercises.map((exercise, i) => (
            <ExerciseCard key={i} exercise={exercise} index={i + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function ExerciseCard({ exercise, index }: { exercise: GeneratedExercise; index: number }) {
  const [showAnswer, setShowAnswer] = useState(false)
  const level = BLOOM_LEVELS.find(l => l.value === exercise.bloomLevel)

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">Q{index}</span>
            {level && (
              <Badge variant="outline" className="gap-1">
                <div className={`w-2 h-2 rounded-full ${level.color}`} />
                {level.label}
              </Badge>
            )}
          </div>
        </div>

        <p className="text-base">{exercise.question}</p>

        {exercise.options && (
          <div className="space-y-2 pl-4">
            {exercise.options.map((option, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-muted-foreground font-mono">{String.fromCharCode(65 + i)}.</span>
                <span>{option}</span>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAnswer(!showAnswer)}
          >
            {showAnswer ? '隱藏答案 Hide Answer' : '顯示答案 Show Answer'}
          </Button>
        </div>

        {showAnswer && (
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <p><strong>答案 Answer：</strong>{exercise.answer}</p>
            <p className="text-sm text-muted-foreground">{exercise.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
