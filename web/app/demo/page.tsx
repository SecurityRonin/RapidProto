'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  PenLine, Sparkles, BookOpen, Loader2, CheckCircle, AlertCircle,
  ChevronRight, ChevronLeft, Info, GraduationCap, Target, Lightbulb, AlertTriangle
} from 'lucide-react'
import { DSE_CHINESE_GUIDELINES, DSE_ENGLISH_GUIDELINES, type DSEGuidelines } from '@/lib/dse-guidelines'

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

interface WritingFeedback {
  overallScore: number
  categories: Array<{
    name: string
    nameChinese: string
    score: number
    maxScore: number
    level: string
    feedback: string
  }>
  strengths: string[]
  improvements: string[]
}

interface GeneratedExercise {
  question: string
  options?: string[]
  answer: string
  explanation: string
  bloomLevel: string
}

export default function DemoPage() {
  const [showGuidelines, setShowGuidelines] = useState(true)
  const [activeMode, setActiveMode] = useState<'chinese' | 'english'>('chinese')

  const guidelines = activeMode === 'chinese' ? DSE_CHINESE_GUIDELINES : DSE_ENGLISH_GUIDELINES

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">智啟學教 AI 平台</h1>
                <p className="text-sm text-muted-foreground">DSE Writing Assistant Demo</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGuidelines(!showGuidelines)}
              className="gap-2"
            >
              <Info className="w-4 h-4" />
              {showGuidelines ? 'Hide' : 'Show'} Guidelines
              {showGuidelines ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Main Content */}
        <main className={`flex-1 container mx-auto px-4 py-8 transition-all ${showGuidelines ? 'mr-96' : ''}`}>
          <Tabs defaultValue="writing" className="max-w-3xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="writing" className="gap-2">
                <PenLine className="w-4 h-4" />
                作文批改 Writing Feedback
              </TabsTrigger>
              <TabsTrigger value="exercises" className="gap-2">
                <Sparkles className="w-4 h-4" />
                練習生成 Exercise Generator
              </TabsTrigger>
            </TabsList>

            <TabsContent value="writing">
              <WritingFeedbackTab
                activeMode={activeMode}
                setActiveMode={setActiveMode}
                guidelines={guidelines}
              />
            </TabsContent>

            <TabsContent value="exercises">
              <ExerciseGeneratorTab />
            </TabsContent>
          </Tabs>
        </main>

        {/* Collapsible Guidelines Panel */}
        {showGuidelines && (
          <aside className="fixed right-0 top-[73px] bottom-0 w-96 border-l bg-background overflow-y-auto">
            <GuidelinesPanel guidelines={guidelines} />
          </aside>
        )}
      </div>
    </div>
  )
}

