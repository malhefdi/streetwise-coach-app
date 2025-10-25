'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';

interface SummaryData {
  lessonName: string;
  sliceName: string;
  stepsComplete: number;
  totalSteps: number;
  completionPercentage: number;
  avgConfidence: number;
  nextAction?: string;
  completed: boolean;
  inProgress: boolean;
  notStarted: boolean;
}

interface SessionSummaryGridProps {
  summaryData: SummaryData[];
  onExport: () => void;
  onPrint: () => void;
}

const SessionSummaryGrid: React.FC<SessionSummaryGridProps> = ({
  summaryData,
  onExport,
  onPrint,
}) => {
  const getStatusIcon = (data: SummaryData) => {
    if (data.completed) return 'pi-check-circle';
    if (data.inProgress) return 'pi-clock';
    return 'pi-times-circle';
  };

  const getConfidenceSeverity = (confidence: number) => {
    if (confidence >= 80) return 'success';
    if (confidence >= 60) return 'warning';
    return 'danger';
  };

  const getActionSeverity = (action: string) => {
    switch (action.toLowerCase()) {
      case 'teach': return 'info';
      case 'review': return 'warning';
      case 'reteach': return 'danger';
      default: return 'info';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'teach': return 'pi pi-book';
      case 'review': return 'pi pi-refresh';
      case 'reteach': return 'pi pi-replay';
      default: return 'pi pi-arrow-right';
    }
  };

  const lessonTemplate = (data: SummaryData) => (
    <div className="flex align-items-center gap-2">
      <i className={`pi ${getStatusIcon(data)} text-xl sw-status-icon`} />
      <span className="font-semibold">{data.lessonName}</span>
    </div>
  );

  const progressTemplate = (data: SummaryData) => (
    <div>
      <ProgressBar 
        value={data.completionPercentage} 
        showValue={false}
        className="sw-mini-progress mb-1"
      />
      <span className="text-xs text-color-secondary">
        {data.stepsComplete}/{data.totalSteps}
      </span>
    </div>
  );

  const confidenceTemplate = (data: SummaryData) => (
    <Tag 
      severity={getConfidenceSeverity(data.avgConfidence)}
      value={`${Math.round(data.avgConfidence)}%`}
    />
  );

  const nextActionTemplate = (data: SummaryData) => {
    if (!data.nextAction) return null;
    
    return (
      <Tag 
        severity={getActionSeverity(data.nextAction)}
        value={data.nextAction}
        icon={getActionIcon(data.nextAction)}
      />
    );
  };

  const rowClassName = (data: SummaryData) => {
    if (data.completed) return 'bg-green-900';
    if (data.inProgress) return 'bg-orange-900';
    return 'bg-red-900';
  };

  return (
    <Card className="sw-summary-grid">
      <div className="flex justify-content-between align-items-center mb-3 sw-summary-header">
        <h3 className="sw-summary-title">Session Summary</h3>
        <div className="flex gap-2 sw-summary-actions">
          <Button 
            label="Export" 
            icon="pi pi-download" 
            size="small" 
            outlined
            onClick={onExport}
          />
          <Button 
            label="Print" 
            icon="pi pi-print" 
            size="small" 
            outlined
            onClick={onPrint}
          />
        </div>
      </div>
      
      <DataTable 
        value={summaryData}
        size="small"
        className="sw-summary-table"
        rowClassName={rowClassName}
        emptyMessage="No session data available"
        scrollable
        scrollHeight="400px"
      >
        <Column 
          field="lessonName" 
          header="Lesson"
          body={lessonTemplate}
          style={{ minWidth: '200px' }}
        />
        <Column 
          field="sliceName" 
          header="Slice"
          style={{ minWidth: '150px' }}
        />
        <Column 
          field="stepsComplete" 
          header="Progress"
          body={progressTemplate}
          style={{ minWidth: '120px' }}
        />
        <Column 
          field="avgConfidence" 
          header="Confidence"
          body={confidenceTemplate}
          style={{ minWidth: '100px' }}
        />
        <Column 
          field="nextAction" 
          header="Next"
          body={nextActionTemplate}
          style={{ minWidth: '100px' }}
        />
      </DataTable>
    </Card>
  );
};

export default SessionSummaryGrid;
