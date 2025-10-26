'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { TabMenu } from 'primereact/tabmenu';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { Chart } from 'primereact/chart';
import { Divider } from 'primereact/divider';
import { getCurriculum, getAllCurricula } from '@/app/data/curriculum';
import { PRINCIPLES } from '@/app/data/principles.base';
import { dataService } from '@/app/services/dataService';
import type { Lesson, Slice } from '@/app/data/curriculum';
import ActionBar from './components/ActionBar';
import CoverageByPositionChart from './components/CoverageByPositionChart';
import AnimatedBarChart from './components/AnimatedBarChart';





// ---------- Helper Utilities ----------
type SessionMap = Record<string, Array<{ completed?: boolean }>>;
const allCurricula = getAllCurricula();
const readLocalJSON = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const POSITION_KEYS = ['Mount', 'Guard', 'Standing', 'Side Mount', 'Back'] as const;
const gradientStyle = {
  background:
    'linear-gradient(90deg, var(--red-400) 0%, var(--orange-400) 30%, var(--yellow-400) 55%, var(--green-400) 100%)'
};

// ---------- Page ----------
const DashboardPage = () => {
  // Get all lessons from all curricula
  const allLessons: Lesson[] = allCurricula.flatMap(curriculum => curriculum.lessons);

  const [activeIndex, setActiveIndex] = useState(0);
  const [sessionMap, setSessionMap] = useState<SessionMap>({});
  const [hasResume, setHasResume] = useState(false);
  const [studentsCount, setStudentsCount] = useState(0);
  const [studentsWithPlans, setStudentsWithPlans] = useState(0);
  const [averagePlanCompletion, setAveragePlanCompletion] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadDashboardData = async () => {
      try {
        setSessionMap(readLocalJSON<SessionMap>('coachSession_v2', {}));
        setHasResume(!!localStorage.getItem('coachSession_v2'));
        
        // Load student and plan stats
        const students = await dataService.getStudents();
        if (!mounted) return;
        
        setStudentsCount(students.length);
        
        const withPlans = students.filter(s => s.planId);
        setStudentsWithPlans(withPlans.length);
        
        // Calculate average plan completion using parallel fetching
        if (withPlans.length > 0) {
          const studentDataPromises = withPlans.map(async (student) => {
            try {
              const [plan, progress] = await Promise.all([
                dataService.getStudentPlan(student.id),
                dataService.getStudentProgress(student.id)
              ]);
              return { plan, progress };
            } catch (error) {
              console.error(`Error loading data for student ${student.id}:`, error);
              return { plan: null, progress: null };
            }
          });

          const studentDataResults = await Promise.all(studentDataPromises);
          if (!mounted) return;

          let totalCompletion = 0;
          let validStudents = 0;

          studentDataResults.forEach(({ plan, progress }) => {
            if (plan && progress) {
              let completedLessons = 0;
              plan.lessonIds.forEach(lessonId => {
                const lessonProgress = progress.lessons[lessonId];
                if (lessonProgress) {
                  // Check if lesson is fully completed
                  const allSteps = lessonProgress.slices.flatMap(s => s.steps || []);
                  const completedSteps = allSteps.filter(st => st.completed);
                  if (allSteps.length > 0 && completedSteps.length === allSteps.length) {
                    completedLessons++;
                  }
                }
              });
              totalCompletion += (completedLessons / plan.lessonIds.length) * 100;
              validStudents++;
            }
          });

          if (validStudents > 0) {
            setAveragePlanCompletion(Math.round(totalCompletion / validStudents));
          }
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };
    
    loadDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  const totalLessons = allLessons.length;
  const totalSlices = useMemo(
    () => allLessons.reduce((acc, l) => acc + (l.slices?.length || 0), 0),
    [allLessons]
  );

  const lessonCompletion = (lessonId: string) => {
    const sliceKeys = Object.keys(sessionMap).filter((k) => k.startsWith(`${lessonId}-`));
    const steps = sliceKeys.flatMap((k) => sessionMap[k] || []);
    if (!steps.length) return 0;
    const completed = steps.filter((s) => s?.completed).length;
    return Math.round((completed / steps.length) * 100);
  };

  const positionCounts = useMemo(() => {
    const map = new Map<string, number>();
    POSITION_KEYS.forEach((p) => map.set(p, 0));
    allLessons.forEach((l) =>
      map.set(l.position || 'Unknown', (map.get(l.position || 'Unknown') || 0) + 1)
    );
    return POSITION_KEYS.map((p) => ({ position: p, count: map.get(p) || 0 }));
  }, [allLessons]);

  const principleHeat = useMemo(() => {
    const counts = new Map<string, number>();
    allLessons.forEach((l) =>
      l.slices?.forEach((s) =>
        (s.corePrinciples || []).forEach((p) => {
          const name = p.split(' (')[0];
          counts.set(name, (counts.get(name) || 0) + 1);
        })
      )
    );
    const arr = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    return {
      all: arr,
      top8: arr.slice(0, 8),
    };
  }, [allLessons]);

  // Create principle data with IDs for radar chart
  const principleRadarData = useMemo(() => {
    return principleHeat.all.map(([name, count]) => {
      // Find the principle ID from the PRINCIPLES array
      const principle = PRINCIPLES.find(p => p.name === name);
      return {
        name,
        count,
        id: principle?.id || 0
      };
    });
  }, [principleHeat.all]);

  // ---------- Small UI helpers ----------
  const QuickCard = ({
    icon,
    title,
    sub,
    href,
    color = 'primary',
  }: {
    icon: string;
    title: string;
    sub?: string;
    href: string;
    color?: 'primary' | 'help' | 'success' | 'warning';
  }) => (
    <Link href={href} className="no-underline">
      <Card className="sw-card sw-card--interactive sw-card--elevated h-full">
        <div className="flex align-items-center gap-3">
          <span className={`pi ${icon} text-3xl text-${color}`}></span>
          <div>
            <div className="text-lg font-semibold text-color">{title}</div>
            {sub && <div className="text-sm text-color-secondary">{sub}</div>}
          </div>
        </div>
      </Card>
    </Link>
  );

  // ---------- Main Dashboard View ----------
  const MainDashboard = () => {
    // Demo-ready data for MVP
    const demoData = {
      totalStudents: studentsCount || 5,
      studentsWithPlans: studentsWithPlans || 3,
      averageProgress: averagePlanCompletion || 31,
      totalLessons: totalLessons || 68,
      totalSlices: totalSlices || 142,
      readyForTest: 2,
      notTrainedThisWeek: 1,
      mountPositionLagging: true
    };

    return (
      <div>
        {/* Hero Section */}
        <div className="sw-hero-section">
          <div className="sw-hero-content">
            <h1 className="sw-hero-title">Coach Dashboard</h1>
            <p className="sw-hero-subtitle">
              One-click access to sessions, coaching stats, and students
            </p>
          </div>
          
          {/* Primary Action */}
          <div className="sw-primary-action">
            <Link href="/coach" className="no-underline">
              <Button 
                label="Start Coaching" 
                icon="pi pi-play" 
                className="sw-hero-button"
                size="large"
              />
            </Link>
          </div>

          {/* Secondary Actions */}
          <div className="sw-secondary-actions">
            <Link href="/students" className="no-underline">
              <Button 
                label="View Students" 
                icon="pi pi-users" 
                className="sw-secondary-button"
                outlined
              />
            </Link>
            <Link href="/curriculum" className="no-underline">
              <Button 
                label="View Curriculum" 
                icon="pi pi-book" 
                className="sw-secondary-button"
                outlined
              />
            </Link>
            <Link href="/session-history" className="no-underline">
              <Button 
                label="Session History" 
                icon="pi pi-history" 
                className="sw-secondary-button"
                outlined
              />
            </Link>
            <Link href="/analytics" className="no-underline">
              <Button 
                label="Analytics" 
                icon="pi pi-chart-bar" 
                className="sw-secondary-button"
                outlined
              />
            </Link>
          </div>
        </div>

        {/* KPI Cards - 2x2 Grid */}
        <div className="sw-kpi-grid">
          <Card className="sw-kpi-card">
            <div className="sw-kpi-content">
              <div className="sw-kpi-number">{demoData.totalStudents}</div>
              <div className="sw-kpi-label">Total Students</div>
              <div className="sw-kpi-subtitle">Active roster</div>
            </div>
            <div className="sw-kpi-icon">
              <i className="pi pi-users text-blue-500"></i>
            </div>
          </Card>

          <Card className="sw-kpi-card">
            <div className="sw-kpi-content">
              <div className="sw-kpi-number text-green-500">{demoData.studentsWithPlans}</div>
              <div className="sw-kpi-label">With Lesson Plans</div>
              <div className="sw-kpi-subtitle">
                {Math.round((demoData.studentsWithPlans / demoData.totalStudents) * 100)}% of students
              </div>
            </div>
            <div className="sw-kpi-icon">
              <i className="pi pi-check-circle text-green-500"></i>
            </div>
          </Card>

          <Card className="sw-kpi-card">
            <div className="sw-kpi-content">
              <div className="sw-kpi-number text-orange-500">{demoData.averageProgress}%</div>
              <div className="sw-kpi-label">Avg. Progress</div>
              <div className="sw-kpi-subtitle">Across all plans</div>
            </div>
            <div className="sw-kpi-icon">
              <i className="pi pi-chart-line text-orange-500"></i>
            </div>
          </Card>

          <Card className="sw-kpi-card">
            <div className="sw-kpi-content">
              <div className="sw-kpi-number text-purple-500">{demoData.totalLessons}</div>
              <div className="sw-kpi-label">Total Lessons</div>
              <div className="sw-kpi-subtitle">{demoData.totalSlices} slices available</div>
            </div>
            <div className="sw-kpi-icon">
              <i className="pi pi-book text-purple-500"></i>
            </div>
          </Card>
        </div>

        {/* Coaching Insights */}
        <Card className="sw-insights-card">
          <div className="sw-insights-header">
            <h3 className="sw-insights-title">
              <i className="pi pi-lightbulb text-yellow-500"></i>
              Coaching Insights
            </h3>
          </div>
          <div className="sw-insights-content">
            <div className="sw-insight-item">
              <i className="pi pi-star text-green-500"></i>
              <span>{demoData.readyForTest} students ready for belt test</span>
            </div>
            <div className="sw-insight-item">
              <i className="pi pi-clock text-orange-500"></i>
              <span>{demoData.notTrainedThisWeek} student hasn't trained this week</span>
            </div>
            <div className="sw-insight-item">
              <i className="pi pi-exclamation-triangle text-red-500"></i>
              <span>Mount position needs more focus</span>
            </div>
          </div>
        </Card>

        {/* Charts Section - Only show if students exist */}
        {demoData.totalStudents > 0 && (
          <div className="sw-charts-section">
            <div className="grid">
              <div className="col-12 md:col-8">
                <Card className="sw-chart-card">
                  <div className="sw-chart-header">
                    <h3 className="sw-chart-title">Coverage by Position</h3>
                  </div>
                  <div className="sw-chart-content">
                    <CoverageByPositionChart 
                      data={positionCounts.map(({ position, count }) => ({
                        position,
                        count,
                        percentage: Math.round((count / totalLessons) * 100)
                      }))}
                      totalLessons={totalLessons}
                    />
                  </div>
                </Card>
              </div>

              <div className="col-12 md:col-4">
                <Card className="sw-chart-card">
                  <div className="sw-chart-header">
                    <h3 className="sw-chart-title">Principles Race</h3>
                    <p className="sw-chart-subtitle">Usage Rankings</p>
                  </div>
                  <div className="sw-chart-content">
                    <AnimatedBarChart 
                      data={principleRadarData}
                    />
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ---------- View B: Curriculum Map ----------
  const CurriculumMap = () => {
    const donutData = {
      labels: positionCounts.map((p) => p.position),
      datasets: [{ data: positionCounts.map((p) => p.count) }],
    };
    const donutOptions = {
      plugins: { legend: { labels: { color: 'var(--text-color)' } } },
      cutout: '60%',
    };
    const todaysPrinciple = principleHeat.all[0]?.[0] || 'Connection';

    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">Curriculum Map</h2>
        <div className="grid">
          <div className="col-12 md:col-4">
            <Card className="shadow-2 border-round-2xl">
              <h3>Coverage by Position</h3>
              <Chart type="doughnut" data={donutData} options={donutOptions} style={{ height: '260px' }} />
              <Divider />
              <h4 className="text-sm text-color-secondary mb-2">Coach Checklist</h4>
              <ul className="pl-3 text-sm">
                <li>Select today’s position</li>
                <li>Warmup & mobility</li>
                <li>Pick 2 lessons → 1 drill → 1 scenario</li>
                <li>Principle focus: <b>{todaysPrinciple}</b></li>
              </ul>
            </Card>
          </div>

          <div className="col-12 md:col-8">
            <Card className="shadow-2 border-round-2xl">
              <h3 className="mb-3">Lessons Overview</h3>
              <div className="grid">
                {allLessons.map((l) => {
                  const id = `gc2-l${l.lessonNumber}`;
                  const pct = lessonCompletion(id);
                  return (
                    <div className="col-12 md:col-6 lg:col-4" key={id}>
                      <Link href={`/coach?lesson=${l.lessonNumber}`} className="no-underline">
                        <Card className="surface-card border-round-xl shadow-1 sw-hover-card h-full p-3">
                          <div className="text-xs text-color-secondary mb-1">{l.position}</div>
                          <div className="font-medium mb-2">{`L${l.lessonNumber} — ${l.technique}`}</div>
                          <ProgressBar value={pct} className="sw-progress mb-2" pt={{ value: { style: gradientStyle } }} />
                          <div className="flex justify-content-between align-items-center">
                            <Tag value={`${pct}%`} />
                            <Button icon="pi pi-arrow-right" rounded text />
                          </div>
                        </Card>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-wrapper sw-dashboard-full-width">
      <MainDashboard />
      <style jsx global>{`
        .sw-hover-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sw-progress .p-progressbar {
          height: 10px;
          border-radius: 999px;
          background: color-mix(in oklab, var(--surface-200) 60%, transparent);
        }
        .sw-card-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        }
        @media (max-width: 768px) {
          .sw-card-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
