import { z } from 'zod'

// =====================================================
// Curriculum Core Types
// =====================================================

export const StepSchema = z.object({
  instruction: z.string(),
  keyPoint: z.string().optional(),
})

export const SliceSchema = z.object({
  id: z.string(),
  slice_number: z.number().int(),
  title: z.string(),
  essential_detail: z.string().optional(),
  most_common_mistake: z.string().optional(),
  safety_tip: z.string().optional(),
  core_principles: z.array(z.string()).optional(),
  steps: z.array(StepSchema).optional(),
  is_bonus_slice: z.boolean().optional(),
})

export const LessonSchema = z.object({
  id: z.string(),
  lesson_number: z.number().int(),
  technique: z.string(),
  position: z.string(),
  overview: z.string().optional(),
  mindset_minute: z.string().optional(),
  street_tip: z.string().optional(),
  chapter_id: z.string().optional(),
  slices: z.array(SliceSchema),
})

export const CurriculumSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  total_lessons: z.number().int(),
  lessons: z.array(LessonSchema),
})

export type Step = z.infer<typeof StepSchema>
export type Slice = z.infer<typeof SliceSchema>
export type Lesson = z.infer<typeof LessonSchema>
export type Curriculum = z.infer<typeof CurriculumSchema>

// =====================================================
// Chapter Types (for BBS1 and other curricula)
// =====================================================

export const ChapterSchema = z.object({
  id: z.string(),
  chapter_number: z.number().int(),
  title: z.string(),
  description: z.string(),
  lesson_count: z.number().int(),
})

export type Chapter = z.infer<typeof ChapterSchema>

// =====================================================
// Position Types
// =====================================================

export const PositionType = z.enum([
  'Mount',
  'Guard',
  'Side Mount',
  'Back',
  'Standing',
  'Turtle',
  'Half Guard',
  'Mixed',
])

export type Position = z.infer<typeof PositionType>

// =====================================================
// Principle Types
// =====================================================

export const PrincipleSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string().optional(),
})

export type Principle = z.infer<typeof PrincipleSchema>

// =====================================================
// UI Helper Types
// =====================================================

export interface LessonSummary {
  id: string
  lesson_number: number
  technique: string
  position: string
  slice_count: number
  total_steps: number
  principles: string[]
}

export interface CurriculumSummary {
  id: string
  name: string
  description: string
  total_lessons: number
  positions: Position[]
  total_slices: number
  total_steps: number
}

export interface LessonFilter {
  curriculum_id?: string
  position?: Position
  search_term?: string
  chapter_id?: string
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Get lesson summary stats
 */
export function getLessonSummary(lesson: Lesson): LessonSummary {
  const principles = new Set<string>()
  let totalSteps = 0

  lesson.slices.forEach(slice => {
    slice.core_principles?.forEach(p => principles.add(p))
    totalSteps += slice.steps?.length || 0
  })

  return {
    id: lesson.id,
    lesson_number: lesson.lesson_number,
    technique: lesson.technique,
    position: lesson.position,
    slice_count: lesson.slices.length,
    total_steps: totalSteps,
    principles: Array.from(principles),
  }
}

/**
 * Get curriculum summary stats
 */
export function getCurriculumSummary(curriculum: Curriculum): CurriculumSummary {
  const positions = new Set<Position>()
  let totalSlices = 0
  let totalSteps = 0

  curriculum.lessons.forEach(lesson => {
    if (PositionType.safeParse(lesson.position).success) {
      positions.add(lesson.position as Position)
    }
    totalSlices += lesson.slices.length
    lesson.slices.forEach(slice => {
      totalSteps += slice.steps?.length || 0
    })
  })

  return {
    id: curriculum.id,
    name: curriculum.name,
    description: curriculum.description,
    total_lessons: curriculum.total_lessons,
    positions: Array.from(positions),
    total_slices: totalSlices,
    total_steps: totalSteps,
  }
}

/**
 * Find lesson by ID across all curricula
 */
export function findLessonById(
  curricula: Curriculum[],
  lessonId: string
): Lesson | undefined {
  for (const curriculum of curricula) {
    const lesson = curriculum.lessons.find(l => l.id === lessonId)
    if (lesson) return lesson
  }
  return undefined
}

/**
 * Find slice by ID across all curricula
 */
export function findSliceById(
  curricula: Curriculum[],
  sliceId: string
): { lesson: Lesson; slice: Slice } | undefined {
  for (const curriculum of curricula) {
    for (const lesson of curriculum.lessons) {
      const slice = lesson.slices.find(s => s.id === sliceId)
      if (slice) return { lesson, slice }
    }
  }
  return undefined
}

/**
 * Filter lessons by criteria
 */
export function filterLessons(
  lessons: Lesson[],
  filter: LessonFilter
): Lesson[] {
  return lessons.filter(lesson => {
    if (filter.position && lesson.position !== filter.position) {
      return false
    }
    if (filter.search_term) {
      const term = filter.search_term.toLowerCase()
      return (
        lesson.technique.toLowerCase().includes(term) ||
        lesson.position.toLowerCase().includes(term) ||
        lesson.id.toLowerCase().includes(term)
      )
    }
    if (filter.chapter_id && lesson.chapter_id !== filter.chapter_id) {
      return false
    }
    return true
  })
}
