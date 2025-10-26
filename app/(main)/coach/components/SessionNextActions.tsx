'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
type NextAction = 'Teach' | 'Review' | 'Reteach';

interface SessionNextActionItem {
  key: string;
  stepNumber: number;
  nextAction: NextAction;
  notes?: string;
  type: 'step' | 'slice';
  lessonName: string;
  sliceName: string;
}

interface SessionNextActionsProps {
  nextActions: SessionNextActionItem[];
  onItemCheck?: (actionKey: string, checked: boolean) => void;
}

const SessionNextActions: React.FC<SessionNextActionsProps> = ({
  nextActions,
  onItemCheck
}) => {
  const teachActions = nextActions.filter(a => a.nextAction === 'Teach');
  const reviewActions = nextActions.filter(a => a.nextAction === 'Review');
  const reteachActions = nextActions.filter(a => a.nextAction === 'Reteach');

  const getTypeColor = (type: NextAction) => {
    switch (type) {
      case 'Teach': return 'success';
      case 'Review': return 'info';
      case 'Reteach': return 'warning';
      default: return 'info';
    }
  };

  const ActionItem: React.FC<{ action: SessionNextActionItem }> = ({ action }) => (
    <div className="flex align-items-center gap-2 p-2 surface-100 border-round mb-2">
      {onItemCheck && (
        <Checkbox
          checked={false} // You can add state management for this if needed
          onChange={(e) => onItemCheck(action.key, e.checked || false)}
          className="mr-2"
        />
      )}
      <div className="flex-1">
        <div className="flex align-items-center gap-2 mb-1">
          <Tag 
            value={action.nextAction}
            severity={getTypeColor(action.nextAction)}
            className="text-xs"
          />
          {action.type === 'slice' && (
            <Tag 
              value="Slice"
              severity="info"
              className="text-xs"
            />
          )}
        </div>
        <div className="text-xs text-color-secondary">
          {action.lessonName} • {action.sliceName}
          {action.stepNumber > 0 && ` • Step ${action.stepNumber}`}
        </div>
        {action.notes && (
          <div className="text-xs mt-1 p-2 surface-200 border-round">
            <strong>Notes:</strong> {action.notes}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-content-between align-items-center mb-3">
        <h6 className="m-0">Session Next Actions</h6>
        <Tag value={`${nextActions.length} total`} severity="info" />
      </div>

      {/* To Teach */}
      {teachActions.length > 0 && (
        <div className="mb-4">
          <h6 className="text-sm font-semibold mb-2 text-orange-500">To Teach ({teachActions.length})</h6>
          <div className="space-y-2">
            {teachActions.slice(0, 5).map((action, index) => (
              <ActionItem key={`${action.key}-${index}`} action={action} />
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
            {reviewActions.slice(0, 5).map((action, index) => (
              <ActionItem key={`${action.key}-${index}`} action={action} />
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
            {reteachActions.slice(0, 5).map((action, index) => (
              <ActionItem key={`${action.key}-${index}`} action={action} />
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

export default SessionNextActions;
