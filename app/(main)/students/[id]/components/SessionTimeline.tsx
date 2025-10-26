'use client';

import React, { useMemo } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Timeline } from 'primereact/timeline';
import { Avatar } from 'primereact/avatar';
import { Divider } from 'primereact/divider';
import { getCurriculum } from '@/app/data/curriculum';
import type { Lesson } from '@/app/data/curriculum';

interface CoachSession {
  timestamp: string;
  lessonId: string;
  notes?: string;
  completed?: number;
}

interface SessionTimelineProps {
  sessions: CoachSession[];
  onViewSession: (session: CoachSession) => void;
}

// Helper function to get session status and icon based on confidence
const getSessionStatusAndIcon = (confidence: number): { status: 'success' | 'warning' | 'danger'; icon: string } => {
  if (confidence >= 80) {
    return { status: 'success', icon: 'pi pi-check-circle' };
  } else if (confidence >= 60) {
    return { status: 'warning', icon: 'pi pi-clock' };
  } else {
    return { status: 'danger', icon: 'pi pi-exclamation-triangle' };
  }
};

// Helper function to format time ago
const formatTimeAgo = (timestamp: string): string => {
  const sessionDate = new Date(timestamp);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - sessionDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return sessionDate.toLocaleDateString();
  }
};

// Reusable SessionCard component
const SessionCard: React.FC<{
  session: CoachSession;
  lesson: Lesson | undefined;
  onViewSession: (session: CoachSession) => void;
}> = ({ session, lesson, onViewSession }) => {
  const confidence = session.completed || 0;
  const { status, icon } = getSessionStatusAndIcon(confidence);
  const timeAgo = formatTimeAgo(session.timestamp);
  const sessionDate = new Date(session.timestamp);

  return (
    <Card className="shadow-1 border-round-2xl">
      <div className="flex flex-column gap-3">
        {/* Header */}
        <div className="flex align-items-center justify-content-between">
          <div className="flex align-items-center gap-3">
            <Avatar
              icon={icon}
              shape="circle"
              size="normal"
              className={`${
                status === 'success' ? 'bg-green-100 text-green-600' :
                status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                'bg-red-100 text-red-600'
              }`}
            />
            <div>
              <div className="font-semibold text-color">
                {lesson ? `L${lesson.lessonNumber}: ${lesson.technique}` : session.lessonId}
              </div>
              <div className="text-sm text-color-secondary">
                {lesson?.position || 'Unknown Position'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-color">
              {timeAgo}
            </div>
            <div className="text-xs text-color-secondary">
              {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Confidence Badge */}
        <div className="flex justify-content-between align-items-center">
          <Badge 
            value={`${confidence}% confidence`}
            severity={status}
            size="large"
          />
          <Button
            label="View Details"
            icon="pi pi-eye"
            size="small"
            outlined
            onClick={() => onViewSession(session)}
          />
        </div>

        {/* Notes */}
        {session.notes && (
          <>
            <Divider />
            <div className="p-3 bg-gray-50 border-round">
              <div className="text-sm font-medium text-color mb-2">
                Session Notes:
              </div>
              <div className="text-sm text-color-secondary line-height-3">
                {session.notes.length > 200 
                  ? `${session.notes.substring(0, 200)}...` 
                  : session.notes
                }
              </div>
            </div>
          </>
        )}

        {/* Lesson Overview */}
        {lesson?.overview && (
          <>
            <Divider />
            <div className="text-sm text-color-secondary line-height-3">
              <strong>Technique Overview:</strong> {lesson.overview}
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

const SessionTimeline: React.FC<SessionTimelineProps> = ({
  sessions,
  onViewSession
}) => {
  const curriculum = getCurriculum('gc2');

  // Prepare timeline events using the reusable SessionCard component
  const timelineEvents = useMemo(() => {
    return sessions.map(session => {
      const lesson = curriculum?.lessons.find(l => l.id === session.lessonId);
      const confidence = session.completed || 0;
      const { status, icon } = getSessionStatusAndIcon(confidence);

      return {
        status,
        icon,
        content: (
          <SessionCard
            session={session}
            lesson={lesson}
            onViewSession={onViewSession}
          />
        )
      };
    });
  }, [sessions, curriculum, onViewSession]);


  if (sessions.length === 0) {
    return (
      <Card className="shadow-2 border-round-2xl">
        <div className="text-center p-5">
          <i className="pi pi-calendar text-6xl text-400 mb-3" />
          <h3 className="text-xl mb-2">No Sessions Yet</h3>
          <p className="text-color-secondary mb-4">
            Start coaching sessions to track progress and build confidence.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid">
        <div className="col-12 md:col-4">
          <Card className="shadow-2 text-center p-p-3">
            <div className="flex flex-column align-items-center gap-2">
              <i className="pi pi-calendar text-3xl text-primary" />
              <div className="text-2xl font-bold text-color">
                {sessions.length}
              </div>
              <div className="text-sm text-color-secondary">
                Total Sessions
              </div>
            </div>
          </Card>
        </div>
        
        <div className="col-12 md:col-4">
          <Card className="shadow-2 text-center p-p-3">
            <div className="flex flex-column align-items-center gap-2">
              <i className="pi pi-chart-line text-3xl text-success" />
              <div className="text-2xl font-bold text-color">
                {Math.round(sessions.reduce((sum, s) => sum + (s.completed || 0), 0) / sessions.length)}%
              </div>
              <div className="text-sm text-color-secondary">
                Avg Confidence
              </div>
            </div>
          </Card>
        </div>
        
        <div className="col-12 md:col-4">
          <Card className="shadow-2 text-center p-p-3">
            <div className="flex flex-column align-items-center gap-2">
              <i className="pi pi-clock text-3xl text-info" />
              <div className="text-sm font-bold text-color">
                {sessions.length > 0 ? new Date(sessions[0].timestamp).toLocaleDateString() : 'N/A'}
              </div>
              <div className="text-sm text-color-secondary">
                Last Session
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Timeline */}
      <Card className="shadow-2 border-round-2xl">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Session History</h3>
          <Timeline 
            value={timelineEvents}
            align="left"
            className="p-timeline-vertical"
          />
        </div>
      </Card>
    </div>
  );
};

export default SessionTimeline;
