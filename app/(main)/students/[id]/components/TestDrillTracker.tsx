'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Panel } from 'primereact/panel';
import { Divider } from 'primereact/divider';
import { Badge } from 'primereact/badge';
import { Message } from 'primereact/message';
import { Tooltip } from 'primereact/tooltip';
import { Toast } from 'primereact/toast';
import { gc2Curriculum } from '@/app/data/gc2.curriculum';
import { getGC2TestDrills } from '@/app/data/gc2.test';
import { dataService } from '@/app/services/dataService';
import type { TestDrill, TestDrillReadiness } from '@/app/types/test-drill.types';
import type { StudentPlan, StudentProgress } from '@/app/types/plan.types';
import type { Lesson, Slice } from '@/app/data/curriculum';

// Import test override dialog
import TestOverrideDialog from '../../../coach/components/TestOverrideDialog';

interface TestDrillTrackerProps {
  studentId: string;
  studentPlan: StudentPlan | null;
  studentProgress: StudentProgress | null;
  onDrillSelect?: (drill: TestDrill) => void;
}

interface TechniqueItem {
  lessonNumber: number;
  lessonTitle: string;
  sliceTitle: string;
  combination?: string;
  isCompleted: boolean;
  isInProgress: boolean;
  isAvailable: boolean;
  lessonId: string;
  sliceId: string;
}

// Helper function to find a slice by ID across all lessons
const findSliceById = (curriculum: any, sliceId: string): Slice | undefined => {
  for (const lesson of curriculum.lessons) {
    const slice = lesson.slices.find((s: Slice) => s.id === sliceId);
    if (slice) return slice;
  }
  return undefined;
};

// Helper function to group items by lesson
const groupItemsByLesson = (items: any[]): Record<string, any[]> => {
  return items.reduce((groups, item, index) => {
    const groupKey = `L${item.lessonNumber}`;
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push({ ...item, originalIndex: index });
    return groups;
  }, {} as Record<string, any[]>);
};

