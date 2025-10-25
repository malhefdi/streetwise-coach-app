// Data service abstraction layer for localStorage (Supabase-ready)
import type { Student } from '@/app/types/student.types';
import type { StudentPlan, StudentProgress, LessonProgress, CoachingSession } from '@/app/types/plan.types';
import type { StudentTestDrillProgress, TestDrillAttempt } from '@/app/types/test-drill.types';

// Service interface for all data operations
export interface IDataService {
  // Students
  getStudents(): Promise<Student[]>;
  getStudent(id: string): Promise<Student | null>;
  createStudent(student: Omit<Student, 'id'>): Promise<Student>;
  updateStudent(id: string, updates: Partial<Student>): Promise<Student>;
  deleteStudent(id: string): Promise<void>;
  
  // Plans
  getStudentPlan(studentId: string): Promise<StudentPlan | null>;
  savePlan(studentId: string, plan: StudentPlan): Promise<void>;
  deletePlan(studentId: string): Promise<void>;
  
  // Sessions
  getStudentSessions(studentId: string): Promise<CoachingSession[]>;
  getAllSessions(): Promise<CoachingSession[]>;
  saveSession(studentId: string, session: CoachingSession): Promise<void>;
  
  // Progress
  getStudentProgress(studentId: string): Promise<StudentProgress>;
  updateProgress(studentId: string, lessonId: string, progress: LessonProgress): Promise<void>;
  
  // Test Drills
  getTestDrillProgress(studentId: string): Promise<StudentTestDrillProgress>;
  saveTestDrillProgress(studentId: string, progress: StudentTestDrillProgress): Promise<void>;
  recordTestDrillAttempt(studentId: string, attempt: TestDrillAttempt): Promise<void>;
  getTestDrillHistory(studentId: string): Promise<TestDrillAttempt[]>;
  
  // Lesson Management
  updateStudentLesson(studentId: string, lessonId: string, updates: any): Promise<void>;
  getStudentCustomLessons(studentId: string): Promise<Record<string, any>>;
  resetStudentLesson(studentId: string, lessonId: string): Promise<void>;
  
  // Always-available students persistence
  markStudentPersistent(studentId: string): Promise<void>;
  getPersistentStudents(): Promise<string[]>;
}

// LocalStorage implementation
class LocalStorageDataService implements IDataService {
  private readonly KEYS = {
    STUDENTS: 'sw_students',
    PLANS: 'sw_plans',
    PROGRESS: (studentId: string) => `sw_progress_${studentId}`,
    SESSIONS: (studentId: string) => `sw_sessions_${studentId}`,
    ALL_SESSIONS: 'sw_all_sessions',
    TEST_DRILL_PROGRESS: (studentId: string) => `sw_test_drill_progress_${studentId}`,
    TEST_DRILL_ATTEMPTS: (studentId: string) => `sw_test_drill_attempts_${studentId}`,
    CUSTOM_LESSONS: (studentId: string) => `sw_custom_lessons_${studentId}`,
    PERSISTENT_STUDENTS: 'sw_persistent_students'
  };

  // Helper methods
  private readJSON<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  private writeJSON(key: string, data: any): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('LocalStorage write error:', error);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Students
  async getStudents(): Promise<Student[]> {
    return this.readJSON<Student[]>(this.KEYS.STUDENTS, []);
  }

  async getStudent(id: string): Promise<Student | null> {
    const students = await this.getStudents();
    return students.find(s => s.id === id) || null;
  }

  async createStudent(student: Omit<Student, 'id'>): Promise<Student> {
    const students = await this.getStudents();
    const newStudent: Student = {
      ...student,
      id: this.generateId(),
      createdAt: student.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    students.push(newStudent);
    this.writeJSON(this.KEYS.STUDENTS, students);
    
    // Auto-mark as persistent
    await this.markStudentPersistent(newStudent.id);
    
    return newStudent;
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
    const students = await this.getStudents();
    const index = students.findIndex(s => s.id === id);
    if (index === -1) throw new Error(`Student ${id} not found`);
    
    students[index] = {
      ...students[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.writeJSON(this.KEYS.STUDENTS, students);
    return students[index];
  }

  async deleteStudent(id: string): Promise<void> {
    const students = await this.getStudents();
    const filtered = students.filter(s => s.id !== id);
    this.writeJSON(this.KEYS.STUDENTS, filtered);
    
    // Clean up related data
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.KEYS.PROGRESS(id));
      localStorage.removeItem(this.KEYS.SESSIONS(id));
      localStorage.removeItem(this.KEYS.TEST_DRILL_PROGRESS(id));
      localStorage.removeItem(this.KEYS.TEST_DRILL_ATTEMPTS(id));
    }
  }

  // Plans
  async getStudentPlan(studentId: string): Promise<StudentPlan | null> {
    const plans = this.readJSON<Record<string, StudentPlan>>(this.KEYS.PLANS, {});
    return plans[studentId] || null;
  }

  async savePlan(studentId: string, plan: StudentPlan): Promise<void> {
    const plans = this.readJSON<Record<string, StudentPlan>>(this.KEYS.PLANS, {});
    plans[studentId] = plan;
    this.writeJSON(this.KEYS.PLANS, plans);
    
    // Update student's planId reference
    await this.updateStudent(studentId, { planId: plan.id });
  }

  async deletePlan(studentId: string): Promise<void> {
    const plans = this.readJSON<Record<string, StudentPlan>>(this.KEYS.PLANS, {});
    delete plans[studentId];
    this.writeJSON(this.KEYS.PLANS, plans);
    
    // Remove planId reference from student
    await this.updateStudent(studentId, { planId: undefined });
  }

  // Sessions
  async getStudentSessions(studentId: string): Promise<CoachingSession[]> {
    return this.readJSON<CoachingSession[]>(this.KEYS.SESSIONS(studentId), []);
  }

  async getAllSessions(): Promise<CoachingSession[]> {
    const allSessions: CoachingSession[] = [];
    const students = await this.getStudents();
    
    for (const student of students) {
      const sessions = await this.getStudentSessions(student.id);
      allSessions.push(...sessions);
    }
    
    return allSessions;
  }

  async saveSession(studentId: string, session: CoachingSession): Promise<void> {
    const sessions = await this.getStudentSessions(studentId);
    const index = sessions.findIndex(s => s.id === session.id);
    
    if (index !== -1) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }
    
    this.writeJSON(this.KEYS.SESSIONS(studentId), sessions);
  }

