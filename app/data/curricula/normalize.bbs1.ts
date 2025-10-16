// app/data/curricula/normalize.bbs1.ts
import type { Curriculum, Lesson, Slice } from '../common.types';
import { bbs1Raw } from '../bbs1.raw';
import { makeLessonId, makeSliceId, deriveGoalFromText } from '../id.utils';

// Accept both slice shapes
type AnyRawSlice =
  | { slice: number; title: string; indicator?: string; essentialDetail?: string;
      mostCommonMistake?: string; badGuyReminder?: string; safetyTip?: string; drillOrders?: string; }
  | { sliceNumber: number; title: string; indicator?: string; essentialDetail?: string;
      mostCommonMistake?: string; badGuyReminder?: string; safetyTip?: string; drillOrders?: string; };

// Accept both lesson shapes (Option B canonical; Option A tolerated)
type AnyRawLesson = {
  lesson?: number;           // Option B
  chapter?: string;          // Option B (e.g., "1.1: Mount Controls")
  lessonNumber?: number;     // Option A
  chapterTitle?: string;     // Option A

  technique: string;
  position: string;
  overview?: string | null;
  rapidMasteryDrill?: string | null;
  focusSparring?: string | null;
  mindsetMinute?: string | null;
  slices: AnyRawSlice[];
  course?: string;           // ignored
};

// Treat "", '"', '""', "'" as missing
const isMissing = (v?: string | null) => !v || ['"', "''", '""', "'"].includes(v.trim());

/** 🔸 Parse "1.1: Mount Controls" → { code:"1.1", major:1, minor:1, section:"Mount Controls" } */
function parseSubchapter(label?: string): {
  code?: string; major?: number; minor?: number; section?: string;
} {
  if (!label) return {};
  const m = label.match(/^\s*(\d+)\.(\d+)\s*:\s*(.+)\s*$/);
  if (!m) return {}; // label might be just "Mount" etc.
  return { code: `${m[1]}.${m[2]}`, major: Number(m[1]), minor: Number(m[2]), section: m[3] };
}

export function normalizeBBS1(): Curriculum<'bbs1'> {
  const lessonMap = new Map<number, Lesson>();

  for (const chapter of bbs1Raw.chapters) {
    for (const rawAny of chapter.lessons as AnyRawLesson[]) {
      const lessonNum = rawAny.lessonNumber ?? rawAny.lesson;
      if (!lessonNum) continue;

      // Prefer explicit lesson-level chapter label if present; else fall back to parent chapter title
      const subchapterLabel = rawAny.chapterTitle ?? rawAny.chapter;
      const { code, major, minor, section } = parseSubchapter(subchapterLabel);

      const lessonId = makeLessonId('bbs1', lessonNum);

      const slices: Slice[] = (rawAny.slices ?? []).map((sAny) => {
        const n = ('slice' in sAny ? sAny.slice : (sAny as any).sliceNumber) as number;
        return {
          id: makeSliceId(lessonId, n),
          sliceNumber: n,
          title: (sAny as any).title ?? `Slice ${n}`,
          indicator: (sAny as any).indicator ?? undefined,
          essentialDetail: (sAny as any).essentialDetail ?? undefined,
          mostCommonMistake: (sAny as any).mostCommonMistake ?? undefined,
          badGuyReminder: (sAny as any).badGuyReminder ?? undefined,
          safetyTip: (sAny as any).safetyTip ?? undefined,
          drillOrders: (sAny as any).drillOrders ?? undefined,
          corePrinciples: [],
          steps: []
        };
      });

      const macroChapterTitle = chapter.title; // e.g., "Mount", "Side Mount", "Guard", "Half Guard"

      const L: Lesson = {
        id: lessonId,
        lessonNumber: lessonNum,
        technique: rawAny.technique,
        position: rawAny.position,

        // Keep the lesson-level label in `chapter` (as before)
        chapter: subchapterLabel ?? macroChapterTitle,

        // 🔸 NEW analytics-friendly metadata (optional)
        macroChapterId: chapter.id,
        macroChapter: macroChapterTitle,
        chapterCode: code,            // "1.1"
        chapterMajor: major,          // 1
        chapterMinor: minor,          // 1
        chapterSection: section,      // "Mount Controls"

        // Content
        overview: isMissing(rawAny.overview) ? undefined : rawAny.overview!,
        reflexDevelopmentDrill: isMissing(rawAny.rapidMasteryDrill) ? null : rawAny.rapidMasteryDrill!,
        fightSimulationDrill: isMissing(rawAny.focusSparring) ? null : rawAny.focusSparring!,
        mindsetMinute: isMissing(rawAny.mindsetMinute) ? null : rawAny.mindsetMinute!,

        goal: deriveGoalFromText(`${rawAny.technique} ${rawAny.position} ${subchapterLabel ?? macroChapterTitle}`),
        principleRefs: [],
        slices,

        stripeCourse: 'Blue Belt Stripe 1',
        source: 'BBS1 v11.1 Official Extract',
        status: lessonNum <= 30 ? 'complete' : 'incomplete',
        discrepancies: [
          ...(slices.length === 0 ? ['no slices'] : []),
          ...(isMissing(rawAny.overview) ? ['missing overview'] : []),
        ],
      };

      lessonMap.set(lessonNum, L);
    }
  }

  // Pad placeholders up to declared total
  for (let n = 1; n <= bbs1Raw.totalLessons; n++) {
    if (!lessonMap.has(n)) {
      const id = makeLessonId('bbs1', n);
      lessonMap.set(n, {
        id,
        lessonNumber: n,
        technique: `Lesson ${n}`,
        position: '',
        chapter: '',
        macroChapterId: undefined,
        macroChapter: undefined,
        chapterCode: undefined,
        chapterMajor: undefined,
        chapterMinor: undefined,
        chapterSection: undefined,
        overview: undefined,
        reflexDevelopmentDrill: null,
        fightSimulationDrill: null,
        mindsetMinute: null,
        goal: null,
        principleRefs: [],
        slices: [],
        stripeCourse: 'Blue Belt Stripe 1',
        source: 'BBS1 v11.1 Official Extract',
        status: 'incomplete',
        discrepancies: ['placeholder: not transcribed in source']
      });
    }
  }

  const lessons = Array.from(lessonMap.values()).sort((a, b) => a.lessonNumber - b.lessonNumber);

  return {
    id: 'bbs1',
    name: 'Master Cycle — Blue Belt Stripe 1 (Enriched)',
    version: '1.0.0',
    totalLessons: lessons.length,
    lessons
  };
}
