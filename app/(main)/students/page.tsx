'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { dataService } from '@/app/services/dataService';
import StudentForm from './components/StudentForm';
import type { Student } from '@/app/types/student.types';

const StudentListPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await dataService.getStudents();
      setStudents(data);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleStudentCreated = (newStudent: Student) => {
    setStudents(prev => [...prev, newStudent]);
  };

  const confirmDelete = (student: Student) => {
    setStudentToDelete(student);
    setDeleteConfirmVisible(true);
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;

    try {
      await dataService.deleteStudent(studentToDelete.id);
      setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
      setDeleteConfirmVisible(false);
      setStudentToDelete(null);
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Failed to delete student. Please try again.');
    }
  };

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
          onClick={() => setShowStudentForm(true)}
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
              <Card className="shadow-2 surface-card border-round-xl h-full p-3">
                <Link href={`/students/${student.id}`} className="no-underline">
                  <div>
                    <div className="flex align-items-center gap-3 mb-3">
                      <img
                        src={student.avatar || '/layout/images/avatar.png'}
                        alt={student.name}
                        className="border-circle"
                        width="48"
                        height="48"
                      />
                      <div>
                        <h3 className="m-0 text-lg font-semibold text-color">{student.name}</h3>
                        <p className="m-0 text-sm text-color-secondary">{student.rank}</p>
                      </div>
                    </div>

                    <div className="flex justify-content-between align-items-center mb-3">
                      <p className="text-sm m-0 text-color">
                        Total Sessions: <strong>{student.sessions}</strong>
                      </p>
                      {student.planId ? (
                        <Tag value="Plan Assigned" severity="success" icon="pi pi-check" />
                      ) : (
                        <Tag value="No Plan" severity="warning" icon="pi pi-exclamation-triangle" />
                      )}
                    </div>

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
                  </div>
                </Link>

                <div className="flex justify-content-between align-items-center mt-3">
                  <Link href={`/students/${student.id}`} className="no-underline">
                    <Button
                      label="View Profile"
                      icon="pi pi-arrow-right"
                      className="p-button-sm p-button-text"
                    />
                  </Link>
                  <Button
                    icon="pi pi-trash"
                    className="p-button-sm p-button-text p-button-danger"
                    onClick={(e) => {
                      e.preventDefault();
                      confirmDelete(student);
                    }}
                    tooltip="Delete Student"
                    tooltipOptions={{ position: 'top' }}
                  />
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Student Creation Modal */}
      <StudentForm
        visible={showStudentForm}
        onHide={() => setShowStudentForm(false)}
        onSuccess={handleStudentCreated}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        visible={deleteConfirmVisible}
        onHide={() => {
          setDeleteConfirmVisible(false);
          setStudentToDelete(null);
        }}
        header="Confirm Delete"
        modal
        style={{ width: '450px' }}
      >
        <div className="flex align-items-center gap-3 mb-4">
          <i className="pi pi-exclamation-triangle text-6xl text-red-500"></i>
          <div>
            <p className="m-0 font-bold">Delete {studentToDelete?.name}?</p>
            <p className="m-0 text-sm text-color-secondary mt-2">
              This will permanently delete the student, their lesson plan, all progress data, and session history. 
              This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex justify-content-end gap-2">
          <Button
            label="Cancel"
            icon="pi pi-times"
            onClick={() => {
              setDeleteConfirmVisible(false);
              setStudentToDelete(null);
            }}
            className="p-button-text"
          />
          <Button
            label="Delete"
            icon="pi pi-trash"
            onClick={handleDeleteStudent}
            className="p-button-danger"
          />
        </div>
      </Dialog>
    </div>
  );
};

export default StudentListPage;
