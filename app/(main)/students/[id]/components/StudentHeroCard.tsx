'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { Badge } from 'primereact/badge';
import { Avatar } from 'primereact/avatar';
import { Divider } from 'primereact/divider';
import { Tooltip } from 'primereact/tooltip';
import type { Student } from '@/app/types/student.types';
import type { StudentPlan, StudentProgress } from '@/app/types/plan.types';

interface StudentHeroCardProps {
  student: Student;
  studentPlan: StudentPlan | null;
  studentProgress: StudentProgress | null;
  onEditPlan: () => void;
  onStartCoaching: () => void;
}

const StudentHeroCard: React.FC<StudentHeroCardProps> = ({
  student,
  studentPlan,
  studentProgress,
  onEditPlan,
  onStartCoaching
}) => {
  // Calculate plan progress
  const calculatePlanProgress = () => {
    if (!studentPlan || !studentProgress) return 0;
    
    const totalLessons = studentPlan.lessonIds.length;
    if (totalLessons === 0) return 0;
    
    let completedLessons = 0;
    studentPlan.lessonIds.forEach(lessonId => {
      const lessonProgress = studentProgress.lessons[lessonId];
      if (lessonProgress && lessonProgress.completedAt) {
        completedLessons++;
      }
    });
    
    return Math.round((completedLessons / totalLessons) * 100);
  };

  const planProgress = calculatePlanProgress();
  
  // Get rank color based on belt level
  const getRankSeverity = (rank: string) => {
    const rankLower = rank.toLowerCase();
    if (rankLower.includes('white')) return 'info';
    if (rankLower.includes('blue')) return 'info';
    if (rankLower.includes('purple')) return 'info';
    if (rankLower.includes('brown')) return 'warning';
    if (rankLower.includes('black')) return 'info';
    return 'info';
  };

  // Get progress bar color
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'success';
    if (progress >= 50) return 'warning';
    return 'danger';
  };

  // Generate avatar initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="sw-card sw-card--hero mb-4">
      <div className="grid align-items-center">
        {/* Avatar and Student Info */}
        <div className="col-12 md:col-4">
          <div className="flex align-items-center gap-4">
            <Avatar
              image={student.avatar}
              label={!student.avatar ? getInitials(student.name) : undefined}
              size="xlarge"
              shape="circle"
              className="border-2 border-primary"
              style={{ minWidth: '80px', minHeight: '80px' }}
            />
            <div className="flex flex-column gap-2">
              <h1 className="title-text m-0">
                {student.name}
              </h1>
              <div className="flex align-items-center gap-2">
                <Tag 
                  severity={getRankSeverity(student.rank)} 
                  value={student.rank}
                  className="text-sm"
                />
                <Badge 
                  value={student.sessions} 
                  severity="success"
                  className="text-sm"
                />
                <span className="text-sm text-med">sessions</span>
              </div>
            </div>
          </div>
        </div>

        <Divider layout="vertical" className="hidden md:block" />

        {/* Stats Section */}
        <div className="col-12 md:col-4">
          <div className="flex flex-column gap-3">
            <div>
              <div className="flex justify-content-between align-items-center mb-2">
                <span className="section-text">Plan Progress</span>
                <span className="text-sm text-med">
                  {studentPlan ? `${studentPlan.lessonIds.length} lessons` : 'No plan'}
                </span>
              </div>
              <ProgressBar 
                value={planProgress} 
                showValue={true}
                className="sw-progress sw-progress--thick"
                pt={{
                  value: { 
                    style: { 
                      background: 'linear-gradient(90deg, var(--sw-primary-400), var(--sw-primary-600))',
                      fontSize: '1.1rem', 
                      fontWeight: 'bold' 
                    } 
                  }
                }}
              />
            </div>
            
            {student.notes && (
              <div className="text-sm text-med">
                <i className="pi pi-info-circle mr-1" />
                {student.notes.length > 100 
                  ? `${student.notes.substring(0, 100)}...` 
                  : student.notes
                }
              </div>
            )}
          </div>
        </div>

        <Divider layout="vertical" className="hidden md:block" />

        {/* Action Buttons */}
        <div className="col-12 md:col-3">
          <div className="flex flex-column gap-2">
            <Button
              label="Edit Plan"
              icon="pi pi-pencil"
              className="sw-button sw-button--secondary"
              onClick={onEditPlan}
              tooltip="Modify lesson plan"
              tooltipOptions={{ position: 'bottom' }}
              aria-label="Edit student lesson plan"
            />
            <Button
              label="Start Coaching"
              icon="pi pi-play"
              className="sw-button sw-button--success"
              onClick={onStartCoaching}
              tooltip="Begin coaching session"
              tooltipOptions={{ position: 'bottom' }}
              aria-label="Start coaching session with student"
            />
          </div>
        </div>
      </div>

      {/* Mobile Responsive Adjustments */}
      <style jsx>{`
        @media (max-width: 768px) {
          .grid > div {
            margin-bottom: 1rem;
          }
        }
      `}</style>
    </Card>
  );
};

export default StudentHeroCard;
