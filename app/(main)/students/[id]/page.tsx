'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { TabView, TabPanel } from 'primereact/tabview';
import { Chart } from 'primereact/chart';
import { MultiSelect } from 'primereact/multiselect';
import { InputTextarea } from 'primereact/inputtextarea';
import { Sidebar } from 'primereact/sidebar';
import { Dialog } from 'primereact/dialog';
import { Panel } from 'primereact/panel';
import Link from 'next/link';
import { getCurriculum } from '@/app/data/curriculum';
import { dataService } from '@/app/services/dataService';
import PlanBuilder from './components/PlanBuilder';
import PlanProgress from './components/PlanProgress';
import TestDrillTracker from './components/TestDrillTracker';
import DrillEvaluator from './components/DrillEvaluator';
import StudentHeroCard from './components/StudentHeroCard';
import OverviewTab from './components/OverviewTab';
import LessonDataView from './components/LessonDataView';
import SessionTimeline from './components/SessionTimeline';
import LessonEditorDialog from './components/LessonEditorDialog';
import type { Student } from '@/app/types/student.types';
import type { StudentPlan, StudentProgress } from '@/app/types/plan.types';
import type { TestDrill, TestDrillAttempt } from '@/app/types/test-drill.types';
import type { Lesson } from '@/app/data/curriculum';

const gc2CurriculumEnriched = getCurriculum('gc2');

interface CoachSession {
  timestamp: string;
  lessonId: string;
  notes?: string;
  completed?: number;
}

