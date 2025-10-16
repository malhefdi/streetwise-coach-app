'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { TabView, TabPanel } from 'primereact/tabview';
import { Chart } from 'primereact/chart';
import { MultiSelect } from 'primereact/multiselect';
import { InputTextarea } from 'primereact/inputtextarea';
import { Sidebar } from 'primereact/sidebar';
import Link from 'next/link';
import { gc2CurriculumEnriched } from '@/app/data/curricula/gc2.enriched';

// ---------- Types ----------
interface Student {
  id: string;
  name: string;
  rank: string;
  sessions: number;
  plan?: string[];
  progress?: Record<string, number>;
  feedback?: { date: string; message: string; tag?: string }[];
  avatar?: string;
}

interface CoachSession {
  timestamp: string;
  lessonId: string;
  notes?: string;
  completed?: number;
}

// ---------- Component ----------
const StudentProfilePage = () => {
  const { id } = useParams();

  // ---------- States ----------
  const [student, setStudent] = useState<Student | null>(null);
  const [allLessons] = useState(gc2CurriculumEnriched.lessons);
  const [newFeedback, setNewFeedback] = useState('');
  const [sessions, setSessions] = useState<CoachSession[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<CoachSession | null>(null);

  // ---------- Derived Hooks (SAFE ORDER) ----------

  // Principle Heat (run always)
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
    const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    return {
      labels: entries.map(([name]) => name),
      data: entries.map(([, count]) => count),
    };
  }, [allLessons]);

  const radarData = {
    labels: principleHeat.labels,
    datasets: [
      {
        label: 'Principle Exposure',
        data: principleHeat.data,
        backgroundColor: 'rgba(34,197,94,0.25)',
        borderColor: '#22C55E',
        pointBackgroundColor: '#22C55E',
      },
    ],
  };

  // ---------- Load Student + Sessions ----------
  useEffect(() => {
    const data = localStorage.getItem('sw_students');
    if (data) {
      const all = JSON.parse(data) as Student[];
      const found = all.find((s) => s.id === id);
      setStudent(found || null);
    }

    const sessionData = localStorage.getItem('coachSession_v2');
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      const sessionEntries: CoachSession[] = Object.entries(parsed).map(([lessonId, steps]: any) => ({
        timestamp: new Date().toLocaleString(),
        lessonId,
        completed: steps.filter((s: any) => s.completed).length / (steps.length || 1),
        notes: steps.map((s: any) => s.notes).filter(Boolean).join('; '),
      }));
      setSessions(sessionEntries);
    }
  }, [id]);

  // ---------- Save Student ----------
  const saveStudent = (updated: Student) => {
    const data = localStorage.getItem('sw_students');
    if (!data) return;
    const all = JSON.parse(data) as Student[];
    const idx = all.findIndex((s) => s.id === updated.id);
    if (idx !== -1) all[idx] = updated;
    localStorage.setItem('sw_students', JSON.stringify(all));
    setStudent(updated);
  };

  // ---------- Handlers ----------
  const openSessionDetail = (s: CoachSession) => {
    setSelectedSession(s);
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setSelectedSession(null);
  };

  const handlePlanChange = (val: string[]) => {
    const updated = { ...student!, plan: val };
    saveStudent(updated);
  };

  const handleAddFeedback = () => {
    if (!newFeedback.trim() || !student) return;
    const entry = {
      date: new Date().toLocaleString(),
      message: newFeedback.trim(),
    };
    const updated = {
      ...student,
      feedback: [...(student.feedback || []), entry],
    };
    saveStudent(updated);
    setNewFeedback('');
  };

  // ---------- Derived Data ----------
  const avgProgress =
    Object.values(student?.progress || {}).reduce((a, b) => a + b, 0) /
    (Object.keys(student?.progress || {}).length || 1);

  const analyticsData = {
    confidenceTrend: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          label: 'Confidence',
          borderColor: '#42A5F5',
          fill: false,
          tension: 0.4,
          data: [40, 55, 70, 82],
        },
      ],
    },
    completionData: {
      labels: ['Completed', 'Remaining'],
      datasets: [
        {
          data: [avgProgress, 100 - avgProgress],
          backgroundColor: ['#22C55E', '#4B5563'],
        },
      ],
    },
  };

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // ---------- Drawer Content ----------
  const renderSessionDetail = () => {
    if (!selectedSession) return null;
    const lessonData = allLessons.find(
      (l) => `gc2-l${l.lesson}` === selectedSession.lessonId
    );

    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-2">
          {lessonData?.technique || selectedSession.lessonId}
        </h2>
        <p className="text-sm text-color-secondary mb-3">{selectedSession.timestamp}</p>
        <ProgressBar
          value={(selectedSession.completed || 0) * 100}
          className="mb-4"
          pt={{
            value: {
              style: { background: 'linear-gradient(90deg,#ef4444,#22c55e)' },
            },
          }}
        />
        {lessonData ? (
          lessonData.slices.map((slice, i) => (
            <Card key={i} className="mb-3 surface-ground border-round-lg p-3">
              <h4 className="text-md font-semibold mb-2">
                Slice {i + 1}: {slice.title}
              </h4>
              <ul className="pl-3">
                {slice.steps?.map((step, j) => (
                  <li key={j} className="text-sm mb-1">
                    {step.description}
                  </li>
                ))}
              </ul>
            </Card>
          ))
        ) : (
          <p>No slice data found for this lesson.</p>
        )}
        {selectedSession.notes && (
          <>
            <Divider />
            <p className="text-sm italic opacity-70">
              Notes: {selectedSession.notes}
            </p>
          </>
        )}
      </div>
    );
  };

  // ---------- Render ----------
  if (!student)
    return (
      <div className="p-5 text-center">
        <h3>Student not found</h3>
        <Link href="/students">
          <Button label="Back to Students" className="mt-3" />
        </Link>
      </div>
    );

  return (
    <div className="p-4">
      <Link href="/students">
        <Button label="Back to Roster" icon="pi pi-arrow-left" className="p-button-text mb-3" />
      </Link>

      {/* Header */}
      <Card className="shadow-2 border-round-2xl mb-4">
        <div className="flex align-items-center gap-3">
          <img
            src={student.avatar || '/layout/images/avatar.png'}
            alt={student.name}
            className="border-circle"
            width="72"
            height="72"
          />
          <div>
            <h2 className="m-0 text-2xl font-bold">{student.name}</h2>
            <p className="m-0 text-sm text-color-secondary">{student.rank}</p>
          </div>
        </div>
        <Divider />
        <p>Total Sessions: {student.sessions}</p>
        <ProgressBar
          value={avgProgress || 0}
          showValue
          className="sw-progress"
          pt={{
            value: {
              style: {
                background: 'linear-gradient(90deg, var(--red-400), var(--green-400))',
              },
            },
          }}
        />
      </Card>

      {/* Tabs */}
      <TabView>
        <TabPanel header="Performance Analytics" leftIcon="pi pi-chart-line mr-2">
          <div className="grid">
            <div className="col-12 md:col-6">
              <Card className="shadow-2 border-round-2xl h-full">
                <h3 className="text-lg mb-3">Confidence Trend</h3>
                <Chart type="line" data={analyticsData.confidenceTrend} />
              </Card>
            </div>
            <div className="col-12 md:col-6">
              <Card className="shadow-2 border-round-2xl h-full">
                <h3 className="text-lg mb-3">Completion Breakdown</h3>
                <Chart type="doughnut" data={analyticsData.completionData} />
              </Card>
            </div>
          </div>
        </TabPanel>

        <TabPanel header="Principle Heat Wheel" leftIcon="pi pi-compass mr-2">
          <Card className="shadow-2 border-round-2xl">
            <h3 className="text-lg mb-3">Principle Exposure Radar</h3>
            <Chart type="radar" data={radarData} />
          </Card>
        </TabPanel>

        <TabPanel header="Session Timeline" leftIcon="pi pi-calendar mr-2">
          <Card className="shadow-2 border-round-2xl">
            <h3 className="text-lg mb-3">Training Sessions</h3>
            {sortedSessions.length ? (
              <ul className="pl-0 m-0 list-none">
                {sortedSessions.map((s, i) => (
                  <li
                    key={i}
                    className="mb-3 p-3 border-round-lg surface-overlay cursor-pointer hover:surface-hover transition-all"
                    onClick={() => openSessionDetail(s)}
                  >
                    <div className="flex justify-content-between mb-1">
                      <span className="font-semibold">{s.lessonId}</span>
                      <Tag
                        value={`${Math.round((s.completed || 0) * 100)}%`}
                        severity={
                          (s.completed || 0) > 0.9
                            ? 'success'
                            : (s.completed || 0) > 0.5
                            ? 'info'
                            : 'warning'
                        }
                      />
                    </div>
                    <small className="text-color-secondary">{s.timestamp}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-color-secondary">No recorded sessions yet.</p>
            )}
          </Card>
        </TabPanel>
      </TabView>

      {/* Drawer */}
      <Sidebar
        visible={drawerVisible}
        position="right"
        onHide={closeDrawer}
        showCloseIcon
        className="w-full md:w-4 lg:w-3 surface-ground"
      >
        {renderSessionDetail()}
      </Sidebar>

      <style jsx global>{`
        .sw-progress .p-progressbar {
          height: 10px;
          border-radius: 999px;
        }
      `}</style>
    </div>
  );
};

export default StudentProfilePage;
