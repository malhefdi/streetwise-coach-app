import { createClient } from '@/lib/supabase/client'
import type { Student, CreateStudent, UpdateStudent } from '@/types'

export class StudentsService {
  /**
   * Get all students for the current coach
   */
  static async getStudents(): Promise<Student[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Get a single student by ID
   */
  static async getStudent(id: string): Promise<Student> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Create a new student
   */
  static async createStudent(student: CreateStudent): Promise<Student> {
    const supabase = createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('students')
      .insert({
        ...student,
        coach_id: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update a student
   */
  static async updateStudent(id: string, updates: UpdateStudent): Promise<Student> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete a student
   */
  static async deleteStudent(id: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Get student with summary stats (uses view)
   */
  static async getStudentSummary(id: string) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('student_summary')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get all students with summary stats
   */
  static async getStudentsSummary() {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('student_summary')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Search students by name
   */
  static async searchStudents(query: string): Promise<Student[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name')

    if (error) throw error
    return data || []
  }

  /**
   * Get students by rank
   */
  static async getStudentsByRank(rank: string): Promise<Student[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('rank', rank)
      .order('name')

    if (error) throw error
    return data || []
  }
}