// Helper function to process a technique item
const processTechniqueItem = (
  item: any,
  gc2Curriculum: any,
  studentPlan: StudentPlan,
  studentProgress: StudentProgress
): { techniques: TechniqueItem[]; completedCount: number; missingPrerequisites: string[] } => {
  const techniques: TechniqueItem[] = [];
  const missingPrerequisites: string[] = [];
  let completedCount = 0;

  // Process main slice
  const mainSliceId = item.ids[0];
  const slice = findSliceById(gc2Curriculum, mainSliceId);
  if (!slice) {
    missingPrerequisites.push(`Slice ID: ${mainSliceId} (Not Found)`);
    return { techniques, completedCount, missingPrerequisites };
  }

  const lesson = gc2Curriculum.lessons.find((l: any) => l.id === mainSliceId.split('-').slice(0, 2).join('-'));
  if (!lesson) {
    missingPrerequisites.push(`Lesson for ${mainSliceId} (Not Found)`);
    return { techniques, completedCount, missingPrerequisites };
  }

  // Check if lesson is in student's plan
  const isInPlan = studentPlan.lessonIds.includes(lesson.id);
  if (!isInPlan) {
    missingPrerequisites.push(`L${lesson.lessonNumber}: ${lesson.technique}`);
  }

  // Check completion status
  const lessonProgress = studentProgress.lessons[lesson.id];
  const isCompleted = lessonProgress?.completedAt !== undefined;
  const isInProgress = Boolean(lessonProgress?.startedAt && !isCompleted);
  
  // Check slice completion
  let sliceCompleted = false;
  if (lessonProgress) {
    const sliceIndex = lesson.slices.indexOf(slice);
    if (sliceIndex >= 0 && sliceIndex < lessonProgress.slices.length) {
      const sliceProgress = lessonProgress.slices[sliceIndex];
      sliceCompleted = Boolean(sliceProgress?.steps.every(step => step.completed));
    }
  }

  if (sliceCompleted) completedCount++;

  // Add main slice
  techniques.push({
    lessonNumber: lesson.lessonNumber,
    lessonTitle: lesson.technique,
    sliceTitle: slice.title,
    combination: item.combination,
    isCompleted: sliceCompleted,
    isInProgress: isInProgress && !sliceCompleted,
    isAvailable: isInPlan,
    lessonId: lesson.id,
    sliceId: slice.id
  });

  // Process combination slices if they exist
  if (item.ids.length > 1) {
    item.ids.slice(1).forEach((sliceId: string, index: number) => {
      const comboSlice = findSliceById(gc2Curriculum, sliceId);
      if (!comboSlice) {
        missingPrerequisites.push(`Combination Slice ID: ${sliceId} (Not Found)`);
        return;
      }

      const comboLesson = gc2Curriculum.lessons.find((l: any) => l.id === sliceId.split('-').slice(0, 2).join('-'));
      if (!comboLesson) {
        missingPrerequisites.push(`Combination Lesson for ${sliceId} (Not Found)`);
        return;
      }

      // Check combination slice completion
      const comboLessonProgress = studentProgress.lessons[comboLesson.id];
      let comboSliceCompleted = false;
      if (comboLessonProgress) {
        const comboSliceIndex = comboLesson.slices.indexOf(comboSlice);
        if (comboSliceIndex >= 0 && comboSliceIndex < comboLessonProgress.slices.length) {
          const comboSliceProgress = comboLessonProgress.slices[comboSliceIndex];
          comboSliceCompleted = Boolean(comboSliceProgress?.steps.every(step => step.completed));
        }
      }

      if (comboSliceCompleted) completedCount++;

      // Add combination slice
      techniques.push({
        lessonNumber: comboLesson.lessonNumber,
        lessonTitle: comboLesson.technique,
        sliceTitle: comboSlice.title,
        combination: item.combination,
        isCompleted: comboSliceCompleted,
        isInProgress: false,
        isAvailable: isInPlan,
        lessonId: comboLesson.id,
        sliceId: comboSlice.id,
        isCombination: true
      } as TechniqueItem & { isCombination: boolean });
    });
  }

  return { techniques, completedCount, missingPrerequisites };
};

// Helper function to compute readiness
const computeReadiness = (
  techniquesCount: number,
  completedTechniques: number,
  missingPrerequisites: string[],
  drillNumber: number
): TestDrillReadiness => {
  const completionPercentage = techniquesCount > 0 
    ? Math.round((completedTechniques / techniquesCount) * 100) 
    : 0;

  return {
    drillNumber,
    isReady: missingPrerequisites.length === 0 && completionPercentage === 100,
    missingLessons: missingPrerequisites,
    completionPercentage
  };
};

