import type { CurriculumId } from './common.types';

// Friendly builders that never change
export type LessonId = `${CurriculumId}-l${number}`;
export type SliceId  = `${LessonId}-s${number}`;
export type StepId   = `${SliceId}-st${number}`;

export const makeLessonId = (curId: CurriculumId, lesson: number): LessonId =>
  `${curId}-l${lesson}` as LessonId;

export const makeSliceId = (lessonId: LessonId, slice: number): SliceId =>
  `${lessonId}-s${slice}` as SliceId;

export const makeStepId = (sliceId: SliceId, step: number): StepId =>
  `${sliceId}-st${step}` as StepId;

// Tiny heuristic for analytics/UI hints
export const deriveGoalFromText = (t: string): Lesson['goal'] => {
  const s = (t || '').toLowerCase();
  if (s.includes('escape')) return 'escape';
  if (s.includes('sweep') || s.includes('back') || s.includes('pass')) return 'transition';
  if (s.includes('choke') || s.includes('armbar') || s.includes('armlock') || s.includes('kimura') || s.includes('americana') || s.includes('triangle')) return 'submission';
  if (s.includes('clinch') || s.includes('takedown') || s.includes('double leg')) return 'takedown';
  if (s.includes('control') || s.includes('mount control') || s.includes('super hooks')) return 'control';
  if (s.includes('counter')) return 'counter';
  return null;
};
