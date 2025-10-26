'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Avatar } from 'primereact/avatar';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';

interface NextActionItem {
  key: string;
  stepNumber: number;
  description: string;
  lessonName: string;
  sliceName: string;
  checked: boolean;
}

interface NextSessionCardProps {
  teachItems: NextActionItem[];
  reviewItems: NextActionItem[];
  reteachItems: NextActionItem[];
  onItemCheck: (key: string, checked: boolean) => void;
  onPrintSummary: () => void;
  onEmailStudent: () => void;
  onClearAll: () => void;
}

const NextSessionCard: React.FC<NextSessionCardProps> = ({
  teachItems,
  reviewItems,
  reteachItems,
  onItemCheck,
  onPrintSummary,
  onEmailStudent,
  onClearAll,
}) => {
  const renderActionSection = (
    items: NextActionItem[],
    title: string,
    icon: string,
    bgColor: string
  ) => {
    if (items.length === 0) return null;

    return (
      <div className="sw-action-section">
        <div className="flex align-items-center gap-2 mb-2 sw-section-header">
          <Avatar 
            icon={icon}
            shape="circle"
            size="normal"
            className={bgColor}
          />
          <h4 className="sw-section-title">{title} ({items.length})</h4>
        </div>
        <div className="flex flex-column gap-2 sw-action-items">
          {items.map(item => (
            <div key={item.key} className="sw-action-item">
              <Checkbox 
                checked={item.checked}
                onChange={(e) => onItemCheck(item.key, e.checked || false)}
                className="sw-action-checkbox"
              />
              <div className="sw-action-text">
                <div className="font-semibold">
                  {item.stepNumber}. {item.description}
                </div>
                <div className="text-xs text-color-secondary">
                  {item.lessonName} • {item.sliceName}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const totalItems = teachItems.length + reviewItems.length + reteachItems.length;
  const checkedItems = [
    ...teachItems,
    ...reviewItems,
    ...reteachItems
  ].filter(item => item.checked).length;

  return (
    <Card className="sw-next-actions-card">
      <h3 className="flex align-items-center gap-2 mb-3 sw-actions-title">
        <i className="pi pi-flag text-2xl" />
        Next Session Actions
        {totalItems > 0 && (
          <Tag 
            value={`${checkedItems}/${totalItems}`}
            severity={checkedItems === totalItems ? 'success' : 'info'}
            className="ml-2"
          />
        )}
      </h3>
      
      {totalItems === 0 ? (
        <div className="text-center p-4">
          <i className="pi pi-check-circle text-4xl text-green-500 mb-3" />
          <p className="text-color-secondary m-0">
            All actions completed! Great session.
          </p>
        </div>
      ) : (
        <>
          {renderActionSection(teachItems, 'To Teach', 'pi pi-book', 'bg-blue-500')}
          {renderActionSection(reviewItems, 'To Review', 'pi pi-refresh', 'bg-orange-500')}
          {renderActionSection(reteachItems, 'To Reteach', 'pi pi-replay', 'bg-red-500')}
          
          <Divider />
          
          <div className="flex gap-2 sw-actions-footer">
            <Button 
              label="Print Summary" 
              icon="pi pi-print" 
              outlined
              onClick={onPrintSummary}
            />
            <Button 
              label="Email Student" 
              icon="pi pi-envelope" 
              outlined
              onClick={onEmailStudent}
            />
            <Button 
              label="Clear All" 
              icon="pi pi-times" 
              severity="danger" 
              outlined
              onClick={onClearAll}
            />
          </div>
        </>
      )}
    </Card>
  );
};

export default NextSessionCard;
