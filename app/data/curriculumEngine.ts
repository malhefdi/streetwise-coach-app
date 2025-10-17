// app/data/curriculumEngine.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import { bbs1Structure } from '@/app/data/datalab/out/bbs1.structure';
import { bbs1Details }   from '@/app/data/datalab/out/bbs1.details';
import { gc2Structure }  from '@/app/data/datalab/out/gc2.structure';
import { gc2Details }    from '@/app/data/datalab/out/gc2.details';

import type { Lesson, Curriculum } from '@/app/data/types/curriculum.types';

/**
 * Return a flattened lesson list with merged details.
 * The structure and detail shapes differ slightly:
 * - GC2 has linear lessons
 * - BBS1 is hierarchical (chapters → subchapters → lessons)
 */
export function buildCurriculum(id: 'gc2' | 'bbs1'): Curriculum<'gc2' | 'bbs1'> {
  const struct = id === 'gc2' ? gc2Structure : bbs1Structure;
  const details = id === 'gc2' ? gc2Details : bbs1Details;

  const lessons: Lesson[] = [];

  if (id === 'gc2') {
    for (const L of struct.lessons) {
      const D = details.lessons.find(dl => dl.id === L.id);
      lessons.push({
        id: L.id,
        lessonNumber: L.lessonNumber ?? L.index ?? 0,
        technique: L.technique,
        position: L.position,
        overview: D?.overview ?? '',
        slices: L.slices.map((S, i) => ({
          id: S.id,
          sliceNumber: i + 1,
          title: S.title,
          indicator: D?.slices?.[i]?.indicator ?? '',
          essentialDetail: D?.slices?.[i]?.essentialDetail ?? '',
          steps: S.steps?.map((st, j) => ({
            id: st.id,
            stepNumber: j + 1,
            description: st.description ?? '',
            importance: 'standard',
            confidence: 0,
          })) ?? [],
        })),
      });
    }
  } else {
    // hierarchical BBS1
    for (const ch of struct.chapters) {
      for (const sub of ch.subchapters ?? [ch]) {
        for (const L of sub.lessons ?? []) {
          const D = details.chapters
            ?.find(c => c.id === ch.id)
            ?.subchapters?.find(sc => sc.id === sub.id)
            ?.lessons?.find(dl => dl.id === L.id);

          lessons.push({
            id: L.id,
            lessonNumber: L.lessonNumber ?? 0,
            technique: L.technique,
            position: L.position,
            overview: D?.overview ?? '',
            slices: L.slices.map((S, i) => ({
              id: S.id,
              sliceNumber: i + 1,
              title: S.title,
              indicator: D?.slices?.[i]?.indicator ?? '',
              essentialDetail: D?.slices?.[i]?.essentialDetail ?? '',
              steps: S.steps?.map((st, j) => ({
                id: st.id,
                stepNumber: j + 1,
                description: st.description ?? '',
                importance: 'standard',
                confidence: 0,
              })) ?? [],
            })),
          });
        }
      }
    }
  }

  return {
    id,
    name: id === 'gc2' ? 'Gracie Combatives 2.0' : 'Master Cycle — Blue Belt Stripe 1',
    totalLessons: lessons.length,
    lessons,
  };
}

// quick getters
export const curricula = {
  gc2: buildCurriculum('gc2'),
  bbs1: buildCurriculum('bbs1'),
};

export const getCurriculum = (id: 'gc2' | 'bbs1') => curricula[id];
