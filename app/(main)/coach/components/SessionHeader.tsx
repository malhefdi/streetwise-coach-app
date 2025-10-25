'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Avatar } from 'primereact/avatar';
import type { Student } from '@/app/types/student.types';
import type { StudentPlan } from '@/app/types/plan.types';

interface SessionHeaderProps {
  student: Student;
  plan: StudentPlan;
  elapsed: number;
  overallProgress: number;
  focusMode: boolean;
  summaryVisible: boolean;
  onSaveProgress: () => void;
  onChangeStudent: () => void;
  onToggleFocus: () => void;
  onToggleSummary: () => void;
}

const SessionHeader: React.FC<SessionHeaderProps> = ({
  student,
  plan,
  elapsed,
  overallProgress,
  focusMode,
  summaryVisible,
  onSaveProgress,
  onChangeStudent,
  onToggleFocus,
  onToggleSummary,
}) => {
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="sw-session-header">
      {/* Top Row: Student & Stats */}
      <div className="flex align-items-center justify-content-between mb-3">
        <div className="flex align-items-center gap-3">
          <Avatar
            image={student.avatar}
            label={!student.avatar ? getInitials(student.name) : undefined}
            size="xlarge"
            shape="circle"
            className="sw-student-avatar"
            style={{ minWidth: '60px', minHeight: '60px' }}
          />
          <div className="sw-student-info">
            <h2 className="sw-student-name">{student.name}</h2>
            <div className="flex align-items-center gap-2 mb-1">
              <Tag 
                severity="info" 
                value={student.rank} 
                icon="pi pi-shield"
                className="text-sm"
              />
            </div>
            <div className="sw-student-details">
              <i className="pi pi-book mr-1" />
              {plan.name} • {plan.lessonIds.length} lessons
            </div>
          </div>
        </div>
        
        <div className="flex align-items-center gap-3 sw-session-stats">
          {/* Circular Progress */}
          <div 
            className="sw-progress-circular"
            style={{ '--progress': overallProgress } as React.CSSProperties}
          >
            <span className="sw-progress-text">{Math.round(overallProgress)}%</span>
          </div>
          
          {/* Timer */}
          <Tag 
            severity="info" 
            value={formatTime(elapsed)} 
            icon="pi pi-clock"
            className="sw-timer"
          />
        </div>
      </div>
      
      {/* Bottom Row: Actions */}
      <div className="flex gap-2 flex-wrap sw-session-actions">
        {/* Primary Actions */}
        <div className="flex gap-2 sw-primary-actions">
          <Button 
            label="Save Progress" 
            icon="pi pi-save" 
            severity="success"
            onClick={onSaveProgress}
          />
        </div>
        
        {/* Secondary Actions */}
        <div className="flex gap-2 sw-secondary-actions">
          <Button 
            label="Change Student" 
            icon="pi pi-user" 
            outlined
            onClick={onChangeStudent}
          />
          <Button 
            label={focusMode ? 'Disable Focus' : 'Enable Focus'} 
            icon={focusMode ? 'pi pi-eye-slash' : 'pi pi-eye'}
            outlined
            onClick={onToggleFocus}
          />
          <Button 
            label={summaryVisible ? 'Hide Summary' : 'Show Summary'} 
            icon="pi pi-list"
            outlined
            onClick={onToggleSummary}
          />
        </div>
      </div>
    </Card>
  );
};

export default SessionHeader;
