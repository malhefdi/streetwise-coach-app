'use client';

import React, { useState, useEffect } from 'react';
import { Timeline } from 'primereact/timeline';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { Rating } from 'primereact/rating';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Divider } from 'primereact/divider';
import { dataService } from '@/app/services/dataService';
import { getCurriculum } from '@/app/data/curriculum';
import type { CoachingSession } from '@/app/types/plan.types';

interface SessionWithStudent extends CoachingSession {
    studentName: string;
    studentRank: string;
    lessonTitle?: string;
}

const SessionHistoryPage = () => {
    const [sessionsByStudent, setSessionsByStudent] = useState<Record<string, SessionWithStudent[]>>({});
    const [loading, setLoading] = useState(true);
    const curriculum = getCurriculum('gc2');

    useEffect(() => {
        const loadSessions = async () => {
            try {
                const allSessions = await dataService.getAllSessions();
                const students = await dataService.getStudents();
                
                // Enrich sessions with student data and group by student
                const grouped: Record<string, SessionWithStudent[]> = {};
                
                for (const session of allSessions) {
                    const student = students.find(s => s.id === session.studentId);
                    if (!student) continue;
                    
                    const lesson = curriculum?.lessons.find(l => l.id === session.lessonId);
                    
                    const enrichedSession: SessionWithStudent = {
                        ...session,
                        studentName: student.name,
                        studentRank: student.rank,
                        lessonTitle: lesson ? `L${lesson.lessonNumber}: ${lesson.technique}` : session.lessonId
                    };
                    
                    if (!grouped[student.id]) {
                        grouped[student.id] = [];
                    }
                    grouped[student.id].push(enrichedSession);
                }
                
                // Sort sessions within each student by date (newest first)
                Object.keys(grouped).forEach(studentId => {
                    grouped[studentId].sort((a, b) => 
                        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
                    );
                });
                
                setSessionsByStudent(grouped);
            } catch (error) {
                console.error('Error loading sessions:', error);
            } finally {
                setLoading(false);
            }
        };
        
        loadSessions();
    }, [curriculum]);

    const sessionCard = (session: SessionWithStudent) => {
        const duration = session.duration ? Math.round(session.duration / 60) : 0;
        const completedSteps = session.progress.slices.flatMap(s => s.steps).filter(st => st.completed).length;
        const totalSteps = session.progress.slices.flatMap(s => s.steps).length;
        const completion = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

        return (
            <Card key={session.id} className="mb-3 shadow-1">
                <div className="flex justify-content-between align-items-start">
                    <div className="flex-1">
                        <h6 className="m-0 mb-2 text-primary">{session.lessonTitle}</h6>
                        <div className="text-sm text-color-secondary mb-2">
                            <i className="pi pi-calendar mr-2"></i>
                            {new Date(session.startedAt).toLocaleString()}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {duration > 0 && <Badge value={`${duration} min`} severity="info" />}
                            <Badge 
                                value={`${completion}%`} 
                                severity={completion === 100 ? 'success' : completion > 50 ? 'info' : 'warning'} 
                            />
                            <Badge value={`${completedSteps}/${totalSteps} steps`} />
                        </div>
                        {session.progress.notes && (
                            <p className="text-sm mt-2 mb-0 text-color-secondary">
                                <i className="pi pi-comment mr-1"></i>
                                {session.progress.notes}
                            </p>
                        )}
                    </div>
                </div>
            </Card>
        );
    };

    if (loading) {
        return (
            <div className="p-5 text-center">
                <i className="pi pi-spin pi-spinner text-4xl text-primary mb-3"></i>
                <h3>Loading session history...</h3>
            </div>
        );
    }

    const studentIds = Object.keys(sessionsByStudent);
    
    if (studentIds.length === 0) {
        return (
            <div className="p-5">
                <Card className="shadow-2 border-round-2xl">
                    <div className="text-center p-5">
                        <i className="pi pi-history text-6xl text-400 mb-3"></i>
                        <h3 className="text-xl mb-2">No Session History</h3>
                        <p className="text-color-secondary">
                            Coaching sessions will appear here once you start training with students.
                        </p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Session History</h2>
            <p className="text-color-secondary mb-4">
                View coaching sessions grouped by student
            </p>

            <Accordion multiple>
                {studentIds.map(studentId => {
                    const studentSessions = sessionsByStudent[studentId];
                    if (!studentSessions || studentSessions.length === 0) return null;
                    
                    const firstSession = studentSessions[0];
                    
                    return (
                        <AccordionTab
                            key={studentId}
                            header={
                                <div className="flex justify-content-between align-items-center w-full pr-3">
                                    <div>
                                        <span className="font-bold">{firstSession.studentName}</span>
                                        <span className="text-sm text-color-secondary ml-2">
                                            ({firstSession.studentRank})
                                        </span>
                                    </div>
                                    <Badge value={`${studentSessions.length} sessions`} severity="info" />
                                </div>
                            }
                        >
                            <div className="pt-3">
                                {studentSessions.map(session => sessionCard(session))}
                            </div>
                        </AccordionTab>
                    );
                })}
            </Accordion>
        </div>
    );
};

export default SessionHistoryPage;