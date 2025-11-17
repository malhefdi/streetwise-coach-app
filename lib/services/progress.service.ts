import { createClient } from '@/lib/supabase/client'
import type {
  StudentProgress,
  LessonProgress,
  StepProgress,
  SliceProgress,
  rowsToLessonProgress,
} from '@/types'

export class ProgressService {
  /**
   * Get all progress for a student
   */
  static async getStudentProgress(studentId: string): Promise<StudentProgress> {
    const supabase = createClient()

    // Get all step progress
    const { data: progressData, error: progressError } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', studentId)

    if (progressError) throw progressError

    // Get all lesson metadata
    const { data: metadataData, error: metadataError } = await supabase
      .from('lesson_metadata')
      .select('*')
      .eq('student_id', studentId)

    if (metadataError) throw metadataError

    // Group by lesson
    const lessonMap = new Map<string, any[]>()
    progressData?.forEach(row => {
      if (!lessonMap.has(row.lesson_id)) {
        lessonMap.set(row.lesson_id, [])
      }
      lessonMap.get(row.lesson_id)!.push(row)
    })

    // Convert to LessonProgress format
    const lessons: Record<string, LessonProgress> = {}
    lessonMap.forEach((rows, lessonId) => {
      const metadata = metadataData?.find(m => m.lesson_id === lessonId)
      lessons[lessonId] = rowsToLessonProgress(rows, metadata)
    })

    return {
      student_id: studentId,
      lessons,
    }
  }

  /**
   * Get progress for a specific lesson
   */
  static async getLessonProgress(
    studentId: string,
    lessonId: string
  ): Promise<LessonProgress | null> {
    const supabase = createClient()

    // Get step progress
    const { data: progressData, error: progressError } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', studentId)
      .eq('lesson_id', lessonId)

    if (progressError) throw progressError
    if (!progressData || progressData.length === 0) return null

    // Get lesson metadata
    const { data: metadata, error: metadataError } = await supabase
      .from('lesson_metadata')
      .select('*')
      .eq('student_id', studentId)
      .eq('lesson_id', lessonId)
      .maybeSingle()

    if (metadataError) throw metadataError

    return rowsToLessonProgress(progressData, metadata)
  }

  /**
   * Update progress for a specific step
   */
  static async updateStepProgress(
    studentId: string,
    lessonId: string,
    sliceId: string,
    stepNumber: number,
    progress: Partial<StepProgress>
  ): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from('student_progress')
      .upsert({
        student_id: studentId,
        lesson_id: lessonId,
        slice_id: sliceId,
        step_number: stepNumber,
        completed: progress.completed ?? false,
        confidence: progress.confidence ?? 0,
        notes: progress.notes ?? '',
        importance: progress.importance ?? 'standard',
        next_action: progress.next_action ?? null,
      })

    if (error) throw error
  }

  /**
   * Update progress for an entire slice
   */
  static async updateSliceProgress(
    studentId: string,
    lessonId: string,
    sliceId: string,
    steps: StepProgress[]
  ): Promise<void> {
    const supabase = createClient()

    const rows = steps.map(step => ({
      student_id: studentId,
      lesson_id: lessonId,
      slice_id: sliceId,
      step_number: step.step_number,
      completed: step.completed,
      confidence: step.confidence,
      notes: step.notes || '',
      importance: step.importance,
      next_action: step.next_action ?? null,
    }))

    const { error } = await supabase
      .from('student_progress')
      .upsert(rows)

    if (error) throw error
  }

  /**
   * Update lesson metadata (started, completed, notes)
   */
  static async updateLessonMetadata(
    studentId: string,
    lessonId: string,
    metadata: {
      started_at?: string | null
      completed_at?: string | null
      notes?: string | null
    }
  ): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from('lesson_metadata')
      .upsert({
        student_id: studentId,
        lesson_id: lessonId,
        ...metadata,
      })

    if (error) throw error
  }

  /**
   * Mark lesson as started
   */
  static async markLessonStarted(studentId: string, lessonId: string): Promise<void> {
    await this.updateLessonMetadata(studentId, lessonId, {
      started_at: new Date().toISOString(),
    })
  }

  /**
   * Mark lesson as completed
   */
  static async markLessonCompleted(studentId: string, lessonId: string): Promise<void> {
    await this.updateLessonMetadata(studentId, lessonId, {
      completed_at: new Date().toISOString(),
    })
  }

  /**
   * Reset lesson progress
   */
  static async resetLesson(studentId: string, lessonId: string): Promise<void> {
    const supabase = createClient()

    // Delete all step progress
    const { error: progressError } = await supabase
      .from('student_progress')
      .delete()
      .eq('student_id', studentId)
      .eq('lesson_id', lessonId)

    if (progressError) throw progressError

    // Delete lesson metadata
    const { error: metadataError } = await supabase
      .from('lesson_metadata')
      .delete()
      .eq('student_id', studentId)
      .eq('lesson_id', lessonId)

    if (metadataError) throw metadataError
  }

  /**
   * Get lesson progress summary view
   */
  static async getLessonProgressSummary(studentId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('lesson_progress_summary')
      .select('*')
      .eq('student_id', studentId)

    if (error) throw error
    return data || []
  }
}
