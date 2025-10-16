'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import { InputText } from 'primereact/inputtext';
import { gc2CurriculumEnriched } from '@/app/data/curricula/gc2.enriched';

interface Student {
  id: string;
  name: string;
  rank: string;
  sessions: number;
  notes?: string;
  plan?: string;
  progress?: Record<string, number>;
  avatar?: string;
}

const StudentListPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const data = localStorage.getItem('sw_students');
    if (data) setStudents(JSON.parse(data));
    else {
      // Demo data for first load
      const demo: Student[] = [
        { id: '1', name: 'Ali Hassan', rank: 'White Belt', sessions: 6, avatar: '/avatars/1.png' },
        { id: '2', name: 'Sara Ahmed', rank: 'Blue Belt', sessions: 12, avatar: '/avatars/2.png' },
        { id: '3', name: 'Omar Khalid', rank: 'Purple Belt', sessions: 20, avatar: '/avatars/3.png' },
      ];
      setStudents(demo);
      localStorage.setItem('sw_students', JSON.stringify(demo));
    }
  }, []);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Students</h2>

      <div className="mb-4 flex justify-content-between align-items-center gap-2">
        <span className="p-input-icon-left w-full md:w-4">
          <i className="pi pi-search" />
          <InputText
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </span>
        <Button
          label="Add Student"
          icon="pi pi-user-plus"
          onClick={() => alert('Future: open add-student modal')}
          className="p-button-success"
        />
      </div>

      <div className="grid">
        {filtered.map((student) => {
          const avgProgress =
            Object.values(student.progress || {}).reduce((a, b) => a + b, 0) /
            (Object.keys(student.progress || {}).length || 1);

          return (
            <div key={student.id} className="col-12 md:col-6 lg:col-4">
              <Link href={`/students/${student.id}`} className="no-underline">
                <Card className="shadow-2 surface-card border-round-xl sw-hover-card h-full p-3">
                  <div className="flex align-items-center gap-3 mb-3">
                    <img
                      src={student.avatar || '/layout/images/avatar.png'}
                      alt={student.name}
                      className="border-circle"
                      width="48"
                      height="48"
                    />
                    <div>
                      <h3 className="m-0 text-lg font-semibold">{student.name}</h3>
                      <p className="m-0 text-sm text-color-secondary">{student.rank}</p>
                    </div>
                  </div>

                  <p className="text-sm mb-3">
                    Total Sessions: <strong>{student.sessions}</strong>
                  </p>

                  <ProgressBar
                    value={avgProgress || 0}
                    showValue
                    className="sw-progress"
                    pt={{
                      value: {
                        style: {
                          background:
                            'linear-gradient(90deg, var(--red-400), var(--green-400))',
                        },
                      },
                    }}
                  />

                  <div className="flex justify-content-end mt-3">
                    <Button
                      label="View Profile"
                      icon="pi pi-arrow-right"
                      className="p-button-sm p-button-text"
                    />
                  </div>
                </Card>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentListPage;
