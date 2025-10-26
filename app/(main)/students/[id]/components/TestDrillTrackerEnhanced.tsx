'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Panel } from 'primereact/panel';
import { Divider } from 'primereact/divider';
import { Badge } from 'primereact/badge';
import { Message } from 'primereact/message';
import { Tooltip } from 'primereact/tooltip';
import { gc2Curriculum } from '@/app/data/gc2.curriculum';
import { getEnhancedTestDrillsForCurriculum, calculateSprintReadiness, calculateEnhancedTestDrillReadiness } from '@/app/services/testDrillService';
import type { EnhancedTestDrill, TestDrillReadiness, SprintGroup } from '@/app/types/test-drill.types';
import type { StudentPlan, StudentProgress } from '@/app/types/plan.types';
import type { Lesson, Slice } from '@/app/data/curriculum';

interface TestDrillTrackerEnhancedProps {
  studentId: string;
  studentPlan: StudentPlan | null;
  studentProgress: StudentProgress | null;
  onDrillSelect?: (drill: EnhancedTestDrill) => void;
}

interface SprintGroupDisplayProps {
  sprintGroup: SprintGroup;
  isReady: boolean;
  onSprintComplete?: (groupNumber: number) => void;
}

const SprintGroupDisplay: React.FC<SprintGroupDisplayProps> = ({ 
  sprintGroup, 
  isReady, 
  onSprintComplete 
}) => {
  const cleanCombinationText = (combination?: string) => {
    if (!combination) return '';
    return combination
      .replace(/^\+/, '') // Remove leading +
      .replace(/\\\+/g, '+') // Replace \+ with +
      .trim();
  };

  const getLessonTag = (lessonNumber: number) => {
    const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'danger', 'contrast'];
    const colorIndex = (lessonNumber - 1) % colors.length;
    return (
      <Tag 
        severity={colors[colorIndex] as any} 
        value={`L${lessonNumber}`}
        className="text-xs"
      />
    );
  };

  return (
    <Card className="sprint-group-card mb-3">
      <div className="flex justify-content-between align-items-start mb-3">
        <div>
          <h6 className="font-semibold text-lg mb-1">
            Sprint {sprintGroup.groupNumber}: {sprintGroup.groupTitle}
          </h6>
          <div className="flex gap-2">
            <Tag 
              value={`${sprintGroup.estimatedTimeMinutes}m`} 
              severity="info" 
              icon="pi pi-clock" 
            />
            {sprintGroup.restTimeMinutes > 0 && (
              <Tag 
                value={`${sprintGroup.restTimeMinutes}m rest`} 
                severity="info" 
                icon="pi pi-pause" 
              />
            )}
            {isReady ? (
              <Tag severity="success" value="Ready" icon="pi pi-check" />
            ) : (
              <Tag severity="warning" value="Not Ready" icon="pi pi-clock" />
            )}
          </div>
        </div>
        {isReady && onSprintComplete && (
          <Button
            label="Complete Sprint"
            icon="pi pi-check"
            size="small"
            severity="success"
            onClick={() => onSprintComplete(sprintGroup.groupNumber)}
          />
        )}
      </div>
      
      <div className="sprint-techniques">
        {sprintGroup.techniques.map((technique, index) => (
          <div key={index} className="technique-item p-2 mb-2 border-round bg-gray-50">
            <div className="flex align-items-center gap-2">
              {getLessonTag(technique.lessonNumber)}
              <span className="font-medium">{technique.sliceTitle}</span>
            </div>
            {technique.combination && (
              <div className="text-sm text-blue-600 mt-1">
                <i className="pi pi-plus mr-1" />
                {cleanCombinationText(technique.combination)}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

const TestDrillTrackerEnhanced: React.FC<TestDrillTrackerEnhancedProps> = ({
  studentId,
  studentPlan,
  studentProgress,
  onDrillSelect
}) => {
  const [drillsWithReadiness, setDrillsWithReadiness] = useState<Array<{ 
    drill: EnhancedTestDrill; 
    readiness: TestDrillReadiness;
    sprintReadiness: boolean[];
  }>>([]);
  const [loading, setLoading] = useState(true);

  // Calculate drill readiness and sprint status
  const calculateDrillData = useMemo(() => {
    if (!studentPlan || !studentProgress) return [];

    const testDrills = getEnhancedTestDrillsForCurriculum('gc2');
    
    return testDrills.map(drill => {
      const readiness = calculateEnhancedTestDrillReadiness(drill, gc2Curriculum, studentPlan, studentProgress);
      
      const sprintReadiness = drill.sprintGroups.map(sprint => 
        calculateSprintReadiness(sprint, gc2Curriculum, studentPlan, studentProgress)
      );

      return {
        drill,
        readiness,
        sprintReadiness
      };
    });
  }, [studentPlan, studentProgress]);

  useEffect(() => {
    setDrillsWithReadiness(calculateDrillData);
    setLoading(false);
  }, [calculateDrillData]);

  const getReadinessBadge = (readiness: TestDrillReadiness) => {
    if (readiness.isReady) {
      return <Tag severity="success" value="Ready" />;
    } else if (readiness.completionPercentage > 50) {
      return <Tag severity="warning" value={`${readiness.completionPercentage}% Ready`} />;
    } else {
      return <Tag severity="danger" value={`${readiness.completionPercentage}% Ready`} />;
    }
  };

  const handleSprintComplete = (drillNumber: number, groupNumber: number) => {
    console.log(`Sprint ${groupNumber} completed for drill ${drillNumber}`);
    // TODO: Implement sprint completion logic
  };

  // Accordion header template
  const drillHeaderTemplate = (drill: EnhancedTestDrill, readiness: TestDrillReadiness) => {
    const readySprints = drill.sprintGroups.length;
    const totalSprints = drill.sprintGroups.length;

    return (
      <div className="flex align-items-center justify-content-between w-full p-2">
        <div className="flex align-items-center gap-3">
          <i className="pi pi-flag text-primary" />
          <div>
            <div className="font-semibold text-lg">
              Drill {drill.drillNumber}: {drill.title}
            </div>
            <div className="flex align-items-center gap-2 mt-1">
              <Tag value={`${drill.timeLimitMinutes}m`} severity="info" icon="pi pi-clock" />
              <Tag value={`${readySprints}/${totalSprints} sprints`} severity="info" icon="pi pi-list" />
              {getReadinessBadge(readiness)}
            </div>
          </div>
        </div>
        
        {onDrillSelect && readiness.isReady && (
          <Button
            label="Start Test"
            icon="pi pi-play"
            size="small"
            severity="success"
            onClick={(e) => {
              e.stopPropagation();
              onDrillSelect(drill);
            }}
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card title="Test Preparation (Sprint-Based)">
        <div className="text-center py-4">
          <i className="pi pi-spin pi-spinner text-2xl" />
          <p className="mt-2">Loading test drills...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Test Preparation (Sprint-Based)" className="shadow-2 border-round-2xl">
      <div className="mb-4">
        <div className="flex align-items-center justify-content-between mb-2">
          <span className="font-medium">Overall Progress</span>
          <span className="text-sm text-color-secondary">
            {drillsWithReadiness.filter(d => d.readiness.isReady).length}/{drillsWithReadiness.length} drills ready
          </span>
        </div>
        <ProgressBar 
          value={(drillsWithReadiness.filter(d => d.readiness.isReady).length / drillsWithReadiness.length) * 100} 
          showValue={false}
          className="h-2"
        />
      </div>

      <div className="mb-4 p-3 bg-blue-50 border-round">
        <h6 className="font-medium text-blue-800 mb-2">Sprint-Based Testing</h6>
        <p className="text-sm text-blue-700 mb-0">
          Each drill is organized into sprint groups. Students demonstrate all techniques in a group continuously, 
          then rest before moving to the next group. This reflects realistic test execution.
        </p>
      </div>

      <Accordion multiple className="test-drill-accordion">
        {drillsWithReadiness.map(({ drill, readiness, sprintReadiness }) => (
          <AccordionTab 
            key={drill.drillNumber}
            headerTemplate={() => drillHeaderTemplate(drill, readiness)}
            className="mb-3"
          >
            <div className="space-y-4">
              {/* Drill Progress */}
              <div className="p-3 bg-gray-50 border-round">
                <div className="flex justify-content-between align-items-center mb-2">
                  <span className="font-medium">Sprint Progress</span>
                  <span className="text-sm text-color-secondary">
                    {sprintReadiness.filter(Boolean).length}/{drill.sprintGroups.length} sprints ready
                  </span>
                </div>
                <ProgressBar 
                  value={readiness.completionPercentage}
                  showValue={true}
                  color={readiness.completionPercentage >= 80 ? 'success' : 
                         readiness.completionPercentage >= 50 ? 'warning' : 'danger'}
                  className="h-1rem"
                />
              </div>

              <Divider />

              {/* Sprint Groups */}
              <div>
                <h5 className="font-semibold mb-3 flex align-items-center gap-2">
                  <i className="pi pi-list" />
                  Sprint Groups
                  <Tooltip target=".sprints-tooltip" />
                  <i 
                    className="pi pi-info-circle text-xs text-color-secondary cursor-pointer sprints-tooltip"
                    data-pr-tooltip="Each sprint group represents a continuous demonstration period followed by a rest period."
                  />
                </h5>
                
                <div className="space-y-3">
                  {drill.sprintGroups.map((sprintGroup, index) => (
                    <SprintGroupDisplay
                      key={sprintGroup.groupNumber}
                      sprintGroup={sprintGroup}
                      isReady={sprintReadiness[index]}
                      onSprintComplete={(groupNumber) => handleSprintComplete(drill.drillNumber, groupNumber)}
                    />
                  ))}
                </div>
              </div>

              {/* Drill Description */}
              <div className="p-3 bg-blue-50 border-round">
                <h6 className="font-medium text-blue-800 mb-2">Drill Instructions</h6>
                <p className="text-sm text-blue-700 mb-0">{drill.description}</p>
              </div>
            </div>
          </AccordionTab>
        ))}
      </Accordion>

      <style jsx>{`
        .test-drill-accordion .p-accordion-tab {
          margin-bottom: 1rem;
        }
        
        .test-drill-accordion .p-accordion-content {
          background-color: #fafafa;
        }
        
        .sprint-group-card {
          border-left: 4px solid var(--primary-color);
        }
        
        .technique-item {
          border-left: 2px solid var(--surface-300);
        }
        
        @media (max-width: 768px) {
          .test-drill-accordion .p-accordion-header {
            padding: 0.75rem;
          }
          
          .test-drill-accordion .p-button {
            min-width: 44px;
            min-height: 44px;
          }
        }
      `}</style>
    </Card>
  );
};

export default TestDrillTrackerEnhanced;
