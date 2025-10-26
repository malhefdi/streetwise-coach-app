'use client';

import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Accordion, AccordionTab } from 'primereact/accordion';
import type { Student } from '@/app/types/student.types';
import type { TestDrillReadiness, TestDrill } from '@/app/types/test-drill.types';

interface StudentWithTestData extends Student {
  testReadiness?: TestDrillReadiness[];
  curriculumId: string;
}

interface TestDrillsUtilitiesProps {
  student?: StudentWithTestData | null;
  allStudents: StudentWithTestData[];
  testDrills: TestDrill[];
  onStartTest: (studentId: string, drillNumber: number) => void;
  onPrintChecklist: (studentId: string, drillNumber: number) => void;
  onViewPrerequisites: (studentId: string, drillNumber: number) => void;
}

const TestDrillsUtilities: React.FC<TestDrillsUtilitiesProps> = ({
  student,
  allStudents,
  testDrills,
  onStartTest,
  onPrintChecklist,
  onViewPrerequisites
}) => {
  const [selectedDrill, setSelectedDrill] = useState<{ studentId: string; drillNumber: number } | null>(null);
  const [showDrillDetails, setShowDrillDetails] = useState(false);

  const studentsToShow = student ? [student] : allStudents;
  const totalDrills = testDrills.length;
  const studentsWithReadyDrills = studentsToShow.filter(s => (s.testReadiness ?? []).some(r => r.isReady)).length;
  const totalReadyDrills = studentsToShow.reduce((sum, s) => sum + (s.testReadiness ?? []).filter(r => r.isReady).length, 0);
  const averageReadiness = studentsToShow.length > 0 
    ? Math.round((totalReadyDrills / (studentsToShow.length * totalDrills)) * 100) 
    : 0;

  const getReadinessColor = (readiness: TestDrillReadiness) => {
    if (readiness.isReady) return 'success';
    if (readiness.completionPercentage >= 80) return 'warning';
    if (readiness.completionPercentage >= 50) return 'info';
    return 'danger';
  };

  const getReadinessSeverity = (readiness: TestDrillReadiness) => {
    if (readiness.isReady) return 'success';
    if (readiness.completionPercentage >= 80) return 'warning';
    if (readiness.completionPercentage >= 50) return 'info';
    return 'danger';
  };

  const readinessCellTemplate = (rowData: StudentWithTestData, drillNumber: number) => {
    const readiness = (rowData.testReadiness ?? []).find(r => r.drillNumber === drillNumber);
    if (!readiness) return <Tag value="N/A" severity="info" className="text-xs" />;

    return (
      <div className="text-center">
        <Tag 
          value={`${readiness.completionPercentage}%`}
          severity={getReadinessSeverity(readiness)}
          className="text-xs"
        />
        {readiness.isReady && (
          <Button
            icon="pi pi-play"
            size="small"
            severity="success"
            outlined
            onClick={() => onStartTest(rowData.id, drillNumber)}
            className="ml-1"
            tooltip="Start Test"
          />
        )}
      </div>
    );
  };

  const studentNameTemplate = (rowData: StudentWithTestData) => (
    <div>
      <div className="font-semibold">{rowData.name}</div>
      <div className="text-xs text-color-secondary">{rowData.rank}</div>
    </div>
  );

  const handleDrillDetails = (studentId: string, drillNumber: number) => {
    setSelectedDrill({ studentId, drillNumber });
    setShowDrillDetails(true);
  };

  const selectedStudent = selectedDrill ? studentsToShow.find(s => s.id === selectedDrill.studentId) : null;
  const selectedDrillData = selectedDrill ? testDrills.find(d => d.drillNumber === selectedDrill.drillNumber) : null;
  const selectedReadiness = selectedDrill && selectedStudent 
    ? (selectedStudent.testReadiness ?? []).find(r => r.drillNumber === selectedDrill.drillNumber)
    : null;

  return (
    <div>
      <div className="flex justify-content-between align-items-center mb-3">
        <h6 className="m-0">Test Drills Utilities</h6>
        <Tag value={`${studentsWithReadyDrills}/${studentsToShow.length} students ready`} severity="success" />
      </div>

      {/* Overview Section */}
      <Card className="mb-4">
        <h6 className="mb-3">Overview</h6>
        <div className="grid">
          <div className="col-4 text-center">
            <div className="text-2xl font-bold text-primary">{totalDrills}</div>
            <div className="text-sm text-color-secondary">Total Drills</div>
          </div>
          <div className="col-4 text-center">
            <div className="text-2xl font-bold text-green-500">{studentsWithReadyDrills}</div>
            <div className="text-sm text-color-secondary">Students Ready</div>
          </div>
          <div className="col-4 text-center">
            <div className="text-2xl font-bold text-orange-500">{averageReadiness}%</div>
            <div className="text-sm text-color-secondary">Avg Readiness</div>
          </div>
        </div>
      </Card>

      {/* Student Test Status Table */}
      <Card className="mb-4">
        <h6 className="mb-3">Student Test Status</h6>
        <DataTable
          value={studentsToShow}
          size="small"
          paginator={studentsToShow.length > 10}
          rows={10}
          emptyMessage="No students found"
        >
          <Column header="Student" body={studentNameTemplate} />
          {[1, 2, 3, 4, 5].map(drillNumber => (
            <Column 
              key={drillNumber}
              header={`Drill ${drillNumber}`}
              body={(rowData) => readinessCellTemplate(rowData, drillNumber)}
              style={{ textAlign: 'center' }}
            />
          ))}
        </DataTable>
      </Card>

      {/* Quick Actions */}
      <Card className="mb-4">
        <h6 className="mb-3">Quick Actions</h6>
        <div className="flex flex-wrap gap-2">
          <Button
            label="Start Test Session"
            icon="pi pi-play"
            size="small"
            severity="success"
            onClick={() => {
              const readyStudent = studentsToShow.find(s => (s.testReadiness ?? []).some(r => r.isReady));
              if (readyStudent) {
                const readyDrill = (readyStudent.testReadiness ?? []).find(r => r.isReady);
                if (readyDrill) {
                  onStartTest(readyStudent.id, readyDrill.drillNumber);
                }
              }
            }}
            disabled={studentsWithReadyDrills === 0}
          />
          <Button
            label="Print Test Checklist"
            icon="pi pi-print"
            size="small"
            outlined
            onClick={() => {
              const readyStudent = studentsToShow.find(s => (s.testReadiness ?? []).some(r => r.isReady));
              if (readyStudent) {
                const readyDrill = (readyStudent.testReadiness ?? []).find(r => r.isReady);
                if (readyDrill) {
                  onPrintChecklist(readyStudent.id, readyDrill.drillNumber);
                }
              }
            }}
            disabled={studentsWithReadyDrills === 0}
          />
          <Button
            label="View Prerequisites"
            icon="pi pi-list"
            size="small"
            outlined
            onClick={() => {
              const student = studentsToShow[0];
              if (student) {
                onViewPrerequisites(student.id, 1);
              }
            }}
          />
        </div>
      </Card>

      {/* Drill Details Expandable Sections */}
      <Card>
        <h6 className="mb-3">Drill Details</h6>
        <Accordion multiple>
          {testDrills.map(drill => (
            <AccordionTab
              key={drill.drillNumber}
              header={
                <div className="flex justify-content-between align-items-center w-full">
                  <span className="font-semibold">Drill {drill.drillNumber}: {drill.title}</span>
                  <Tag 
                    value={`${studentsToShow.filter(s => (s.testReadiness ?? []).find(r => r.drillNumber === drill.drillNumber)?.isReady).length}/${studentsToShow.length} ready`}
                    severity="info"
                    className="text-xs"
                  />
                </div>
              }
            >
              <div className="grid">
                <div className="col-12 md:col-6">
                  <h6 className="mb-2">Drill Information</h6>
                  <div className="space-y-2">
                    <div><strong>Name:</strong> {drill.title}</div>
                    <div><strong>Time Limit:</strong> {drill.timeLimitMinutes || 5} minutes</div>
                    <div><strong>Description:</strong> {drill.description || 'Demonstrate all techniques in order'}</div>
                  </div>
                </div>
                <div className="col-12 md:col-6">
                  <h6 className="mb-2">Student Readiness</h6>
                  <div className="space-y-2">
                    {studentsToShow.map(student => {
                      const readiness = (student.testReadiness ?? []).find(r => r.drillNumber === drill.drillNumber);
                      return (
                        <div key={student.id} className="flex justify-content-between align-items-center p-2 surface-100 border-round">
                          <span className="text-sm">{student.name}</span>
                          <div className="flex align-items-center gap-2">
                            <ProgressBar 
                              value={readiness?.completionPercentage || 0}
                              showValue={false}
                              className="w-6rem h-1rem"
                            />
                            <Tag 
                              value={readiness?.isReady ? 'Ready' : 'Not Ready'}
                              severity={readiness?.isReady ? 'success' : 'danger'}
                              className="text-xs"
                            />
                            {readiness?.isReady && (
                              <Button
                                icon="pi pi-play"
                                size="small"
                                severity="success"
                                outlined
                                onClick={() => onStartTest(student.id, drill.drillNumber)}
                                tooltip="Start Test"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </AccordionTab>
          ))}
        </Accordion>
      </Card>

      {/* Drill Details Dialog */}
      <Dialog
        visible={showDrillDetails}
        onHide={() => setShowDrillDetails(false)}
        header={`Drill ${selectedDrill?.drillNumber} Details`}
        style={{ width: '600px' }}
        modal
      >
        {selectedDrillData && selectedStudent && selectedReadiness && (
          <div>
            <div className="mb-3">
              <h6>Drill Information</h6>
              <p><strong>Name:</strong> {selectedDrillData.title}</p>
              <p><strong>Student:</strong> {selectedStudent.name}</p>
              <p><strong>Readiness:</strong> 
                <Tag 
                  value={selectedReadiness.isReady ? 'Ready' : `${selectedReadiness.completionPercentage}%`}
                  severity={getReadinessSeverity(selectedReadiness)}
                  className="ml-2"
                />
              </p>
            </div>
            
            {selectedReadiness.missingLessons.length > 0 && (
              <div className="mb-3">
                <h6>Missing Prerequisites</h6>
                <div className="flex flex-wrap gap-1">
                  {selectedReadiness.missingLessons.map((lessonId: string) => (
                    <Tag key={lessonId} value={lessonId} severity="danger" className="text-xs" />
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                label="Start Test"
                icon="pi pi-play"
                severity="success"
                onClick={() => {
                  onStartTest(selectedStudent.id, selectedDrill!.drillNumber);
                  setShowDrillDetails(false);
                }}
                disabled={!selectedReadiness.isReady}
              />
              <Button
                label="Print Checklist"
                icon="pi pi-print"
                outlined
                onClick={() => {
                  onPrintChecklist(selectedStudent.id, selectedDrill!.drillNumber);
                  setShowDrillDetails(false);
                }}
              />
              <Button
                label="Practice Mode"
                icon="pi pi-cog"
                outlined
                onClick={() => {
                  // Override for practice mode
                  onStartTest(selectedStudent.id, selectedDrill!.drillNumber);
                  setShowDrillDetails(false);
                }}
              />
            </div>
          </div>
        )}
      </Dialog>

      <style jsx>{`
        .space-y-2 > * + * {
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default TestDrillsUtilities;
