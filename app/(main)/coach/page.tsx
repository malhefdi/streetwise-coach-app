'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Slider } from 'primereact/slider';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Avatar } from 'primereact/avatar';
import { Checkbox } from 'primereact/checkbox';
import { getCurriculum, getAllCurricula } from '@/app/data/curriculum';
import { dataService } from '@/app/services/dataService';
import type { Lesson, Slice } from '@/app/data/curriculum';
import type { Student } from '@/app/types/student.types';
import type { StudentPlan, StepProgress as StepProgressType, SliceProgress, LessonProgress as LessonProgressType, SparringProgress } from '@/app/types/plan.types';

// Import new components
import SessionHeader from './components/SessionHeader';
import SessionSummaryGrid from './components/SessionSummaryGrid';
import NextSessionCard from './components/NextSessionCard';
import ActionBar from './components/ActionBar';
import BatchActionDialog from './components/BatchActionDialog';

const allCurricula = getAllCurricula();

// ---------- Types ----------
type Importance = 'standard' | 'important' | 'critical';
type NextAction = 'Teach' | 'Review' | 'Reteach';

interface StepState {
  confidence: number;        // 0-100
  completed: boolean;
  notes: string;
  description: string;       // The step instruction itself
  importance: Importance;
  nextAction?: NextAction;
}

interface SparringState {
  rapidMasteryCompleted: boolean;
  rapidMasteryNotes: string;
  focusSparringCompleted: boolean;
  focusSparringNotes: string;
}

interface LegacyLessonProgress {
  [sliceKey: string]: StepState[]; // e.g., "gc2-l1-s2" -> steps[]
}

interface SessionData {
  [sliceKey: string]: StepState[] | SparringState; // e.g., "gc2-l1-s2" -> steps[] or sparring state
}

// ---------- Helpers ----------
const DEFAULT_STEP_STATE = (description = ''): StepState => ({
  confidence: 50,
  completed: false,
  notes: '',
  description,
  importance: 'standard'
});

const loadSession = (): SessionData => {
  try {
    const data = localStorage.getItem('coachSession_v6');
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};
const saveSession = (data: SessionData) => localStorage.setItem('coachSession_v6', JSON.stringify(data));

const formatTime = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
};

