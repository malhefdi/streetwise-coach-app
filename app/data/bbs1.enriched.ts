import type { Curriculum } from './common.types';
import { normalizeBBS1 } from './curricula/normalize.bbs1';

export const bbs1CurriculumEnriched: Curriculum<'bbs1'> = normalizeBBS1();
