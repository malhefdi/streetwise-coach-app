'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import type { Student } from '@/app/types/student.types';
import type { TestDrillReadiness } from '@/app/types/test-drill.types';

interface StudentWithStats extends Student {
  overallProgress: number;
  lessonsCompleted: number;
  avgConfidence: number;
  testReadiness: TestDrillReadiness[];
  recentActivity: string;
}

interface AggregateSessionSummaryProps {
  students: StudentWithStats[];
  onExport: () => void;
  onPrint: () => void;
}

const AggregateSessionSummary: React.FC<AggregateSessionSummaryProps> = ({
  students,
  onExport,
  onPrint
}) => {
  const totalStudents = students.length;
  const totalProgress = students.reduce((sum, s) => sum + s.overallProgress, 0);
  const averageProgress = totalStudents > 0 ? Math.round(totalProgress / totalStudents) : 0;
  const totalLessonsCompleted = students.reduce((sum, s) => sum + s.lessonsCompleted, 0);
  const totalTestDrillsReady = students.reduce((sum, s) => sum + s.testReadiness.filter(r => r.isReady).length, 0);

  const recentActivityData = students.map(student => ({
    student: student.name,
    activity: student.recentActivity,
    progress: student.overallProgress,
    testReady: student.testReadiness.filter(r => r.isReady).length
  }));

  const progressBodyTemplate = (rowData: any) => (
    <div className="flex align-items-center gap-2">
      <ProgressBar 
        value={rowData.progress} 
        showValue={false} 
        className="flex-1 h-1rem"
      />
      <span className="text-sm font-semibold">{rowData.progress}%</span>
    </div>
  );

  const testReadyBodyTemplate = (rowData: any) => (
    <Tag 
      value={`${rowData.testReady}/5`}
      severity={rowData.testReady === 5 ? 'success' : rowData.testReady > 0 ? 'warning' : 'danger'}
      className="text-xs"
    />
  );

  return (
    <div>
      <div className="flex justify-content-between align-items-center mb-3">
        <h6 className="m-0">Aggregate Session Summary</h6>
        <div className="flex gap-2">
          <Button icon="pi pi-download" size="small" outlined tooltip="Export" onClick={onExport} />
          <Button icon="pi pi-print" size="small" outlined tooltip="Print" onClick={onPrint} />
        </div>
      </div>
      
      {/* Overall Stats */}
      <div className="grid mb-4">
        <div className="col-6">
          <Card className="text-center">
            <div className="text-2xl font-bold text-primary mb-1">{totalStudents}</div>
            <div className="text-sm text-color-secondary">Total Students</div>
          </Card>
        </div>
        <div className="col-6">
          <Card className="text-center">
            <div className="text-2xl font-bold text-green-500 mb-1">{averageProgress}%</div>
            <div className="text-sm text-color-secondary">Avg Progress</div>
          </Card>
        </div>
        <div className="col-6">
          <Card className="text-center">
            <div className="text-2xl font-bold text-orange-500 mb-1">{totalLessonsCompleted}</div>
            <div className="text-sm text-color-secondary">Lessons Completed</div>
          </Card>
        </div>
        <div className="col-6">
          <Card className="text-center">
            <div className="text-2xl font-bold text-cyan-500 mb-1">{totalTestDrillsReady}</div>
            <div className="text-sm text-color-secondary">Test Drills Ready</div>
          </Card>
        </div>
      </div>

      {/* Test Drill Readiness Summary */}
      <Card className="mb-4">
        <h6 className="mb-3">Test Drill Readiness Summary</h6>
        <div className="grid">
          {[1, 2, 3, 4, 5].map(drillNumber => {
            const readyCount = students.filter(s => 
              s.testReadiness.find(r => r.drillNumber === drillNumber)?.isReady
            ).length;
            const percentage = totalStudents > 0 ? Math.round((readyCount / totalStudents) * 100) : 0;
            
            return (
              <div key={drillNumber} className="col-12 md:col-6 lg:col-4">
                <div className="flex align-items-center gap-3 p-3 surface-100 border-round">
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">Drill {drillNumber}</div>
                    <div className="text-sm text-color-secondary">{readyCount}/{totalStudents} ready</div>
                  </div>
                  <div className="flex-1">
                    <ProgressBar 
                      value={percentage}
                      showValue={false}
                      className="h-1rem"
                    />
                    <div className="text-xs text-center mt-1">{percentage}%</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent Activity Table */}
      <Card>
        <h6 className="mb-3">Recent Activity</h6>
        <DataTable
          value={recentActivityData}
          size="small"
          paginator
          rows={5}
          emptyMessage="No recent activity"
        >
          <Column field="student" header="Student" />
          <Column field="activity" header="Activity" />
          <Column header="Progress" body={progressBodyTemplate} />
          <Column header="Test Ready" body={testReadyBodyTemplate} />
        </DataTable>
      </Card>
    </div>
  );
};

export default AggregateSessionSummary;
