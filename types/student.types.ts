import { z } from 'zod'

// =====================================================
// Student Types
// =====================================================

export const StudentSchema = z.object({
  id: z.string().uuid(),
  coach_id: z.string().uuid().nullable(),
  name: z.string().min(1, 'Name is required'),
  rank: z.string().default('white'),
  avatar: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  session_count: z.number().int().default(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const CreateStudentSchema = StudentSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  session_count: true,
}).extend({
  coach_id: z.string().uuid().optional(),
})

export const UpdateStudentSchema = CreateStudentSchema.partial()

export type Student = z.infer<typeof StudentSchema>
export type CreateStudent = z.infer<typeof CreateStudentSchema>
export type UpdateStudent = z.infer<typeof UpdateStudentSchema>

// Feedback types
export const FeedbackTypeSchema = z.enum(['strength', 'improvement', 'note'])

export const StudentFeedbackSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  coach_id: z.string().uuid().nullable(),
  feedback_type: FeedbackTypeSchema,
  content: z.string().min(1),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type FeedbackType = z.infer<typeof FeedbackTypeSchema>
export type StudentFeedback = z.infer<typeof StudentFeedbackSchema>

// Legacy type for backward compatibility
export interface LegacyStudent {
  id: string
  name: string
  rank: string
  sessions: number
  notes?: string
  avatar?: string
  planId?: string
  createdAt: string
  updatedAt: string
  progress?: Record<string, number>
  feedback?: { date: string; message: string; tag?: string }[]
}

// Helper function to convert between formats
export function toLegacyStudent(student: Student): LegacyStudent {
  return {
    id: student.id,
    name: student.name,
    rank: student.rank,
    sessions: student.session_count,
    notes: student.notes || undefined,
    avatar: student.avatar || undefined,
    createdAt: student.created_at,
    updatedAt: student.updated_at,
  }
}

export function fromLegacyStudent(legacy: LegacyStudent, coachId: string): CreateStudent {
  return {
    coach_id: coachId,
    name: legacy.name,
    rank: legacy.rank,
    notes: legacy.notes || null,
    avatar: legacy.avatar || null,
  }
}