  // Progress
  async getStudentProgress(studentId: string): Promise<StudentProgress> {
    return this.readJSON<StudentProgress>(
      this.KEYS.PROGRESS(studentId),
      { studentId, lessons: {} }
    );
  }

  async updateProgress(studentId: string, lessonId: string, progress: LessonProgress): Promise<void> {
    const studentProgress = await this.getStudentProgress(studentId);
    studentProgress.lessons[lessonId] = progress;
    this.writeJSON(this.KEYS.PROGRESS(studentId), studentProgress);
  }

  // Test Drills
  async getTestDrillProgress(studentId: string): Promise<StudentTestDrillProgress> {
    return this.readJSON<StudentTestDrillProgress>(
      this.KEYS.TEST_DRILL_PROGRESS(studentId),
      { 
        studentId, 
        drills: {}, 
        attempts: [], 
        lastUpdated: new Date().toISOString() 
      }
    );
  }

  async saveTestDrillProgress(studentId: string, progress: StudentTestDrillProgress): Promise<void> {
    const updatedProgress = {
      ...progress,
      lastUpdated: new Date().toISOString()
    };
    this.writeJSON(this.KEYS.TEST_DRILL_PROGRESS(studentId), updatedProgress);
  }

  async recordTestDrillAttempt(studentId: string, attempt: TestDrillAttempt): Promise<void> {
    const attempts = this.readJSON<TestDrillAttempt[]>(this.KEYS.TEST_DRILL_ATTEMPTS(studentId), []);
    attempts.push(attempt);
    this.writeJSON(this.KEYS.TEST_DRILL_ATTEMPTS(studentId), attempts);

    // Also update the test drill progress
    const progress = await this.getTestDrillProgress(studentId);
    progress.attempts.push(attempt);
    progress.drills[attempt.drillNumber] = attempt.progress;
    await this.saveTestDrillProgress(studentId, progress);
  }

  async getTestDrillHistory(studentId: string): Promise<TestDrillAttempt[]> {
    return this.readJSON<TestDrillAttempt[]>(this.KEYS.TEST_DRILL_ATTEMPTS(studentId), []);
  }

  // Lesson Management
  async updateStudentLesson(studentId: string, lessonId: string, updates: any): Promise<void> {
    const customLessons = this.readJSON<Record<string, any>>(this.KEYS.CUSTOM_LESSONS(studentId), {});
    customLessons[lessonId] = updates;
    this.writeJSON(this.KEYS.CUSTOM_LESSONS(studentId), customLessons);
  }

  async getStudentCustomLessons(studentId: string): Promise<Record<string, any>> {
    return this.readJSON<Record<string, any>>(this.KEYS.CUSTOM_LESSONS(studentId), {});
  }

  async resetStudentLesson(studentId: string, lessonId: string): Promise<void> {
    const customLessons = this.readJSON<Record<string, any>>(this.KEYS.CUSTOM_LESSONS(studentId), {});
    delete customLessons[lessonId];
    this.writeJSON(this.KEYS.CUSTOM_LESSONS(studentId), customLessons);
  }

  // Always-available students persistence
  async markStudentPersistent(studentId: string): Promise<void> {
    const persistentStudents = this.readJSON<string[]>(this.KEYS.PERSISTENT_STUDENTS, []);
    if (!persistentStudents.includes(studentId)) {
      persistentStudents.push(studentId);
      this.writeJSON(this.KEYS.PERSISTENT_STUDENTS, persistentStudents);
    }
  }

  async getPersistentStudents(): Promise<string[]> {
    return this.readJSON<string[]>(this.KEYS.PERSISTENT_STUDENTS, []);
  }
}

// Export singleton instance
export const dataService: IDataService = new LocalStorageDataService();

