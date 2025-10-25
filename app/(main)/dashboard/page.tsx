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
import { dataService } from '@/app/services/dataService';
import type { Lesson, Slice } from '@/app/data/curriculum';





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
    const loadDashboardData = async () => {
      setSessionMap(readLocalJSON<SessionMap>('coachSession_v2', {}));
      setHasResume(!!localStorage.getItem('coachSession_v2'));
      
      // Load student and plan stats
      const students = await dataService.getStudents();
      setStudentsCount(students.length);
      
      const withPlans = students.filter(s => s.planId);
      setStudentsWithPlans(withPlans.length);
      
      // Calculate average plan completion
      if (withPlans.length > 0) {
        let totalCompletion = 0;
        for (const student of withPlans) {
          const plan = await dataService.getStudentPlan(student.id);
          const progress = await dataService.getStudentProgress(student.id);
          
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
          }
        }
        setAveragePlanCompletion(Math.round(totalCompletion / withPlans.length));
      }
    };
    
    loadDashboardData();
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

  // ---------- View A: Coach Cockpit ----------
  const CoachCockpit = () => (
    <div>
      <div className="flex flex-wrap gap-3 align-items-center justify-content-between mb-4">
        <div>
          <h2 className="m-0 text-2xl md:text-3xl font-bold">Coach Cockpit</h2>
          <p className="m-0 text-sm text-color-secondary">
            One-click access to sessions, students, and analytics.
          </p>
        </div>
        <div className="flex gap-2">
          {hasResume && (
            <Link href="/coach" className="no-underline">
              <Button label="Resume Session" icon="pi pi-play" severity="help" />
            </Link>
          )}
          <Link href="/coach" className="no-underline">
            <Button label="Start Coaching" icon="pi pi-bolt" severity="success" />
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="sw-card-grid mb-4">
        <Card className="sw-card sw-card--kpi">
          <div className="sw-card__label">Total Students</div>
          <div className="sw-card__number">{studentsCount}</div>
        </Card>
        <Card className="sw-card sw-card--kpi">
          <div className="sw-card__label">With Lesson Plans</div>
          <div className="sw-card__number text-green-500">{studentsWithPlans}</div>
          <div className="sw-card__subtext">
            {studentsCount > 0 ? Math.round((studentsWithPlans / studentsCount) * 100) : 0}% of students
          </div>
        </Card>
        <Card className="sw-card sw-card--kpi">
          <div className="sw-card__label">Avg. Plan Progress</div>
          <div className="sw-card__number text-blue-500">{averagePlanCompletion}%</div>
          <div className="sw-card__subtext">Across all plans</div>
        </Card>
        <Card className="sw-card sw-card--kpi">
          <div className="sw-card__label">Total Lessons</div>
          <div className="sw-card__number">{totalLessons}</div>
          <div className="sw-card__subtext">{totalSlices} slices</div>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="sw-card-grid mt-2">
        <QuickCard icon="pi-users" title="Students" sub="Roster" href="/students" color="primary" />
        <QuickCard icon="pi-book" title="Curriculum" sub={`${allCurricula.length} Programs`} href="/curriculum" color="success" />
        <QuickCard icon="pi-chart-bar" title="Analytics" sub="Trends" href="/analytics" color="warning" />
        <QuickCard icon="pi-history" title="Session History" sub="Reports" href="/session-history" color="help" />
      </div>

      <Divider className="my-4" />

      {/* Curriculum Coverage */}
      <div className="grid">
        <div className="col-12 md:col-8">
          <Card className="sw-card sw-card--elevated">
            <div className="sw-card__header">
              <h3 className="sw-card__title">Curriculum Coverage</h3>
            </div>
            <div className="sw-card__content">
              {positionCounts.map(({ position, count }) => {
                const percent = Math.round((count / totalLessons) * 100);
                return (
                  <div key={position} className="mb-3">
                    <div className="flex justify-content-between mb-1">
                      <span className="font-medium">{position}</span>
                      <span className="text-color-secondary">{count} lessons</span>
                    </div>
                    <ProgressBar value={percent} showValue className="sw-progress sw-progress--thick" pt={{ value: { style: gradientStyle } }} />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="col-12 md:col-4">
          <Card className="sw-card sw-card--elevated">
            <div className="sw-card__header">
              <h3 className="sw-card__title">Principles Heat</h3>
            </div>
            <div className="sw-card__content">
              <Chart
                type="bar"
                data={{
                  labels: principleHeat.top8.map(([k]) => k),
                  datasets: [{ data: principleHeat.top8.map(([, v]) => v), borderWidth: 1 }],
                }}
                options={{
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { ticks: { color: 'var(--text-color)' } },
                    y: { ticks: { color: 'var(--text-color)' } },
                  },
                  maintainAspectRatio: false,
                }}
                style={{ height: '260px' }}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

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

  // ---------- Tabs ----------
  const tabs = [
    { label: 'Coach Cockpit', icon: 'pi pi-compass' },
    { label: 'Curriculum Map', icon: 'pi pi-sitemap' },
  ];

  return (
    <div className="page-wrapper p-4 md:p-5">
      <TabMenu model={tabs} activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)} className="mb-4" />
      {activeIndex === 0 ? <CoachCockpit /> : <CurriculumMap />}
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
