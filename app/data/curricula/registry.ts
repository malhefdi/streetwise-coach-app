// app/data/curricula/registry.ts
import type { Curriculum, CurriculumId } from '../common.types';
import { gc2CurriculumEnriched } from '../gc2.enriched';
import { bbs1CurriculumEnriched } from '../bbs1.enriched';

export const curricula: Record<CurriculumId, Curriculum> = {
  gc2: gc2CurriculumEnriched,
  bbs1: bbs1CurriculumEnriched,
};

export const getCurriculum = (id: CurriculumId): Curriculum => curricula[id];

export const curriculumMeta = [
  { id: 'gc2' as const,  name: 'Gracie Combatives 2.0', lessons: gc2CurriculumEnriched.totalLessons },
  { id: 'bbs1' as const, name: 'Master Cycle — BBS1',   lessons: bbs1CurriculumEnriched.totalLessons },
];
