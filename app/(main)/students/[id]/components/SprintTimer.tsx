'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { InputTextarea } from 'primereact/inputtextarea';
import { Divider } from 'primereact/divider';
import { Message } from 'primereact/message';
import type { SprintGroup } from '@/app/types/test-drill.types';

interface SprintTimerProps {
  sprintGroup: SprintGroup;
  onSprintComplete: (notes?: string, timeSpent?: number) => void;
  onRestComplete: () => void;
  onNextSprint: () => void;
  onPreviousSprint: () => void;
  isFirstSprint: boolean;
  isLastSprint: boolean;
}

const SprintTimer: React.FC<SprintTimerProps> = ({
  sprintGroup,
  onSprintComplete,
  onRestComplete,
  onNextSprint,
  onPreviousSprint,
  isFirstSprint,
  isLastSprint
}) => {
  const [timeLeft, setTimeLeft] = useState(sprintGroup.estimatedTimeMinutes * 60);
  const [isResting, setIsResting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [notes, setNotes] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset timer when sprint group changes
  useEffect(() => {
    setTimeLeft(sprintGroup.estimatedTimeMinutes * 60);
    setIsResting(false);
    setIsActive(false);
    setIsCompleted(false);
    setNotes('');
    setStartTime(null);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [sprintGroup.groupNumber]);

  // Timer logic
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsActive(false);
            if (!isResting) {
              // Sprint time finished, start rest period
              setIsResting(true);
              setTimeLeft(sprintGroup.restTimeMinutes * 60);
              return sprintGroup.restTimeMinutes * 60;
            } else {
              // Rest time finished
              setIsResting(false);
              setIsCompleted(true);
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeLeft, isResting, sprintGroup.restTimeMinutes]);

  const handleStart = () => {
    if (!startTime) {
      setStartTime(Date.now());
    }
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleCompleteSprint = () => {
    const timeSpent = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    onSprintComplete(notes, timeSpent);
  };

  const handleCompleteRest = () => {
    onRestComplete();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressValue = () => {
    const totalTime = isResting ? sprintGroup.restTimeMinutes * 60 : sprintGroup.estimatedTimeMinutes * 60;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  const getStatusColor = () => {
    if (isCompleted) return 'success';
    if (isResting) return 'info';
    if (timeLeft < 30) return 'danger';
    if (timeLeft < 60) return 'warning';
    return 'primary';
  };

  return (
    <Card className="sprint-timer-card">
      <div className="text-center">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-2xl font-bold mb-2">
            {isCompleted ? 'Sprint Completed!' : 
             isResting ? 'Rest Period' : 
             `Sprint ${sprintGroup.groupNumber}`}
          </h3>
          <h4 className="font-semibold text-lg text-primary">
            {sprintGroup.groupTitle}
          </h4>
        </div>

        {/* Timer Display */}
        <div className="mb-4">
          <div className="text-6xl font-mono font-bold mb-2" style={{ color: `var(--${getStatusColor()}-500)` }}>
            {formatTime(timeLeft)}
          </div>
          <ProgressBar 
            value={getProgressValue()} 
            color={getStatusColor()}
            className="h-2"
          />
        </div>

        {/* Status Messages */}
        {isCompleted && (
          <Message 
            severity="success" 
            text="Sprint completed! Take a moment to rest before the next sprint." 
            className="mb-4"
          />
        )}
        
        {isResting && timeLeft > 0 && (
          <Message 
            severity="info" 
            text="Rest period - prepare for the next sprint." 
            className="mb-4"
          />
        )}

        {!isResting && timeLeft === 0 && !isCompleted && (
          <Message 
            severity="warning" 
            text="Time's up! Complete the sprint or continue if needed." 
            className="mb-4"
          />
        )}

        {/* Techniques List */}
        <div className="mb-4">
          <h5 className="font-semibold mb-2">Techniques to Demonstrate:</h5>
          <div className="flex flex-wrap gap-2 justify-content-center">
            {sprintGroup.techniques.map((technique, index) => (
              <Tag 
                key={index}
                value={`L${technique.lessonNumber}: ${technique.sliceTitle}`}
                severity="secondary"
                className="text-xs"
              />
            ))}
          </div>
        </div>

        {/* Notes Section */}
        <div className="mb-4">
          <label htmlFor="sprint-notes" className="block text-sm font-medium mb-2">
            Sprint Notes (Optional)
          </label>
          <InputTextarea
            id="sprint-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this sprint..."
            rows={3}
            className="w-full"
          />
        </div>

        <Divider />

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-2 justify-content-center">
          {!isCompleted && (
            <>
              <Button
                label={isActive ? 'Pause' : 'Start'}
                icon={isActive ? 'pi pi-pause' : 'pi pi-play'}
                onClick={isActive ? handlePause : handleStart}
                severity={isActive ? 'warning' : 'success'}
                size="large"
              />
              
              <Button
                label="Complete Sprint"
                icon="pi pi-check"
                severity="success"
                onClick={handleCompleteSprint}
                size="large"
              />
            </>
          )}

          {isCompleted && isResting && sprintGroup.restTimeMinutes > 0 && (
            <Button
              label="Complete Rest"
              icon="pi pi-check"
              severity="info"
              onClick={handleCompleteRest}
              size="large"
            />
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-2">
            {!isFirstSprint && (
              <Button
                label="Previous Sprint"
                icon="pi pi-chevron-left"
                severity="secondary"
                onClick={onPreviousSprint}
                size="large"
              />
            )}
            
            {!isLastSprint && (
              <Button
                label="Next Sprint"
                icon="pi pi-chevron-right"
                iconPos="right"
                severity="secondary"
                onClick={onNextSprint}
                size="large"
              />
            )}
          </div>
        </div>

        {/* Sprint Info */}
        <div className="mt-4 p-3 bg-gray-50 border-round">
          <div className="flex justify-content-between text-sm">
            <span>
              <strong>Estimated Time:</strong> {sprintGroup.estimatedTimeMinutes}m
            </span>
            <span>
              <strong>Rest Time:</strong> {sprintGroup.restTimeMinutes}m
            </span>
            <span>
              <strong>Techniques:</strong> {sprintGroup.techniques.length}
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .sprint-timer-card {
          max-width: 600px;
          margin: 0 auto;
        }
        
        @media (max-width: 768px) {
          .sprint-timer-card .p-card-content {
            padding: 1rem;
          }
          
          .sprint-timer-card .text-6xl {
            font-size: 3rem;
          }
        }
      `}</style>
    </Card>
  );
};

export default SprintTimer;
