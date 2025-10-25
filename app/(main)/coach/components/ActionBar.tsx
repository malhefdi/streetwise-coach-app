'use client';

import React, { useRef } from 'react';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Menu } from 'primereact/menu';

interface ActionBarProps {
  elapsed: number;
  completedSteps: number;
  totalSteps: number;
  onSave: () => void;
  onEndSession: () => void;
  onExportSession: () => void;
  onPrintSession: () => void;
  onEmailSummary: () => void;
}

const ActionBar: React.FC<ActionBarProps> = ({
  elapsed,
  completedSteps,
  totalSteps,
  onSave,
  onEndSession,
  onExportSession,
  onPrintSession,
  onEmailSummary,
}) => {
  const actionMenu = useRef<Menu>(null);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const menuItems = [
    {
      label: 'Export Session',
      icon: 'pi pi-download',
      command: onExportSession,
    },
    {
      label: 'Print Session',
      icon: 'pi pi-print',
      command: onPrintSession,
    },
    {
      label: 'Email Summary',
      icon: 'pi pi-envelope',
      command: onEmailSummary,
    },
  ];

  return (
    <div className="sw-action-bar">
      <div className="flex justify-content-between align-items-center">
        {/* Left: Session Info */}
        <div className="flex align-items-center gap-3 sw-session-info">
          <Tag 
            value={formatTime(elapsed)} 
            severity="info"
            icon="pi pi-clock"
            className="sw-timer-tag"
          />
          <span className="sw-steps-count">
            {completedSteps}/{totalSteps} steps
          </span>
        </div>
        
        {/* Right: Primary Actions */}
        <div className="flex gap-2 sw-primary-actions">
          <Button 
            label="Save" 
            icon="pi pi-save"
            severity="success"
            onClick={onSave}
          />
          <Button 
            label="End Session" 
            icon="pi pi-sign-out"
            severity="danger"
            onClick={onEndSession}
          />
          <Button 
            icon="pi pi-ellipsis-v"
            rounded
            text
            onClick={(e) => actionMenu.current?.toggle(e)}
            tooltip="More Actions"
            tooltipOptions={{ position: 'top' }}
          />
        </div>
      </div>
      
      <Menu 
        ref={actionMenu}
        model={menuItems}
        popup
        className="sw-action-menu"
      />
    </div>
  );
};

export default ActionBar;
