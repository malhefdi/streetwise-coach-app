// Single source of truth for all curriculum data
export interface Step {
  id: string;
  stepNumber: number;
  description: string;
  importance?: string;
  confidence?: number;
  notes?: string;
}

export interface Slice {
  id: string;
  sliceNumber: number;
  title: string;
  indicator?: string | null;
  essentialDetail?: string | null;
  mostCommonMistake?: string | null;
  badGuyReminder?: string | null;
  safetyTip?: string | null;
  corePrinciples?: string[] | null;
  drillOrders?: string | null;
  isBonusSlice?: boolean;
  steps?: Step[];
}

export interface Lesson {
  id: string;
  lessonNumber: number;
  technique: string;
  position: string;
  overview?: string | null;
  mindsetMinute?: string | null;
  streetTip?: string | null;
  // Chapter metadata (for BBS1 and future curricula)
  chapterId?: string | null; // e.g., "bbs1-c1", "bbs1-c2"
  chapterTitle?: string | null; // e.g., "Mount", "Side Mount"
  chapter?: string | null; // e.g., "1.1: Mount Controls" - subchapter
  course?: string | null; // e.g., "Master Cycle | Blue Belt Stripe 1"
  // Advanced sparring drills (for BBS1 and future curricula)
  rapidMasteryDrill?: string | null;
  focusSparring?: string | null;
  slices: Slice[];
}

export interface Curriculum {
  id: string;
  name: string;
  description: string;
  totalLessons: number;
  lessons: Lesson[];
  testDrills?: string; // Reference to test drills data (e.g., 'gc2' for gc2TestDrills)
}

// Import curriculum data from separate files
import { gc2Curriculum } from './gc2.curriculum';
import { bbs1Curriculum } from './bbs1.curriculum';

// Curriculum registry - single source of truth for all curricula
export const CURRICULA: Record<string, Curriculum> = {
  gc2: gc2Curriculum,
  bbs1: bbs1Curriculum
};

// Helper functions
export const getCurriculum = (id: string): Curriculum | undefined => {
  return CURRICULA[id];
};

export const getAllCurricula = (): Curriculum[] => {
  return Object.values(CURRICULA);
};

export const getCurriculumIds = (): string[] => {
  return Object.keys(CURRICULA);
};

// For backward compatibility
export const curricula = CURRICULA;
export const gc2CurriculumEnriched = CURRICULA.gc2;