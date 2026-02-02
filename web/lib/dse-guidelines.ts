// DSE Writing Guidelines for Chinese and English
// Sources:
// - HKEAA Official: https://www.hkeaa.edu.hk/DocLibrary/HKDSE/Subject_Information/eng_lang/LevelDescriptors-ENG-Writing.pdf
// - AfterSchool: https://afterschool.com.hk/blog/258-dse-中文卷二-作文/
// - Issac Lo: https://issaclo.hk/chinese/essential-strategies-for-writing-skills-paper-2/

export interface RubricLevel {
  level: string
  score: string
  description: string
}

export interface RubricCategory {
  name: string
  nameChinese: string
  weight: number
  description: string
  levels: RubricLevel[]
}

export interface DSEGuidelines {
  subject: 'chinese' | 'english'
  title: string
  paperInfo: string
  overview: string
  rubrics: RubricCategory[]
  tips: string[]
  commonMistakes: string[]
}

export const DSE_CHINESE_GUIDELINES: DSEGuidelines = {
  subject: 'chinese',
  title: 'DSE 中文科 卷二 寫作能力',
  paperInfo: '考試時間：1小時30分鐘 | 佔全科 30%',
  overview: '卷二分為甲部（實用寫作）及乙部（長文寫作），考核學生的寫作能力，包括內容構思、語言表達及文章結構。',
  rubrics: [
    {
      name: 'Content',
      nameChinese: '內容',
      weight: 40,
      description: '評估文章內容是否切題、充實、有深度，立意是否明確。',
      levels: [
        { level: '上品', score: '36-40', description: '內容充實，切合題旨；立意高遠，見解獨到；材料豐富，例證恰當' },
        { level: '中上品', score: '28-35', description: '內容充實，切合題旨；立意清晰，見解合理；材料適當，例證恰當' },
        { level: '中品', score: '20-27', description: '內容大致切題；立意尚算清晰；材料尚算充足' },
        { level: '中下品', score: '12-19', description: '內容部分切題；立意模糊；材料不足或欠恰當' },
        { level: '下品', score: '0-11', description: '內容離題或空泛；立意不明；材料貧乏或不當' },
      ]
    },
    {
      name: 'Expression',
      nameChinese: '表達',
      weight: 30,
      description: '評估語言運用能力，包括用詞準確性、句子流暢性及整體表達效果。',
      levels: [
        { level: '上品', score: '27-30', description: '文筆流暢優美；用詞準確精煉；句式靈活多變；修辭恰當' },
        { level: '中上品', score: '21-26', description: '文筆流暢；用詞準確；句式通順；間有修飾' },
        { level: '中品', score: '15-20', description: '文筆尚算流暢；用詞大致準確；句子大致通順' },
        { level: '中下品', score: '9-14', description: '文筆欠流暢；用詞有時欠準確；句子偶有不通' },
        { level: '下品', score: '0-8', description: '文筆生硬；用詞不當；句子多有不通' },
      ]
    },
    {
      name: 'Structure',
      nameChinese: '結構',
      weight: 20,
      description: '評估文章組織能力，包括段落安排、層次分明及前後呼應。',
      levels: [
        { level: '上品', score: '18-20', description: '結構嚴謹完整；層次分明；詳略得宜，鋪排有序；首尾呼應' },
        { level: '中上品', score: '14-17', description: '結構完整；層次清晰；詳略得宜，鋪排有序' },
        { level: '中品', score: '10-13', description: '結構大致完整；層次大致清晰；鋪排大致有序' },
        { level: '中下品', score: '6-9', description: '尚具組織；層次稍欠清晰；鋪排尚算恰當' },
        { level: '下品', score: '0-5', description: '組織散亂；層次混亂；鋪排失當' },
      ]
    },
    {
      name: 'Mechanics',
      nameChinese: '標點字體',
      weight: 10,
      description: '評估標點運用及字體書寫。',
      levels: [
        { level: '上品', score: '9-10', description: '標點準確恰當；字體端正清晰' },
        { level: '中品', score: '5-8', description: '標點大致準確；字體尚算清晰' },
        { level: '下品', score: '0-4', description: '標點錯誤頗多；字體潦草難辨' },
      ]
    }
  ],
  tips: [
    '審題要準確，避免離題（離題最多只得「下上」12分）',
    '立意要明確，提出獨特觀點',
    '選材要恰當，例證要具體',
    '結構要完整，起承轉合分明',
    '表達要流暢，避免詞不達意',
    '錯別字：0-1個可得3分加分'
  ],
  commonMistakes: [
    '離題或偏題',
    '內容空泛，欠缺具體例子',
    '結構鬆散，段落銜接不當',
    '用詞重複或不當',
    '錯別字過多'
  ]
}

