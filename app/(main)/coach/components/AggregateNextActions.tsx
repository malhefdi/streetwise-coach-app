'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import type { Student } from '@/app/types/student.types';
import type { TestDrillReadiness } from '@/app/types/test-drill.types';

interface NextAction {
  id: string;
  studentId: string;
  studentName: string;
  type: 'teach' | 'review' | 'reteach' | 'test';
  description: string;
  lessonName: string;
  sliceName: string;
  priority: 'high' | 'medium' | 'low';
  checked: boolean;
}

interface StudentWithActions extends Student {
  nextActions: NextAction[];
  testReadiness: TestDrillReadiness[];
}

interface AggregateNextActionsProps {
  students: StudentWithActions[];
  onItemCheck: (actionId: string, checked: boolean) => void;
  onStartTest: (studentId: string, drillNumber: number) => void;
}

const AggregateNextActions: React.FC<AggregateNextActionsProps> = ({
  students,
  onItemCheck,
  onStartTest
}) => {
  const allActions = students.flatMap(student => 
    (student.nextActions || []).map(action => ({ ...action, student }))
  );

  const teachActions = allActions.filter(a => a.type === 'teach');
  const reviewActions = allActions.filter(a => a.type === 'review');
  const reteachActions = allActions.filter(a => a.type === 'reteach');
  const testActions = students.filter(s => (s.testReadiness || []).some(r => r.isReady));

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      default: return 'info';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'teach': return 'success';
      case 'review': return 'info';
      case 'reteach': return 'warning';
      default: return 'secondary';
    }
  };

  const ActionItem: React.FC<{ action: NextAction & { student: Student } }> = ({ action }) => (
    <div className="flex align-items-center gap-2 p-2 surface-100 border-round mb-2">
      <Checkbox
        checked={action.checked}
        onChange={(e) => onItemCheck(action.id, e.checked || false)}
        className="mr-2"
      />
      <div className="flex-1">
        <div className="flex align-items-center gap-2 mb-1">
          <span className="text-sm font-semibold">{action.studentName}</span>
          <Tag 
            value={action.type}
            severity={getTypeColor(action.type)}
            className="text-xs"
          />
          <Tag 
            value={action.priority}
            severity={getPriorityColor(action.priority)}
            className="text-xs"
          />
        </div>
        <div className="text-xs text-color-secondary">
          {action.lessonName} • {action.sliceName}
        </div>
        <div className="text-xs">{action.description}</div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-content-between align-items-center mb-3">
        <h6 className="m-0">Aggregate Next Actions</h6>
        <Tag value={`${allActions.length} total`} severity="info" />
      </div>

      {/* Students Ready for Test Drills */}
      {testActions.length > 0 && (
        <Card className="mb-4">
          <h6 className="text-sm font-semibold mb-2 text-green-500">Ready for Test Drills</h6>
          <div className="space-y-2">
            {testActions.map(student => (
              <div key={student.id} className="flex align-items-center gap-2 p-2 surface-100 border-round">
                <div className="flex-1">
                  <div className="text-sm font-semibold">{student.name}</div>
                  <div className="text-xs text-color-secondary">
                    {(student.testReadiness || []).filter(r => r.isReady).length}/5 drills ready
                  </div>
                </div>
                <div className="flex gap-1">
                  {(student.testReadiness || [])
                    .filter(r => r.isReady)
                    .map(readiness => (
                      <Button
                        key={readiness.drillNumber}
                        label={`Drill ${readiness.drillNumber}`}
                        size="small"
                        severity="success"
                        outlined
                        onClick={() => onStartTest(student.id, readiness.drillNumber)}
                        className="text-xs"
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* To Teach */}
      {teachActions.length > 0 && (
        <div className="mb-4">
          <h6 className="text-sm font-semibold mb-2 text-orange-500">To Teach ({teachActions.length})</h6>
          <div className="space-y-2">
            {teachActions.slice(0, 5).map(action => (
              <ActionItem key={action.id} action={action} />
            ))}
            {teachActions.length > 5 && (
              <div className="text-xs text-color-secondary text-center">
                +{teachActions.length - 5} more teaching items
              </div>
            )}
          </div>
        </div>
      )}

      {/* To Review */}
      {reviewActions.length > 0 && (
        <div className="mb-4">
          <h6 className="text-sm font-semibold mb-2 text-blue-500">To Review ({reviewActions.length})</h6>
          <div className="space-y-2">
            {reviewActions.slice(0, 5).map(action => (
              <ActionItem key={action.id} action={action} />
            ))}
            {reviewActions.length > 5 && (
              <div className="text-xs text-color-secondary text-center">
                +{reviewActions.length - 5} more review items
              </div>
            )}
          </div>
        </div>
      )}

      {/* To Reteach */}
      {reteachActions.length > 0 && (
        <div className="mb-4">
          <h6 className="text-sm font-semibold mb-2 text-yellow-500">To Reteach ({reteachActions.length})</h6>
          <div className="space-y-2">
            {reteachActions.slice(0, 5).map(action => (
              <ActionItem key={action.id} action={action} />
            ))}
            {reteachActions.length > 5 && (
              <div className="text-xs text-color-secondary text-center">
                +{reteachActions.length - 5} more reteach items
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <Card className="surface-50">
        <h6 className="text-sm font-semibold mb-2">Action Summary</h6>
        <div className="grid">
          <div className="col-4 text-center">
            <div className="text-lg font-bold text-orange-500">{teachActions.length}</div>
            <div className="text-xs text-color-secondary">Teach</div>
          </div>
          <div className="col-4 text-center">
            <div className="text-lg font-bold text-blue-500">{reviewActions.length}</div>
            <div className="text-xs text-color-secondary">Review</div>
          </div>
          <div className="col-4 text-center">
            <div className="text-lg font-bold text-yellow-500">{reteachActions.length}</div>
            <div className="text-xs text-color-secondary">Reteach</div>
          </div>
        </div>
      </Card>

      <style jsx>{`
        .space-y-2 > * + * {
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default AggregateNextActions;
