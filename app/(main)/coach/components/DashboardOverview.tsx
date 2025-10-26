'use client';

import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { Avatar } from 'primereact/avatar';
import type { Student } from '@/app/types/student.types';
import type { TestDrillReadiness } from '@/app/types/test-drill.types';

interface DashboardStats {
  totalStudents: number;
  totalLessonsInProgress: number;
  averageProgress: number;
  upcomingSessions: number;
  recentActivity: number;
  testDrillsReady: number;
  curriculumCompletion: number;
  masteryRate: number;
  averageMastery: number;
  advancedStudents: number;
}

interface StudentWithStats extends Student {
  overallProgress: number;
  lessonsCompleted: number;
  avgConfidence: number;
  testReadiness: TestDrillReadiness[];
  status: 'active' | 'needs-attention' | 'ready-to-test';
}

interface DashboardOverviewProps {
  stats: DashboardStats;
  students: StudentWithStats[];
  onStartSession: (studentId: string) => void;
  onStartTest: (studentId: string, drillNumber: number) => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  students,
  onStartSession,
  onStartTest
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Dynamic column classes based on screen size
  const statsColClass = isMobile ? 'col-6' : 'col-12 md:col-6 lg:col-2';
  const masteryColClass = isMobile ? 'col-6' : 'col-12 md:col-6 lg:col-3';
  const studentColClass = isMobile ? 'col-12' : 'col-12 md:col-6 lg:col-4';

