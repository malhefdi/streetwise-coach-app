import { createClient } from '@/lib/supabase/client'
import type { CoachingSession, CreateSession } from '@/types'

export class SessionsService {
  /**
   * Get all sessions for a student
   */
  static async getStudentSessions(studentId: string): Promise<CoachingSession[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('coaching_sessions')
      .select('*')
      .eq('student_id', studentId)
      .order('started_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Get all sessions for the current coach
   */
  static async getAllSessions(): Promise<CoachingSession[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('coaching_sessions')
      .select('*, students(*)')
      .order('started_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Get a single session by ID
   */
  static async getSession(id: string): Promise<CoachingSession> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('coaching_sessions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Create a new coaching session
   */
  static async createSession(session: CreateSession): Promise<CoachingSession> {
    const supabase = createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('coaching_sessions')
      .insert({
        ...session,
        coach_id: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update a coaching session
   */
  static async updateSession(
    id: string,
    updates: Partial<CreateSession>
  ): Promise<CoachingSession> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('coaching_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * End a coaching session
   */
  static async endSession(id: string): Promise<CoachingSession> {
    const session = await this.getSession(id)

    const endedAt = new Date()
    const startedAt = new Date(session.started_at)
    const durationMinutes = Math.round((endedAt.getTime() - startedAt.getTime()) / 60000)

    return this.updateSession(id, {
      ended_at: endedAt.toISOString(),
      duration_minutes: durationMinutes,
    })
  }

  /**
   * Delete a coaching session
   */
  static async deleteSession(id: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from('coaching_sessions')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Get recent sessions (last N sessions)
   */
  static async getRecentSessions(limit: number = 10): Promise<CoachingSession[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('coaching_sessions')
      .select('*, students(*)')
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  /**
   * Get sessions for a specific lesson
   */
  static async getSessionsByLesson(lessonId: string): Promise<CoachingSession[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('coaching_sessions')
      .select('*, students(*)')
      .eq('lesson_id', lessonId)
      .order('started_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Get sessions within a date range
   */
  static async getSessionsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<CoachingSession[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('coaching_sessions')
      .select('*, students(*)')
      .gte('started_at', startDate)
      .lte('started_at', endDate)
      .order('started_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Get session statistics for a student
   */
  static async getStudentStats(studentId: string) {
    const sessions = await this.getStudentSessions(studentId)

    const totalSessions = sessions.length
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
    const avgCompletion = sessions.length > 0
      ? Math.round(
          sessions.reduce((sum, s) => sum + s.completion_percentage, 0) / sessions.length
        )
      : 0

    const lastSession = sessions[0]

    return {
      total_sessions: totalSessions,
      total_minutes: totalMinutes,
      avg_completion: avgCompletion,
      last_session: lastSession ? new Date(lastSession.started_at) : null,
    }
  }
}