// ---------- Component ----------
const StudentProfilePage = () => {
  const { id } = useParams();
  const router = useRouter();

  // ---------- States ----------
  const [student, setStudent] = useState<Student | null>(null);
  const [allLessons] = useState(gc2CurriculumEnriched?.lessons || []);
  const [newFeedback, setNewFeedback] = useState('');
  const [sessions, setSessions] = useState<CoachSession[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<CoachSession | null>(null);
  
  // Plan-related states
  const [studentPlan, setStudentPlan] = useState<StudentPlan | null>(null);
  const [studentProgress, setStudentProgress] = useState<StudentProgress | null>(null);
  const [showPlanBuilder, setShowPlanBuilder] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  
  // Test drill states
  const [selectedDrill, setSelectedDrill] = useState<TestDrill | null>(null);
  const [showDrillEvaluator, setShowDrillEvaluator] = useState(false);
  
  // Lesson editing states
  const [showLessonEditor, setShowLessonEditor] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  // ---------- Derived Hooks (SAFE ORDER) ----------

  // Principle Exposure based on actual student progress
  const principleExposure = useMemo(() => {
    if (!studentProgress || !studentPlan || !gc2CurriculumEnriched) {
      return { labels: [], data: [] };
    }

    const exposureCounts = new Map<string, number>();
    
    // Get lessons from student's plan
    const planLessons = studentPlan.lessonIds
      .map(lessonId => gc2CurriculumEnriched.lessons.find(l => l.id === lessonId))
      .filter((l): l is typeof gc2CurriculumEnriched.lessons[0] => l !== undefined);

    // Count principle exposure from completed slices
    planLessons.forEach(lesson => {
      const lessonProgress = studentProgress.lessons[lesson.id];
      if (!lessonProgress) return;

      lesson.slices.forEach((slice, sliceIdx) => {
        const sliceProgress = lessonProgress.slices[sliceIdx];
        if (!sliceProgress) return;

        // Check if slice is completed (all steps completed)
        const allStepsCompleted = sliceProgress.steps.every(st => st.completed);
        
        if (allStepsCompleted && slice.corePrinciples) {
          slice.corePrinciples.forEach(principle => {
            const name = principle.split(' (')[0];
            exposureCounts.set(name, (exposureCounts.get(name) || 0) + 1);
          });
        }
      });
    });

    const entries = Array.from(exposureCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8); // Top 8 principles for readability

    return {
      labels: entries.map(([name]) => name),
      data: entries.map(([, count]) => count),
    };
  }, [studentProgress, studentPlan]);

  const radarData = {
    labels: principleExposure.labels.length > 0 ? principleExposure.labels : ['No Data'],
    datasets: [
      {
        label: 'Principle Exposure',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderColor: 'rgba(34, 197, 94, 1)',
        pointBackgroundColor: 'rgba(34, 197, 94, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(34, 197, 94, 1)',
        data: principleExposure.data.length > 0 ? principleExposure.data : [0],
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: Math.max(...principleExposure.data, 1),
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  // Confidence Trend from actual session data
  const confidenceTrendData = useMemo(() => {
    if (!studentProgress || !studentPlan) {
      return {
        labels: ['No Data'],
        datasets: [{
          label: 'Confidence',
          borderColor: '#42A5F5',
          fill: false,
          tension: 0.4,
          data: [0],
        }]
      };
    }

    // Get all steps from all lessons with timestamps
    const allSteps: { confidence: number; timestamp: string }[] = [];
    
    Object.values(studentProgress.lessons).forEach(lessonProg => {
      lessonProg.slices.forEach(sliceProg => {
        sliceProg.steps.forEach(step => {
          if (step.completed && lessonProg.startedAt) {
            allSteps.push({
              confidence: step.confidence,
              timestamp: lessonProg.startedAt
            });
          }
        });
      });
    });

    if (allSteps.length === 0) {
      return {
        labels: ['No Sessions'],
        datasets: [{
          label: 'Confidence',
          borderColor: '#42A5F5',
          fill: false,
          tension: 0.4,
          data: [50],
        }]
      };
    }

    // Sort by timestamp
    allSteps.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Group by session (same timestamp) and calculate average
    const sessionMap = new Map<string, number[]>();
    allSteps.forEach(step => {
      const date = new Date(step.timestamp).toLocaleDateString();
      if (!sessionMap.has(date)) {
        sessionMap.set(date, []);
      }
      sessionMap.get(date)!.push(step.confidence);
    });

    const sessions = Array.from(sessionMap.entries()).map(([date, confidences]) => ({
      date,
      avgConfidence: confidences.reduce((sum, c) => sum + c, 0) / confidences.length
    }));

    return {
      labels: sessions.map(s => s.date),
      datasets: [{
        label: 'Average Confidence',
        borderColor: '#42A5F5',
        fill: false,
        tension: 0.4,
        data: sessions.map(s => Math.round(s.avgConfidence)),
      }]
    };
  }, [studentProgress, studentPlan]);

  // Completion breakdown data
  const completionBreakdownData = useMemo(() => {
    if (!studentProgress || !studentPlan) {
      return {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['#E5E7EB'],
        }]
      };
    }

    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;

    studentPlan.lessonIds.forEach(lessonId => {
      const lessonProgress = studentProgress.lessons[lessonId];
      if (lessonProgress?.completedAt) {
        completed++;
      } else if (lessonProgress?.startedAt) {
        inProgress++;
      } else {
        notStarted++;
      }
    });

    return {
      labels: ['Completed', 'In Progress', 'Not Started'],
      datasets: [{
        data: [completed, inProgress, notStarted],
        backgroundColor: ['#22C55E', '#F59E0B', '#E5E7EB'],
      }]
    };
  }, [studentProgress, studentPlan]);

  const analyticsData = {
    confidenceTrend: confidenceTrendData,
    completionData: completionBreakdownData,
  };

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // ---------- Load Student + Sessions + Plan ----------
  useEffect(() => {
    const loadData = async () => {
      if (!id || typeof id !== 'string') return;
      
      // Load student
      const studentData = await dataService.getStudent(id);
      setStudent(studentData);
      
      // Load plan if exists
      if (studentData?.planId) {
        setPlanLoading(true);
        try {
          const plan = await dataService.getStudentPlan(id);
          setStudentPlan(plan);
          
          const progress = await dataService.getStudentProgress(id);
          setStudentProgress(progress);
        } catch (error) {
          console.error('Error loading plan:', error);
        } finally {
          setPlanLoading(false);
        }
      }
      
      // Load sessions
      const sessionData = localStorage.getItem('coachSession_v2');
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        const sessionEntries: CoachSession[] = Object.entries(parsed).map(([lessonId, steps]: any) => ({
          timestamp: new Date().toLocaleString(),
          lessonId,
          completed: steps.filter((s: any) => s.completed).length / (steps.length || 1),
          notes: steps.map((s: any) => s.notes).filter(Boolean).join('; '),
        }));
        setSessions(sessionEntries);
      }
    };
    
    loadData();
  }, [id]);

  // ---------- Save Student ----------
  const saveStudent = async (updates: Partial<Student>) => {
    if (!student) return;
    try {
      const updated = await dataService.updateStudent(student.id, updates);
      setStudent(updated);
    } catch (error) {
      console.error('Error saving student:', error);
    }
  };

  // ---------- Plan Handlers ----------
  const handlePlanSaved = async () => {
    setShowPlanBuilder(false);
    // Reload plan and progress
    if (id && typeof id === 'string') {
      try {
        const plan = await dataService.getStudentPlan(id);
        setStudentPlan(plan);
        
        const progress = await dataService.getStudentProgress(id);
        setStudentProgress(progress);
      } catch (error) {
        console.error('Error reloading plan:', error);
      }
    }
  };

  const handlePlanChange = (val: string[]) => {
    const updated = { ...student!, plan: val };
    saveStudent(updated);
  };

  const handleAddFeedback = () => {
    if (!newFeedback.trim() || !student) return;
    const entry = {
      date: new Date().toLocaleString(),
      message: newFeedback.trim(),
    };
    const updated = {
      ...student,
      feedback: [...(student.feedback || []), entry],
    };
    saveStudent(updated);
    setNewFeedback('');
  };

  const handleDrillSelect = (drill: TestDrill) => {
    setSelectedDrill(drill);
    setShowDrillEvaluator(true);
  };

  const reloadStudentProgress = async () => {
    if (!id || typeof id !== 'string') return;
    try {
      const progress = await dataService.getStudentProgress(id);
      setStudentProgress(progress);
    } catch (error) {
      console.error('Error reloading progress:', error);
    }
  };

  const handleDrillComplete = (attempt: TestDrillAttempt) => {
    // Refresh student progress to reflect any changes
    reloadStudentProgress();
    setShowDrillEvaluator(false);
    setSelectedDrill(null);
  };

  // Lesson editing handlers
  const handleEditLesson = (lessonId: string) => {
    const lesson = gc2CurriculumEnriched?.lessons.find(l => l.id === lessonId);
    if (lesson) {
      setEditingLesson(lesson);
      setShowLessonEditor(true);
    }
  };

  const handleSaveLesson = async (updatedLesson: Lesson) => {
    if (!id || typeof id !== 'string') return;
    try {
      await dataService.updateStudentLesson(id, updatedLesson.id, updatedLesson);
      // Reload data to reflect changes
      await loadData();
    } catch (error) {
      console.error('Error saving lesson:', error);
      throw error;
    }
  };

  // ---------- Event Handlers ----------
  const openDrawer = (s: CoachSession) => {
    setSelectedSession(s);
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setSelectedSession(null);
  };

  // ---------- Drawer Content ----------
  const renderSessionDetail = () => {
    if (!selectedSession) return null;
    const lessonData = allLessons.find(
      (l) => `gc2-l${l.lessonNumber}` === selectedSession.lessonId
    );

    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-2">
          {lessonData?.technique || selectedSession.lessonId}
        </h2>
        <p className="text-color-secondary mb-3">
          {lessonData?.overview || 'No overview available'}
        </p>
        <div className="mb-3">
          <strong>Confidence:</strong> {Math.round((selectedSession.completed || 0) * 100)}%
        </div>
        {selectedSession.notes && (
          <div>
            <strong>Notes:</strong>
            <p className="text-color-secondary mt-1">{selectedSession.notes}</p>
          </div>
        )}
      </div>
    );
  };

  // ---------- Tab Navigation Handlers ----------
  const handleStartCoaching = () => {
    if (student) {
      router.push(`/coach?student=${student.id}`);
    }
  };

  const handleViewLesson = (lessonId: string) => {
    // Navigate to lesson detail or open in modal
    console.log('View lesson:', lessonId);
  };

  const handleContinueLesson = (lessonId: string) => {
    // Start coaching session with specific lesson
    if (student) {
      router.push(`/coach?student=${student.id}&lesson=${lessonId}`);
    }
  };

  const handleViewSession = useCallback((session: CoachSession) => {
    openDrawer(session);
  }, []);

  // ---------- Render ----------
  if (!student) {
    return (
      <div className="flex justify-content-center align-items-center h-screen">
        <div className="text-center">
          <i className="pi pi-spin pi-spinner text-4xl text-primary mb-3" />
          <p>Loading student profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper p-4">
      {/* Hero Card */}
      <StudentHeroCard
        student={student}
        studentPlan={studentPlan}
        studentProgress={studentProgress}
        onEditPlan={() => setShowPlanBuilder(true)}
        onStartCoaching={handleStartCoaching}
      />

      {/* Enhanced TabView */}
      <TabView pt={{panelContainer: {className: 'p-p-0 p-mt-3'}}}>
        {/* Overview Tab */}
        <TabPanel header="Overview" leftIcon="pi pi-home">
          <OverviewTab
            student={student}
            studentPlan={studentPlan}
            studentProgress={studentProgress}
            sessions={sortedSessions}
            onStartCoaching={handleStartCoaching}
            onViewTestPrep={() => {/* Switch to test prep tab */}}
            onViewLessonPlan={() => {/* Switch to lesson plan tab */}}
          />
        </TabPanel>

        {/* Performance Analytics Tab */}
        <TabPanel header="Performance" leftIcon="pi pi-chart-line">
          <div className="grid">
            <div className="col-12">
              <Panel header="Confidence Trend" toggleable className="sw-card sw-card--elevated mb-4">
                <Chart type="line" data={analyticsData.confidenceTrend} />
              </Panel>
            </div>
            <div className="col-12 md:col-6">
              <Panel header="Completion Breakdown" toggleable className="sw-card sw-card--elevated">
                <Chart type="doughnut" data={analyticsData.completionData} />
              </Panel>
            </div>
            <div className="col-12 md:col-6">
              <Panel header="Principle Exposure" toggleable className="sw-card sw-card--elevated">
                <div style={{ height: '300px' }}>
                  <Chart type="radar" data={radarData} options={radarOptions} />
                </div>
              </Panel>
            </div>
          </div>
        </TabPanel>

        {/* Test Preparation Tab */}
        <TabPanel header="Test Prep" leftIcon="pi pi-flag">
          <TestDrillTracker
            studentId={id as string}
            studentPlan={studentPlan}
            studentProgress={studentProgress}
            onDrillSelect={handleDrillSelect}
          />
        </TabPanel>

        {/* Lesson Plan Tab */}
        <TabPanel header="Lesson Plan" leftIcon="pi pi-list">
          <LessonDataView
            studentPlan={studentPlan}
            studentProgress={studentProgress}
            onViewLesson={handleViewLesson}
            onContinueLesson={handleContinueLesson}
            onEditLesson={handleEditLesson}
          />
        </TabPanel>

        {/* Sessions Timeline Tab */}
        <TabPanel header="Sessions" leftIcon="pi pi-calendar">
          <SessionTimeline
            sessions={sortedSessions}
            onViewSession={handleViewSession}
          />
        </TabPanel>
      </TabView>

      {/* Plan Builder Dialog */}
      <Dialog
        visible={showPlanBuilder}
        onHide={() => setShowPlanBuilder(false)}
        style={{ width: '90vw', maxWidth: '1200px' }}
        maximizable
        modal
        header={studentPlan ? 'Edit Lesson Plan' : 'Build Lesson Plan'}
      >
        <PlanBuilder
          studentId={typeof id === 'string' ? id : ''}
          existingPlan={studentPlan}
          onSave={handlePlanSaved}
        />
      </Dialog>

      {/* Drill Evaluator Dialog */}
      <DrillEvaluator
        visible={showDrillEvaluator}
        drill={selectedDrill}
        studentId={id as string}
        onClose={() => {
          setShowDrillEvaluator(false);
          setSelectedDrill(null);
        }}
        onComplete={handleDrillComplete}
      />

      {/* Lesson Editor Dialog */}
      <LessonEditorDialog
        visible={showLessonEditor}
        onHide={() => {
          setShowLessonEditor(false);
          setEditingLesson(null);
        }}
        lesson={editingLesson}
        studentId={id as string}
        onSave={handleSaveLesson}
      />

      {/* Drawer */}
      <Sidebar
        visible={drawerVisible}
        position="right"
        onHide={closeDrawer}
        showCloseIcon
        className="w-full md:w-4 lg:w-3 surface-ground"
      >
        {renderSessionDetail()}
      </Sidebar>

      <style jsx global>{`
        .sw-progress .p-progressbar {
          height: 10px;
          border-radius: 999px;
        }
        .lesson-dataview .p-dataview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }
        @media (max-width: 768px) {
          .lesson-dataview .p-dataview-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentProfilePage;