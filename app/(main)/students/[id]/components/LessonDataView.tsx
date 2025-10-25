'use client';

import React, { useMemo } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { Avatar } from 'primereact/avatar';
import { DataView } from 'primereact/dataview';
import { Tooltip } from 'primereact/tooltip';
import { getCurriculum } from '@/app/data/curriculum';
import type { StudentPlan, StudentProgress } from '@/app/types/plan.types';
import type { Lesson } from '@/app/data/curriculum';

interface LessonDataViewProps {
  studentPlan: StudentPlan | null;
  studentProgress: StudentProgress | null;
  onViewLesson: (lessonId: string) => void;
  onContinueLesson: (lessonId: string) => void;
  onEditLesson: (lessonId: string) => void;
}

const LessonDataView: React.FC<LessonDataViewProps> = ({
  studentPlan,
  studentProgress,
  onViewLesson,
  onContinueLesson,
  onEditLesson
}) => {
  const curriculum = getCurriculum('gc2');

  // Prepare lesson data for DataView
  const planLessons = useMemo(() => {
    if (!studentPlan || !curriculum) return [];
    
    return studentPlan.lessonIds
      .map(lessonId => curriculum.lessons.find(l => l.id === lessonId))
      .filter((lesson): lesson is Lesson => lesson !== undefined)
      .map(lesson => {
        const lessonProgress = studentProgress?.lessons[lesson.id];
        const isCompleted = lessonProgress?.completedAt !== undefined;
        const isInProgress = lessonProgress?.startedAt && !isCompleted;
        
        // Calculate step progress
        let completedSteps = 0;
        let totalSteps = 0;
        
        if (lessonProgress) {
          lesson.slices.forEach((slice, sliceIdx) => {
            const sliceProgress = lessonProgress.slices[sliceIdx];
            if (sliceProgress) {
              totalSteps += slice.steps?.length || 0;
              completedSteps += sliceProgress.steps.filter(step => step.completed).length;
            }
          });
        }
        
        const stepProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
        
        // Calculate average confidence
        let totalConfidence = 0;
        let confidenceCount = 0;
        
        if (lessonProgress) {
          lessonProgress.slices.forEach(sliceProgress => {
            sliceProgress.steps.forEach(step => {
              if (step.completed) {
                totalConfidence += step.confidence;
                confidenceCount++;
              }
            });
          });
        }
        
        const avgConfidence = confidenceCount > 0 ? Math.round(totalConfidence / confidenceCount) : 0;
        
        return {
          ...lesson,
          isCompleted,
          isInProgress,
          stepProgress,
          avgConfidence,
          completedSteps,
          totalSteps
        };
      });
  }, [studentPlan, studentProgress, curriculum]);

  // Get overall progress
  const overallProgress = useMemo(() => {
    if (!studentPlan) return 0;
    const totalLessons = studentPlan.lessonIds.length;
    if (totalLessons === 0) return 0;
    
    const completedLessons = planLessons.filter(lesson => lesson.isCompleted).length;
    return Math.round((completedLessons / totalLessons) * 100);
  }, [studentPlan, planLessons]);

  // Get progress color
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'success';
    if (progress >= 50) return 'warning';
    return 'danger';
  };

  // Get status tag
  const getStatusTag = (lesson: any) => {
    if (lesson.isCompleted) {
      return <Tag severity="success" value="Complete" icon="pi pi-check" />;
    } else if (lesson.isInProgress) {
      return <Tag severity="warning" value="In Progress" icon="pi pi-clock" />;
    } else {
      return <Tag severity="info" value="Not Started" icon="pi pi-circle" />;
    }
  };

  // Get position icon
  const getPositionIcon = (position: string) => {
    const positionLower = position.toLowerCase();
    if (positionLower.includes('mount')) return 'pi pi-arrow-up';
    if (positionLower.includes('guard')) return 'pi pi-shield';
    if (positionLower.includes('side')) return 'pi pi-arrow-right';
    if (positionLower.includes('standing')) return 'pi pi-user';
    return 'pi pi-bolt';
  };

  // Lesson card template
  const lessonCardTemplate = (lesson: any) => {
    return (
      <Card className="shadow-2 border-round-2xl h-full">
        <div className="flex flex-column h-full">
          {/* Header */}
          <div className="flex align-items-center justify-content-between mb-3">
            <div className="flex align-items-center gap-2">
              <Avatar
                icon={getPositionIcon(lesson.position)}
                shape="circle"
                size="normal"
                className="bg-primary-100 text-primary-600"
              />
              <div>
                <div className="font-semibold text-color">
                  L{lesson.lessonNumber}: {lesson.technique}
                </div>
                <div className="text-sm text-color-secondary">
                  {lesson.position}
                </div>
              </div>
            </div>
            {getStatusTag(lesson)}
          </div>

          {/* Progress Section */}
          <div className="mb-3">
            <div className="flex justify-content-between align-items-center mb-2">
              <span className="text-sm font-medium">Steps Progress</span>
              <span className="text-sm text-color-secondary">
                {lesson.completedSteps}/{lesson.totalSteps}
              </span>
            </div>
            <ProgressBar
              value={lesson.stepProgress}
              showValue={false}
              color={getProgressColor(lesson.stepProgress)}
              className="h-1rem"
            />
            <div className="text-xs text-color-secondary mt-1">
              {lesson.stepProgress}% complete
            </div>
          </div>

          {/* Confidence */}
          {lesson.avgConfidence > 0 && (
            <div className="mb-3">
              <div className="flex align-items-center gap-2">
                <span className="text-sm font-medium">Confidence</span>
                <Tooltip target=".confidence-tooltip" />
                <i 
                  className="pi pi-info-circle text-xs text-color-secondary cursor-pointer confidence-tooltip"
                  data-pr-tooltip={`Average confidence: ${lesson.avgConfidence}%`}
                />
              </div>
              <div className="flex align-items-center gap-2">
                <ProgressBar
                  value={lesson.avgConfidence}
                  showValue={false}
                  color={getProgressColor(lesson.avgConfidence)}
                  className="flex-1 h-1rem"
                />
                <span className="text-sm font-medium">
                  {lesson.avgConfidence}%
                </span>
              </div>
            </div>
          )}

          {/* Overview */}
          {lesson.overview && (
            <div className="mb-3 flex-1">
              <div className="text-sm text-color-secondary line-height-3">
                {lesson.overview.length > 120 
                  ? `${lesson.overview.substring(0, 120)}...` 
                  : lesson.overview
                }
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-auto">
            <Button
              label="View"
              icon="pi pi-eye"
              size="small"
              outlined
              onClick={() => onViewLesson(lesson.id)}
              className="flex-1"
            />
            <Button
              label="Edit"
              icon="pi pi-pencil"
              size="small"
              severity="warning"
              onClick={() => onEditLesson(lesson.id)}
              className="flex-1"
            />
            {lesson.isInProgress ? (
              <Button
                label="Continue"
                icon="pi pi-play"
                size="small"
                severity="success"
                onClick={() => onContinueLesson(lesson.id)}
                className="flex-1"
              />
            ) : lesson.isCompleted ? (
              <Button
                label="Review"
                icon="pi pi-refresh"
                size="small"
                severity="info"
                onClick={() => onViewLesson(lesson.id)}
                className="flex-1"
              />
            ) : (
              <Button
                label="Start"
                icon="pi pi-play"
                size="small"
                severity="success"
                onClick={() => onContinueLesson(lesson.id)}
                className="flex-1"
              />
            )}
          </div>
        </div>
      </Card>
    );
  };

  if (!studentPlan) {
    return (
      <Card className="shadow-2 border-round-2xl">
        <div className="text-center p-5">
          <i className="pi pi-inbox text-6xl text-400 mb-3" />
          <h3 className="text-xl mb-2">No Lesson Plan Yet</h3>
          <p className="text-color-secondary mb-4">
            Create a personalized lesson plan to track this student&apos;s progress
            and run customized coaching sessions.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <Card className="shadow-2 border-round-2xl">
        <div className="flex align-items-center justify-content-between mb-3">
          <h3 className="text-lg font-semibold m-0">Lesson Plan Progress</h3>
          <span className="text-sm text-color-secondary">
            {planLessons.filter(l => l.isCompleted).length}/{planLessons.length} lessons complete
          </span>
        </div>
        <ProgressBar
          value={overallProgress}
          showValue={true}
          color={getProgressColor(overallProgress)}
          pt={{
            value: { 
              style: { 
                fontSize: '1.1rem', 
                fontWeight: 'bold' 
              } 
            }
          }}
          className="h-2rem"
        />
      </Card>

      {/* Lessons Grid */}
      <DataView
        value={planLessons}
        layout="grid"
        itemTemplate={lessonCardTemplate}
        emptyMessage="No lessons in plan"
        className="lesson-dataview"
        pt={{
          grid: { className: 'grid' },
          gridItem: { className: 'col-12 md:col-6 lg:col-4' }
        }}
      />
    </div>
  );
};

export default LessonDataView;
