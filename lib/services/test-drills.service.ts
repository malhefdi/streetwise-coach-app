import { createClient } from '@/lib/supabase/client'
import type {
  TestDrillProgress,
  TestDrillAttempt,
  CreateAttempt,
} from '@/types'

export class TestDrillsService {
  /**
   * Get test drill progress for a student
   */
  static async getTestDrillProgress(
    studentId: string,
    curriculumId: string
  ): Promise<Record<number, TestDrillProgress>> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('test_drill_progress')
      .select('*')
      .eq('student_id', studentId)
      .eq('curriculum_id', curriculumId)

    if (error) throw error

    // Convert array to record indexed by drill_number
    const progressMap: Record<number, TestDrillProgress> = {}
    data?.forEach(drill => {
      progressMap[drill.drill_number] = drill
    })

    return progressMap
  }

  /**
   * Get progress for a specific drill
   */
  static async getDrillProgress(
    studentId: string,
    curriculumId: string,
    drillNumber: number
  ): Promise<TestDrillProgress | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('test_drill_progress')
      .select('*')
      .eq('student_id', studentId)
      .eq('curriculum_id', curriculumId)
      .eq('drill_number', drillNumber)
      .maybeSingle()

    if (error) throw error
    return data
  }

  /**
   * Update test drill progress
   */
  static async updateDrillProgress(
    studentId: string,
    curriculumId: string,
    drillNumber: number,
    progress: Partial<TestDrillProgress>
  ): Promise<TestDrillProgress> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('test_drill_progress')
      .upsert({
        student_id: studentId,
        curriculum_id: curriculumId,
        drill_number: drillNumber,
        ...progress,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Record a test drill attempt
   */
  static async recordAttempt(attempt: CreateAttempt): Promise<TestDrillAttempt> {
    const supabase = createClient()

    // Insert into attempts table
    const { data: attemptData, error: attemptError } = await supabase
      .from('test_drill_attempts')
      .insert({
        ...attempt,
        tested_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (attemptError) throw attemptError

    // Update progress table with latest attempt
    await this.updateDrillProgress(
      attempt.student_id,
      attempt.curriculum_id,
      attempt.drill_number,
      {
        score: attempt.score,
        passed: attempt.passed,
        total_time_seconds: attempt.total_time_seconds,
        tested_slices: attempt.tested_slices,
        score_deductions: attempt.score_deductions,
      }
    )

    return attemptData
  }

  /**
   * Get all attempts for a drill
   */
  static async getDrillAttempts(
    studentId: string,
    curriculumId: string,
    drillNumber: number
  ): Promise<TestDrillAttempt[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('test_drill_attempts')
      .select('*')
      .eq('student_id', studentId)
      .eq('curriculum_id', curriculumId)
      .eq('drill_number', drillNumber)
      .order('tested_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Get all attempts for a student
   */
  static async getAllAttempts(
    studentId: string,
    curriculumId: string
  ): Promise<TestDrillAttempt[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('test_drill_attempts')
      .select('*')
      .eq('student_id', studentId)
      .eq('curriculum_id', curriculumId)
      .order('tested_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Save a test override (bypass test requirements)
   */
  static async saveTestOverride(
    studentId: string,
    curriculumId: string,
    drillNumber: number,
    reason: string
  ): Promise<TestDrillProgress> {
    return this.updateDrillProgress(studentId, curriculumId, drillNumber, {
      override_reason: reason,
      passed: true,
      score: 100,
    })
  }

  /**
   * Reset test drill progress
   */
  static async resetDrillProgress(
    studentId: string,
    curriculumId: string,
    drillNumber: number
  ): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from('test_drill_progress')
      .delete()
      .eq('student_id', studentId)
      .eq('curriculum_id', curriculumId)
      .eq('drill_number', drillNumber)

    if (error) throw error
  }

  /**
   * Get test drill statistics for a student
   */
  static async getTestDrillStats(studentId: string, curriculumId: string) {
    const progress = await this.getTestDrillProgress(studentId, curriculumId)
    const attempts = await this.getAllAttempts(studentId, curriculumId)

    const totalDrills = 5 // GC2 has 5 drills
    const completedDrills = Object.values(progress).filter(d => d.passed).length
    const averageScore = attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
      : undefined

    const lastAttempt = attempts[0]

    return {
      total_drills: totalDrills,
      completed_drills: completedDrills,
      total_attempts: attempts.length,
      average_score: averageScore,
      last_attempt_date: lastAttempt ? lastAttempt.tested_at : undefined,
      completion_percentage: Math.round((completedDrills / totalDrills) * 100),
    }
  }
}
