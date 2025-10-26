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
    <div className="page-wrapper p-4">
      {/* Page Header */}
      <div className="sw-page-header">
        <h1 className="title-text">Students</h1>
        <p className="sw-page-subtitle">
          Manage your student roster and track their progress.
        </p>
      </div>

      {/* Search and Add Student */}
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
          className="sw-button sw-button--primary"
        />
      </div>

      {/* Empty State for No Students */}
      {filtered.length === 0 && students.length === 0 && (
        <div className="sw-empty-state">
          <div className="sw-empty-state__icon">
            <i className="pi pi-users"></i>
          </div>
          <div className="sw-empty-state__title">No students yet</div>
          <div className="sw-empty-state__description">
            Add your first student to start tracking progress and building lesson plans.
          </div>
          <div className="sw-empty-state__action">
            <Button
              label="Add Student"
              icon="pi pi-user-plus"
              className="sw-button sw-button--primary"
              onClick={() => setShowStudentForm(true)}
            />
          </div>
        </div>
      )}

      {/* Empty State for No Search Results */}
      {filtered.length === 0 && students.length > 0 && (
        <div className="sw-empty-state">
          <div className="sw-empty-state__icon">
            <i className="pi pi-search"></i>
          </div>
          <div className="sw-empty-state__title">No students found</div>
          <div className="sw-empty-state__description">
            No students match your search criteria. Try adjusting your search terms.
          </div>
          <div className="sw-empty-state__action">
            <Button
              label="Clear Search"
              icon="pi pi-times"
              className="sw-button sw-button--secondary"
              onClick={() => setSearch('')}
            />
          </div>
        </div>
      )}

      {/* Student Cards Grid - Normalized */}
      {filtered.length > 0 && (
        <div className="sw-grid sw-grid--auto-fit">
          {filtered.map((student) => {
            const avgProgress =
              Object.values(student.progress || {}).reduce((a, b) => a + b, 0) /
              (Object.keys(student.progress || {}).length || 1);

            return (
              <Card key={student.id} className="sw-card sw-card--interactive h-full">
                <div className="flex flex-column h-full">
                  {/* Student Info - Left aligned */}
                  <div className="flex-1">
                    <Link href={`/students/${student.id}`} className="no-underline">
                      <div className="flex align-items-center gap-3 mb-3">
                        <img
                          src={student.avatar || '/layout/images/avatar.png'}
                          alt={student.name}
                          className="border-circle"
                          width="48"
                          height="48"
                        />
                        <div className="flex-1">
                          <h3 className="m-0 text-lg font-semibold text-high">{student.name}</h3>
                          <p className="m-0 text-sm text-med">{student.rank}</p>
                        </div>
                      </div>

                      <div className="flex justify-content-between align-items-center mb-3">
                        <p className="text-sm m-0 text-med">
                          Sessions: <strong className="text-high">{student.sessions}</strong>
                        </p>
                        {student.planId ? (
                          <Tag value="Plan Assigned" severity="success" icon="pi pi-check" className="text-xs" />
                        ) : (
                          <Tag value="No Plan" severity="warning" icon="pi pi-exclamation-triangle" className="text-xs" />
                        )}
                      </div>

                      {/* Progress Bar - Subdued placeholder if no progress */}
                      {avgProgress > 0 ? (
                        <ProgressBar
                          value={avgProgress}
                          showValue
                          className="sw-progress"
                          pt={{
                            value: {
                              style: {
                                background: 'linear-gradient(90deg, var(--sw-primary-400), var(--sw-primary-600))',
                              },
                            },
                          }}
                        />
                      ) : (
                        <div className="mb-2">
                          <div className="sw-progress">
                            <div className="p-progressbar h-2 bg-surface-200 border-round-full">
                              <div className="p-progressbar-value bg-surface-300" style={{ width: '0%' }}></div>
                            </div>
                          </div>
                          <p className="text-xs text-low mt-1 m-0">
                            Progress appears after your first session
                          </p>
                        </div>
                      )}
                    </Link>
                  </div>

                  {/* Actions - Right aligned */}
                  <div className="flex justify-content-between align-items-center mt-3 pt-3 border-top-1 surface-border">
                    <Link href={`/students/${student.id}`} className="no-underline">
                      <Button
                        label="View"
                        icon="pi pi-arrow-right"
                        className="sw-button sw-button--text"
                        size="small"
                      />
                    </Link>
                    <Button
                      icon="pi pi-trash"
                      className="sw-button sw-button--rounded-text"
                      onClick={(e) => {
                        e.preventDefault();
                        confirmDelete(student);
                      }}
                      tooltip="Delete Student"
                      tooltipOptions={{ position: 'top' }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

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
