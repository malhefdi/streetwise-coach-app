// Plan-related type definitions for student curriculum management

export interface StudentPlan {
  id: string;
  studentId: string;
  name: string; // e.g., "Ali's Beginner Path"
  description?: string;
  lessonIds: string[]; // Array of lesson IDs from curriculum (e.g., ["gc2-l1", "gc2-l3", "gc2-l5"])
  createdAt: string;
  updatedAt: string;
}

export interface StepProgress {
  stepNumber: number;
  completed: boolean;
  confidence: number; // 0-100
  notes: string;
  importance: 'standard' | 'important' | 'critical';
  nextAction?: 'Teach' | 'Review' | 'Reteach';
}

export interface SliceProgress {
  sliceId: string;
  steps: StepProgress[];
}

export interface SparringProgress {
  rapidMasteryCompleted: boolean;
  rapidMasteryNotes?: string;
  focusSparringCompleted: boolean;
  focusSparringNotes?: string;
}

export interface LessonProgress {
  lessonId: string;
  slices: SliceProgress[];
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  // Advanced sparring progress (for BBS1 and future curricula)
  sparringProgress?: SparringProgress;
}

export interface StudentProgress {
  studentId: string;
  lessons: Record<string, LessonProgress>; // lessonId -> progress
}

export interface CoachingSession {
  id: string;
  studentId: string;
  lessonId: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  progress: LessonProgress;
}

