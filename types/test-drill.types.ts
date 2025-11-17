import { z } from 'zod'

// =====================================================
// Test Drill Types
// =====================================================

export const TestDrillItemSchema = z.object({
  ids: z.array(z.string()),
  lesson_number: z.number().int(),
  slice_title: z.string(),
  combination: z.string().optional(),
})

export const SprintGroupSchema = z.object({
  group_number: z.number().int(),
  group_title: z.string(),
  techniques: z.array(TestDrillItemSchema),
  estimated_time_minutes: z.number(),
  rest_time_minutes: z.number(),
  is_completed: z.boolean().optional(),
  notes: z.string().optional(),
  completed_at: z.string().datetime().optional(),
})

export const SprintProgressSchema = z.object({
  group_number: z.number().int(),
  is_completed: z.boolean(),
  completed_at: z.string().datetime().optional(),
  notes: z.string().optional(),
  time_spent: z.number().optional(), // seconds
  quality_rating: z.number().min(0).max(100).optional(),
})

export const TestDrillSchema = z.object({
  drill_number: z.number().int().min(1).max(5),
  title: z.string(),
  time_limit_minutes: z.number(),
  description: z.string(),
  items: z.array(TestDrillItemSchema).optional(),
  is_freestyle: z.boolean().optional(),
  special_requirements: z.string().optional(),
})

export const EnhancedTestDrillSchema = TestDrillSchema.extend({
  sprint_groups: z.array(SprintGroupSchema),
})

export type TestDrillItem = z.infer<typeof TestDrillItemSchema>
export type SprintGroup = z.infer<typeof SprintGroupSchema>
export type SprintProgress = z.infer<typeof SprintProgressSchema>
export type TestDrill = z.infer<typeof TestDrillSchema>
export type EnhancedTestDrill = z.infer<typeof EnhancedTestDrillSchema>

// =====================================================
// Test Drill Progress Types
// =====================================================

export const DeductionSchema = z.object({
  reason: z.string(),
  points: z.number(),
  slice_reference: z.object({
    lesson_number: z.number().int(),
    slice_title: z.string(),
  }).optional(),
  sprint_reference: z.object({
    group_number: z.number().int(),
    group_title: z.string(),
  }).optional(),
  timestamp: z.string().datetime(),
})

export const TestedSliceSchema = z.object({
  lesson_number: z.number().int(),
  slice_title: z.string(),
  tested: z.boolean(),
  has_deductions: z.boolean(),
  notes: z.string().optional(),
})

export const TestedSprintSchema = z.object({
  group_number: z.number().int(),
  group_title: z.string(),
  tested: z.boolean(),
  has_deductions: z.boolean(),
})

export const TestDrillProgressSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  curriculum_id: z.string(),
  drill_number: z.number().int().min(1).max(5),
  score: z.number().int().min(0).max(100).nullable().optional(),
  passed: z.boolean().nullable().optional(),
  total_time_seconds: z.number().int().nullable().optional(),
  tested_slices: z.any().nullable().optional(), // JSONB
  score_deductions: z.any().nullable().optional(), // JSONB
  override_reason: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const TestDrillAttemptSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  curriculum_id: z.string(),
  drill_number: z.number().int().min(1).max(5),
  score: z.number().int().min(0).max(100),
  passed: z.boolean(),
  total_time_seconds: z.number().int(),
  tested_slices: z.any().nullable().optional(), // JSONB
  score_deductions: z.any().nullable().optional(), // JSONB
  tested_at: z.string().datetime(),
  created_at: z.string().datetime(),
})

export const CreateAttemptSchema = TestDrillAttemptSchema.omit({
  id: true,
  created_at: true,
})

export type Deduction = z.infer<typeof DeductionSchema>
export type TestedSlice = z.infer<typeof TestedSliceSchema>
export type TestedSprint = z.infer<typeof TestedSprintSchema>
export type TestDrillProgress = z.infer<typeof TestDrillProgressSchema>
export type TestDrillAttempt = z.infer<typeof TestDrillAttemptSchema>
export type CreateAttempt = z.infer<typeof CreateAttemptSchema>

// =====================================================
// UI Helper Types
// =====================================================

export interface TestDrillReadiness {
  drill_number: number
  is_ready: boolean
  missing_lessons: string[]
  completion_percentage: number
}

export interface TestDrillSummary {
  total_drills: number
  ready_drills: number
  completed_drills: number
  average_score?: number
  last_attempt_date?: string
}

// =====================================================
// Legacy Types (for backward compatibility)
// =====================================================

export interface LegacyTestDrillProgress {
  drillNumber: number
  startedAt?: string
  completedAt?: string
  totalTime?: number
  score?: number
  passed?: boolean
  items?: any[]
  sprintProgress?: any[]
  freestyleProgress?: any
  notes?: string
  testedSlices?: any[]
  testedSprints?: any[]
  scoreDeductions?: any[]
}

// Helper function to convert legacy to new format
export function fromLegacyTestDrillProgress(
  legacy: LegacyTestDrillProgress,
  studentId: string,
  curriculumId: string
): Partial<TestDrillProgress> {
  return {
    student_id: studentId,
    curriculum_id: curriculumId,
    drill_number: legacy.drillNumber,
    score: legacy.score || null,
    passed: legacy.passed || null,
    total_time_seconds: legacy.totalTime || null,
    tested_slices: legacy.testedSlices || null,
    score_deductions: legacy.scoreDeductions || null,
  }
}