  return (
    <div className="dashboard-overview">
      {/* Primary Stats Grid */}
      <div className="grid mb-3">
        <div className={statsColClass}>
          <Card className="text-center">
            <div className={`font-bold text-primary mb-1 ${isMobile ? 'text-xl' : 'text-2xl'}`}>{stats.totalStudents}</div>
            <div className={`text-color-secondary ${isMobile ? 'text-xs' : 'text-sm'}`}>Active Students</div>
          </Card>
        </div>
        <div className={statsColClass}>
          <Card className="text-center">
            <div className={`font-bold text-orange-500 mb-1 ${isMobile ? 'text-xl' : 'text-2xl'}`}>{stats.totalLessonsInProgress}</div>
            <div className={`text-color-secondary ${isMobile ? 'text-xs' : 'text-sm'}`}>Lessons in Progress</div>
          </Card>
        </div>
        <div className={statsColClass}>
          <Card className="text-center">
            <div className={`font-bold text-green-500 mb-1 ${isMobile ? 'text-xl' : 'text-2xl'}`}>{stats.averageProgress}%</div>
            <div className={`text-color-secondary ${isMobile ? 'text-xs' : 'text-sm'}`}>Avg Progress</div>
          </Card>
        </div>
        <div className={statsColClass}>
          <Card className="text-center">
            <div className={`font-bold text-blue-500 mb-1 ${isMobile ? 'text-xl' : 'text-2xl'}`}>{stats.upcomingSessions}</div>
            <div className={`text-color-secondary ${isMobile ? 'text-xs' : 'text-sm'}`}>Upcoming Sessions</div>
          </Card>
        </div>
        <div className={statsColClass}>
          <Card className="text-center">
            <div className={`font-bold text-purple-500 mb-1 ${isMobile ? 'text-xl' : 'text-2xl'}`}>{stats.recentActivity}</div>
            <div className={`text-color-secondary ${isMobile ? 'text-xs' : 'text-sm'}`}>Recent Activity</div>
          </Card>
        </div>
        <div className={statsColClass}>
          <Card className="text-center">
            <div className={`font-bold text-cyan-500 mb-1 ${isMobile ? 'text-xl' : 'text-2xl'}`}>{stats.testDrillsReady}</div>
            <div className={`text-color-secondary ${isMobile ? 'text-xs' : 'text-sm'}`}>Test Drills Ready</div>
          </Card>
        </div>
      </div>

      {/* Curriculum & Mastery KPIs */}
      {!isMobile && (
        <div className="grid mb-4">
          <div className="col-12 md:col-6 lg:col-3">
            <Card className="text-center">
              <div className="text-2xl font-bold text-indigo-500 mb-1">{stats.curriculumCompletion}%</div>
              <div className="text-sm text-color-secondary">Curriculum Completion</div>
              <ProgressBar 
                value={stats.curriculumCompletion} 
                showValue={false} 
                className="h-1rem mt-2"
              />
            </Card>
          </div>
          <div className="col-12 md:col-6 lg:col-3">
            <Card className="text-center">
              <div className="text-2xl font-bold text-teal-500 mb-1">{stats.masteryRate}%</div>
              <div className="text-sm text-color-secondary">Mastery Rate</div>
              <ProgressBar 
                value={stats.masteryRate} 
                showValue={false} 
                className="h-1rem mt-2"
              />
            </Card>
          </div>
          <div className="col-12 md:col-6 lg:col-3">
            <Card className="text-center">
              <div className="text-2xl font-bold text-pink-500 mb-1">{stats.averageMastery}%</div>
              <div className="text-sm text-color-secondary">Avg Mastery Level</div>
              <ProgressBar 
                value={stats.averageMastery} 
                showValue={false} 
                className="h-1rem mt-2"
              />
            </Card>
          </div>
          <div className="col-12 md:col-6 lg:col-3">
            <Card className="text-center">
              <div className="text-2xl font-bold text-amber-500 mb-1">{stats.advancedStudents}</div>
              <div className="text-sm text-color-secondary">Advanced Students</div>
              <Tag 
                value={stats.advancedStudents > 0 ? 'Ahead of Pace' : 'On Track'}
                severity={stats.advancedStudents > 0 ? 'success' : 'info'}
                className="mt-2"
              />
            </Card>
          </div>
        </div>
      )}

      {/* Test Drills Quick View */}
      <Card className="mb-4">
        <div className="flex justify-content-between align-items-center mb-3">
          <h5 className="m-0">Test Drills Quick View</h5>
          <Tag value={`${stats.testDrillsReady} students ready`} severity="success" />
        </div>
        
        <div className="grid">
          {students.filter(s => s.testReadiness.some(r => r.isReady)).map(student => (
            <div key={student.id} className={studentColClass}>
              <Card className="h-full">
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
                </div>
                
                <div className="mb-3">
                  <div className="flex justify-content-between align-items-center mb-1">
                    <span className="text-sm font-semibold">Test Readiness</span>
                    <Tag 
                      value={getTestReadinessBadge(student.testReadiness)}
                      severity={getTestReadinessSeverity(student.testReadiness)}
                      className="text-xs"
                    />
                  </div>
                  <ProgressBar 
                    value={(student.testReadiness.filter(r => r.isReady).length / student.testReadiness.length) * 100}
                    showValue={false}
                    className="h-1rem"
                  />
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {student.testReadiness.map(readiness => (
                    <Button
                      key={readiness.drillNumber}
                      label={`Drill ${readiness.drillNumber}`}
                      size="small"
                      severity={readiness.isReady ? 'success' : readiness.completionPercentage > 50 ? 'warning' : 'danger'}
                      outlined={!readiness.isReady}
                      onClick={() => onStartTest(student.id, readiness.drillNumber)}
                      className="text-xs"
                    />
                  ))}
                </div>

                <Button
                  label="Start Session"
                  icon="pi pi-play"
                  size="small"
                  className="w-full"
                  onClick={() => onStartSession(student.id)}
                />
              </Card>
            </div>
          ))}
        </div>
      </Card>

      {/* Student Cards */}
      <div className="grid">
        {students.map(student => (
          <div key={student.id} className={studentColClass}>
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
                  value={student.status.replace(/-/g, ' ')}
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
            </Card>
          </div>
        ))}
      </div>

      <style jsx>{`
        .student-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .student-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .dashboard-overview .p-card {
          border: 1px solid var(--surface-border);
          transition: all 0.2s ease;
        }
        
        .dashboard-overview .p-card:hover {
          border-color: var(--primary-color);
        }
      `}</style>
    </div>
  );
};

export default DashboardOverview;
