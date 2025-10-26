'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { Avatar } from 'primereact/avatar';
import type { Student } from '@/app/types/student.types';
import type { TestDrillReadiness } from '@/app/types/test-drill.types';

interface StudentWithStats extends Student {
  overallProgress: number;
  lessonsCompleted: number;
  avgConfidence: number;
  testReadiness: TestDrillReadiness[];
  status: 'active' | 'needs-attention' | 'ready-to-test';
}

interface StudentCardProps {
  student: StudentWithStats;
  onStartSession: (studentId: string) => void;
  // TODO: Add onStartTest prop when drill initiation is implemented
}

const StudentCard: React.FC<StudentCardProps> = ({
  student,
  onStartSession
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready-to-test': return 'success';
      case 'needs-attention': return 'warning';
      default: return 'info';
    }
  };

  const getTestReadinessBadge = (readiness: TestDrillReadiness[]) => {
    const readyCount = readiness.filter(r => r.isReady).length;
    const totalCount = readiness.length;
    return `${readyCount}/${totalCount} drills ready`;
  };

  const getTestReadinessSeverity = (readiness: TestDrillReadiness[]) => {
    const readyCount = readiness.filter(r => r.isReady).length;
    const totalCount = readiness.length;
    const percentage = (readyCount / totalCount) * 100;
    
    if (percentage === 100) return 'success';
    if (percentage >= 60) return 'warning';
    return 'danger';
  };

  return (
    <Card className="h-full student-card">
      <div className="flex align-items-center gap-3 mb-3">
        <Avatar 
          label={student.name.charAt(0)} 
          shape="circle"
          size="large"
          className="bg-primary"
        />
        <div className="flex-1">
          <h6 className="m-0">{student.name}</h6>
          <div className="text-sm text-color-secondary">{student.rank}</div>
        </div>
        <Tag 
          value={student.status.replace('-', ' ')}
          severity={getStatusColor(student.status)}
          className="text-xs"
        />
      </div>
      
      <div className="mb-3">
        <div className="flex justify-content-between align-items-center mb-1">
          <span className="text-sm font-semibold">Overall Progress</span>
          <span className="text-sm font-semibold">{student.overallProgress}%</span>
        </div>
        <ProgressBar 
          value={student.overallProgress}
          showValue={false}
          className="h-1rem"
        />
      </div>

      <div className="flex justify-content-between align-items-center mb-3">
        <div className="text-center">
          <div className="text-lg font-bold text-primary">{student.lessonsCompleted}</div>
          <div className="text-xs text-color-secondary">Lessons</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-orange-500">{student.avgConfidence}%</div>
          <div className="text-xs text-color-secondary">Confidence</div>
        </div>
        <div className="text-center">
          <Tag 
            value={getTestReadinessBadge(student.testReadiness)}
            severity={getTestReadinessSeverity(student.testReadiness)}
            className="text-xs"
          />
        </div>
      </div>

      <Button
        label="Start Session"
        icon="pi pi-play"
        size="small"
        className="w-full"
        onClick={() => onStartSession(student.id)}
      />

      <style jsx>{`
        .student-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .student-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </Card>
  );
};

export default StudentCard;
