import { curricula, getCurriculum } from '../catalog';

const gc2 = getCurriculum('gc2');
const bbs1 = getCurriculum('bbs1');

console.log('[OK] ids:', Object.keys(curricula));
console.log('[OK] gc2 lessons:', gc2.totalLessons, 'bbs1 lessons:', bbs1.totalLessons);

// Probe a couple of lesson fields so we catch shape drift
const sample = gc2.lessons[0];
if (!sample || typeof sample.lesson !== 'number' || !Array.isArray(sample.slices)) {
  throw new Error('gc2 first lesson shape invalid');
}
console.log('[OK] sample lesson:', { lesson: sample.lesson, technique: sample.technique });
