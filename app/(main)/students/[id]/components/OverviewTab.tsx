'use client';

import React, { useMemo } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Tag } from 'primereact/tag';
import { Timeline } from 'primereact/timeline';
import { Panel } from 'primereact/panel';
import { Divider } from 'primereact/divider';
import { getTestDrillsWithReadiness } from '@/app/services/testDrillService';
import { getCurriculum } from '@/app/data/curriculum';
import type { Student } from '@/app/types/student.types';
import type { StudentPlan, StudentProgress } from '@/app/types/plan.types';
import type { TestDrill } from '@/app/types/test-drill.types';

interface CoachSession {
  timestamp: string;
  lessonId: string;
  notes?: string;
  completed?: number;
}

interface OverviewTabProps {
  student: Student;
  studentPlan: StudentPlan | null;
  studentProgress: StudentProgress | null;
  sessions: CoachSession[];
  onStartCoaching: () => void;
  onViewTestPrep: () => void;
  onViewLessonPlan: () => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  student,
  studentPlan,
  studentProgress,
  sessions,
  onStartCoaching,
  onViewTestPrep,
  onViewLessonPlan
}) => {
  const curriculum = getCurriculum('gc2');

  // Calculate quick stats
  const quickStats = useMemo(() => {
    const totalSessions = student.sessions;
    
    // Calculate plan progress
    let planProgress = 0;
    if (studentPlan && studentProgress) {
      const totalLessons = studentPlan.lessonIds.length;
      if (totalLessons > 0) {
        let completedLessons = 0;
        studentPlan.lessonIds.forEach(lessonId => {
          const lessonProgress = studentProgress.lessons[lessonId];
          if (lessonProgress && lessonProgress.completedAt) {
            completedLessons++;
          }
        });
        planProgress = Math.round((completedLessons / totalLessons) * 100);
      }
    }

    // Calculate test readiness
    let testReady = 0;
    if (curriculum && studentPlan && studentProgress) {
      const drillsWithReadiness = getTestDrillsWithReadiness(curriculum, studentPlan, studentProgress);
      testReady = drillsWithReadiness.filter(d => d.readiness.isReady).length;
    }

    // Get last activity
    const lastActivity = sessions.length > 0 
      ? sessions[0].timestamp 
      : 'No recent activity';

    return {
      sessions: totalSessions,
      planProgress,
      testReady,
      lastActivity
    };
  }, [student, studentPlan, studentProgress, sessions, curriculum]);

  // Prepare recent activity timeline
  const timelineEvents = useMemo(() => {
    return sessions.slice(0, 5).map(session => {
      const lesson = curriculum?.lessons.find(l => l.id === session.lessonId);
      const confidence = session.completed || 0;
      
      return {
        status: confidence >= 80 ? 'success' : confidence >= 60 ? 'warning' : 'danger',
        icon: confidence >= 80 ? 'pi pi-check-circle' : confidence >= 60 ? 'pi pi-clock' : 'pi pi-exclamation-triangle',
        content: (
          <div className="flex flex-column gap-1">
            <div className="font-medium">
              {lesson ? `L${lesson.lessonNumber}: ${lesson.technique}` : session.lessonId}
            </div>
            <div className="text-sm text-color-secondary">
              {session.timestamp}
            </div>
            {session.notes && (
              <div className="text-sm text-color-secondary">
                {session.notes.length > 100 
                  ? `${session.notes.substring(0, 100)}...` 
                  : session.notes
                }
              </div>
            )}
            <Badge 
              value={`${confidence}% confidence`}
              severity={confidence >= 80 ? 'success' : confidence >= 60 ? 'warning' : 'danger'}
            />
          </div>
        )
      };
    });
  }, [sessions, curriculum]);

  // Get next recommended lesson
  const nextLesson = useMemo(() => {
    if (!studentPlan || !studentProgress || !curriculum) return null;
    
    for (const lessonId of studentPlan.lessonIds) {
      const lessonProgress = studentProgress.lessons[lessonId];
      if (!lessonProgress || !lessonProgress.completedAt) {
        return curriculum.lessons.find(l => l.id === lessonId);
      }
    }
    return null;
  }, [studentPlan, studentProgress, curriculum]);

  // Get ready test drills
  const readyDrills = useMemo(() => {
    if (!curriculum || !studentPlan || !studentProgress) return [];
    
    const drillsWithReadiness = getTestDrillsWithReadiness(curriculum, studentPlan, studentProgress);
    return drillsWithReadiness.filter(d => d.readiness.isReady).slice(0, 2);
  }, [curriculum, studentPlan, studentProgress]);

  return (
    <div className="space-y-4">
      {/* Quick Stats Grid */}
      <div className="sw-card-grid">
        <Card className="sw-card sw-card--kpi">
          <div className="flex flex-column align-items-center gap-2">
            <i className="pi pi-calendar text-3xl text-primary" />
            <div className="sw-card__number">
              {quickStats.sessions}
            </div>
            <div className="sw-card__label">
              Total Sessions
            </div>
          </div>
        </Card>
        
        <Card className="sw-card sw-card--kpi">
          <div className="flex flex-column align-items-center gap-2">
            <i className="pi pi-chart-line text-3xl text-success" />
            <div className="sw-card__number text-green-500">
              {quickStats.planProgress}%
            </div>
            <div className="sw-card__label">
              Plan Progress
            </div>
          </div>
        </Card>
        
        <Card className="sw-card sw-card--kpi">
          <div className="flex flex-column align-items-center gap-2">
            <i className="pi pi-flag text-3xl text-warning" />
            <div className="sw-card__number text-orange-500">
              {quickStats.testReady}/5
            </div>
            <div className="sw-card__label">
              Tests Ready
            </div>
          </div>
        </Card>
        
        <Card className="sw-card sw-card--kpi">
          <div className="flex flex-column align-items-center gap-2">
            <i className="pi pi-clock text-3xl text-info" />
            <div className="sw-card__number text-blue-500">
              {quickStats.lastActivity}
            </div>
            <div className="sw-card__label">
              Last Activity
            </div>
          </div>
        </Card>
      </div>

      <div className="grid">
        {/* Recent Activity Timeline */}
        <div className="col-12 lg:col-8">
          <Panel header="Recent Activity" className="sw-card sw-card--elevated">
            {timelineEvents.length > 0 ? (
              <Timeline 
                value={timelineEvents}
                align="left"
                className="p-timeline-vertical"
              />
            ) : (
              <div className="text-center p-4">
                <i className="pi pi-inbox text-4xl text-400 mb-3" />
                <p className="text-color-secondary">No recent sessions</p>
                <Button
                  label="Start First Session"
                  icon="pi pi-play"
                  severity="success"
                  onClick={onStartCoaching}
                />
              </div>
            )}
          </Panel>
        </div>

        {/* Next Steps Panel */}
        <div className="col-12 lg:col-4">
          <Panel header="Next Steps" className="sw-card sw-card--elevated">
            <div className="flex flex-column gap-3">
              {/* Next Lesson */}
              {nextLesson && (
                <Card className="sw-card sw-card--next-steps">
                  <div className="flex align-items-center gap-2 mb-2">
                    <i className="pi pi-book text-primary" />
                    <span className="sw-card__title">Next Lesson</span>
                  </div>
                  <div className="sw-card__content">
                    L{nextLesson.lessonNumber}: {nextLesson.technique}
                  </div>
                  <Button
                    label="Continue"
                    icon="pi pi-play"
                    size="small"
                    onClick={onStartCoaching}
                    className="w-full"
                  />
                </Card>
              )}

              {/* Ready Test Drills */}
              {readyDrills.length > 0 && (
                <Card className="sw-card sw-card--ready-testing">
                  <div className="flex align-items-center gap-2 mb-2">
                    <i className="pi pi-flag text-green-500" />
                    <span className="sw-card__title">Ready for Testing</span>
                  </div>
                  <div className="flex flex-column gap-1 mb-2">
                    {readyDrills.map(drill => (
                      <div key={drill.drill.drillNumber} className="text-sm text-color-secondary">
                        Drill {drill.drill.drillNumber}: {drill.drill.title}
                      </div>
                    ))}
                  </div>
                  <Button
                    label="View Tests"
                    icon="pi pi-flag"
                    size="small"
                    severity="warning"
                    onClick={onViewTestPrep}
                    className="w-full"
                  />
                </Card>
              )}

              {/* Quick Actions */}
              <Divider />
              <div className="flex flex-column gap-2">
                <Button
                  label="View Lesson Plan"
                  icon="pi pi-list"
                  size="small"
                  outlined
                  onClick={onViewLessonPlan}
                  className="w-full"
                />
                <Button
                  label="Start Coaching"
                  icon="pi pi-play"
                  size="small"
                  severity="success"
                  onClick={onStartCoaching}
                  className="w-full"
                />
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