const TestDrillTracker: React.FC<TestDrillTrackerProps> = ({
  studentId,
  studentPlan,
  studentProgress,
  onDrillSelect
}) => {
  const toast = React.useRef<Toast>(null);
  const [drillsWithReadiness, setDrillsWithReadiness] = useState<Array<{ 
    drill: TestDrill; 
    readiness: TestDrillReadiness;
    techniques: TechniqueItem[];
    missingPrerequisites: string[];
  }>>([]);
  const [loading, setLoading] = useState(true);
  
  // Test override state
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [selectedDrillForOverride, setSelectedDrillForOverride] = useState<TestDrill | null>(null);
  const [overrideReasons, setOverrideReasons] = useState<Record<string, string>>({});

  const saveOverrideToBackend = async (drillNumber: number, reason: string) => {
    try {
      await dataService.saveTestDrillOverride(studentId, drillNumber, reason);
    } catch (error) {
      console.error('Error saving override to backend:', error);
      throw error;
    }
  };

  // Load existing overrides on mount
  useEffect(() => {
    const loadOverrides = async () => {
      try {
        const overrides = await dataService.getTestDrillOverrides(studentId);
        setOverrideReasons(overrides);
      } catch (error) {
        console.error('Error loading overrides:', error);
      }
    };
    
    loadOverrides();
  }, [studentId]);

  // Calculate drill readiness and technique status
  const calculateDrillData = useMemo(() => {
    if (!studentPlan || !studentProgress) return [];

    const testDrills = getGC2TestDrills();
    
    return testDrills.map(drill => {
      if (!drill.items) {
        return {
          drill,
          readiness: {
            drillNumber: drill.drillNumber,
            isReady: false,
            missingLessons: [],
            completionPercentage: 0
          },
          techniques: [],
          missingPrerequisites: []
        };
      }

      const techniques: TechniqueItem[] = [];
      const missingPrerequisites: string[] = [];
      let completedTechniques = 0;

      // Group items by lesson for better organization
      const groupedItems = groupItemsByLesson(drill.items);

      // Process each group
      Object.entries(groupedItems).forEach(([groupKey, items]) => {
        const lessonNumber = parseInt(groupKey.replace('L', ''));
        const lesson = gc2Curriculum.lessons.find(l => l.lessonNumber === lessonNumber);
        const groupTitle = lesson ? lesson.technique : `Lesson ${lessonNumber}`;
        
        // Add group header as a special technique item
        techniques.push({
          lessonNumber,
          lessonTitle: groupTitle,
          sliceTitle: `${items[0].originalIndex + 1}. ${groupTitle} (${groupKey})`,
          combination: undefined,
          isCompleted: false,
          isInProgress: false,
          isAvailable: true,
          lessonId: lesson?.id || '',
          sliceId: `group-${groupKey}`,
          isGroupHeader: true
        } as TechniqueItem & { isGroupHeader: boolean });

        // Process items in this group
        items.forEach(item => {
          const result = processTechniqueItem(item, gc2Curriculum, studentPlan, studentProgress);
          techniques.push(...result.techniques);
          missingPrerequisites.push(...result.missingPrerequisites);
          completedTechniques += result.completedCount;
        });
      });

      const readiness = computeReadiness(
        techniques.length,
        completedTechniques,
        missingPrerequisites,
        drill.drillNumber
      );

      return {
        drill,
        readiness,
        techniques,
        missingPrerequisites
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

  const getTechniqueStatusTag = (technique: TechniqueItem) => {
    if (technique.isCompleted) {
      return <Tag severity="success" value="Complete" icon="pi pi-check" />;
    } else if (technique.isInProgress) {
      return <Tag severity="warning" value="In Progress" icon="pi pi-clock" />;
    } else if (technique.isAvailable) {
      return <Tag severity="info" value="Available" icon="pi pi-circle" />;
    } else {
      return <Tag severity="danger" value="Missing" icon="pi pi-times" />;
    }
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

  const cleanCombinationText = (combination?: string) => {
    if (!combination) return '';
    return combination
      .replace(/^\+/, '') // Remove leading +
      .replace(/\\\+/g, '+') // Replace \+ with +
      .trim();
  };

  // Enhanced technique template with hierarchical structure
  const techniqueTemplate = (technique: TechniqueItem, isCombination: boolean = false, combinationText?: string) => {
    return (
      <div className={`sw-card sw-card--timeline ${isCombination ? 'combination-technique' : ''} ${technique.isCompleted ? 'sw-card--success' : technique.isInProgress ? 'sw-card--warning' : 'sw-card--danger'}`}>
        <div className="grid grid-cols-4 gap-4 items-center">
          <div className="text-center">
            {getLessonTag(technique.lessonNumber)}
          </div>
          <div className="text-center">
            <Tag value={`S${technique.sliceId.split('-s')[1] || '1'}`} severity="info" />
          </div>
          <div className="technique-info">
            <div className="font-medium text-color">
              {isCombination ? '++' : ''} {technique.sliceTitle}
            </div>
            <div className="text-sm text-color-secondary">
              {technique.lessonTitle}
            </div>
            {combinationText && (
              <div className="text-xs text-blue-600 mt-1">
                {combinationText}
              </div>
            )}
          </div>
          <div className="text-center">
            {getTechniqueStatusTag(technique)}
          </div>
        </div>
      </div>
    );
  };

  // Group header template
  const groupHeaderTemplate = (groupTitle: string, groupNumber: number) => {
    return (
      <Card className="sw-card sw-card--group-header">
        <div className="sw-card__title">
          {groupNumber}. {groupTitle}
        </div>
      </Card>
    );
  };

  // Accordion header template
  const drillHeaderTemplate = (drill: TestDrill, readiness: TestDrillReadiness) => {
    const hasOverride = overrideReasons[drill.drillNumber];
    const isOverrideActive = hasOverride && !readiness.isReady;
    
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
              {isOverrideActive ? (
                <Tag severity="warning" value="Override Active" icon="pi pi-unlock" />
              ) : (
                getReadinessBadge(readiness)
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          {onDrillSelect && (readiness.isReady || isOverrideActive) && (
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
          
          {!readiness.isReady && !isOverrideActive && onDrillSelect && (
            <Button
              label="Override & Start"
              icon="pi pi-unlock"
              size="small"
              severity="warning"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDrillForOverride(drill);
                setShowOverrideDialog(true);
              }}
            />
          )}
        </div>
      </div>
    );
  };


  if (loading) {
    return (
      <Card title="Test Preparation">
        <div className="text-center py-4">
          <i className="pi pi-spin pi-spinner text-2xl" />
          <p className="mt-2">Loading test drills...</p>
        </div>
      </Card>
    );
  }


  return (
    <>
      <Toast ref={toast} />
      <Card title="Test Preparation" className="shadow-2 border-round-2xl">
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

      {/* Individual Drill Cards */}
      <div className="grid">
        {drillsWithReadiness.map(({ drill, readiness, techniques, missingPrerequisites }) => {
          const hasOverride = overrideReasons[drill.drillNumber];
          const isOverrideActive = hasOverride && !readiness.isReady;
          
          return (
            <div key={drill.drillNumber} className="col-12 mb-4">
              <Card className="sw-drill-card">
                {/* Card Header */}
                <div className="flex justify-content-between align-items-center mb-3">
                  <div className="flex align-items-center gap-3">
                    <i className="pi pi-flag text-2xl text-primary" />
                    <div>
                      <h3 className="m-0 text-xl font-bold text-primary">
                        Drill {drill.drillNumber}: {drill.title}
                      </h3>
                      <div className="flex align-items-center gap-2 mt-1">
                        <Tag value={`${drill.timeLimitMinutes}m`} severity="info" icon="pi pi-clock" />
                        {isOverrideActive ? (
                          <Tag severity="warning" value="Override Active" icon="pi pi-unlock" />
                        ) : (
                          getReadinessBadge(readiness)
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {onDrillSelect && (readiness.isReady || isOverrideActive) && (
                      <Button
                        label="Start Test"
                        icon="pi pi-play"
                        severity="success"
                        onClick={() => onDrillSelect(drill)}
                      />
                    )}
                    
                    {!readiness.isReady && !isOverrideActive && onDrillSelect && (
                      <Button
                        label="Override & Start"
                        icon="pi pi-unlock"
                        severity="warning"
                        onClick={() => {
                          setSelectedDrillForOverride(drill);
                          setShowOverrideDialog(true);
                        }}
                      />
                    )}
                  </div>
                </div>
                {/* Drill Progress */}
                <div className="mb-3">
                  <div className="flex justify-content-between align-items-center mb-2">
                    <span className="font-medium">Progress</span>
                    <span className="text-sm text-color-secondary">
                      {techniques.filter(t => t.isCompleted).length}/{techniques.length} techniques
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

                {/* Missing Prerequisites Alert */}
                {missingPrerequisites.length > 0 && (
                  <Message 
                    severity="warn" 
                    text={`Missing ${missingPrerequisites.length} prerequisite(s). Complete these lessons first.`}
                    className="w-full mb-3"
                  />
                )}

                {/* Techniques Summary */}
                <div className="mb-3">
                  <h4 className="text-lg font-semibold mb-2">Techniques Checklist</h4>
                  <div className="grid">
                    {techniques.slice(0, 3).map((technique, index) => (
                      <div key={index} className="col-12 md:col-4">
                        <div className="flex align-items-center gap-2 p-2 surface-100 border-round">
                          <i className={`pi ${technique.isCompleted ? 'pi-check-circle text-green-500' : 
                                           technique.isInProgress ? 'pi-clock text-orange-500' : 
                                           technique.isAvailable ? 'pi-play text-blue-500' : 'pi-lock text-red-500'}`} />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{technique.lessonTitle}</div>
                            <div className="text-xs text-color-secondary">
                              L{technique.lessonNumber} • {technique.sliceTitle}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {techniques.length > 3 && (
                      <div className="col-12">
                        <div className="text-center p-2">
                          <Tag 
                            value={`+${techniques.length - 3} more techniques`} 
                            severity="info" 
                            className="cursor-pointer"
                            onClick={() => {
                              // TODO: Expand to show all techniques
                              console.log('Show all techniques');
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Missing Prerequisites Details */}
                {missingPrerequisites.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-semibold mb-2 text-orange-500">Missing Prerequisites:</h5>
                    <div className="flex flex-wrap gap-1">
                      {missingPrerequisites.map((prereq, index) => (
                        <Tag 
                          key={index}
                          severity="danger" 
                          value={prereq}
                          icon="pi pi-exclamation-triangle"
                          className="text-xs"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Drill Description */}
                <div className="mt-3 p-3 surface-100 border-round">
                  <h6 className="font-medium text-primary mb-2">Drill Instructions</h6>
                  <p className="text-sm text-color-secondary mb-0">{drill.description}</p>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .sw-drill-card {
          background-color: var(--surface-card);
          border: 1px solid var(--surface-border);
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        
        .sw-drill-card:hover {
          border-color: var(--primary-color);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }
        
        .test-drill-accordion .p-accordion-header-link {
          background-color: var(--surface-ground);
          color: var(--text-color);
        }
        
        .test-drill-accordion .p-accordion-header-link:hover {
          background-color: var(--surface-100);
        }
        
        .group-header {
          background-color: var(--primary-50);
          border-left: 4px solid var(--primary-color);
          border-radius: 4px;
          margin: 8px 0;
        }
        
        .group-header-row {
          background-color: var(--primary-50);
          border-bottom: 2px solid var(--primary-color);
        }
        
        .combination-technique {
          background-color: var(--surface-50);
          border-left: 3px solid var(--blue-500);
          margin-left: 16px;
        }
        
        .combination-row {
          background-color: var(--surface-50);
          border-left: 3px solid var(--blue-500);
        }
        
        .technique-item {
          border-bottom: 1px solid var(--surface-border);
        }
        
        .technique-item:hover {
          background-color: var(--surface-100);
        }
        
        .technique-info {
          color: var(--text-color);
        }
        
        .technique-info .text-color-secondary {
          color: var(--text-color-secondary);
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
      
      {/* Test Override Dialog */}
      <TestOverrideDialog
        visible={showOverrideDialog}
        onHide={() => {
          setShowOverrideDialog(false);
          setSelectedDrillForOverride(null);
        }}
        drillName={selectedDrillForOverride?.title || ''}
        completedLessons={selectedDrillForOverride ? 
          drillsWithReadiness.find(d => d.drill.drillNumber === selectedDrillForOverride.drillNumber)?.readiness.completionPercentage || 0 
          : 0}
        requiredLessons={100}
        onConfirm={async (reason) => {
          if (selectedDrillForOverride) {
            const drillNumber = selectedDrillForOverride.drillNumber;
            
            // Optimistic update
            setOverrideReasons(prev => ({
              ...prev,
              [drillNumber]: reason
            }));

            try {
              await saveOverrideToBackend(drillNumber, reason);
              toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Override reason saved successfully'
              });
            } catch (error) {
              // Revert optimistic update on failure
              setOverrideReasons(prev => {
                const newReasons = { ...prev };
                delete newReasons[drillNumber];
                return newReasons;
              });
              
              toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to save override reason. Please try again.'
              });
            }
          }
        }}
      />
    </Card>
    </>
  );
};

export default TestDrillTracker;
