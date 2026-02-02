import { anthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'

// DSE Chinese Writing Rubric (based on HKEAA guidelines)
const CHINESE_SYSTEM_PROMPT = `你是一位經驗豐富的 DSE 中文科教師，專門批改學生卷二寫作。請根據香港考評局 DSE 中文科評分準則評估這篇作文。

## 評分標準

### 內容 Content (40分)
- 上品 (36-40)：內容充實，切合題旨；立意高遠，見解獨到
- 中上品 (28-35)：內容充實，切合題旨；立意清晰，見解合理
- 中品 (20-27)：內容大致切題；立意尚算清晰
- 中下品 (12-19)：內容部分切題；立意模糊
- 下品 (0-11)：內容離題或空泛；立意不明

### 表達 Expression (30分)
- 上品 (27-30)：文筆流暢優美；用詞準確精煉；句式靈活多變
- 中上品 (21-26)：文筆流暢；用詞準確；句式通順
- 中品 (15-20)：文筆尚算流暢；用詞大致準確
- 中下品 (9-14)：文筆欠流暢；用詞有時欠準確
- 下品 (0-8)：文筆生硬；用詞不當

### 結構 Structure (20分)
- 上品 (18-20)：結構嚴謹完整；層次分明；首尾呼應
- 中上品 (14-17)：結構完整；層次清晰
- 中品 (10-13)：結構大致完整；層次大致清晰
- 中下品 (6-9)：尚具組織；層次稍欠清晰
- 下品 (0-5)：組織散亂；層次混亂

### 標點字體 Mechanics (10分)
- 上品 (9-10)：標點準確恰當；字體端正清晰
- 中品 (5-8)：標點大致準確；字體尚算清晰
- 下品 (0-4)：標點錯誤頗多；字體潦草難辨

請提供詳細、具建設性的反饋，指出優點和改進空間。使用繁體中文。`

// DSE English Writing Rubric (based on HKEAA Level Descriptors)
const ENGLISH_SYSTEM_PROMPT = `You are an experienced DSE English Language teacher specializing in Paper 2 Writing assessment. Evaluate this essay based on HKEAA DSE English marking criteria.

## Marking Criteria (each scored 1-7)

### Content (Level 7 = 5**)
- Level 7: Excellent understanding; insightful arguments; strong evidence; fully addresses task
- Level 6: Very good understanding; well-developed arguments; relevant evidence
- Level 5: Good understanding; clear arguments; adequate evidence
- Level 4: Adequate understanding; reasonable arguments; some support
- Level 3: Basic understanding; limited development
- Level 2: Limited understanding; underdeveloped ideas
- Level 1: Minimal understanding; largely irrelevant

### Language (Level 7 = 5**)
- Level 7: Wide vocabulary; complex sentences; accurate grammar; appropriate register throughout
- Level 6: Good vocabulary; varied sentences; mostly accurate
- Level 5: Adequate vocabulary; some variety; generally accurate
- Level 4: Sufficient vocabulary; simple but correct
- Level 3: Limited vocabulary; frequent errors
- Level 2: Restricted vocabulary; meaning sometimes unclear
- Level 1: Very limited; serious errors; meaning often unclear

### Organisation (Level 7 = 5**)
- Level 7: Extremely effective; logical development; sophisticated cohesion
- Level 6: Very effective; clear development; strong cohesion
- Level 5: Effective; good development; adequate cohesion
- Level 4: Adequate; reasonable development
- Level 3: Basic; limited development; weak cohesion
- Level 2: Poor; unclear development
- Level 1: Very poor; no clear structure

Provide detailed, constructive feedback highlighting strengths and areas for improvement.`

const FeedbackSchema = z.object({
  overallScore: z.number().min(0).max(100),
  categories: z.array(z.object({
    name: z.string(),
    nameChinese: z.string(),
    score: z.number(),
    maxScore: z.number(),
    level: z.string(),
    feedback: z.string()
  })),
  strengths: z.array(z.string()),
  improvements: z.array(z.string())
})

export async function POST(request: Request) {
  try {
    const { essay, language } = await request.json()

    if (!essay || typeof essay !== 'string') {
      return NextResponse.json({ error: 'Essay is required' }, { status: 400 })
    }

    const systemPrompt = language === 'english' ? ENGLISH_SYSTEM_PROMPT : CHINESE_SYSTEM_PROMPT

    const categorySchema = language === 'english'
      ? z.object({
          overallScore: z.number().describe('Overall percentage score 0-100, calculated from the three categories'),
          categories: z.array(z.object({
            name: z.string(),
            nameChinese: z.string(),
            score: z.number().min(1).max(7).describe('Score 1-7 based on DSE level descriptors'),
            maxScore: z.literal(7),
            level: z.string().describe('Level descriptor e.g. "Level 5 (5)" or "Level 7 (5**)"'),
            feedback: z.string().describe('Specific feedback for this category')
          })).length(3).describe('Must include Content, Language, Organisation'),
          strengths: z.array(z.string()).min(2).max(4),
          improvements: z.array(z.string()).min(2).max(4)
        })
      : z.object({
          overallScore: z.number().describe('Overall percentage score 0-100'),
          categories: z.array(z.object({
            name: z.string(),
            nameChinese: z.string(),
            score: z.number().describe('Score based on DSE rubric'),
            maxScore: z.number(),
            level: z.string().describe('品等 e.g. "上品", "中上品", "中品"'),
            feedback: z.string().describe('具體的評語')
          })).length(4).describe('Must include 內容, 表達, 結構, 標點字體'),
          strengths: z.array(z.string()).min(2).max(4).describe('優點 (使用繁體中文)'),
          improvements: z.array(z.string()).min(2).max(4).describe('改進建議 (使用繁體中文)')
        })

    const { object: feedback } = await generateObject({
      model: anthropic('claude-sonnet-4-20250514'),
      system: systemPrompt,
      prompt: language === 'english'
        ? `Please assess this DSE English essay:\n\n${essay}`
        : `請批改以下 DSE 中文作文：\n\n${essay}`,
      schema: categorySchema,
    })

    return NextResponse.json(feedback)
  } catch (error) {
    console.error('Writing feedback error:', error)
    return NextResponse.json(
      { error: 'Failed to generate feedback' },
      { status: 500 }
    )
  }
}
