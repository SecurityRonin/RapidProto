import { anthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'

// Bloom's Taxonomy level descriptions for prompt engineering
const BLOOM_PROMPTS = {
  remember: {
    description: '記憶層次 (Remember): Test recall of facts, terms, basic concepts',
    verbs: 'define, list, state, describe, identify, name, recall, recognize',
    questionStyle: 'Direct factual questions, definitions, identification tasks'
  },
  understand: {
    description: '理解層次 (Understand): Test explanation and interpretation of ideas',
    verbs: 'explain, summarize, classify, compare, infer, paraphrase, describe',
    questionStyle: 'Explanation questions, comparisons, summaries, interpretations'
  },
  apply: {
    description: '應用層次 (Apply): Test using information in new situations',
    verbs: 'apply, demonstrate, solve, use, implement, calculate, execute',
    questionStyle: 'Problem-solving, calculations, applying rules to new scenarios'
  },
  analyze: {
    description: '分析層次 (Analyze): Test drawing connections and distinguishing ideas',
    verbs: 'analyze, distinguish, compare, contrast, examine, differentiate, organize',
    questionStyle: 'Analysis of relationships, cause-effect, compare-contrast, categorization'
  },
  evaluate: {
    description: '評估層次 (Evaluate): Test judgment and critical thinking',
    verbs: 'evaluate, judge, defend, critique, justify, support, argue',
    questionStyle: 'Critical evaluation, judgment questions, argumentation, pros/cons'
  },
  create: {
    description: '創造層次 (Create): Test producing new ideas or original work',
    verbs: 'design, construct, create, develop, formulate, propose, hypothesize',
    questionStyle: 'Open-ended creation, design tasks, hypothetical scenarios, synthesis'
  }
}

const SUBJECT_CONTEXT: Record<string, string> = {
  chinese: '中文科：包括語文知識、文學賞析、寫作技巧等內容。使用繁體中文出題。',
  english: 'English Language: Including grammar, vocabulary, reading comprehension, writing. Questions in English.',
  math: '數學科：包括代數、幾何、統計、微積分等內容。可包含計算題。',
  science: '科學科：包括物理、化學、生物等內容。可包含實驗相關題目。',
  history: '歷史科：包括中國歷史、世界歷史、時事分析等內容。'
}

const ExercisesSchema = z.object({
  exercises: z.array(z.object({
    question: z.string().describe('The question text'),
    options: z.array(z.string()).optional().describe('Multiple choice options A-D (omit for open-ended questions)'),
    answer: z.string().describe('The correct answer'),
    explanation: z.string().describe('Explanation of why this is correct'),
    bloomLevel: z.string().describe('The Bloom taxonomy level')
  }))
})

export async function POST(request: Request) {
  try {
    const { subject, topic, bloomLevel, count } = await request.json()

    if (!topic || !bloomLevel) {
      return NextResponse.json({ error: 'Topic and Bloom level are required' }, { status: 400 })
    }

    const bloom = BLOOM_PROMPTS[bloomLevel as keyof typeof BLOOM_PROMPTS]
    if (!bloom) {
      return NextResponse.json({ error: 'Invalid Bloom level' }, { status: 400 })
    }

    const subjectContext = SUBJECT_CONTEXT[subject] || SUBJECT_CONTEXT.chinese
    const useChinese = subject === 'chinese' || subject === 'history'

    const systemPrompt = `You are an expert educational content creator specializing in Bloom's Taxonomy-aligned assessments.

## Subject Context
${subjectContext}

## Bloom's Taxonomy Level
${bloom.description}
Action verbs to use: ${bloom.verbs}
Question style: ${bloom.questionStyle}

## Guidelines
1. Create questions that specifically target the ${bloomLevel} cognitive level
2. Each question must clearly align with the action verbs and style for this level
3. For lower levels (remember, understand): Use multiple choice format with 4 options
4. For higher levels (analyze, evaluate, create): May use open-ended format
5. Provide clear, educational explanations
6. Ensure questions are appropriate for Hong Kong secondary school students (Forms 4-6)
7. ${useChinese ? '使用繁體中文' : 'Use English'}

## Topic
Generate ${count} questions about: ${topic}`

    const { object: result } = await generateObject({
      model: anthropic('claude-sonnet-4-20250514'),
      system: systemPrompt,
      prompt: `Generate ${count} ${bloom.description} questions about "${topic}" for ${subject} subject.`,
      schema: ExercisesSchema,
    })

    // Ensure bloomLevel is set on all exercises
    const exercises = result.exercises.map(ex => ({
      ...ex,
      bloomLevel: bloomLevel
    }))

    return NextResponse.json({ exercises })
  } catch (error) {
    console.error('Exercise generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate exercises' },
      { status: 500 }
    )
  }
}
