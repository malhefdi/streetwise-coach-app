import { createClient } from '@/lib/supabase/client'
import type { StudentPlan, CreatePlan, UpdatePlan } from '@/types'

export class PlansService {
  /**
   * Get a student's lesson plan
   */
  static async getStudentPlan(studentId: string): Promise<StudentPlan | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('lesson_plans')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle()

    if (error) throw error
    return data
  }

  /**
   * Create a new lesson plan for a student
   */
  static async createPlan(plan: CreatePlan): Promise<StudentPlan> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('lesson_plans')
      .insert(plan)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update a student's lesson plan
   */
  static async updatePlan(studentId: string, updates: UpdatePlan): Promise<StudentPlan> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('lesson_plans')
      .update(updates)
      .eq('student_id', studentId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete a student's lesson plan
   */
  static async deletePlan(studentId: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from('lesson_plans')
      .delete()
      .eq('student_id', studentId)

    if (error) throw error
  }

  /**
   * Add lessons to a student's plan
   */
  static async addLessons(studentId: string, lessonIds: string[]): Promise<StudentPlan> {
    const supabase = createClient()

    // Get current plan
    const plan = await this.getStudentPlan(studentId)

    if (!plan) {
      throw new Error('Student has no lesson plan')
    }

    // Merge lesson IDs (avoid duplicates)
    const currentLessons = plan.lesson_ids || []
    const newLessons = lessonIds.filter(id => !currentLessons.includes(id))
    const updatedLessons = [...currentLessons, ...newLessons]

    return this.updatePlan(studentId, {
      student_id: studentId,
      lesson_ids: updatedLessons,
    })
  }

  /**
   * Remove lessons from a student's plan
   */
  static async removeLessons(studentId: string, lessonIds: string[]): Promise<StudentPlan> {
    const supabase = createClient()

    // Get current plan
    const plan = await this.getStudentPlan(studentId)

    if (!plan) {
      throw new Error('Student has no lesson plan')
    }

    // Remove lesson IDs
    const updatedLessons = (plan.lesson_ids || []).filter(
      id => !lessonIds.includes(id)
    )

    return this.updatePlan(studentId, {
      student_id: studentId,
      lesson_ids: updatedLessons,
    })
  }

  /**
   * Reorder lessons in a student's plan
   */
  static async reorderLessons(studentId: string, lessonIds: string[]): Promise<StudentPlan> {
    return this.updatePlan(studentId, {
      student_id: studentId,
      lesson_ids: lessonIds,
    })
  }
}