// ---------- Page ----------
const CoachPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const studentId = searchParams.get('student');
  
  // Student & Plan state
  const [student, setStudent] = useState<Student | null>(null);
  const [plan, setPlan] = useState<StudentPlan | null>(null);
  const [planLessons, setPlanLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  
  // Session state
  const [session, setSession] = useState<LegacyLessonProgress>({});
  const [elapsed, setElapsed] = useState(0);
  const [sparringState, setSparringState] = useState<SparringState>({
    rapidMasteryCompleted: false,
    rapidMasteryNotes: '',
    focusSparringCompleted: false,
    focusSparringNotes: ''
  });

  // UI state
  const [activeLessons, setActiveLessons] = useState<number[]>([]);
  const [activeSlices, setActiveSlices] = useState<Record<string, number[]>>({});
  const [summaryVisible, setSummaryVisible] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  
  // Sync with global focus mode
  useEffect(() => {
    const handleFocusModeChange = () => {
      const isGlobalFocusMode = document.body.classList.contains('focus-mode');
      setFocusMode(isGlobalFocusMode);
    };
    
    // Check initial state
    handleFocusModeChange();
    
    // Listen for changes
    const observer = new MutationObserver(handleFocusModeChange);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);
  
  // Batch operations state
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [batchActionType, setBatchActionType] = useState<'confidence' | 'complete' | 'incomplete'>('complete');
  const [batchTarget, setBatchTarget] = useState<{lessonId?: string, sliceKey?: string}>({});
  const [batchItemCount, setBatchItemCount] = useState(0);

  // Timer
  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Load student data and plan
  useEffect(() => {
    const loadStudentData = async () => {
      if (studentId) {
        setLoading(true);
        try {
          const s = await dataService.getStudent(studentId);
          setStudent(s);

          if (s?.planId) {
            const p = await dataService.getStudentPlan(studentId);
            setPlan(p);

            if (p) {
              // Collect lessons from all curricula based on plan
              const ordered: Lesson[] = [];
              
              p.lessonIds.forEach(id => {
                for (const curriculum of allCurricula) {
                  const lesson = curriculum.lessons.find(l => l.id === id);
                  if (lesson) {
                    ordered.push(lesson);
                    break;
                  }
                }
              });
              
              setPlanLessons(ordered);
            }
          } else {
            // Student has no plan - show warning
            setPlanLessons([]);
          }
        } catch (error) {
          console.error('Error loading student data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        // No student selected - show selector
        setLoading(false);
        setShowStudentSelector(true);
        // Load all students for selector
        const students = await dataService.getStudents();
        setAllStudents(students.filter(s => s.planId)); // Only students with plans
      }
    };

    loadStudentData();
  }, [studentId]);

  // Load / Save session
  useEffect(() => {
    const loadedSession = loadSession();
    const { sparring, ...stepData } = loadedSession;
    setSession(stepData as LegacyLessonProgress);
    if (sparring && typeof sparring === 'object' && 'rapidMasteryCompleted' in sparring) {
      setSparringState(sparring as SparringState);
    }
  }, []);
  useEffect(() => {
    saveSession({ ...session, sparring: sparringState });
  }, [session, sparringState]);

  // ---------- Compute ----------
  const lessonIdOf = (l: Lesson) => l.id;
  const sliceKeyOf = (lessonId: string, sIdx: number) => `${lessonId}-s${sIdx + 1}`;

  const computeLessonCompletion = (lessonId: string) => {
    const keys = Object.keys(session).filter((k) => k.startsWith(`${lessonId}-`));
    const all = keys.flatMap((k) => session[k] || []);
    if (!all.length) return 0;
    const done = all.filter((s) => s.completed).length;
    return Math.round((done / all.length) * 100);
  };

  // Build "next session" report items
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

  // Compute overall progress
  const overallProgress = useMemo(() => {
    const allSteps = Object.values(session).flat();
    if (allSteps.length === 0) return 0;
    const completedSteps = allSteps.filter(s => s.completed).length;
    return Math.round((completedSteps / allSteps.length) * 100);
  }, [session]);

  // Compute completed and total steps
  const { completedSteps, totalSteps } = useMemo(() => {
    const allSteps = Object.values(session).flat();
    const completed = allSteps.filter(s => s.completed).length;
    return { completedSteps: completed, totalSteps: allSteps.length };
  }, [session]);

  // Build summary data for grid
  const summaryData = useMemo(() => {
    return Object.entries(session).map(([key, steps]) => {
      const completed = steps.filter(s => s.completed).length;
      const avgConfidence = steps.length > 0 
        ? Math.round(steps.reduce((sum, s) => sum + s.confidence, 0) / steps.length)
        : 0;
      const hasNextAction = steps.some(s => s.nextAction);
      const nextAction = steps.find(s => s.nextAction)?.nextAction;
      
      return {
        lessonName: key.split('-')[0] + ' ' + key.split('-')[1],
        sliceName: key.split('-')[2] || 'Unknown',
        stepsComplete: completed,
        totalSteps: steps.length,
        completionPercentage: steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0,
        avgConfidence,
        nextAction,
        completed: completed === steps.length && steps.length > 0,
        inProgress: completed > 0 && completed < steps.length,
        notStarted: completed === 0
      };
    });
  }, [session]);

  // ---------- Batch Operations ----------
  const handleBatchAction = (actionType: 'confidence' | 'complete' | 'incomplete', target: {lessonId?: string, sliceKey?: string}, value?: number) => {
    setSession(prev => {
      const newSession = { ...prev };
      
      if (target.lessonId) {
        // Lesson-level batch action
        const keys = Object.keys(newSession).filter(k => k.startsWith(`${target.lessonId}-`));
        keys.forEach(key => {
          newSession[key] = newSession[key].map(step => {
            if (actionType === 'confidence' && value !== undefined) {
              return { ...step, confidence: value };
            } else if (actionType === 'complete') {
              return { ...step, completed: true };
            } else if (actionType === 'incomplete') {
              return { ...step, completed: false };
            }
            return step;
          });
        });
      } else if (target.sliceKey) {
        // Slice-level batch action
        if (newSession[target.sliceKey]) {
          newSession[target.sliceKey] = newSession[target.sliceKey].map(step => {
            if (actionType === 'confidence' && value !== undefined) {
              return { ...step, confidence: value };
            } else if (actionType === 'complete') {
              return { ...step, completed: true };
            } else if (actionType === 'incomplete') {
              return { ...step, completed: false };
            }
            return step;
          });
        }
      }
      
      return newSession;
    });
  };

  const showBatchActionDialog = (actionType: 'confidence' | 'complete' | 'incomplete', target: {lessonId?: string, sliceKey?: string}) => {
    setBatchActionType(actionType);
    setBatchTarget(target);
    
    // Count items
    let count = 0;
    if (target.lessonId) {
      const keys = Object.keys(session).filter(k => k.startsWith(`${target.lessonId}-`));
      count = keys.reduce((sum, key) => sum + session[key].length, 0);
    } else if (target.sliceKey) {
      count = session[target.sliceKey]?.length || 0;
    }
    
    setBatchItemCount(count);
    setShowBatchDialog(true);
  };

  // ---------- Mutations ----------
  const ensureSlicePersisted = (lessonId: string, sIdx: number, slice: Slice): StepState[] => {
    const key = sliceKeyOf(lessonId, sIdx);
    const current = session[key];
    if (current && current.length) {
      // Ensure existing steps have descriptions (for backward compatibility)
      return current.map((state, idx) => ({
        ...state,
        description: state.description || slice.steps?.[idx]?.description || `Step ${idx + 1}`
      }));
    }

    // Seed with defaults matching the curriculum step count
    const baseSteps = slice.steps || [];
    return Array.from({ length: baseSteps.length || 1 }, (_, idx) => 
      DEFAULT_STEP_STATE(baseSteps[idx]?.description || `Step ${idx + 1}`)
    );
  };

  const updateStep = (lessonId: string, sIdx: number, stIdx: number, updates: Partial<StepState>, slice: Slice) => {
    setSession((prev) => {
      const key = sliceKeyOf(lessonId, sIdx);
      const steps = ensureSlicePersisted(lessonId, sIdx, slice);
      steps[stIdx] = { ...steps[stIdx], ...updates };
      return { ...prev, [key]: steps };
    });
  };

  const addStep = (lessonId: string, sIdx: number, slice: Slice) => {
    setSession((prev) => {
      const key = sliceKeyOf(lessonId, sIdx);
      const steps = ensureSlicePersisted(lessonId, sIdx, slice);
      steps.push(DEFAULT_STEP_STATE('New step - edit to add instructions'));
      return { ...prev, [key]: steps };
    });
  };

  const removeStep = (lessonId: string, sIdx: number, slice: Slice) => {
    setSession((prev) => {
      const key = sliceKeyOf(lessonId, sIdx);
      const steps = ensureSlicePersisted(lessonId, sIdx, slice);
      if (steps.length > 1) steps.pop(); // keep at least 1 step
      return { ...prev, [key]: steps };
    });
  };

  // Sync session data to student progress system
  const syncProgressToDataService = async () => {
    if (!student || !plan) return;

    try {
      // Convert legacy session format to new progress format
      for (const lesson of planLessons) {
        const lessonId = lessonIdOf(lesson);
        
        // Check if this lesson has any session data
        const lessonKeys = Object.keys(session).filter(k => k.startsWith(`${lessonId}-`));
        if (lessonKeys.length === 0) continue;

        const sliceProgresses: SliceProgress[] = lesson.slices.map((slice, sIdx) => {
          const key = sliceKeyOf(lessonId, sIdx);
          const stepStates = session[key] || [];
          
          const steps: StepProgressType[] = stepStates.map((state, stepIdx) => ({
            stepNumber: stepIdx + 1,
            completed: state.completed,
            confidence: state.confidence,
            notes: state.notes,
            importance: state.importance,
            nextAction: state.nextAction
          }));

          return {
            sliceId: slice.id,
            steps
          };
        });

        const lessonProgress: LessonProgressType = {
          lessonId,
          slices: sliceProgresses,
          startedAt: new Date().toISOString(),
          notes: ''
        };

        await dataService.updateProgress(student.id, lessonId, lessonProgress);
      }

      alert('Session progress saved successfully!');
    } catch (error) {
      console.error('Error syncing progress:', error);
      alert('Failed to save progress. Please try again.');
    }
  };

  // ---------- Render ----------
  if (loading) {
    return (
      <div className="p-5 text-center">
        <i className="pi pi-spin pi-spinner text-4xl text-primary mb-3"></i>
        <h3>Loading coaching session...</h3>
      </div>
    );
  }

  if (!student || !plan || planLessons.length === 0) {
    return (
      <div className="p-5">
        <Card className="shadow-2 border-round-2xl">
          <div className="text-center p-5">
            <i className="pi pi-exclamation-triangle text-6xl text-orange-500 mb-3"></i>
            <h3 className="text-2xl mb-2">
              {!student ? 'No Student Selected' : 'No Lesson Plan'}
            </h3>
            <p className="text-color-secondary mb-4">
              {!student 
                ? 'Please select a student with an active lesson plan to start a coaching session.'
                : `${student.name} doesn't have a lesson plan yet. Please create one first.`
              }
            </p>
            <div className="flex gap-2 justify-content-center">
              <Button
                label="Select Student"
                icon="pi pi-users"
                onClick={() => setShowStudentSelector(true)}
              />
              {student && (
                <Button
                  label="Create Plan"
                  icon="pi pi-plus"
                  severity="success"
                  onClick={() => router.push(`/students/${student.id}`)}
                />
              )}
            </div>
          </div>
        </Card>

        {/* Student Selector Dialog */}
        <Dialog
          visible={showStudentSelector}
          onHide={() => setShowStudentSelector(false)}
          header="Select Student"
          style={{ width: '600px' }}
          modal
        >
          <DataTable
            value={allStudents}
            selectionMode="single"
            onRowClick={(e) => {
              router.push(`/coach?student=${e.data.id}`);
              setShowStudentSelector(false);
            }}
            emptyMessage="No students with lesson plans found"
          >
            <Column field="name" header="Name" />
            <Column field="rank" header="Rank" />
            <Column 
              header="Lessons"
              body={(rowData: Student) => {
                // Would need to load plan to show count, showing placeholder
                return <Tag value="Has Plan" severity="success" />;
              }}
            />
          </DataTable>
        </Dialog>
      </div>
    );
  }

  const lessons = planLessons; // Use plan lessons instead of all curriculum

  return (
    <div className="page-wrapper p-4">
      {/* Session Header */}
      <SessionHeader
        student={student}
        plan={plan}
        elapsed={elapsed}
        overallProgress={overallProgress}
        focusMode={focusMode}
        summaryVisible={summaryVisible}
        onSaveProgress={() => {
          saveSession(session);
          syncProgressToDataService();
        }}
        onChangeStudent={() => setShowStudentSelector(true)}
        onToggleFocus={() => {
          // Toggle global focus mode
          const event = new CustomEvent('toggle-focus-mode');
          window.dispatchEvent(event);
        }}
        onToggleSummary={() => setSummaryVisible((v) => !v)}
      />

      {/* Student Selector Dialog */}
      <Dialog
        visible={showStudentSelector}
        onHide={() => setShowStudentSelector(false)}
        header="Select Student"
        style={{ width: '600px' }}
        modal
      >
        <DataTable
          value={allStudents}
          selectionMode="single"
          onRowClick={(e) => {
            router.push(`/coach?student=${e.data.id}`);
            setShowStudentSelector(false);
          }}
          emptyMessage="No students with lesson plans found"
        >
          <Column field="name" header="Name" />
          <Column field="rank" header="Rank" />
          <Column 
            header="Plan"
            body={(rowData: Student) => (
              <Tag value="Has Plan" severity="success" icon="pi pi-check" />
            )}
          />
        </DataTable>
      </Dialog>

      <div className="grid">
        {/* Lessons column */}
        <div className={`col-12 ${summaryVisible ? 'md:col-8' : 'md:col-12'}`}>
          {/* Enhanced Lesson Cards */}
          {lessons.map((lesson, lIdx) => {
            const lessonId = lessonIdOf(lesson);
            const progress = computeLessonCompletion(lessonId);
            const lessonSteps = Object.keys(session).filter(k => k.startsWith(`${lessonId}-`));
            const allSteps = lessonSteps.flatMap(key => session[key] || []);
            const avgConfidence = allSteps.length > 0 
              ? Math.round(allSteps.reduce((sum, s) => sum + s.confidence, 0) / allSteps.length)
              : 0;

            return (
              <Card key={lessonId} className="sw-lesson-card">
                {/* Card Header */}
                <div className="flex justify-content-between align-items-center mb-2 sw-lesson-header">
                  <div className="flex align-items-center gap-2">
                    <Avatar 
                      label={`L${lesson.lessonNumber}`} 
                      shape="circle"
                      className="sw-lesson-avatar"
                    />
                    <div>
                      <h3 className="sw-lesson-title">{lesson.technique}</h3>
                      <div className="sw-lesson-subtitle">
                        {lesson.chapterTitle}
                      </div>
                    </div>
                  </div>
                  
                  {/* Batch Actions */}
                  <div className="flex gap-1 sw-batch-actions">
                    <Button 
                      icon="pi pi-check-square" 
                      rounded 
                      text
                      severity="success"
                      tooltip="Mark All Complete"
                      onClick={() => showBatchActionDialog('complete', {lessonId})}
                    />
                    <Button 
                      icon="pi pi-times-circle" 
                      rounded 
                      text
                      severity="danger"
                      tooltip="Mark All Incomplete"
                      onClick={() => showBatchActionDialog('incomplete', {lessonId})}
                    />
                    <Button 
                      icon="pi pi-sliders-h" 
                      rounded 
                      text
                      severity="info"
                      tooltip="Set Confidence"
                      onClick={() => showBatchActionDialog('confidence', {lessonId})}
                    />
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="sw-lesson-progress">
                  <ProgressBar 
                    value={progress} 
                    showValue 
                    className="sw-progress sw-progress-thick"
                  />
                </div>
                
                {/* Stats Row */}
                <div className="flex gap-3 text-sm sw-lesson-stats">
                  <Tag severity="info" value={`${lesson.slices.length} slices`} />
                  <Tag 
                    severity={avgConfidence >= 80 ? 'success' : avgConfidence >= 60 ? 'warning' : 'danger'}
                    value={`${avgConfidence}% avg confidence`}
                  />
                </div>

                {/* Slices Accordion */}
                <Accordion
                  multiple
                  activeIndex={activeSlices[lessonId] || []}
                  onTabChange={(e) =>
                    setActiveSlices({
                      ...activeSlices,
                      [lessonId]: Array.isArray(e.index) ? e.index : [e.index]
                    })
                  }
                  className="mt-3"
                >
                  {lesson.slices.map((slice, sIdx) => {
                    const baseSteps = slice.steps || [];
                    const key = sliceKeyOf(lessonId, sIdx);
                    const persisted = ensureSlicePersisted(lessonId, sIdx, slice);
                    const maxLen = persisted.length;
                    const sliceSteps = persisted;
                    const allSliceComplete = sliceSteps.every(s => s.completed);
                    const sliceProgress = sliceSteps.length > 0 
                      ? Math.round((sliceSteps.filter(s => s.completed).length / sliceSteps.length) * 100)
                      : 0;

                    return (
                      <AccordionTab
                        key={`${lessonId}-s${sIdx + 1}`}
                        header={
                          <div className="flex justify-content-between align-items-center w-full">
                            <div className="flex align-items-center gap-2">
                              <span className="font-semibold">{`Slice ${sIdx + 1}: ${slice.title}`}</span>
                              <Tag 
                                value={`${sliceProgress}%`}
                                severity={sliceProgress === 100 ? 'success' : sliceProgress > 0 ? 'warning' : 'danger'}
                                className="text-xs"
                              />
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                icon={allSliceComplete ? "pi pi-check-square" : "pi pi-square"}
                                rounded 
                                text
                                size="small"
                                severity={allSliceComplete ? "success" : "secondary"}
                                tooltip="Toggle All Steps"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showBatchActionDialog(allSliceComplete ? 'incomplete' : 'complete', {sliceKey: key});
                                }}
                              />
                            </div>
                          </div>
                        }
                      >
                        {/* Steps */}
                        {Array.from({ length: maxLen }).map((_, stIdx) => {
                          const state = persisted[stIdx] ?? DEFAULT_STEP_STATE();

                          return (
                            <div
                              key={stIdx}
                              className={`sw-step-card ${state.importance !== 'standard' ? `importance-${state.importance}` : ''} ${state.completed ? 'completed' : ''}`}
                            >
                              <div className="flex justify-content-between align-items-center mb-2 sw-step-header">
                                <div className="flex align-items-center gap-2">
                                  <Checkbox 
                                    checked={state.completed}
                                    onChange={(e: any) => updateStep(lessonId, sIdx, stIdx, { completed: e.checked || false }, slice)}
                                    className="sw-step-checkbox"
                                  />
                                  <span className="sw-step-description">
                                    {state.description || `Step ${stIdx + 1}`}
                                  </span>
                                </div>
                                <div className="flex gap-2 sw-step-tags">
                                  <Tag 
                                    severity="info" 
                                    value={`${Math.round(state.confidence)}%`} 
                                  />
                                  {state.importance !== 'standard' && (
                                    <Tag 
                                      severity={state.importance === 'critical' ? 'danger' : 'warning'}
                                      value={state.importance}
                                    />
                                  )}
                                </div>
                              </div>

                              {/* Collapsible Controls */}
                              <div className="sw-step-controls">
                                <div className="grid">
                                  <div className="col-12">
                                    <label className="block text-sm font-semibold mb-2">
                                      Confidence
                                    </label>
                                    <Slider 
                                      value={state.confidence}
                                      onChange={(e) => updateStep(lessonId, sIdx, stIdx, { confidence: e.value as number }, slice)}
                                      className="w-full sw-confidence-control"
                                    />
                                  </div>
                                  
                                  <div className="col-12">
                                    <label className="block text-sm font-semibold mb-2">
                                      Importance
                                    </label>
                                    <div className="flex gap-2 sw-importance-control">
                                      {(['standard', 'important', 'critical'] as Importance[]).map((imp) => (
                                        <Button
                                          key={imp}
                                          label={imp}
                                          size="small"
                                          severity={state.importance === imp ? 'info' : 'secondary'}
                                          outlined={state.importance !== imp}
                                          onClick={() => updateStep(lessonId, sIdx, stIdx, { importance: imp }, slice)}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  
                                  <div className="col-12">
                                    <label className="block text-sm font-semibold mb-2">
                                      Next Action
                                    </label>
                                    <Dropdown
                                      value={state.nextAction}
                                      options={['Teach', 'Review', 'Reteach']}
                                      placeholder="Next..."
                                      className="w-full"
                                      onChange={(e) => updateStep(lessonId, sIdx, stIdx, { nextAction: e.value as NextAction }, slice)}
                                    />
                                  </div>
                                  
                                  <div className="col-12">
                                    <label className="block text-sm font-semibold mb-2">
                                      Coach Notes
                                    </label>
                                    <InputTextarea 
                                      value={state.notes}
                                      onChange={(e) => updateStep(lessonId, sIdx, stIdx, { notes: e.target.value }, slice)}
                                      placeholder="Add your coaching observations..."
                                      rows={3}
                                      className="sw-notes-control"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Add / Remove buttons */}
                        <div className="flex gap-2 justify-content-end mt-3">
                          <Button
                            icon="pi pi-plus"
                            label="Add Step"
                            size="small"
                            outlined
                            severity="success"
                            onClick={() => addStep(lessonId, sIdx, slice)}
                          />
                          {maxLen > 1 && (
                            <Button
                              icon="pi pi-minus"
                              label="Remove Last Step"
                              size="small"
                              outlined
                              severity="danger"
                              onClick={() => removeStep(lessonId, sIdx, slice)}
                            />
                          )}
                        </div>
                      </AccordionTab>
                    );
                  })}
                </Accordion>
              </Card>
            );
          })}
        </div>

        {/* Summary column */}
        {summaryVisible && (
          <div className="col-12 md:col-4">
            <div className="flex flex-column gap-3">
              {/* Session Summary Grid */}
              <SessionSummaryGrid
                summaryData={summaryData}
                onExport={() => {
                  // TODO: Implement export functionality
                  console.log('Export session data');
                }}
                onPrint={() => {
                  // TODO: Implement print functionality
                  console.log('Print session data');
                }}
              />

              {/* Next Session Actions Card */}
              <NextSessionCard
                teachItems={nextSessionItems.filter(item => item.nextAction === 'Teach').map(item => ({
                  key: `${item.key}-${item.stepNumber}`,
                  stepNumber: item.stepNumber,
                  description: item.notes || `Step ${item.stepNumber}`,
                  lessonName: item.key.split('-')[0] + ' ' + item.key.split('-')[1],
                  sliceName: item.key.split('-')[2] || 'Unknown',
                  checked: false
                }))}
                reviewItems={nextSessionItems.filter(item => item.nextAction === 'Review').map(item => ({
                  key: `${item.key}-${item.stepNumber}`,
                  stepNumber: item.stepNumber,
                  description: item.notes || `Step ${item.stepNumber}`,
                  lessonName: item.key.split('-')[0] + ' ' + item.key.split('-')[1],
                  sliceName: item.key.split('-')[2] || 'Unknown',
                  checked: false
                }))}
                reteachItems={nextSessionItems.filter(item => item.nextAction === 'Reteach').map(item => ({
                  key: `${item.key}-${item.stepNumber}`,
                  stepNumber: item.stepNumber,
                  description: item.notes || `Step ${item.stepNumber}`,
                  lessonName: item.key.split('-')[0] + ' ' + item.key.split('-')[1],
                  sliceName: item.key.split('-')[2] || 'Unknown',
                  checked: false
                }))}
                onItemCheck={(key, checked) => {
                  // TODO: Implement item check functionality
                  console.log('Item check:', key, checked);
                }}
                onPrintSummary={() => {
                  // TODO: Implement print summary
                  console.log('Print summary');
                }}
                onEmailStudent={() => {
                  // TODO: Implement email student
                  console.log('Email student');
                }}
                onClearAll={() => {
                  // TODO: Implement clear all
                  console.log('Clear all');
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Fixed Action Bar */}
      <ActionBar
        elapsed={elapsed}
        completedSteps={completedSteps}
        totalSteps={totalSteps}
        onSave={() => {
          saveSession(session);
          syncProgressToDataService();
        }}
        onEndSession={() => {
          // TODO: Implement end session functionality
          console.log('End session');
        }}
        onExportSession={() => {
          // TODO: Implement export session
          console.log('Export session');
        }}
        onPrintSession={() => {
          // TODO: Implement print session
          console.log('Print session');
        }}
        onEmailSummary={() => {
          // TODO: Implement email summary
          console.log('Email summary');
        }}
      />

      {/* Batch Action Dialog */}
      <BatchActionDialog
        visible={showBatchDialog}
        onHide={() => setShowBatchDialog(false)}
        actionType={batchActionType}
        itemCount={batchItemCount}
        onConfirm={(value) => {
          handleBatchAction(batchActionType, batchTarget, value);
        }}
      />

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
