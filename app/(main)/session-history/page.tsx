'use client';

import React, { useState } from 'react';
import { Timeline } from 'primereact/timeline';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { Rating } from 'primereact/rating';

// NEW - SessionEvent interface
interface SessionEvent {
    id: string;
    studentName: string;
    date: string;
    duration: number; // minutes
    techniquesCount: number;
    curriculum: 'GC2' | 'BBS1';
    notes?: string;
    rating?: number; // 1-5
}

const SessionHistoryPage = () => {
    // NEW - Session data
    const [sessions, setSessions] = useState<SessionEvent[]>([
        {
            id: '1',
            studentName: 'John Doe',
            date: '2025-10-08 14:30',
            duration: 60,
            techniquesCount: 5,
            curriculum: 'GC2',
            rating: 4,
            notes: 'Great progress on mount escapes'
        },
        {
            id: '2',
            studentName: 'Jane Smith',
            date: '2025-10-07 10:00',
            duration: 45,
            techniquesCount: 3,
            curriculum: 'BBS1',
            rating: 5,
            notes: 'Excellent retention of guard passing sequences'
        },
        {
            id: '3',
            studentName: 'Charlie Brown',
            date: '2025-10-06 18:00',
            duration: 90,
            techniquesCount: 8,
            curriculum: 'GC2',
            rating: 5,
            notes: 'Worked on spider guard sweeps. Very intuitive.'
        },
        {
            id: '4',
            studentName: 'Alice Johnson',
            date: '2025-10-05 09:00',
            duration: 60,
            techniquesCount: 4,
            curriculum: 'BBS1',
            notes: 'Needs to improve posture in closed guard.',
            rating: 3
        }
    ]);

    // NEW - Timeline item template
    const customizedContent = (session: SessionEvent) => {
        return (
            <Card className="mt-3">
                <div className="flex justify-content-between align-items-start">
                    <div>
                        <h6 className="mt-0 mb-2">{session.studentName}</h6>
                        <div className="text-sm text-color-secondary mb-2">
                            <i className="pi pi-calendar mr-2"></i>
                            {new Date(session.date).toLocaleString()}
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                            <Badge value={`${session.duration} min`} severity="info" />
                            <Badge value={session.curriculum} severity="success" />
                            <Badge value={`${session.techniquesCount} techniques`} />
                        </div>
                        {session.notes && <p className="text-sm m-0">{session.notes}</p>}
                    </div>
                    {session.rating && (
                        <div className="flex flex-column align-items-end">
                            <Rating value={session.rating} readOnly cancel={false} />
                        </div>
                    )}
                </div>
            </Card>
        );
    };

    const customizedMarker = () => {
        return (
            <span className="custom-marker shadow-1" style={{ backgroundColor: '#607D8B' }}>
                <i className="pi pi-history"></i>
            </span>
        );
    };

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card timeline-demo">
                    <h5>Session History</h5>
                    <Timeline value={sessions} align="alternate" className="customized-timeline" marker={customizedMarker} content={customizedContent} />
                </div>
            </div>
        </div>
    );
};

export default SessionHistoryPage;