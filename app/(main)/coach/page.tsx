'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Slider } from 'primereact/slider';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { getCurriculum } from '@/app/data/curriculumEngine';
import type { Lesson, Slice } from '@/app/data/types/curriculum.types';

const gc2CurriculumEnriched = getCurriculum('gc2');
// ---------- Types ----------
type Importance = 'standard' | 'important' | 'critical';
type NextAction = 'Teach' | 'Review' | 'Reteach';

interface StepState {
  confidence: number;        // 0-100
  completed: boolean;
  notes: string;
  importance: Importance;
  nextAction?: NextAction;
}

interface LessonProgress {
  [sliceKey: string]: StepState[]; // e.g., "gc2-l1-s2" -> steps[]
}

// ---------- Helpers ----------
const DEFAULT_STEP_STATE = (): StepState => ({
  confidence: 50,
  completed: false,
  notes: '',
  importance: 'standard'
});

const loadSession = (): LessonProgress => {
  try {
    const data = localStorage.getItem('coachSession_v6');
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};
const saveSession = (data: LessonProgress) => localStorage.setItem('coachSession_v6', JSON.stringify(data));

const formatTime = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
};

// ---------- Page ----------
const CoachPage = () => {
const lessons: Lesson[] = gc2CurriculumEnriched.lessons;
  const [session, setSession] = useState<LessonProgress>({});
  const [student] = useState('Guest Student');
  const [elapsed, setElapsed] = useState(0);

  // UI state
  const [activeLessons, setActiveLessons] = useState<number[]>([]);                    // which top-level lessons are open
  const [activeSlices, setActiveSlices] = useState<Record<string, number[]>>({});     // per-lesson open slices
  const [summaryVisible, setSummaryVisible] = useState(true);
  const [focusMode, setFocusMode] = useState(false);

  // Timer
  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Load / Save
  useEffect(() => setSession(loadSession()), []);
  useEffect(() => saveSession(session), [session]);

  // ---------- Compute ----------
  const lessonIdOf = (l: Lesson) => `gc2-l${l.lessonNumber}`;
  const sliceKeyOf = (lessonId: string, sIdx: number) => `${lessonId}-s${sIdx + 1}`;

  const computeLessonCompletion = (lessonId: string) => {
    const keys = Object.keys(session).filter((k) => k.startsWith(`${lessonId}-`));
    const all = keys.flatMap((k) => session[k] || []);
    if (!all.length) return 0;
    const done = all.filter((s) => s.completed).length;
    return Math.round((done / all.length) * 100);
  };

  // Build “next session” report items
  const nextSessionItems = useMemo(() => {
    return Object.entries(session).flatMap(([key, steps]) =>
      steps
        .map((s, i) => ({ key, i, s }))
        .filter(({ s }) => !!s.nextAction)
        .map(({ key, i, s }) => ({
          key,
          stepNumber: i + 1,
          nextAction: s.nextAction as NextAction,
          notes: s.notes
        }))
    );
  }, [session]);

  // ---------- Mutations ----------
  const ensureSlicePersisted = (lessonId: string, sIdx: number, baseLen: number): StepState[] => {
    const key = sliceKeyOf(lessonId, sIdx);
    const current = session[key];
    if (current && current.length) return current.slice();

    // Seed with defaults matching the curriculum step count
    return Array.from({ length: baseLen }, () => DEFAULT_STEP_STATE());
  };

  const updateStep = (lessonId: string, sIdx: number, stIdx: number, updates: Partial<StepState>, baseLen: number) => {
    setSession((prev) => {
      const key = sliceKeyOf(lessonId, sIdx);
      const steps = ensureSlicePersisted(lessonId, sIdx, baseLen);
      steps[stIdx] = { ...steps[stIdx], ...updates };
      return { ...prev, [key]: steps };
    });
  };

  const addStep = (lessonId: string, sIdx: number, baseLen: number) => {
    setSession((prev) => {
      const key = sliceKeyOf(lessonId, sIdx);
      const steps = ensureSlicePersisted(lessonId, sIdx, baseLen);
      steps.push(DEFAULT_STEP_STATE());
      return { ...prev, [key]: steps };
    });
  };

  const removeStep = (lessonId: string, sIdx: number, baseLen: number) => {
    setSession((prev) => {
      const key = sliceKeyOf(lessonId, sIdx);
      const steps = ensureSlicePersisted(lessonId, sIdx, baseLen);
      if (steps.length > 1) steps.pop(); // keep at least 1 step
      return { ...prev, [key]: steps };
    });
  };

  // ---------- Render ----------
  return (
    <div className="p-0 surface-ground text-0">
      {/* Header */}
      <Card className="mb-4 surface-card shadow-2">
        <div className="flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h2 className="m-0 text-4xl font-medium text-primary">StreetWise Coaching Session</h2>
            <p className="m-0 text-sm text-color-secondary">
              Student: <b>{student}</b>
            </p>
          </div>
          <div className="flex gap-3 align-items-center">
            <Tag value={formatTime(elapsed)} severity="info" />
            <Button
              label={focusMode ? 'Disable Focus' : 'Enable Focus'}
              icon={focusMode ? 'pi pi-eye-slash' : 'pi pi-eye'}
              className="p-button-secondary"
              onClick={() => setFocusMode((f) => !f)}
            />
            <Button
              label={summaryVisible ? 'Hide Summary' : 'Show Summary'}
              icon="pi pi-list"
              className="p-button-info"
              onClick={() => setSummaryVisible((v) => !v)}
            />
            <Button label="Save" icon="pi pi-save" className="p-button-success" onClick={() => saveSession(session)} />
          </div>
        </div>
      </Card>

      <div className="grid">
        {/* Lessons column */}
        <div className={`col-12 ${summaryVisible ? 'md:col-8' : 'md:col-12'}`}>
          <Accordion
            multiple
            activeIndex={activeLessons}
            onTabChange={(e) => setActiveLessons(Array.isArray(e.index) ? e.index : [e.index])}
          >
            {lessons.map((lesson, lIdx) => {
              const lessonId = lessonIdOf(lesson);
              const progress = computeLessonCompletion(lessonId);

              // Focus mode visual states
              const isFocused = focusMode && activeLessons.includes(lIdx);
              const dimOthers = focusMode && !isFocused;

              return (
                <AccordionTab
                  key={lessonId}
                  header={
                    <div className="flex justify-content-between align-items-center w-full">
                      <span className="font-bold text-primary">{`L${lesson.lessonNumber} — ${lesson.technique}`}</span>
                      <div className="w-20rem sm:w-24rem md:w-28rem">
                        <ProgressBar value={progress} showValue className="sw-progress" />
                      </div>
                    </div>
                  }
                  contentClassName={`${isFocused ? 'sw-focus' : ''} ${dimOthers ? 'sw-dim' : ''}`}
                >
                  <Accordion
                    multiple
                    activeIndex={activeSlices[lessonId] || []}
                    onTabChange={(e) =>
                      setActiveSlices({
                        ...activeSlices,
                        [lessonId]: Array.isArray(e.index) ? e.index : [e.index]
                      })
                    }
                  >
                    {lesson.slices.map((slice, sIdx) => {
                      const baseSteps = slice.steps || []; // real curriculum steps
                      const key = sliceKeyOf(lessonId, sIdx);
                      const persisted = session[key] || [];
                      const maxLen = Math.max(baseSteps.length, persisted.length || 0) || 1;
                      const effectiveStates: StepState[] =
                        persisted.length > 0
                          ? persisted
                          : Array.from({ length: baseSteps.length || 1 }, () => DEFAULT_STEP_STATE());

                      return (
                        <AccordionTab
                          key={`${lessonId}-s${sIdx + 1}`}
                          header={<span>{`Slice ${sIdx + 1}: ${slice.title}`}</span>}
                        >
                          {/* Steps */}
                          {Array.from({ length: maxLen }).map((_, stIdx) => {
                            const state = effectiveStates[stIdx] ?? DEFAULT_STEP_STATE();
                            const description =
                              baseSteps[stIdx]?.description || `Step ${stIdx + 1}`;

                            const borderColor =
                              state.importance === 'critical'
                                ? 'border-2 border-red-500'
                                : state.importance === 'important'
                                ? 'border-2 border-yellow-500'
                                : 'border-1 border-gray-700';

                            return (
                              <div
                                key={stIdx}
                                className={`p-3 mb-3 border-round-lg surface-overlay ${borderColor}`}
                              >
                                <div className="flex justify-content-between align-items-center mb-2">
                                  <div className="text-sm font-medium">
                                    {description}
                                  </div>
                                  <Button
                                    icon={state.completed ? 'pi pi-check' : 'pi pi-circle'}
                                    className={`p-button-rounded p-button-sm ${
                                      state.completed ? 'p-button-success' : 'p-button-secondary'
                                    }`}
                                    onClick={() =>
                                      updateStep(lessonId, sIdx, stIdx, { completed: !state.completed }, baseSteps.length || 1)
                                    }
                                    tooltip="Mark complete"
                                  />
                                </div>

                                <div className="mb-2 flex justify-content-between align-items-center">
                                  <span className="text-xs text-color-secondary">Confidence</span>
                                  <Tag value={`${state.confidence}%`} severity="info" />
                                </div>
                                <Slider
                                  value={state.confidence}
                                  min={0}
                                  max={100}
                                  step={5}
                                  onChange={(e) =>
                                    updateStep(lessonId, sIdx, stIdx, { confidence: e.value as number }, baseSteps.length || 1)
                                  }
                                  className="w-full"
                                />

                                <div className="flex justify-content-between align-items-center mt-2 mb-2">
                                  <div className="flex gap-2">
                                    {(['standard', 'important', 'critical'] as Importance[]).map((imp) => (
                                      <Button
                                        key={imp}
                                        label={imp}
                                        className={`p-button-sm ${
                                          state.importance === imp ? 'p-button-info' : 'p-button-text'
                                        }`}
                                        onClick={() =>
                                          updateStep(lessonId, sIdx, stIdx, { importance: imp }, baseSteps.length || 1)
                                        }
                                      />
                                    ))}
                                  </div>
                                  <Dropdown
                                    value={state.nextAction}
                                    options={['Teach', 'Review', 'Reteach']}
                                    placeholder="Next..."
                                    className="w-9rem"
                                    onChange={(e) =>
                                      updateStep(lessonId, sIdx, stIdx, { nextAction: e.value as NextAction }, baseSteps.length || 1)
                                    }
                                  />
                                </div>

                                <InputTextarea
                                  value={state.notes}
                                  onChange={(e) =>
                                    updateStep(lessonId, sIdx, stIdx, { notes: e.target.value }, baseSteps.length || 1)
                                  }
                                  placeholder="Coach notes..."
                                  rows={2}
                                  autoResize
                                  className="w-full"
                                />
                              </div>
                            );
                          })}

                          {/* Add / Remove buttons (below steps so they don't toggle accordion) */}
                          <div className="flex gap-2 justify-content-end">
                            <Button
                              icon="pi pi-plus"
                              label="Add Step"
                              className="p-button-sm p-button-text text-green-400"
                              onClick={() => addStep(lessonId, sIdx, (slice.steps?.length || 1))}
                            />
                            <Button
                              icon="pi pi-minus"
                              label="Remove Step"
                              className="p-button-sm p-button-text text-red-400"
                              onClick={() => removeStep(lessonId, sIdx, (slice.steps?.length || 1))}
                            />
                          </div>
                        </AccordionTab>
                      );
                    })}
                  </Accordion>
                </AccordionTab>
              );
            })}
          </Accordion>
        </div>

        {/* Summary column */}
        {summaryVisible && (
          <div className="col-12 md:col-4">
            <Card className="surface-card shadow-2 border-round-xl h-full overflow-auto">
              <h3 className="text-lg mb-3 text-primary font-bold">Session Summary</h3>

              {/* Progress for every lesson (old summary) */}
              <div className="mb-3">
                {lessons.map((lesson) => {
                  const id = lessonIdOf(lesson);
                  const progress = computeLessonCompletion(id);
                  return (
                    <div
                      key={id}
                      className="flex justify-content-between align-items-center mb-5"
                    >
                      <span className="text-md font-medium">{lesson.technique}</span>
                      <Tag
                        value={`${progress}%`}
                        severity={
                          progress === 100
                            ? 'success'
                            : progress > 60
                            ? 'info'
                            : progress > 30
                            ? 'warning'
                            : 'danger'
                        }
                      />
                    </div>
                  );
                })}
              </div>

              <hr className="mb-3" />

              {/* Next-session feedback report (new summary) */}
              <h4 className="text-sm text-color-secondary mb-2">Next Session Actions</h4>
              {nextSessionItems.length === 0 ? (
                <p className="text-sm text-color-secondary">No items tagged yet.</p>
              ) : (
                nextSessionItems.map((item, idx) => (
                  <div key={idx} className="mb-3 p-2 border-round surface-overlay shadow-1">
                    <div className="flex justify-content-between align-items-center mb-1">
                      <Tag value={item.nextAction} />
                      <span className="text-xs text-color-secondary">{item.key} • Step {item.stepNumber}</span>
                    </div>
                    {item.notes && (
                      <p className="text-xs text-color-secondary m-0">{item.notes}</p>
                    )}
                  </div>
                ))
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Styles for gradient progress + focus mode */}
      <style jsx global>{`
        .sw-progress .p-progressbar {
          height: 0.9rem;
          border-radius: 9999px;
          background: rgba(120, 120, 120, 0.15);
        }
        .sw-progress .p-progressbar-value {
          border-radius: 9999px;
          background: linear-gradient(90deg, #ef4444 0%, #f59e0b 40%, #22c55e 100%);
        }

        .sw-dim {
          filter: blur(3px) brightness(0.75);
          opacity: 0.6;
          transition: filter 0.25s ease, opacity 0.25s ease;
        }
        .sw-focus {
          box-shadow:
            0 0 0 1px rgba(139, 92, 246, 0.5),
            0 0 16px rgba(138, 92, 246, 0.14);
          transform: scale(1.01);
          transition: transform 0.15s ease, box-shadow 0.25s ease;
          border-radius: 12px;
        }
      `}</style>
    </div>
  );
};

export default CoachPage;
