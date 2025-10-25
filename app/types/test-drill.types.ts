// Test Drill type definitions for GC2 curriculum test preparation

export interface TestDrillItem {
  ids: string[]; // Primary: direct curriculum slice references (e.g., ["gc2-l1-s1"])
  lessonNumber: number; // Keep for display/backward compatibility
  sliceTitle: string; // Keep for display/backward compatibility
  combination?: string; // Optional combination with other techniques
}

export interface SprintGroup {
  groupNumber: number;
  groupTitle: string;
  techniques: TestDrillItem[];
  estimatedTimeMinutes: number;
  restTimeMinutes: number;
  isCompleted?: boolean;
  notes?: string;
  completedAt?: string;
}

export interface SprintProgress {
  groupNumber: number;
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
  timeSpent?: number; // seconds
  qualityRating?: number; // 0-100
}

export interface EnhancedTestDrill extends TestDrill {
  sprintGroups: SprintGroup[];
}

export interface TestDrill {
  drillNumber: number;
  title: string;
  timeLimitMinutes: number;
  description: string;
  items?: TestDrillItem[]; // For drills 1-4 (ordered sequences)
  isFreestyle?: boolean; // For drill 5 (freestyle fight simulation)
  specialRequirements?: string; // Additional requirements for drill 5
}

export interface TestDrillItemProgress {
  lessonNumber: number;
  sliceTitle: string;
  completed: boolean;
  confidence: number; // 0-100
  notes?: string;
  timeSpent?: number; // seconds
}

export interface FreestyleDrillProgress {
  techniquesAttempted: TestDrillItem[];
  evaluatorComments: string;
  scoreDeductions: Array<{
    reason: string;
    points: number;
    sliceReference?: {
      lessonNumber: number;
      sliceTitle: string;
    };
    timestamp: string;
  }>;
  qualityRatings: {
    details: number; // 0-100
    conviction: number; // 0-100
    reflexes: number; // 0-100
  };
  totalTime: number; // seconds
}

export interface TestDrillProgress {
  drillNumber: number;
  startedAt?: string;
  completedAt?: string;
  totalTime?: number; // seconds
  score?: number; // 0-100 (starts at 100, deductions applied)
  passed?: boolean; // 90+ = pass
  items?: TestDrillItemProgress[]; // For drills 1-4 (legacy)
  sprintProgress?: SprintProgress[]; // Track each sprint
  freestyleProgress?: FreestyleDrillProgress; // For drill 5
  notes?: string;
  testedSlices?: Array<{
    lessonNumber: number;
    sliceTitle: string;
    tested: boolean;
    hasDeductions: boolean;
  }>;
  testedSprints?: Array<{
    groupNumber: number;
    groupTitle: string;
    tested: boolean;
    hasDeductions: boolean;
  }>;
  scoreDeductions?: Array<{
    reason: string;
    points: number;
    sliceReference?: {
      lessonNumber: number;
      sliceTitle: string;
    };
    sprintReference?: {
      groupNumber: number;
      groupTitle: string;
    };
    timestamp: string;
  }>;
}

export interface TestDrillAttempt {
  id: string;
  studentId: string;
  drillNumber: number;
  attemptedAt: string;
  completedAt?: string;
  score: number;
  passed: boolean;
  totalTime: number; // seconds
  evaluatorNotes?: string;
  progress: TestDrillProgress;
}

export interface StudentTestDrillProgress {
  studentId: string;
  drills: Record<number, TestDrillProgress>; // drillNumber -> progress
  attempts: TestDrillAttempt[]; // Historical attempts
  lastUpdated: string;
}

// Helper types for UI components
export interface TestDrillReadiness {
  drillNumber: number;
  isReady: boolean;
  missingLessons: string[]; // Lesson IDs that need completion
  completionPercentage: number; // 0-100
}

export interface TestDrillSummary {
  totalDrills: number;
  readyDrills: number;
  completedDrills: number;
  averageScore?: number;
  lastAttemptDate?: string;
}
