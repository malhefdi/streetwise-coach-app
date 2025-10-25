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
import { getTestDrillsForCurriculum } from '@/app/services/testDrillService';
import type { Lesson, Slice } from '@/app/data/curriculum';
import type { Student } from '@/app/types/student.types';
import type { StudentPlan, StepProgress as StepProgressType, SliceProgress, LessonProgress as LessonProgressType, SparringProgress } from '@/app/types/plan.types';
import type { TestDrillReadiness, TestDrill } from '@/app/types/test-drill.types';

// Import new components
import SessionHeader from './components/SessionHeader';
import SessionSummaryGrid from './components/SessionSummaryGrid';
import NextSessionCard from './components/NextSessionCard';
import ActionBar from './components/ActionBar';
import BatchActionDialog from './components/BatchActionDialog';
import DashboardOverview from './components/DashboardOverview';
import AggregateSessionSummary from './components/AggregateSessionSummary';
import AggregateNextActions from './components/AggregateNextActions';
import TestDrillsUtilities from './components/TestDrillsUtilities';
import LessonEditorDialog from '../students/[id]/components/LessonEditorDialog';

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
  
  // Dashboard state
  const [sidebarTab, setSidebarTab] = useState<'summary' | 'actions' | 'testdrills'>('summary');
  const [expandedLessons, setExpandedLessons] = useState<string[]>([]);
  const [testDrillsData, setTestDrillsData] = useState<Map<string, TestDrillReadiness[]>>(new Map());
  const [allStudentsWithStats, setAllStudentsWithStats] = useState<any[]>([]);
  const [testDrills, setTestDrills] = useState<TestDrill[]>([]);
  
  // Lesson editing state
  const [showLessonEditor, setShowLessonEditor] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  
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

  // Expand/collapse functions
  const expandAllLessons = () => {
    const allExpanded = planLessons.map(lesson => lesson.id);
    setExpandedLessons(allExpanded);
  };

  const collapseAllLessons = () => {
    setExpandedLessons([]);
  };

  const toggleLessonExpansion = (lessonId: string) => {
    setExpandedLessons(prev => 
      prev.includes(lessonId) 
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  };

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
        // No student selected - load dashboard data
        setLoading(true);
        try {
          const students = await dataService.getStudents();
          const studentsWithPlans = students.filter(s => s.planId);
          setAllStudents(studentsWithPlans);

          // Load test drill data for all students
          const drillsMap = new Map<string, TestDrillReadiness[]>();
          const studentsWithStats = [];

          for (const student of studentsWithPlans) {
            try {
              const plan = await dataService.getStudentPlan(student.id);
              const progress = await dataService.getStudentProgress(student.id);
              const curriculum = plan ? getCurriculum('gc2') : null;
              
              if (curriculum) {
                // Calculate test drill readiness
                const testDrills = getTestDrillsForCurriculum(curriculum.id);
                const readiness = testDrills.map(drill => {
                  // Mock readiness calculation - in real app this would use the service
                  const mockReadiness: TestDrillReadiness = {
                    drillNumber: drill.drillNumber,
                    isReady: Math.random() > 0.5,
                    missingLessons: [],
                    completionPercentage: Math.floor(Math.random() * 100)
                  };
                  return mockReadiness;
                });
                
                drillsMap.set(student.id, readiness);

                // Calculate student stats
                const studentStats = {
                  ...student,
                  overallProgress: Math.floor(Math.random() * 100),
                  lessonsCompleted: Math.floor(Math.random() * 20),
                  avgConfidence: Math.floor(Math.random() * 100),
                  testReadiness: readiness,
                  status: readiness.some(r => r.isReady) ? 'ready-to-test' : 
                         readiness.some(r => r.completionPercentage > 50) ? 'needs-attention' : 'active',
                  recentActivity: 'Last session 2 days ago'
                };
                studentsWithStats.push(studentStats);
              }
            } catch (error) {
              console.error(`Error loading data for student ${student.id}:`, error);
            }
          }

          setTestDrillsData(drillsMap);
          setAllStudentsWithStats(studentsWithStats);
          
          // Load test drills for the first curriculum (GC2)
          const gc2Curriculum = getCurriculum('gc2');
          if (gc2Curriculum) {
            setTestDrills(getTestDrillsForCurriculum('gc2'));
          }
        } catch (error) {
          console.error('Error loading dashboard data:', error);
        } finally {
          setLoading(false);
        }
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

  // Calculate dashboard stats
  const dashboardStats = useMemo(() => {
    if (allStudentsWithStats.length === 0) {
      return {
        totalStudents: 0,
        totalLessonsInProgress: 0,
        averageProgress: 0,
        upcomingSessions: 0,
        recentActivity: 0,
        testDrillsReady: 0,
        curriculumCompletion: 0,
        masteryRate: 0,
        averageMastery: 0,
        advancedStudents: 0
      };
    }

    const totalStudents = allStudentsWithStats.length;
    const totalLessonsInProgress = allStudentsWithStats.reduce((sum, s) => sum + s.lessonsCompleted, 0);
    const averageProgress = Math.round(allStudentsWithStats.reduce((sum, s) => sum + s.overallProgress, 0) / totalStudents);
    const upcomingSessions = allStudentsWithStats.filter(s => s.status === 'needs-attention').length;
    const recentActivity = allStudentsWithStats.filter(s => s.recentActivity.includes('today') || s.recentActivity.includes('yesterday')).length;
    const testDrillsReady = allStudentsWithStats.filter(s => s.testReadiness.some((r: any) => r.isReady)).length;
    
    // Curriculum & Mastery KPIs
    const curriculumCompletion = averageProgress; // Overall progress represents curriculum completion
    const masteryRate = Math.round((allStudentsWithStats.filter(s => s.overallProgress >= 80).length / totalStudents) * 100);
    const averageMastery = Math.round(allStudentsWithStats.reduce((sum, s) => sum + (s.avgConfidence || 0), 0) / totalStudents);
    const advancedStudents = allStudentsWithStats.filter(s => s.overallProgress >= 70 && s.avgConfidence >= 75).length;

    return {
      totalStudents,
      totalLessonsInProgress,
      averageProgress,
      upcomingSessions,
      recentActivity,
      testDrillsReady,
      curriculumCompletion,
      masteryRate,
      averageMastery,
      advancedStudents
    };
  }, [allStudentsWithStats]);

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

  // Dashboard handlers
  const handleStartSession = (studentId: string) => {
    router.push(`/coach?student=${studentId}`);
  };

  const handleStartTest = (studentId: string, drillNumber: number) => {
    // Navigate to test drill session
    router.push(`/coach?student=${studentId}&test=${drillNumber}`);
  };

  const handlePrintChecklist = (studentId: string, drillNumber: number) => {
    // Print test checklist
    console.log(`Printing checklist for student ${studentId}, drill ${drillNumber}`);
  };

  const handleViewPrerequisites = (studentId: string, drillNumber: number) => {
    // Show prerequisites dialog
    console.log(`Viewing prerequisites for student ${studentId}, drill ${drillNumber}`);
  };

  const handleExport = () => {
    // Export aggregate data
    console.log('Exporting aggregate data');
  };

  const handlePrint = () => {
    // Print aggregate report
    console.log('Printing aggregate report');
  };

  const handleItemCheck = (actionId: string, checked: boolean) => {
    // Handle item check in aggregate actions
    console.log(`Item ${actionId} checked: ${checked}`);
  };

  // Lesson editing handlers for coach page
  const handleEditLesson = (lessonId: string) => {
    const lesson = planLessons.find(l => l.id === lessonId);
    if (lesson) {
      setEditingLesson(lesson);
      setShowLessonEditor(true);
    }
  };

  const handleSaveLesson = async (updatedLesson: Lesson) => {
    if (!studentId) return;
    try {
      await dataService.updateStudentLesson(studentId, updatedLesson.id, updatedLesson);
      // Reload data to reflect changes
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
            }
          } catch (error) {
            console.error('Error loading student data:', error);
          } finally {
            setLoading(false);
          }
        }
      };
      await loadStudentData();
    } catch (error) {
      console.error('Error saving lesson:', error);
      throw error;
    }
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
        <div className="grid">
          {/* Main Content - 8 columns */}
          <div className="col-12 lg:col-8">
            {!student ? (
              <DashboardOverview
                stats={dashboardStats}
                students={allStudentsWithStats}
                onStartSession={handleStartSession}
                onStartTest={handleStartTest}
              />
            ) : (
              <Card className="shadow-2 border-round-2xl">
                <div className="text-center p-5">
                  <i className="pi pi-exclamation-triangle text-6xl text-orange-500 mb-3"></i>
                  <h3 className="text-2xl mb-2">No Lesson Plan</h3>
                  <p className="text-color-secondary mb-4">
                    {student.name} doesn't have a lesson plan yet. Please create one first.
                  </p>
                  <div className="flex gap-2 justify-content-center">
                    <Button
                      label="Select Student"
                      icon="pi pi-users"
                      onClick={() => setShowStudentSelector(true)}
                    />
                    <Button
                      label="Create Plan"
                      icon="pi pi-plus"
                      severity="success"
                      onClick={() => router.push(`/students/${student.id}`)}
                    />
                  </div>
                </div>
              </Card>
            )}
          </div>
          
          {/* Sidebar - 4 columns with tabs */}
          <div className="col-12 lg:col-4">
            <Card>
              <div className="flex gap-2 mb-3">
                <Button
                  label="Summary"
                  size="small"
                  severity={sidebarTab === 'summary' ? 'info' : 'secondary'}
                  outlined={sidebarTab !== 'summary'}
                  onClick={() => setSidebarTab('summary')}
                />
                <Button
                  label="Actions"
                  size="small"
                  severity={sidebarTab === 'actions' ? 'info' : 'secondary'}
                  outlined={sidebarTab !== 'actions'}
                  onClick={() => setSidebarTab('actions')}
                />
                <Button
                  label="Test Drills"
                  size="small"
                  severity={sidebarTab === 'testdrills' ? 'info' : 'secondary'}
                  outlined={sidebarTab !== 'testdrills'}
                  onClick={() => setSidebarTab('testdrills')}
                />
              </div>
              
              {sidebarTab === 'summary' && (
                <AggregateSessionSummary
                  students={allStudentsWithStats}
                  onExport={handleExport}
                  onPrint={handlePrint}
                />
              )}
              {sidebarTab === 'actions' && (
                <AggregateNextActions
                  students={allStudentsWithStats}
                  onItemCheck={handleItemCheck}
                  onStartTest={handleStartTest}
                />
              )}
              {sidebarTab === 'testdrills' && (
                <TestDrillsUtilities
                  student={student}
                  allStudents={allStudentsWithStats}
                  testDrills={testDrills}
                  onStartTest={handleStartTest}
                  onPrintChecklist={handlePrintChecklist}
                  onViewPrerequisites={handleViewPrerequisites}
                />
              )}
            </Card>
          </div>
        </div>

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
        {/* Main Content - 8 columns */}
        <div className="col-12 lg:col-8">
          {/* Expand/Collapse Controls */}
          <div className="flex justify-content-between align-items-center mb-3">
            <h5 className="m-0">Lesson Cards</h5>
            <div className="flex gap-2">
              <Button
                label="Expand All"
                icon="pi pi-chevron-down"
                size="small"
                outlined
                onClick={expandAllLessons}
              />
              <Button
                label="Collapse All"
                icon="pi pi-chevron-up"
                size="small"
                outlined
                onClick={collapseAllLessons}
              />
            </div>
          </div>
          {/* Enhanced Lesson Cards */}
          {lessons.map((lesson, lIdx) => {
            const lessonId = lessonIdOf(lesson);
            const progress = computeLessonCompletion(lessonId);
            const lessonSteps = Object.keys(session).filter(k => k.startsWith(`${lessonId}-`));
            const allSteps = lessonSteps.flatMap(key => session[key] || []);
            const avgConfidence = allSteps.length > 0 
              ? Math.round(allSteps.reduce((sum, s) => sum + s.confidence, 0) / allSteps.length)
              : 0;

            const isExpanded = expandedLessons.includes(lessonId);

            return (
              <Card key={lessonId} className="sw-lesson-card">
                {/* Card Header - Clickable to toggle expansion */}
                <div 
                  className="flex justify-content-between align-items-center mb-2 sw-lesson-header cursor-pointer"
                  onClick={() => toggleLessonExpansion(lessonId)}
                >
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
                  
                  <div className="flex align-items-center gap-2">
                    {/* Progress and stats when collapsed */}
                    {!isExpanded && (
                      <div className="flex align-items-center gap-3">
                        <div className="text-center">
                          <div className="text-sm font-semibold text-primary">{progress}%</div>
                          <div className="text-xs text-color-secondary">Progress</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold text-orange-500">{allSteps.length}</div>
                          <div className="text-xs text-color-secondary">Steps</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold text-green-500">{avgConfidence}%</div>
                          <div className="text-xs text-color-secondary">Confidence</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Expand/Collapse Icon */}
                    <i className={`pi ${isExpanded ? 'pi-chevron-up' : 'pi-chevron-down'} text-color-secondary`}></i>
                  </div>
                </div>
                
                {/* Batch Actions - Always visible */}
                <div className="flex gap-1 sw-batch-actions mb-3">
                  <Button 
                    icon="pi pi-pencil" 
                    rounded 
                    text
                    size="small"
                    severity="warning"
                    tooltip="Edit Lesson"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditLesson(lessonId);
                    }}
                  />
                  <Button 
                    icon="pi pi-check-square" 
                    rounded 
                    text
                    size="small"
                    severity="success"
                    tooltip="Mark All Complete"
                    onClick={(e) => {
                      e.stopPropagation();
                      showBatchActionDialog('complete', {lessonId});
                    }}
                  />
                  <Button 
                    icon="pi pi-times-circle" 
                    rounded 
                    text
                    size="small"
                    severity="danger"
                    tooltip="Mark All Incomplete"
                    onClick={(e) => {
                      e.stopPropagation();
                      showBatchActionDialog('incomplete', {lessonId});
                    }}
                  />
                  <Button 
                    icon="pi pi-sliders-h" 
                    rounded 
                    text
                    size="small"
                    severity="info"
                    tooltip="Set Confidence"
                    onClick={(e) => {
                      e.stopPropagation();
                      showBatchActionDialog('confidence', {lessonId});
                    }}
                  />
                </div>
                
                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="sw-lesson-content">
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
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Sidebar - 4 columns with tabs */}
        <div className="col-12 lg:col-4">
          <Card>
            <div className="flex gap-2 mb-3">
              <Button
                label="Summary"
                size="small"
                severity={sidebarTab === 'summary' ? 'info' : 'secondary'}
                outlined={sidebarTab !== 'summary'}
                onClick={() => setSidebarTab('summary')}
              />
              <Button
                label="Actions"
                size="small"
                severity={sidebarTab === 'actions' ? 'info' : 'secondary'}
                outlined={sidebarTab !== 'actions'}
                onClick={() => setSidebarTab('actions')}
              />
              <Button
                label="Test Drills"
                size="small"
                severity={sidebarTab === 'testdrills' ? 'info' : 'secondary'}
                outlined={sidebarTab !== 'testdrills'}
                onClick={() => setSidebarTab('testdrills')}
              />
            </div>
            
            {sidebarTab === 'summary' && (
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
            )}
            {sidebarTab === 'actions' && (
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
            )}
            {sidebarTab === 'testdrills' && (
              <TestDrillsUtilities
                student={student}
                allStudents={allStudentsWithStats}
                testDrills={testDrills}
                onStartTest={handleStartTest}
                onPrintChecklist={handlePrintChecklist}
                onViewPrerequisites={handleViewPrerequisites}
              />
            )}
          </Card>
        </div>
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

      {/* Lesson Editor Dialog */}
      <LessonEditorDialog
        visible={showLessonEditor}
        onHide={() => {
          setShowLessonEditor(false);
          setEditingLesson(null);
        }}
        lesson={editingLesson}
        studentId={studentId || ''}
        onSave={handleSaveLesson}
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

        /* Collapsible lesson styles */
        .sw-lesson-header {
          transition: all 0.2s ease;
        }
        
        .sw-lesson-header:hover {
          background-color: var(--surface-hover);
          border-radius: 0.5rem;
        }
        
        .sw-lesson-content {
          animation: slideDown 0.3s ease-out;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 1000px;
          }
        }
        
        /* Dashboard styles */
        .dashboard-overview .p-card {
          border: 1px solid var(--surface-border);
          transition: all 0.2s ease;
        }
        
        .dashboard-overview .p-card:hover {
          border-color: var(--primary-color);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .student-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .student-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        /* Sidebar tab styles */
        .p-button.p-button-outlined {
          border-width: 2px;
        }
        
        .p-button.p-button-outlined:hover {
          background-color: var(--primary-color);
          color: white;
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
         
         /* Mobile optimizations */
         @media (max-width: 768px) {
           .sw-session-header-collapsed {
             padding: 0.5rem !important;
           }
           
           .sw-session-header .p-card-body {
             padding: 0.75rem;
           }
           
           .sw-action-bar {
             position: fixed;
             bottom: 0;
             left: 0;
             right: 0;
             background: var(--surface-ground);
             padding: 0.75rem;
             box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
             z-index: 1000;
             transition: transform 0.3s ease-in-out;
           }
           
           .sw-action-bar-hidden {
             transform: translateY(100%);
           }
           
           .page-wrapper {
             padding-bottom: 80px; /* Space for fixed action bar */
           }
           
           .dashboard-overview .p-card {
             padding: 0.75rem;
           }
           
           .student-card {
             margin-bottom: 0.75rem;
           }
           
           .sw-lesson-card {
             margin-bottom: 0.75rem;
           }
           
           .grid {
             margin: 0 -0.5rem;
           }
           
           .grid > [class*="col-"] {
             padding: 0.5rem;
           }
         }
       `}</style>
     </div>
   );
 };

export default CoachPage;