function GuidelinesPanel({ guidelines }: { guidelines: DSEGuidelines }) {
  const [expandedRubric, setExpandedRubric] = useState<string | null>(null)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          {guidelines.title}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{guidelines.paperInfo}</p>
      </div>

      <div className="p-3 bg-muted/50 rounded-lg">
        <p className="text-sm">{guidelines.overview}</p>
      </div>

      {/* Rubrics */}
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Target className="w-4 h-4" />
          評分準則 Marking Criteria
        </h3>
        {guidelines.rubrics.map((rubric) => (
          <div key={rubric.name} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedRubric(expandedRubric === rubric.name ? null : rubric.name)}
              className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{rubric.weight}%</span>
                </div>
                <div className="text-left">
                  <div className="font-medium">{rubric.nameChinese}</div>
                  <div className="text-xs text-muted-foreground">{rubric.name}</div>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${expandedRubric === rubric.name ? 'rotate-90' : ''}`} />
            </button>
            {expandedRubric === rubric.name && (
              <div className="px-3 pb-3 space-y-2">
                <p className="text-sm text-muted-foreground px-1">{rubric.description}</p>
                <div className="space-y-1">
                  {rubric.levels.map((level, i) => (
                    <div key={i} className="flex gap-2 text-xs p-2 bg-muted/30 rounded">
                      <Badge variant="outline" className="shrink-0">{level.level}</Badge>
                      <span className="text-muted-foreground">{level.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          寫作貼士 Tips
        </h3>
        <ul className="space-y-1">
          {guidelines.tips.map((tip, i) => (
            <li key={i} className="text-sm flex gap-2">
              <span className="text-primary">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Common Mistakes */}
      <div className="space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          常見錯誤 Common Mistakes
        </h3>
        <ul className="space-y-1">
          {guidelines.commonMistakes.map((mistake, i) => (
            <li key={i} className="text-sm flex gap-2 text-muted-foreground">
              <span className="text-orange-500">✗</span>
              <span>{mistake}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-4 border-t text-xs text-muted-foreground">
        Sources: <a href="https://www.hkeaa.edu.hk" className="underline" target="_blank" rel="noopener">HKEAA</a>,
        <a href="https://afterschool.com.hk" className="underline ml-1" target="_blank" rel="noopener">AfterSchool</a>
      </div>
    </div>
  )
}

function WritingFeedbackTab({
  activeMode,
  setActiveMode,
  guidelines
}: {
  activeMode: 'chinese' | 'english'
  setActiveMode: (mode: 'chinese' | 'english') => void
  guidelines: DSEGuidelines
}) {
  const [essay, setEssay] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!essay.trim()) return

    setLoading(true)
    setError(null)
    setFeedback(null)

    try {
      const res = await fetch('/api/writing-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ essay, language: activeMode }),
      })

      if (!res.ok) throw new Error('Failed to get feedback')

      const data = await res.json()
      setFeedback(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const minWords = activeMode === 'chinese' ? 400 : 200

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>提交作文 Submit Essay</CardTitle>
              <CardDescription>
                根據 DSE {activeMode === 'chinese' ? '中文' : 'English'} 評分標準提供反饋
              </CardDescription>
            </div>
            {/* Mode Switcher */}
            <div className="flex rounded-lg border overflow-hidden">
              <button
                onClick={() => setActiveMode('chinese')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeMode === 'chinese'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                中文
              </button>
              <button
                onClick={() => setActiveMode('english')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeMode === 'english'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-3">
              {essay.length} {activeMode === 'chinese' ? '字' : 'words'}
            </Badge>
            {essay.length > 0 && essay.length < minWords && (
              <span className="text-sm text-muted-foreground">
                (建議至少 {minWords} {activeMode === 'chinese' ? '字' : 'words'})
              </span>
            )}
          </div>

          <textarea
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            placeholder={activeMode === 'chinese'
              ? '在此輸入您的作文...\n\n題目示例：\n• 我最想尋回的一件玩具\n• 無愧的選擇\n• 遵守或放棄諾言'
              : 'Enter your essay here...\n\nSample topics:\n• A letter to a friend about your future plans\n• An article about the importance of technology\n• A blog post about a memorable experience'}
            className="w-full h-72 p-4 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
          />

          <Button
            onClick={handleSubmit}
            disabled={loading || !essay.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                分析中 Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                獲取 AI 反饋 Get AI Feedback
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

      {feedback && <FeedbackDisplay feedback={feedback} guidelines={guidelines} />}
    </div>
  )
}

function FeedbackDisplay({ feedback, guidelines }: { feedback: WritingFeedback; guidelines: DSEGuidelines }) {
  const getScoreColor = (score: number, max: number) => {
    const pct = (score / max) * 100
    if (pct >= 80) return 'text-green-600'
    if (pct >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getGradeLevel = (score: number) => {
    if (score >= 85) return '5**'
    if (score >= 75) return '5*'
    if (score >= 65) return '5'
    if (score >= 55) return '4'
    if (score >= 45) return '3'
    if (score >= 35) return '2'
    return '1'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            DSE 評估報告 Assessment Report
          </CardTitle>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getScoreColor(feedback.overallScore, 100)}`}>
              {feedback.overallScore}/100
            </div>
            <Badge variant="secondary" className="mt-1">
              預測等級 Level: {getGradeLevel(feedback.overallScore)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Scores */}
        <div className="space-y-4">
          {feedback.categories.map((cat) => (
            <div key={cat.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{cat.nameChinese}</span>
                  <span className="text-sm text-muted-foreground">({cat.name})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{cat.level}</Badge>
                  <span className={`font-bold ${getScoreColor(cat.score, cat.maxScore)}`}>
                    {cat.score}/{cat.maxScore}
                  </span>
                </div>
              </div>
              <Progress value={(cat.score / cat.maxScore) * 100} className="h-2" />
              <p className="text-sm text-muted-foreground">{cat.feedback}</p>
            </div>
          ))}
        </div>

        <Separator />

        {/* Strengths & Improvements */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              優點 Strengths
            </h4>
            <ul className="space-y-2">
              {feedback.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-green-600">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              改進建議 Areas to Improve
            </h4>
            <ul className="space-y-2">
              {feedback.improvements.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-blue-600">→</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          ⚠️ AI 評估僅供參考，最終評分以教師判斷為準。
          This AI assessment is for reference only. Final grading is subject to teacher review.
        </div>
      </CardContent>
    </Card>
  )
}

function ExerciseGeneratorTab() {
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
    <div className="space-y-6">
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
