'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { Toast } from 'primereact/toast';
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

// Mobile-optimized slice row component
const MobileSliceRow: React.FC<{
  slice: any;
  onToggle: (sliceId: string) => void;
  onAddDeduction: (sliceId: string) => void;
  onAddComment: (sliceId: string) => void;
}> = ({ slice, onToggle, onAddDeduction, onAddComment }) => {
  if (slice.isGroupHeader) {
    return (
      <div className="sw-mobile-group-header">
        <div className="sw-group-title">
          {slice.groupHeader}
        </div>
      </div>
    );
  }

  const hasNotes = slice.notes && slice.notes.trim().length > 0;

  return (
    <div 
      className={`sw-mobile-slice-row ${slice.tested ? 'tested' : ''} ${slice.hasDeductions ? 'has-deductions' : ''} ${hasNotes ? 'has-notes' : ''}`}
    >
      <div className="sw-slice-main">
        <div className="sw-slice-checkbox">
          <Checkbox 
            checked={slice.tested || false}
            onChange={() => onToggle(slice.id)}
            className="sw-large-checkbox"
          />
        </div>
        
        <div className="sw-slice-info" onClick={() => onToggle(slice.id)}>
          <div className="sw-slice-title">
            {slice.isCombination ? '++' : ''} {slice.sliceTitle}
          </div>
          <div className="sw-slice-meta">
            L{slice.lessonNumber} • S{slice.sliceNumber}
            {slice.combinationText && (
              <span className="sw-combination-text"> • {slice.combinationText}</span>
            )}
          </div>
        </div>
        
        <div className="sw-slice-actions">
          {slice.hasDeductions && (
            <Tag severity="danger" value="-" className="sw-deduction-badge" />
          )}
          <Button
            icon="pi pi-minus"
            size="small"
            severity="danger"
            text
            className="sw-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onAddDeduction(slice.id);
            }}
          />
          <Button
            icon="pi pi-comment"
            size="small"
            severity={hasNotes ? "warning" : "info"}
            text
            className={`sw-action-btn ${hasNotes ? 'sw-note-btn--active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onAddComment(slice.id);
            }}
          />
        </div>
      </div>
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
  
  // Use refs to avoid recreating interval on every state change
  const timeRemainingRef = useRef(0);
  const isOvertimeRef = useRef(false);
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
    isGroupHeader?: boolean;
    groupHeader?: string;
    notes?: string; // Add slice-specific notes
  }>>([]);
  
  // For freestyle drill (Drill 5)
  const [techniquesAttempted, setTechniquesAttempted] = useState<Array<{ lessonNumber: number; sliceTitle: string; attempted: boolean }>>([]);
  const [qualityRatings, setQualityRatings] = useState({
    details: 50,
    conviction: 50,
    reflexes: 50
  });

  // Mobile-specific state
  const [showDescription, setShowDescription] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showDeductions, setShowDeductions] = useState(false);
  const [currentDeductionSlice, setCurrentDeductionSlice] = useState<string | null>(null);
  const [deductionReason, setDeductionReason] = useState('');
  
  // Slice-specific notes state
  const [currentNoteSlice, setCurrentNoteSlice] = useState<string | null>(null);
  const [sliceNoteText, setSliceNoteText] = useState('');

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

  // Update refs when state changes
  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
  }, [timeRemaining]);

  useEffect(() => {
    isOvertimeRef.current = isOvertime;
  }, [isOvertime]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (timeRemainingRef.current > 0) {
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
        } else if (isOvertimeRef.current) {
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
  }, [isRunning]);

  const showWarningAlert = () => {
    toast.current?.show({
      severity: 'warn',
      summary: '30 Seconds Remaining!',
      detail: 'Time is almost up. Complete your techniques quickly.'
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

  const handleAddDeduction = (sliceId: string) => {
    setCurrentDeductionSlice(sliceId);
    setDeductionReason('');
  };

  const confirmDeduction = () => {
    if (!currentDeductionSlice || !deductionReason.trim()) return;
    
    const slice = testedSlices.find(s => s.id === currentDeductionSlice);
    if (!slice) return;
    
    const newDeduction = {
      reason: deductionReason.trim(),
      points: 1, // Default 1 point deduction
      sliceReference: {
        lessonNumber: slice.lessonNumber,
        sliceTitle: slice.sliceTitle
      },
      timestamp: new Date().toISOString()
    };
    
    setDeductions(prev => [...prev, newDeduction]);
    setCurrentScore(prev => Math.max(prev - 1, 0));
    
    // Mark slice as having deductions
    setTestedSlices(prev => 
      prev.map(s => 
        s.id === currentDeductionSlice ? { ...s, hasDeductions: true } : s
      )
    );
    
    setCurrentDeductionSlice(null);
    setDeductionReason('');
    
    toast.current?.show({
      severity: 'info',
      summary: 'Deduction Added',
      detail: `-1 point: ${deductionReason.trim()}`
    });
  };

  const cancelDeduction = () => {
    setCurrentDeductionSlice(null);
    setDeductionReason('');
  };

  const handleAddSliceNote = (sliceId: string) => {
    const slice = testedSlices.find(s => s.id === sliceId);
    setCurrentNoteSlice(sliceId);
    setSliceNoteText(slice?.notes || '');
  };

  const confirmSliceNote = () => {
    if (!currentNoteSlice) return;
    
    setTestedSlices(prev => 
      prev.map(s => 
        s.id === currentNoteSlice ? { ...s, notes: sliceNoteText.trim() } : s
      )
    );
    
    setCurrentNoteSlice(null);
    setSliceNoteText('');
    
    toast.current?.show({
      severity: 'info',
      summary: 'Note Added',
      detail: 'Slice-specific note saved'
    });
  };

  const cancelSliceNote = () => {
    setCurrentNoteSlice(null);
    setSliceNoteText('');
  };

  const markAllTested = () => {
    setTestedSlices(prev => 
      prev.map(slice => 
        slice.isGroupHeader ? slice : { ...slice, tested: true }
      )
    );
  };

  const unmarkAll = () => {
    setTestedSlices(prev => 
      prev.map(slice => 
        slice.isGroupHeader ? slice : { ...slice, tested: false }
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

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
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

  const testedCount = testedSlices.filter(s => s.tested && !s.isGroupHeader).length;
  const totalCount = testedSlices.filter(s => !s.isGroupHeader).length;

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        header={null}
        visible={visible}
        onHide={onClose}
        style={{ width: '100vw', height: '100vh', maxWidth: 'none', maxHeight: 'none' }}
        modal
        className="sw-mobile-drill-dialog"
        contentStyle={{ padding: 0, height: '100vh' }}
        closable={false}
      >
        <div className="sw-mobile-drill-container">
          {/* Mobile Header */}
          <div className="sw-mobile-header">
            <div className="sw-header-top">
              <Button
                icon="pi pi-times"
                className="sw-close-btn"
                onClick={onClose}
                text
                size="large"
              />
              <div className="sw-drill-title">
                Drill {drill.drillNumber}: {drill.title}
              </div>
              <div className="sw-timer-score">
                <div className={`sw-timer ${getTimerColor()}`}>
                  {getTimerDisplay()}
                </div>
                <div className={`sw-score ${getScoreColor(currentScore)}`}>
                  {currentScore}
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="sw-progress-section">
              <div className="sw-progress-info">
                <span>{testedCount}/{totalCount} Slices Tested</span>
                <span>{deductions.length} Deductions</span>
              </div>
              <ProgressBar 
                value={(testedCount / totalCount) * 100}
                showValue={false}
                className="sw-progress-bar"
              />
            </div>
          </div>

          {/* Utility Bar */}
          <div className="sw-utility-bar">
            <Button
              label="Mark All"
              icon="pi pi-check"
              size="small"
              severity="success"
              onClick={markAllTested}
              className="sw-utility-btn"
            />
            <Button
              label="Unmark All"
              icon="pi pi-times"
              size="small"
              severity="secondary"
              onClick={unmarkAll}
              className="sw-utility-btn"
            />
            <Button
              label="Deductions"
              icon="pi pi-minus"
              size="small"
              severity="danger"
              onClick={() => setShowDeductions(!showDeductions)}
              className="sw-utility-btn"
            />
            <Button
              label="Notes"
              icon="pi pi-comment"
              size="small"
              severity="info"
              onClick={() => setShowNotes(!showNotes)}
              className="sw-utility-btn"
            />
            {!isRunning ? (
              <Button
                label="Start"
                icon="pi pi-play"
                size="small"
                severity="success"
                onClick={startTest}
                className="sw-utility-btn"
              />
            ) : (
              <Button
                label="Pause"
                icon="pi pi-pause"
                size="small"
                severity="warning"
                onClick={pauseTest}
                className="sw-utility-btn"
              />
            )}
          </div>

          {/* Description Toggle */}
          <div className="sw-description-toggle">
            <Button
              label={showDescription ? "Hide Instructions" : "Show Instructions"}
              icon={showDescription ? "pi pi-chevron-up" : "pi pi-chevron-down"}
              size="small"
              text
              onClick={() => setShowDescription(!showDescription)}
              className="sw-toggle-btn"
            />
          </div>

          {/* Collapsible Description */}
          {showDescription && (
            <div className="sw-description-panel">
              <p className="sw-description-text">{drill.description}</p>
              {drill.specialRequirements && (
                <div className="sw-special-requirements">
                  <strong>Special Requirements:</strong> {drill.specialRequirements}
                </div>
              )}
            </div>
          )}

          {/* Slice Checklist */}
          <div className="sw-slice-checklist">
            {testedSlices.map((slice) => (
              <MobileSliceRow
                key={slice.id}
                slice={slice}
                onToggle={toggleSliceTested}
                onAddDeduction={handleAddDeduction}
                onAddComment={handleAddSliceNote}
              />
            ))}
          </div>

          {/* Deduction Input Modal */}
          {currentDeductionSlice && (
            <div className="sw-deduction-modal">
              <div className="sw-deduction-content">
                <h4>Add Deduction</h4>
                <InputTextarea
                  value={deductionReason}
                  onChange={(e) => setDeductionReason(e.target.value)}
                  placeholder="Reason for deduction..."
                  rows={3}
                  className="sw-deduction-input"
                  autoFocus
                />
                <div className="sw-deduction-actions">
                  <Button
                    label="Cancel"
                    size="small"
                    severity="secondary"
                    onClick={cancelDeduction}
                  />
                  <Button
                    label="Add (-1)"
                    size="small"
                    severity="danger"
                    onClick={confirmDeduction}
                    disabled={!deductionReason.trim()}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Slice Note Input Modal */}
          {currentNoteSlice && (
            <div className="sw-note-modal">
              <div className="sw-note-content">
                <h4>Add Note for Slice</h4>
                <InputTextarea
                  value={sliceNoteText}
                  onChange={(e) => setSliceNoteText(e.target.value)}
                  placeholder="Add specific notes for this slice..."
                  rows={4}
                  className="sw-note-input"
                  autoFocus
                />
                <div className="sw-note-actions">
                  <Button
                    label="Cancel"
                    size="small"
                    severity="secondary"
                    onClick={cancelSliceNote}
                  />
                  <Button
                    label="Save Note"
                    size="small"
                    severity="success"
                    onClick={confirmSliceNote}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Collapsible Notes Panel */}
          {showNotes && (
            <div className="sw-notes-panel">
              <h4>Evaluator Notes</h4>
              <InputTextarea
                value={evaluatorNotes}
                onChange={(e) => setEvaluatorNotes(e.target.value)}
                placeholder="Enter detailed feedback and observations..."
                rows={4}
                className="sw-notes-input"
              />
            </div>
          )}

          {/* Collapsible Deductions Panel */}
          {showDeductions && (
            <div className="sw-deductions-panel">
              <h4>Score Deductions ({deductions.length})</h4>
              {deductions.length > 0 ? (
                <div className="sw-deductions-list">
                  {deductions.map((deduction, index) => (
                    <div key={index} className="sw-deduction-item">
                      <div className="sw-deduction-reason">
                        {deduction.reason} (-{deduction.points} points)
                      </div>
                      {deduction.sliceReference && (
                        <div className="sw-deduction-slice">
                          L{deduction.sliceReference.lessonNumber}: {deduction.sliceReference.sliceTitle}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="sw-no-deductions">No deductions yet</p>
              )}
            </div>
          )}

          {/* Complete Button */}
          <div className="sw-complete-section">
            <Button
              label="Complete Test"
              icon="pi pi-check"
              onClick={completeTest}
              disabled={isRunning}
              severity="success"
              className="sw-complete-btn"
            />
          </div>
        </div>
      </Dialog>

      <style jsx>{`
        .sw-mobile-drill-dialog .p-dialog {
          background-color: var(--surface-card);
          color: var(--text-color);
          border-radius: 0;
          margin: 0;
          max-height: 100vh;
        }
        
        .sw-mobile-drill-dialog .p-dialog-content {
          background-color: var(--surface-card);
          color: var(--text-color);
          padding: 0;
          height: 100vh;
          overflow: hidden;
        }
        
        .sw-mobile-drill-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background-color: var(--surface-ground);
        }
        
        .sw-mobile-header {
          background-color: var(--surface-card);
          border-bottom: 2px solid var(--primary-color);
          padding: 1rem;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        .sw-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        
        .sw-close-btn {
          font-size: 1.5rem;
          color: var(--text-color);
          min-width: 48px;
          min-height: 48px;
        }
        
        .sw-drill-title {
          font-size: 1.25rem;
          font-weight: bold;
          color: var(--text-color);
          text-align: center;
          flex: 1;
          margin: 0 1rem;
        }
        
        .sw-timer-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }
        
        .sw-timer {
          font-size: 1.5rem;
          font-weight: bold;
        }
        
        .sw-score {
          font-size: 1.25rem;
          font-weight: bold;
        }
        
        .sw-progress-section {
          margin-top: 0.5rem;
        }
        
        .sw-progress-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          color: var(--text-color-secondary);
          margin-bottom: 0.5rem;
        }
        
        .sw-progress-bar {
          height: 8px;
        }
        
        .sw-utility-bar {
          display: flex;
          gap: 0.5rem;
          padding: 1rem;
          background-color: var(--surface-card);
          border-bottom: 1px solid var(--surface-border);
          overflow-x: auto;
          flex-shrink: 0;
        }
        
        .sw-utility-btn {
          min-width: 80px;
          min-height: 44px;
          font-size: 0.875rem;
          flex-shrink: 0;
        }
        
        .sw-description-toggle {
          padding: 0.5rem 1rem;
          background-color: var(--surface-50);
          border-bottom: 1px solid var(--surface-border);
        }
        
        .sw-toggle-btn {
          width: 100%;
          justify-content: center;
        }
        
        .sw-description-panel {
          padding: 1rem;
          background-color: var(--surface-card);
          border-bottom: 1px solid var(--surface-border);
        }
        
        .sw-description-text {
          margin: 0 0 1rem 0;
          line-height: 1.5;
        }
        
        .sw-special-requirements {
          padding: 0.75rem;
          background-color: var(--blue-50);
          border: 1px solid var(--blue-200);
          border-radius: 4px;
          font-size: 0.875rem;
        }
        
        .sw-slice-checklist {
          flex: 1;
          overflow-y: auto;
          padding: 0.5rem;
        }
        
        .sw-mobile-group-header {
          background-color: var(--primary-50);
          border-left: 4px solid var(--primary-color);
          padding: 1rem;
          margin: 0.5rem 0;
          border-radius: 4px;
        }
        
        .sw-group-title {
          font-weight: bold;
          font-size: 1.125rem;
          color: var(--primary-color);
        }
        
        .sw-mobile-slice-row {
          background-color: var(--surface-card);
          border: 1px solid var(--surface-border);
          border-radius: 8px;
          margin-bottom: 0.75rem;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .sw-mobile-slice-row:hover {
          border-color: var(--primary-color);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .sw-mobile-slice-row.tested {
          background-color: var(--green-50);
          border-color: var(--green-300);
        }
        
        .sw-mobile-slice-row.has-deductions {
          border-color: var(--red-300);
        }
        
        .sw-mobile-slice-row.has-notes {
          border-color: var(--yellow-300);
          background-color: var(--yellow-50);
        }
        
        .sw-slice-main {
          display: flex;
          align-items: center;
          padding: 1.25rem;
          gap: 1rem;
          min-height: 60px;
        }
        
        .sw-slice-checkbox {
          flex-shrink: 0;
          min-width: 48px;
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .sw-large-checkbox {
          transform: scale(1.3);
        }
        
        .sw-slice-info {
          flex: 1;
          min-width: 0;
          cursor: pointer;
          padding: 0.25rem 0;
        }
        
        .sw-slice-title {
          font-weight: 600;
          font-size: 1rem;
          color: var(--text-color);
          margin-bottom: 0.25rem;
          line-height: 1.3;
        }
        
        .sw-slice-meta {
          font-size: 0.875rem;
          color: var(--text-color-secondary);
          line-height: 1.2;
        }
        
        .sw-combination-text {
          color: var(--blue-600);
        }
        
        .sw-slice-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }
        
        .sw-deduction-badge {
          font-size: 0.75rem;
        }
        
        .sw-action-btn {
          min-width: 44px;
          min-height: 44px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        
        .sw-action-btn:hover {
          background-color: var(--surface-100);
        }
        
        .sw-note-btn--active {
          background-color: var(--yellow-100) !important;
          color: var(--yellow-700) !important;
        }
        
        .sw-deduction-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        
        .sw-deduction-content {
          background-color: var(--surface-card);
          border-radius: 8px;
          padding: 1.5rem;
          width: 100%;
          max-width: 400px;
        }
        
        .sw-deduction-content h4 {
          margin: 0 0 1rem 0;
          font-size: 1.125rem;
        }
        
        .sw-deduction-input {
          width: 100%;
          margin-bottom: 1rem;
        }
        
        .sw-deduction-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }
        
        .sw-note-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        
        .sw-note-content {
          background-color: var(--surface-card);
          border-radius: 8px;
          padding: 1.5rem;
          width: 100%;
          max-width: 400px;
        }
        
        .sw-note-content h4 {
          margin: 0 0 1rem 0;
          font-size: 1.125rem;
        }
        
        .sw-note-input {
          width: 100%;
          margin-bottom: 1rem;
        }
        
        .sw-note-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }
        
        .sw-notes-panel,
        .sw-deductions-panel {
          background-color: var(--surface-card);
          border-top: 1px solid var(--surface-border);
          padding: 1rem;
        }
        
        .sw-notes-panel h4,
        .sw-deductions-panel h4 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
        }
        
        .sw-notes-input {
          width: 100%;
        }
        
        .sw-deductions-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .sw-deduction-item {
          background-color: var(--red-50);
          border: 1px solid var(--red-200);
          border-radius: 4px;
          padding: 0.75rem;
        }
        
        .sw-deduction-reason {
          font-weight: 600;
          color: var(--red-800);
          margin-bottom: 0.25rem;
        }
        
        .sw-deduction-slice {
          font-size: 0.875rem;
          color: var(--red-600);
        }
        
        .sw-no-deductions {
          color: var(--text-color-secondary);
          font-style: italic;
          margin: 0;
        }
        
        .sw-complete-section {
          padding: 1rem;
          background-color: var(--surface-card);
          border-top: 1px solid var(--surface-border);
          flex-shrink: 0;
        }
        
        .sw-complete-btn {
          width: 100%;
          min-height: 48px;
          font-size: 1rem;
          font-weight: 600;
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
          .sw-drill-title {
            font-size: 1.125rem;
          }
          
          .sw-timer {
            font-size: 1.25rem;
          }
          
          .sw-score {
            font-size: 1rem;
          }
          
          .sw-slice-title {
            font-size: 0.9rem;
          }
          
          .sw-slice-meta {
            font-size: 0.8rem;
          }
          
          .sw-slice-main {
            padding: 1rem;
            min-height: 56px;
          }
          
          .sw-action-btn {
            min-width: 40px;
            min-height: 40px;
          }
          
          .sw-large-checkbox {
            transform: scale(1.2);
          }
        }
        
        /* Very small screens */
        @media (max-width: 480px) {
          .sw-header-top {
            flex-direction: column;
            gap: 0.5rem;
            align-items: stretch;
          }
          
          .sw-timer-score {
            flex-direction: row;
            justify-content: space-between;
            width: 100%;
          }
          
          .sw-utility-bar {
            flex-wrap: wrap;
            gap: 0.25rem;
          }
          
          .sw-utility-btn {
            min-width: 70px;
            font-size: 0.75rem;
          }
          
          .sw-slice-main {
            padding: 0.875rem;
            gap: 0.75rem;
          }
          
          .sw-slice-title {
            font-size: 0.875rem;
          }
          
          .sw-slice-meta {
            font-size: 0.75rem;
          }
          
          .sw-action-btn {
            min-width: 36px;
            min-height: 36px;
          }
          
          .sw-large-checkbox {
            transform: scale(1.1);
          }
        }
      `}</style>
    </>
  );
};

export default DrillEvaluator;