export const DSE_ENGLISH_GUIDELINES: DSEGuidelines = {
  subject: 'english',
  title: 'DSE English Language Paper 2 Writing',
  paperInfo: 'Duration: 2 hours | Part A: 10% | Part B: 15% (Total 25%)',
  overview: 'Paper 2 consists of Part A (short guided writing ~200 words) and Part B (extended writing ~400 words). Assessment focuses on Content, Language, and Organisation.',
  rubrics: [
    {
      name: 'Content',
      nameChinese: '內容',
      weight: 33,
      description: 'Evaluates relevance, development of ideas, and use of supporting details.',
      levels: [
        { level: '7 (5**)', score: '7', description: 'Excellent understanding; insightful arguments; strong supporting evidence; fully addresses the task' },
        { level: '6 (5*)', score: '6', description: 'Very good understanding; well-developed arguments; relevant supporting evidence' },
        { level: '5 (5)', score: '5', description: 'Good understanding; clear arguments; adequate supporting evidence' },
        { level: '4 (4)', score: '4', description: 'Adequate understanding; reasonable arguments; some relevant support' },
        { level: '3 (3)', score: '3', description: 'Basic understanding; limited development; insufficient support' },
        { level: '2 (2)', score: '2', description: 'Limited understanding; underdeveloped ideas; little relevant content' },
        { level: '1 (1)', score: '1', description: 'Minimal understanding; very limited content; largely irrelevant' },
      ]
    },
    {
      name: 'Language',
      nameChinese: '語言',
      weight: 33,
      description: 'Evaluates vocabulary range, grammatical accuracy, sentence variety, and register.',
      levels: [
        { level: '7 (5**)', score: '7', description: 'Wide vocabulary range; complex sentence structures; accurate grammar; appropriate register and tone throughout' },
        { level: '6 (5*)', score: '6', description: 'Good vocabulary range; varied sentence structures; mostly accurate grammar; appropriate register' },
        { level: '5 (5)', score: '5', description: 'Adequate vocabulary; some sentence variety; generally accurate grammar' },
        { level: '4 (4)', score: '4', description: 'Sufficient vocabulary; simple but correct sentences; occasional errors' },
        { level: '3 (3)', score: '3', description: 'Limited vocabulary; basic sentence patterns; frequent errors' },
        { level: '2 (2)', score: '2', description: 'Restricted vocabulary; simple sentences with errors; meaning sometimes unclear' },
        { level: '1 (1)', score: '1', description: 'Very limited vocabulary; serious grammatical errors; meaning often unclear' },
      ]
    },
    {
      name: 'Organisation',
      nameChinese: '組織',
      weight: 34,
      description: 'Evaluates structure, coherence, cohesion, and paragraphing.',
      levels: [
        { level: '7 (5**)', score: '7', description: 'Extremely effective organisation; logical development; sophisticated cohesion; entirely appropriate to genre' },
        { level: '6 (5*)', score: '6', description: 'Very effective organisation; clear development; strong cohesion between paragraphs' },
        { level: '5 (5)', score: '5', description: 'Effective organisation; good development; adequate cohesion' },
        { level: '4 (4)', score: '4', description: 'Adequate organisation; reasonable development; some cohesive devices' },
        { level: '3 (3)', score: '3', description: 'Basic organisation; limited development; weak cohesion' },
        { level: '2 (2)', score: '2', description: 'Poor organisation; unclear development; little cohesion' },
        { level: '1 (1)', score: '1', description: 'Very poor organisation; no clear structure; lacks coherence' },
      ]
    }
  ],
  tips: [
    'Read the task carefully - identify purpose, audience, and format',
    'Plan your essay structure before writing',
    'Use topic sentences to begin each paragraph',
    'Include specific examples and evidence',
    'Vary your sentence structures',
    'Use appropriate connectives for cohesion',
    'Check for grammar and spelling errors',
    'Ensure appropriate register and tone for the task'
  ],
  commonMistakes: [
    'Not addressing all parts of the task',
    'Weak or missing introduction/conclusion',
    'Lack of paragraph organisation',
    'Limited vocabulary range',
    'Inappropriate register for audience',
    'Poor use of connectives',
    'Spelling and grammatical errors'
  ]
}

export function getGuidelines(subject: 'chinese' | 'english'): DSEGuidelines {
  return subject === 'chinese' ? DSE_CHINESE_GUIDELINES : DSE_ENGLISH_GUIDELINES
}
