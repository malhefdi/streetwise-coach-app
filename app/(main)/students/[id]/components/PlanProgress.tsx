'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { getCurriculum, getAllCurricula } from '@/app/data/curriculum';
import type { StudentPlan, StudentProgress } from '@/app/types/plan.types';

interface PlanProgressProps {
  plan: StudentPlan;
  progress: StudentProgress;
}

const PlanProgress = ({ plan, progress }: PlanProgressProps) => {
  const allCurricula = getAllCurricula();

  if (!allCurricula.length) {
    return <div>Loading curriculum...</div>;
  }

  const lessonStats = plan.lessonIds.map(lessonId => {
    // Find lesson in any curriculum
    let lesson = null;
    for (const curriculum of allCurricula) {
      lesson = curriculum.lessons.find(l => l.id === lessonId);
      if (lesson) break;
    }
    if (!lesson) return null;

    const lessonProgress = progress.lessons[lessonId];
    
    const totalSteps = lesson.slices.reduce((sum, s) => 
      sum + (s.steps?.length || 0), 0
    );
    
    const completedSteps = lessonProgress?.slices.reduce((sum, s) =>
      sum + (s.steps?.filter(st => st.completed).length || 0), 0
    ) || 0;
    
    const allSteps = lessonProgress?.slices.flatMap(s => s.steps || []) || [];
    const avgConfidence = allSteps.length > 0
      ? allSteps.reduce((sum, st) => sum + st.confidence, 0) / allSteps.length
      : 0;
    
    const completion = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
    
    // Check sparring progress for BBS1 lessons
    const sparringProgress = lessonProgress?.sparringProgress;
    const hasSparringDrills = lesson.rapidMasteryDrill || lesson.focusSparring;
    const sparringCompleted = sparringProgress ? 
      (sparringProgress.rapidMasteryCompleted && sparringProgress.focusSparringCompleted) : 
      !hasSparringDrills; // If no sparring drills, consider it "completed"
    
    const status = completedSteps === 0 ? 'not-started' : 
                   (completedSteps === totalSteps && sparringCompleted) ? 'completed' : 'in-progress';

    return {
      lesson,
      totalSteps,
      completedSteps,
      completion,
      avgConfidence,
      status,
      sparringProgress,
      hasSparringDrills
    };
  }).filter(Boolean);

  // Group lessons by curriculum and chapter
  const groupedLessons = lessonStats.reduce((groups, stat) => {
    if (!stat) return groups;
    
    const curriculumId = stat.lesson.id.startsWith('gc2-') ? 'gc2' : 
                        stat.lesson.id.startsWith('bbs1-') ? 'bbs1' : 'other';
    const chapterKey = stat.lesson.chapterTitle || 'No Chapter';
    
    if (!groups[curriculumId]) {
      groups[curriculumId] = {};
    }
    if (!groups[curriculumId][chapterKey]) {
      groups[curriculumId][chapterKey] = [];
    }
    
    groups[curriculumId][chapterKey].push(stat);
    return groups;
  }, {} as Record<string, Record<string, typeof lessonStats>>);

  // Calculate overall stats
  const totalLessons = lessonStats.length;
  const completedLessons = lessonStats.filter(s => s && s.status === 'completed').length;
  const inProgressLessons = lessonStats.filter(s => s && s.status === 'in-progress').length;
  const notStartedLessons = lessonStats.filter(s => s && s.status === 'not-started').length;
  const overallCompletion = totalLessons > 0 
    ? (completedLessons / totalLessons) * 100 
    : 0;

  const gradientStyle = {
    background: 'linear-gradient(90deg, var(--red-400) 0%, var(--orange-400) 30%, var(--yellow-400) 55%, var(--green-400) 100%)'
  };

  return (
    <div>
      {/* Overall Progress Summary */}
      <Card className="shadow-2 border-round-2xl mb-4">
        <h3 className="text-xl font-bold mb-3">Overall Progress</h3>
        <ProgressBar 
          value={overallCompletion} 
          showValue 
          className="mb-3" 
          style={{ height: '24px' }}
          pt={{ value: { style: gradientStyle } }}
        />
        <div className="grid">
          <div className="col-12 md:col-3">
            <div className="text-center p-3 surface-50 border-round-lg">
              <div className="text-2xl font-bold text-color">{totalLessons}</div>
              <div className="text-sm text-color-secondary">Total Lessons</div>
            </div>
          </div>
          <div className="col-12 md:col-3">
            <div className="text-center p-3 surface-50 border-round-lg">
              <div className="text-2xl font-bold text-green-500">{completedLessons}</div>
              <div className="text-sm text-color-secondary">Completed</div>
            </div>
          </div>
          <div className="col-12 md:col-3">
            <div className="text-center p-3 surface-50 border-round-lg">
              <div className="text-2xl font-bold text-blue-500">{inProgressLessons}</div>
              <div className="text-sm text-color-secondary">In Progress</div>
            </div>
          </div>
          <div className="col-12 md:col-3">
            <div className="text-center p-3 surface-50 border-round-lg">
              <div className="text-2xl font-bold text-500">{notStartedLessons}</div>
              <div className="text-sm text-color-secondary">Not Started</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Lesson-by-Lesson Progress */}
      <h4 className="text-lg font-semibold mb-3">Lesson Details</h4>
      
      {Object.entries(groupedLessons).map(([curriculumId, chapters]) => (
        <div key={curriculumId} className="mb-5">
          <h5 className="text-md font-semibold text-primary mb-3 flex align-items-center gap-2">
            <i className="pi pi-book"></i>
            {curriculumId === 'gc2' ? 'Gracie Combatives 2.0' : 
             curriculumId === 'bbs1' ? 'Master Cycle — Blue Belt Stripe 1' : 
             'Other Curriculum'}
          </h5>
          
          {Object.entries(chapters).map(([chapterTitle, lessons]) => (
            <div key={chapterTitle} className="mb-4">
              {chapterTitle !== 'No Chapter' && (
                <h6 className="text-sm font-medium text-600 mb-2 ml-2">
                  {chapterTitle}
                </h6>
              )}
              
              <div className="grid">
                {lessons.map((stat, index) => (
                  <div key={stat.lesson.id} className="col-12 md:col-6 lg:col-4">
                    <Card className="shadow-2 hover:shadow-4 transition-duration-200 h-full">
                      <div className="flex justify-content-between align-items-start mb-2">
                        <div className="flex-1">
                          <div className="text-xs text-color-secondary mb-1">
                            #{plan.lessonIds.indexOf(stat.lesson.id) + 1} in Plan
                          </div>
                          <h4 className="m-0 text-base font-bold">
                            L{stat.lesson.lessonNumber}: {stat.lesson.technique}
                          </h4>
                          <div className="text-sm text-color-secondary mt-1">
                            {stat.lesson.position}
                          </div>
                          {stat.lesson.chapter && (
                            <div className="text-xs text-400 mt-1">
                              <i className="pi pi-book mr-1"></i>
                              {stat.lesson.chapter}
                            </div>
                          )}
                        </div>
                        <Tag 
                          value={
                            stat.status === 'completed' ? 'Completed' :
                            stat.status === 'in-progress' ? 'In Progress' :
                            'Not Started'
                          }
                          severity={
                            stat.status === 'completed' ? 'success' : 
                            stat.status === 'in-progress' ? 'info' : 'secondary'
                          }
                          className="ml-2"
                        />
                      </div>

                      <ProgressBar 
                        value={stat.completion} 
                        className="mb-3" 
                        pt={{ value: { style: gradientStyle } }}
                      />

                      <div className="flex justify-content-between text-sm mb-2">
                        <div>
                          <i className="pi pi-check-circle mr-1 text-green-500"></i>
                          <span className="font-semibold">{stat.completedSteps}</span>
                          <span className="text-color-secondary">/{stat.totalSteps} steps</span>
                        </div>
                        <div>
                          <i className="pi pi-chart-line mr-1 text-blue-500"></i>
                          <span className="font-semibold">{Math.round(stat.avgConfidence)}%</span>
                          <span className="text-color-secondary"> confidence</span>
                        </div>
                      </div>

                      {/* Sparring Progress Indicators */}
                      {stat.hasSparringDrills && (
                        <div className="mt-2 pt-2 border-top-1 border-200">
                          <div className="text-xs text-color-secondary mb-1">Sparring Drills:</div>
                          <div className="flex gap-2">
                            {stat.lesson.rapidMasteryDrill && (
                              <Tag 
                                value="Rapid Mastery" 
                                severity={stat.sparringProgress?.rapidMasteryCompleted ? 'success' : 'warning'}
                                className="text-xs"
                              />
                            )}
                            {stat.lesson.focusSparring && (
                              <Tag 
                                value="Focus Sparring" 
                                severity={stat.sparringProgress?.focusSparringCompleted ? 'success' : 'warning'}
                                className="text-xs"
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default PlanProgress;

