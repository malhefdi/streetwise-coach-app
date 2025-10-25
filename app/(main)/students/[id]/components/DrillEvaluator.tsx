'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { Slider } from 'primereact/slider';
import { Checkbox } from 'primereact/checkbox';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { Divider } from 'primereact/divider';
import { Toast } from 'primereact/toast';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Panel } from 'primereact/panel';
import { Dropdown } from 'primereact/dropdown';
import { getCurriculum } from '@/app/data/curriculum';
import { resolveTestDrillReferences } from '@/app/services/testDrillService';
import { dataService } from '@/app/services/dataService';
import type { TestDrill, TestDrillAttempt, TestDrillProgress, FreestyleDrillProgress } from '@/app/types/test-drill.types';
import type { Curriculum } from '@/app/data/curriculum';

interface DrillEvaluatorProps {
  visible: boolean;
  drill: TestDrill | null;
  studentId: string;
  onClose: () => void;
  onComplete: (attempt: TestDrillAttempt) => void;
}

// Helper function to extract combination title from combination text
const extractCombinationTitle = (combination?: string, index: number = 0): string => {
  if (!combination) return '';
  
  // Remove leading + and split by common separators
  const cleanText = combination.replace(/^\+/, '').trim();
  
  // Try to extract the technique name (usually before the first parenthesis or dash)
  const parts = cleanText.split(/[\(-]/);
  if (parts.length > 0) {
    return parts[0].trim();
  }
  
  return cleanText;
};

// Inline Deduction Component
const InlineDeduction: React.FC<{
  sliceId: string;
  onAddDeduction: (sliceId: string, reason: string, points: number) => void;
}> = ({ sliceId, onAddDeduction }) => {
  const [showDeduction, setShowDeduction] = useState(false);
  const [deductionReason, setDeductionReason] = useState('');
  
  const handleAddDeduction = () => {
    if (deductionReason.trim()) {
      onAddDeduction(sliceId, deductionReason.trim(), 1); // Default 1 point
      setShowDeduction(false);
      setDeductionReason('');
    }
  };
  
  const handleCancel = () => {
    setShowDeduction(false);
    setDeductionReason('');
  };
  
  return (
    <div className="deduction-controls">
      {!showDeduction ? (
        <Button
          icon="pi pi-minus"
          size="small"
          severity="danger"
          text
          onClick={() => setShowDeduction(true)}
          tooltip="Add 1-point deduction"
        />
      ) : (
        <div className="deduction-input">
          <InputTextarea
            value={deductionReason}
            onChange={(e) => setDeductionReason(e.target.value)}
            placeholder="Deduction reason..."
            rows={2}
            className="w-full"
            autoFocus
          />
          <div className="flex gap-1 mt-1">
            <Button
              label="Add (-1)"
              size="small"
              severity="danger"
              onClick={handleAddDeduction}
              disabled={!deductionReason.trim()}
            />
            <Button
              label="Cancel"
              size="small"
              severity="secondary"
              text
              onClick={handleCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const DrillEvaluator: React.FC<DrillEvaluatorProps> = ({
  visible,
  drill,
  studentId,
  onClose,
  onComplete
}) => {
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [resolvedSlices, setResolvedSlices] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isOvertime, setIsOvertime] = useState(false);
  const [overtimeSeconds, setOvertimeSeconds] = useState(0);
  const [currentScore, setCurrentScore] = useState(100);
  const [evaluatorNotes, setEvaluatorNotes] = useState('');
  const [deductions, setDeductions] = useState<Array<{
    reason: string;
    points: number;
    sliceReference?: {
      lessonNumber: number;
      sliceTitle: string;
    };
    timestamp: string;
  }>>([]);
  const [testedSlices, setTestedSlices] = useState<Array<{
    id: string;
    lessonNumber: number;
    sliceTitle: string;
    tested: boolean;
    hasDeductions: boolean;
    isCombination: boolean;
    combinationText?: string;
  }>>([]);
  
  // For freestyle drill (Drill 5)
  const [techniquesAttempted, setTechniquesAttempted] = useState<Array<{ lessonNumber: number; sliceTitle: string; attempted: boolean }>>([]);
  const [qualityRatings, setQualityRatings] = useState({
    details: 50,
    conviction: 50,
    reflexes: 50
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    if (drill) {
      const gc2Curriculum = getCurriculum('gc2');
      setCurriculum(gc2Curriculum || null);
      setTimeRemaining(drill.timeLimitMinutes * 60);
      setIsOvertime(false);
      setOvertimeSeconds(0);
      setCurrentScore(100);
      setEvaluatorNotes('');
      setDeductions([]);
      
      if (gc2Curriculum) {
        // Resolve slice data for drills 1-4
        if (!drill.isFreestyle && drill.items) {
          const resolved = resolveTestDrillReferences(drill, gc2Curriculum);
          setResolvedSlices(resolved);
          
          // Initialize tested slices tracking with hierarchical structure
          const initialTestedSlices: Array<{
            id: string;
            lessonNumber: number;
            sliceNumber: number;
            sliceTitle: string;
            tested: boolean;
            hasDeductions: boolean;
            isCombination: boolean;
            combinationText?: string;
            groupHeader?: string;
            isGroupHeader?: boolean;
          }> = [];
          
          // Group items by lesson for better organization
          const groupedItems = drill.items.reduce((groups, item, index) => {
            const groupKey = `L${item.lessonNumber}`;
            if (!groups[groupKey]) {
              groups[groupKey] = [];
            }
            groups[groupKey].push({ ...item, originalIndex: index });
            return groups;
          }, {} as Record<string, any[]>);
          
          // Add group headers and slices
          Object.entries(groupedItems).forEach(([groupKey, items]) => {
            const lessonNumber = parseInt(groupKey.replace('L', ''));
            const lesson = gc2Curriculum.lessons.find(l => l.lessonNumber === lessonNumber);
            const groupTitle = lesson ? lesson.technique : `Lesson ${lessonNumber}`;
            
            // Add group header
            initialTestedSlices.push({
              id: `group-${groupKey}`,
              lessonNumber,
              sliceNumber: 0,
              sliceTitle: groupTitle,
              tested: false,
              hasDeductions: false,
              isCombination: false,
              groupHeader: `${items[0].originalIndex + 1}. ${groupTitle} (${groupKey})`,
              isGroupHeader: true
            });
            
            // Add slices for this group
            items.forEach(item => {
              // Add main slice
              const mainSliceId = item.ids[0];
              const sliceNumber = parseInt(mainSliceId.split('-s')[1]) || 1;
              
              initialTestedSlices.push({
                id: mainSliceId,
                lessonNumber: item.lessonNumber,
                sliceNumber,
                sliceTitle: item.sliceTitle,
                tested: false,
                hasDeductions: false,
                isCombination: false
              });
              
              // Add combination slices if they exist
              if (item.ids.length > 1) {
                item.ids.slice(1).forEach((sliceId: string, index: number) => {
                  const combinationTitle = extractCombinationTitle(item.combination, index);
                  const comboSliceNumber = parseInt(sliceId.split('-s')[1]) || 1;
                  
                  initialTestedSlices.push({
                    id: sliceId,
                    lessonNumber: item.lessonNumber,
                    sliceNumber: comboSliceNumber,
                    sliceTitle: combinationTitle,
                    tested: false,
                    hasDeductions: false,
                    isCombination: true,
                    combinationText: item.combination
                  });
                });
              }
            });
          });
          
          setTestedSlices(initialTestedSlices);
        }
      }
    }
  }, [drill]);

  // Separate effect for freestyle drill techniques initialization
  useEffect(() => {
    if (drill?.isFreestyle && resolvedSlices.length > 0) {
      const techniques = resolvedSlices.map(item => ({
        lessonNumber: item.item.lessonNumber,
        sliceTitle: item.item.sliceTitle,
        attempted: false
      }));
      setTechniquesAttempted(techniques);
    }
  }, [drill?.isFreestyle, resolvedSlices]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (timeRemaining > 0) {
          setTimeRemaining(prev => {
            const newTime = prev - 1;
            
            // 30-second warning
            if (newTime === 30) {
              showWarningAlert();
            }
            
            // Time up - start overtime
            if (newTime === 0) {
              setIsOvertime(true);
              setOvertimeSeconds(0);
            }
            
            return newTime;
          });
        } else if (isOvertime) {
          // Overtime counting
          setOvertimeSeconds(prev => prev + 1);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining, isOvertime]);

  const showWarningAlert = () => {
    toast.current?.show({
      severity: 'warn',
      summary: '30 Seconds Remaining!',
      detail: 'Time is almost up. Complete your techniques quickly.'
    });
  };

  const handleTimeUp = () => {
    setIsRunning(false);
    toast.current?.show({
      severity: 'warn',
      summary: 'Time Up!',
      detail: 'The test time has expired. Overtime has started.'
    });
  };

  const startTest = () => {
    setIsRunning(true);
  };

  const pauseTest = () => {
    setIsRunning(false);
  };

  const toggleSliceTested = (sliceId: string) => {
    setTestedSlices(prev => 
      prev.map((slice) => 
        slice.id === sliceId ? { ...slice, tested: !slice.tested } : slice
      )
    );
  };

  const handleAddDeduction = (sliceId: string, reason: string, points: number = 1) => {
    const slice = testedSlices.find(s => s.id === sliceId);
    if (!slice) return;
    
    const newDeduction = {
      reason,
      points,
      sliceReference: {
        lessonNumber: slice.lessonNumber,
        sliceTitle: slice.sliceTitle
      },
      timestamp: new Date().toISOString()
    };
    
    setDeductions(prev => [...prev, newDeduction]);
    setCurrentScore(prev => Math.max(prev - points, 0));
    
    // Mark slice as having deductions
    setTestedSlices(prev => 
      prev.map(s => 
        s.id === sliceId ? { ...s, hasDeductions: true } : s
      )
    );
  };

  const addDeduction = () => {
    const reason = prompt('Enter deduction reason:');
    if (!reason) return;
    
    const points = parseInt(prompt('Enter points to deduct (1-10):') || '1');
    const validPoints = Math.min(Math.max(points, 1), 10);
    
    // For drills 1-4, allow selecting which slice
    let sliceReference = undefined;
    if (!drill?.isFreestyle && testedSlices.length > 0) {
      const sliceOptions = testedSlices.map((slice, index) => ({
        label: `L${slice.lessonNumber}: ${slice.sliceTitle}`,
        value: { lessonNumber: slice.lessonNumber, sliceTitle: slice.sliceTitle }
      }));
      
      // Simple prompt for slice selection (could be enhanced with a proper dialog)
      const sliceIndex = prompt(`Select slice (0-${sliceOptions.length - 1}):`);
      if (sliceIndex !== null && !isNaN(parseInt(sliceIndex))) {
        const selectedIndex = parseInt(sliceIndex);
        if (selectedIndex >= 0 && selectedIndex < sliceOptions.length) {
          sliceReference = sliceOptions[selectedIndex].value;
        }
      }
    }
    
    const newDeduction = {
      reason,
      points: validPoints,
      sliceReference,
      timestamp: new Date().toISOString()
    };
    
    setDeductions(prev => [...prev, newDeduction]);
    setCurrentScore(prev => Math.max(prev - validPoints, 0));
    
    // Mark slice as having deductions if slice reference exists
    if (sliceReference) {
      setTestedSlices(prev => 
        prev.map(slice => 
          slice.lessonNumber === sliceReference.lessonNumber && 
          slice.sliceTitle === sliceReference.sliceTitle
            ? { ...slice, hasDeductions: true }
            : slice
        )
      );
    }
  };

  const removeDeduction = (index: number) => {
    const deduction = deductions[index];
    setDeductions(prev => prev.filter((_, i) => i !== index));
    setCurrentScore(prev => Math.min(prev + deduction.points, 100));
  };

  const toggleTechniqueAttempted = (index: number) => {
    setTechniquesAttempted(prev => 
      prev.map((tech, i) => 
        i === index ? { ...tech, attempted: !tech.attempted } : tech
      )
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerDisplay = () => {
    if (isOvertime) {
      return `+${formatTime(overtimeSeconds)}`;
    }
    return formatTime(timeRemaining);
  };

  const getTimerColor = () => {
    if (isOvertime) return 'text-red-600';
    if (timeRemaining <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getTimerSeverity = () => {
    if (isOvertime) return 'danger';
    if (timeRemaining <= 30) return 'warning';
    return 'success';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreSeverity = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'danger';
  };

  const sliceCheckboxTemplate = (slice: any) => {
    if (slice.isGroupHeader) {
      return <div className="text-center">—</div>;
    }
    
    return (
      <Checkbox 
        checked={slice.tested || false}
        onChange={() => toggleSliceTested(slice.id)}
      />
    );
  };

  const sliceInfoTemplate = (slice: any) => {
    if (slice.isGroupHeader) {
      return (
        <div className="group-header">
          <div className="font-bold text-lg text-primary">
            {slice.groupHeader}
          </div>
        </div>
      );
    }
    
    return (
      <div className={`slice-info ${slice.isCombination ? 'combination-slice' : ''}`}>
        <div className="font-medium text-color">
          {slice.isCombination ? '++' : ''} {slice.sliceTitle}
        </div>
        {slice.combinationText && (
          <div className="text-xs text-blue-600 mt-1">
            {slice.combinationText}
          </div>
        )}
      </div>
    );
  };

  const sliceActionsTemplate = (slice: any) => {
    if (slice.isGroupHeader) {
      return <div className="text-center">—</div>;
    }
    
    const hasDeductions = slice.hasDeductions || false;
    
    return (
      <div className="flex items-center space-x-2">
        {hasDeductions && (
          <Tag severity="danger" value="Deductions" />
        )}
        <InlineDeduction 
          sliceId={slice.id}
          onAddDeduction={handleAddDeduction}
        />
      </div>
    );
  };

  const completeTest = async () => {
    if (!drill || !curriculum) return;

    const passed = currentScore >= 90;
    const totalTime = (drill.timeLimitMinutes * 60) - timeRemaining;

    let progress: TestDrillProgress;

    if (drill.isFreestyle) {
      const freestyleProgress: FreestyleDrillProgress = {
        techniquesAttempted: techniquesAttempted
          .filter(tech => tech.attempted)
          .map(tech => ({ 
            ids: [`gc2-l${tech.lessonNumber}-s1`], // Default slice ID for freestyle
            lessonNumber: tech.lessonNumber, 
            sliceTitle: tech.sliceTitle 
          })),
        evaluatorComments: evaluatorNotes,
        scoreDeductions: deductions,
        qualityRatings,
        totalTime
      };

      progress = {
        drillNumber: drill.drillNumber,
        startedAt: new Date(Date.now() - (totalTime * 1000)).toISOString(),
        completedAt: new Date().toISOString(),
        totalTime,
        score: currentScore,
        passed,
        freestyleProgress,
        notes: evaluatorNotes
      };
    } else {
      progress = {
        drillNumber: drill.drillNumber,
        startedAt: new Date(Date.now() - (totalTime * 1000)).toISOString(),
        completedAt: new Date().toISOString(),
        totalTime,
        score: currentScore,
        passed,
        notes: evaluatorNotes,
        testedSlices,
        scoreDeductions: deductions
      };
    }

    const attempt: TestDrillAttempt = {
      id: `attempt-${Date.now()}`,
      studentId,
      drillNumber: drill.drillNumber,
      attemptedAt: new Date(Date.now() - (totalTime * 1000)).toISOString(),
      completedAt: new Date().toISOString(),
      score: currentScore,
      passed,
      totalTime,
      evaluatorNotes,
      progress
    };

    try {
      await dataService.recordTestDrillAttempt(studentId, attempt);
      onComplete(attempt);
      onClose();
      
      toast.current?.show({
        severity: passed ? 'success' : 'warn',
        summary: passed ? 'Test Passed!' : 'Test Failed',
        detail: `Score: ${currentScore}/100 (${passed ? 'Passed' : 'Failed'})`
      });
    } catch (error) {
      console.error('Error saving test attempt:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save test results'
      });
    }
  };

  if (!drill || !curriculum) return null;

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        header={`Drill ${drill.drillNumber}: ${drill.title}`}
        visible={visible}
        onHide={onClose}
        style={{ width: '95vw', maxWidth: '1400px' }}
        maximizable
        modal
        className="drill-evaluator-dialog"
      >
        <div className="space-y-6">
          {/* Timer and Score Header */}
          <Card className="shadow-2 border-round-2xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getTimerColor()}`}>
                  {getTimerDisplay()}
                </div>
                <div className="text-sm text-color-secondary">
                  {isOvertime ? 'Overtime' : 'Time Remaining'}
                </div>
                <ProgressBar 
                  value={isOvertime ? 100 : (timeRemaining / (drill.timeLimitMinutes * 60)) * 100}
                  showValue={false}
                  className="mt-2"
                  color={getTimerSeverity()}
                />
              </div>
              
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(currentScore)}`}>
                  {currentScore}/100
                </div>
                <div className="text-sm text-color-secondary">Current Score</div>
                <Tag 
                  severity={getScoreSeverity(currentScore)}
                  value={currentScore >= 90 ? 'PASSING' : 'FAILING'}
                  className="mt-2"
                />
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold text-color">
                  {testedSlices.filter(s => s.tested).length}/{testedSlices.length}
                </div>
                <div className="text-sm text-color-secondary">Slices Tested</div>
              </div>
              
              <div className="text-center">
                <div className="space-x-2">
                  {!isRunning ? (
                    <Button 
                      label="Start Test" 
                      icon="pi pi-play" 
                      onClick={startTest}
                      disabled={timeRemaining === 0}
                      severity="success"
                    />
                  ) : (
                    <Button 
                      label="Pause" 
                      icon="pi pi-pause" 
                      onClick={pauseTest}
                      severity="warning"
                    />
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Test Description */}
          <Card className="shadow-2 border-round-2xl">
            <h4 className="font-semibold mb-2">Test Instructions</h4>
            <p className="text-color-secondary">{drill.description}</p>
            {drill.specialRequirements && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                <h5 className="font-medium text-blue-800 mb-1">Special Requirements:</h5>
                <p className="text-sm text-blue-700">{drill.specialRequirements}</p>
              </div>
            )}
          </Card>

          {/* Slice Checklist for Drills 1-4 */}
          {!drill.isFreestyle && (
            <Card className="shadow-2 border-round-2xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Slice Checklist</h4>
                <Button 
                  label="Add Deduction" 
                  icon="pi pi-minus" 
                  size="small"
                  severity="danger"
                  onClick={addDeduction}
                />
              </div>
              
              <DataTable 
                value={testedSlices}
                responsiveLayout="scroll"
                className="p-datatable-sm hierarchical-checklist"
                rowClassName={(slice: any) => 
                  slice.isGroupHeader 
                    ? 'group-header-row' 
                    : slice.isCombination 
                      ? 'combination-row' 
                      : ''
                }
              >
                <Column 
                  header="Tested" 
                  body={(slice) => sliceCheckboxTemplate(slice)}
                  style={{ width: '80px' }}
                />
                <Column 
                  header="Lesson" 
                  body={(slice) => slice.isGroupHeader ? '' : `L${slice.lessonNumber}`}
                  style={{ width: '80px' }}
                />
                <Column 
                  header="Slice" 
                  body={(slice) => slice.isGroupHeader ? '' : `S${slice.sliceNumber}`}
                  style={{ width: '80px' }}
                />
                <Column 
                  header="Technique" 
                  body={(slice) => sliceInfoTemplate(slice)}
                  style={{ minWidth: '300px' }}
                />
                <Column 
                  header="Actions" 
                  body={(slice) => sliceActionsTemplate(slice)}
                  style={{ width: '120px' }}
                />
              </DataTable>
            </Card>
          )}

          {/* Freestyle Drill Specific */}
          {drill.isFreestyle && (
            <>
              <Card className="shadow-2 border-round-2xl">
                <h4 className="font-semibold mb-3">Techniques Demonstrated</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {techniquesAttempted.map((tech, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                      <Checkbox 
                        checked={tech.attempted}
                        onChange={() => toggleTechniqueAttempted(index)}
                      />
                      <span className="text-sm">
                        L{tech.lessonNumber}: {tech.sliceTitle}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="shadow-2 border-round-2xl">
                <h4 className="font-semibold mb-3">Quality Ratings</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Details (0-100)</label>
                    <Slider 
                      value={qualityRatings.details}
                      onChange={(e) => setQualityRatings(prev => ({ ...prev, details: e.value as number }))}
                      min={0}
                      max={100}
                      step={5}
                    />
                    <div className="text-sm text-color-secondary mt-1">
                      Understanding of technique concepts: {qualityRatings.details}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Conviction (0-100)</label>
                    <Slider 
                      value={qualityRatings.conviction}
                      onChange={(e) => setQualityRatings(prev => ({ ...prev, conviction: e.value as number }))}
                      min={0}
                      max={100}
                      step={5}
                    />
                    <div className="text-sm text-color-secondary mt-1">
                      Application with belief and effectiveness: {qualityRatings.conviction}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Reflexes (0-100)</label>
                    <Slider 
                      value={qualityRatings.reflexes}
                      onChange={(e) => setQualityRatings(prev => ({ ...prev, reflexes: e.value as number }))}
                      min={0}
                      max={100}
                      step={5}
                    />
                    <div className="text-sm text-color-secondary mt-1">
                      Speed and appropriateness of responses: {qualityRatings.reflexes}
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Deductions Panel */}
          <Panel header="Score Deductions" className="shadow-2 border-round-2xl">
            {deductions.length > 0 ? (
              <div className="space-y-2">
                {deductions.map((deduction, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded">
                    <div className="flex-1">
                      <div className="font-medium text-red-800">
                        {deduction.reason} (-{deduction.points} points)
                      </div>
                      {deduction.sliceReference && (
                        <div className="text-sm text-red-600 mt-1">
                          L{deduction.sliceReference.lessonNumber}: {deduction.sliceReference.sliceTitle}
                        </div>
                      )}
                    </div>
                    <Button 
                      icon="pi pi-times" 
                      size="small"
                      severity="danger"
                      text
                      onClick={() => removeDeduction(index)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-color-secondary text-sm">No deductions yet</p>
            )}
          </Panel>

          {/* Evaluator Notes */}
          <Card className="shadow-2 border-round-2xl">
            <h4 className="font-semibold mb-3">Evaluator Notes</h4>
            <InputTextarea
              value={evaluatorNotes}
              onChange={(e) => setEvaluatorNotes(e.target.value)}
              rows={4}
              placeholder="Enter detailed feedback and observations..."
              className="w-full"
            />
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button 
              label="Cancel" 
              icon="pi pi-times" 
              severity="secondary"
              onClick={onClose}
            />
            <Button 
              label="Complete Test" 
              icon="pi pi-check" 
              onClick={completeTest}
              disabled={isRunning}
              severity="success"
            />
          </div>
        </div>
      </Dialog>

      <style jsx>{`
        .drill-evaluator-dialog .p-dialog {
          background-color: var(--surface-card);
          color: var(--text-color);
        }
        
        .drill-evaluator-dialog .p-dialog-header {
          background-color: var(--surface-ground);
          border-bottom: 1px solid var(--surface-border);
          color: var(--text-color);
        }
        
        .drill-evaluator-dialog .p-dialog-content {
          background-color: var(--surface-card);
          color: var(--text-color);
        }
        
        .deduction-input {
          background-color: var(--surface-card);
          border: 1px solid var(--surface-border);
          border-radius: 4px;
          padding: 8px;
        }
        
        .deduction-input .p-inputtextarea {
          background-color: var(--surface-ground);
          color: var(--text-color);
          border: 1px solid var(--surface-border);
        }
        
        .group-header {
          background-color: var(--primary-50);
          border-left: 4px solid var(--primary-color);
          padding: 12px 16px;
          margin: 8px 0;
          border-radius: 4px;
        }
        
        .combination-slice {
          background-color: var(--surface-50);
          border-left: 3px solid var(--blue-500);
          padding-left: 8px;
          margin-left: 16px;
        }
        
        .hierarchical-checklist .p-datatable-tbody > tr.group-header-row {
          background-color: var(--primary-50);
          border-bottom: 2px solid var(--primary-color);
        }
        
        .hierarchical-checklist .p-datatable-tbody > tr.combination-row {
          background-color: var(--surface-50);
          border-left: 3px solid var(--blue-500);
        }
        
        .slice-info {
          color: var(--text-color);
        }
        
        .slice-info .text-color-secondary {
          color: var(--text-color-secondary);
        }
        
        .timer-display.success { color: var(--green-500); }
        .timer-display.warning { color: var(--yellow-500); }
        .timer-display.danger { color: var(--red-500); }
        
        .p-datatable .p-datatable-tbody > tr {
          background-color: var(--surface-card);
          color: var(--text-color);
        }
        
        .p-datatable .p-datatable-tbody > tr:nth-child(even) {
          background-color: var(--surface-50);
        }
        
        .p-datatable .p-datatable-tbody > tr:hover {
          background-color: var(--surface-100);
        }
        
        .p-datatable .p-datatable-thead > tr > th {
          background-color: var(--surface-ground);
          color: var(--text-color);
          border-bottom: 1px solid var(--surface-border);
        }
      `}</style>
    </>
  );
};

export default DrillEvaluator;