// app/data/types/curriculum.types.ts

export type Step = {
  id?: string;
  stepNumber: number;
  description: string;
  importance?: 'standard' | 'important' | 'critical';
  confidence?: number; // 0–5
  completed?: boolean;
};

export type Slice = {
  id?: string;
  sliceNumber: number;
  title: string;
  indicator?: string;
  essentialDetail?: string;
  mostCommonMistake?: string;
  badGuyReminder?: string;
  safetyTip?: string;
  corePrinciples?: string[];
  steps?: Step[];
};

export type Lesson = {
  id?: string;
  lessonNumber: number;
  technique: string;
  position: string;
  overview?: string;
  reflexDevelopmentDrill?: string;
  fightSimulationDrill?: string;
  mindsetMinute?: string;
  streetTip?: string;
  slices: Slice[];
};

export type Curriculum<ID extends string = string> = {
  id: ID;
  name: string;
  totalLessons: number;
  lessons: Lesson[];
};
