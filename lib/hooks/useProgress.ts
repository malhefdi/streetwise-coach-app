'use client'

import { useState, useEffect } from 'react'
import { ProgressService } from '@/lib/services'
import type { StudentProgress, LessonProgress } from '@/types'

export function useStudentProgress(studentId: string) {
  const [progress, setProgress] = useState<StudentProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProgress = async () => {
    try {
      setLoading(true)
      const data = await ProgressService.getStudentProgress(studentId)
      setProgress(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (studentId) {
      fetchProgress()
    }
  }, [studentId])

  return {
    progress,
    loading,
    error,
    refetch: fetchProgress,
  }
}

export function useLessonProgress(studentId: string, lessonId: string) {
  const [progress, setProgress] = useState<LessonProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProgress = async () => {
    try {
      setLoading(true)
      const data = await ProgressService.getLessonProgress(studentId, lessonId)
      setProgress(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (studentId && lessonId) {
      fetchProgress()
    }
  }, [studentId, lessonId])

  return {
    progress,
    loading,
    error,
    refetch: fetchProgress,
  }
}
