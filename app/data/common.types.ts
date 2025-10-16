// ---------- Canonical shared types ----------

export type CurriculumId = 'gc2' | 'bbs1';

// Per-step state captured during coaching
export type NextAction = 'Teach' | 'Review' | 'Reteach';
export type Importance = 'standard' | 'important' | 'critical';

export interface Step {
  // optional so historical data without ids still type-checks
  id?: string;                       // ex: "gc2-l1-s1-st1"
  stepNumber: number;                // 1..n (order inside a slice)
  description?: string;
  importance?: Importance;
  confidence?: number;               // 0..100
  notes?: string;
  nextAction?: NextAction;
}

export interface SliceMetrics {
  principleEntropy?: number;
  reflexFidelity?: number;
  composureDensity?: number;
  energyExpenditure?: number;
}

export interface Slice {
  id: string;                        // "gc2-l1-s1"
  sliceNumber: number;               // 1..n
  title: string;

  indicator?: string;
  essentialDetail?: string;
  mostCommonMistake?: string;
  badGuyReminder?: string;
  safetyTip?: string;
  drillOrders?: string;

  corePrinciples?: string[];         // ["Kuzushi (11)", ...]
  neuromechanics?: string[];         // psychophysiological map
  emotions?: string[];
  somatics?: string[];
  continuityLinks?: string[];        // IDs to related slices/lessons
  heuristics?: string[];             // cue ids
  philosophyTags?: string[];         // doctrine tags

  steps?: Step[];
  metrics?: SliceMetrics;
}

export interface Lesson {
  id: string;                        // "gc2-l1"
  lessonNumber: number;              // 1..n
  technique: string;
  position: string;
  chapter?: string;
  overview?: string;
  
  // 🔸 NEW (optional analytics metadata; safe to ignore in UI)
  macroChapterId?: string;     // e.g., "bbs1-c1" (parent chapter object id)
  macroChapter?: string;       // e.g., "Mount" (parent chapter title)
  chapterCode?: string;        // e.g., "1.1"
  chapterMajor?: number;       // e.g., 1
  chapterMinor?: number;       // e.g., 1
  chapterSection?: string;     // e.g., "Mount Controls"

  reflexDevelopmentDrill?: string | null;
  fightSimulationDrill?: string | null;
  mindsetMinute?: string | null;

  goal?: 'escape' | 'control' | 'submission' | 'transition' | 'counter' | 'takedown' | null;
  principleRefs?: string[];

  slices: Slice[];

  stripeCourse?: string;
  source?: string;
  status?: 'complete' | 'incomplete';
  discrepancies?: string[];
}
export interface Curriculum<TId extends CurriculumId = CurriculumId> {
  id: TId;                           // "gc2" | "bbs1"
  name: string;                      // display name
  version?: string;                  // optional (for data migrations)
  totalLessons: number;
  lessons: Lesson[];
}
