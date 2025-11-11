import { z } from 'zod'

// =====================================================
// Plan Types
// =====================================================

export const StudentPlanSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  name: z.string().min(1, 'Plan name is required'),
  description: z.string().nullable().optional(),
  lesson_ids: z.array(z.string()).default([]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const CreatePlanSchema = StudentPlanSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const UpdatePlanSchema = CreatePlanSchema.partial().extend({
  student_id: z.string().uuid(),
})

export type StudentPlan = z.infer<typeof StudentPlanSchema>
export type CreatePlan = z.infer<typeof CreatePlanSchema>
export type UpdatePlan = z.infer<typeof UpdatePlanSchema>

// =====================================================
// Progress Types
// =====================================================

export const ImportanceSchema = z.enum(['standard', 'important', 'critical'])
export const NextActionSchema = z.enum(['Teach', 'Review', 'Reteach'])

export const StepProgressSchema = z.object({
  step_number: z.number().int().min(0),
  completed: z.boolean().default(false),
  confidence: z.number().int().min(0).max(100).default(0),
  notes: z.string().default(''),
  importance: ImportanceSchema.default('standard'),
  next_action: NextActionSchema.nullable().optional(),
})

export const SliceProgressSchema = z.object({
  slice_id: z.string(),
  steps: z.array(StepProgressSchema),
})

export const SparringProgressSchema = z.object({
  rapid_mastery_completed: z.boolean().default(false),
  rapid_mastery_notes: z.string().nullable().optional(),
  focus_sparring_completed: z.boolean().default(false),
  focus_sparring_notes: z.string().nullable().optional(),
})

export const LessonProgressSchema = z.object({
  lesson_id: z.string(),
  slices: z.array(SliceProgressSchema),
  started_at: z.string().datetime().nullable().optional(),
  completed_at: z.string().datetime().nullable().optional(),
  notes: z.string().nullable().optional(),
  sparring_progress: SparringProgressSchema.optional(),
})

export const StudentProgressSchema = z.object({
  student_id: z.string().uuid(),
  lessons: z.record(z.string(), LessonProgressSchema),
})

export type Importance = z.infer<typeof ImportanceSchema>
export type NextAction = z.infer<typeof NextActionSchema>
export type StepProgress = z.infer<typeof StepProgressSchema>
export type SliceProgress = z.infer<typeof SliceProgressSchema>
export type SparringProgress = z.infer<typeof SparringProgressSchema>
export type LessonProgress = z.infer<typeof LessonProgressSchema>
export type StudentProgress = z.infer<typeof StudentProgressSchema>

// =====================================================
// Coaching Session Types
// =====================================================

export const CoachingSessionSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  coach_id: z.string().uuid().nullable(),
  lesson_id: z.string(),
  lesson_name: z.string().nullable().optional(),
  started_at: z.string().datetime(),
  ended_at: z.string().datetime().nullable().optional(),
  duration_minutes: z.number().int().nullable().optional(),
  steps_completed: z.number().int().default(0),
  total_steps: z.number().int().default(0),
  completion_percentage: z.number().int().min(0).max(100).default(0),
  notes: z.string().nullable().optional(),
  session_data: z.any().nullable().optional(), // JSONB field
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const CreateSessionSchema = CoachingSessionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type CoachingSession = z.infer<typeof CoachingSessionSchema>
export type CreateSession = z.infer<typeof CreateSessionSchema>

// =====================================================
// Database row types (Supabase format)
// =====================================================

export interface StudentProgressRow {
  id: string
  student_id: string
  lesson_id: string
  slice_id: string
  step_number: number
  completed: boolean
  confidence: number
  importance: Importance
  next_action: NextAction | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface LessonMetadataRow {
  id: string
  student_id: string
  lesson_id: string
  started_at: string | null
  completed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// =====================================================
// Helper functions
// =====================================================

/**
 * Convert database rows to LessonProgress object
 */
export function rowsToLessonProgress(
  progressRows: StudentProgressRow[],
  metadata?: LessonMetadataRow
): LessonProgress {
  const sliceMap = new Map<string, StepProgress[]>()

  progressRows.forEach(row => {
    if (!sliceMap.has(row.slice_id)) {
      sliceMap.set(row.slice_id, [])
    }
    sliceMap.get(row.slice_id)!.push({
      step_number: row.step_number,
      completed: row.completed,
      confidence: row.confidence,
      notes: row.notes || '',
      importance: row.importance,
      next_action: row.next_action || undefined,
    })
  })

  const slices: SliceProgress[] = Array.from(sliceMap.entries()).map(([slice_id, steps]) => ({
    slice_id,
    steps: steps.sort((a, b) => a.step_number - b.step_number),
  }))

  return {
    lesson_id: progressRows[0]?.lesson_id || '',
    slices,
    started_at: metadata?.started_at || undefined,
    completed_at: metadata?.completed_at || undefined,
    notes: metadata?.notes || undefined,
  }
}

/**
 * Calculate overall lesson completion percentage
 */
export function calculateLessonCompletion(progress: LessonProgress): number {
  const allSteps = progress.slices.flatMap(s => s.steps)
  if (allSteps.length === 0) return 0

  const completedSteps = allSteps.filter(s => s.completed).length
  return Math.round((completedSteps / allSteps.length) * 100)
}

/**
 * Calculate average confidence for a lesson
 */
export function calculateAverageConfidence(progress: LessonProgress): number {
  const allSteps = progress.slices.flatMap(s => s.steps)
  if (allSteps.length === 0) return 0

  const totalConfidence = allSteps.reduce((sum, step) => sum + step.confidence, 0)
  return Math.round(totalConfidence / allSteps.length)
}
