'use client'

import { useState, useEffect } from 'react'
import { StudentsService } from '@/lib/services'
import type { Student } from '@/types'

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const data = await StudentsService.getStudents()
      setStudents(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  return {
    students,
    loading,
    error,
    refetch: fetchStudents,
  }
}

export function useStudent(id: string) {
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchStudent = async () => {
    try {
      setLoading(true)
      const data = await StudentsService.getStudent(id)
      setStudent(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchStudent()
    }
  }, [id])

  return {
    student,
    loading,
    error,
    refetch: fetchStudent,
  }
}
