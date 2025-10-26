'use client';

import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Dialog } from 'primereact/dialog';
import type { Lesson } from '@/app/data/curriculum';

interface LessonCardProps {
    lesson: Lesson;
    onViewFullscreen: (lesson: Lesson) => void;
    onAddToPlan?: (lesson: Lesson) => void;
    className?: string;
}

const LessonCard: React.FC<LessonCardProps> = ({ 
    lesson, 
    onViewFullscreen, 
    onAddToPlan,
    className = '' 
}) => {
    const [expanded, setExpanded] = useState(false);
    const [showFullscreen, setShowFullscreen] = useState(false);

    const handleViewFullscreen = () => {
        setShowFullscreen(true);
        onViewFullscreen(lesson);
    };

    const handleAddToPlan = () => {
        if (onAddToPlan) {
            onAddToPlan(lesson);
        }
    };

    const getPrincipleSeverity = (principle: string): 'info' | 'success' | 'warning' | 'danger' => {
        const principleName = principle.split(' (')[0];
        
        // Group principles by category for consistent coloring
        const corePrinciples = ['Connection', 'Distance', 'Pyramid', 'Creation', 'Acceptance'];
        const movementPrinciples = ['Velocity', 'Clock', 'River', 'Frame', 'Kuzushi'];
        const controlPrinciples = ['Reconnaissance', 'Prevention', 'Tension', 'Fork', 'Posture'];
        const advancedPrinciples = ['False Surrender', 'Depletion', 'Isolation', 'Sacrifice', 'Momentum'];
        const specializedPrinciples = ['Pivot', 'Tagalong', 'Overload', 'Anchor', 'Ratchet'];
        
        if (corePrinciples.includes(principleName)) return 'success';
        if (movementPrinciples.includes(principleName)) return 'info';
        if (controlPrinciples.includes(principleName)) return 'warning';
        if (advancedPrinciples.includes(principleName)) return 'danger';
        if (specializedPrinciples.includes(principleName)) return 'info';
        
        return 'info';
    };

    return (
        <>
            <Card className={`sw-card sw-card--interactive ${className}`}>
                {/* Card Header */}
                <div className="sw-card__header">
                    <div className="flex align-items-start justify-content-between">
                        <div className="flex-1">
                            <div className="flex align-items-center gap-2 mb-2">
                                <h4 className="m-0 text-lg font-semibold">
                                    L{lesson.lessonNumber} — {lesson.technique}
                                </h4>
                                <Tag 
                                    value={lesson.position} 
                                    severity="info" 
                                    className="text-xs"
                                />
                            </div>
                            
                            {/* 2-line overview (truncated) */}
                            {lesson.overview && (
                                <p className="text-sm text-med m-0 mb-2 line-height-3" style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}>
                                    {lesson.overview}
                                </p>
                            )}
                            
                            {/* Slice count badge */}
                            <div className="flex align-items-center gap-2">
                                <Tag 
                                    value={`${lesson.slices?.length || 0} slices`} 
                                    severity="info" 
                                    className="text-xs"
                                />
                                {lesson.slices?.some(slice => slice.isBonusSlice) && (
                                    <Tag 
                                        value="BONUS" 
                                        severity="warning" 
                                        icon="pi pi-star" 
                                        className="text-xs"
                                    />
                                )}
                            </div>
                        </div>
                        
                        {/* Expand/Collapse Button */}
                        <Button
                            icon={expanded ? "pi pi-chevron-up" : "pi pi-chevron-down"}
                            className="sw-button sw-button--rounded-text"
                            onClick={() => setExpanded(!expanded)}
                            tooltip={expanded ? "Collapse" : "Preview"}
                            tooltipOptions={{ position: 'top' }}
                        />
                    </div>
                </div>

                {/* Card Actions - Always visible on mobile, hover on desktop */}
                <div className="flex gap-2 mt-3">
                    <Button
                        label="View"
                        icon="pi pi-eye"
                        className="sw-button sw-button--outlined"
                        size="small"
                        onClick={handleViewFullscreen}
                    />
                    {onAddToPlan && (
                        <Button
                            label="Add to Plan"
                            icon="pi pi-plus"
                            className="sw-button sw-button--secondary"
                            size="small"
                            onClick={handleAddToPlan}
                        />
                    )}
                </div>

                {/* Collapsible Content - Accordion-style expansion */}
                {expanded && (
                    <div className="mt-3 pt-3 border-top-1 surface-border">
                        <Accordion multiple>
                            {lesson.slices?.map((slice, index) => (
                                <AccordionTab
                                    key={slice.id || index}
                                    header={
                                        <div className="flex align-items-center gap-2">
                                            <span className="font-medium">
                                                Slice {slice.sliceNumber}: {slice.title}
                                            </span>
                                            {slice.isBonusSlice && (
                                                <Tag value="BONUS" severity="warning" icon="pi pi-star" className="text-xs" />
                                            )}
                                        </div>
                                    }
                                >
                                    {/* Essential Detail */}
                                    {slice.essentialDetail && (
                                        <div className="mb-3">
                                            <div className="flex align-items-center gap-2 mb-2">
                                                <i className="pi pi-check-circle text-green-500"></i>
                                                <span className="font-semibold text-green-600 text-sm">Essential Detail</span>
                                            </div>
                                            <p className="text-sm line-height-3 pl-4 m-0">{slice.essentialDetail}</p>
                                        </div>
                                    )}

                                    {/* Most Common Mistake */}
                                    {slice.mostCommonMistake && (
                                        <div className="mb-3 p-2 surface-50 border-round-md border-left-2 border-red-400">
                                            <div className="flex align-items-center gap-2 mb-1">
                                                <i className="pi pi-exclamation-triangle text-red-500"></i>
                                                <span className="font-semibold text-red-600 text-sm">Most Common Mistake</span>
                                            </div>
                                            <p className="text-sm line-height-3 pl-4 m-0">{slice.mostCommonMistake}</p>
                                        </div>
                                    )}

                                    {/* Safety Tip */}
                                    {slice.safetyTip && (
                                        <div className="mb-3 p-2 surface-50 border-round-md border-left-2 border-orange-400">
                                            <div className="flex align-items-center gap-2 mb-1">
                                                <i className="pi pi-shield text-orange-500"></i>
                                                <span className="font-semibold text-orange-600 text-sm">Safety Tip</span>
                                            </div>
                                            <p className="text-sm line-height-3 pl-4 m-0">{slice.safetyTip}</p>
                                        </div>
                                    )}

                                    {/* Principles */}
                                    {slice.corePrinciples && slice.corePrinciples.length > 0 && (
                                        <div className="mt-3 pt-3 border-top-1 surface-border">
                                            <div className="flex align-items-center gap-2 mb-2">
                                                <i className="pi pi-compass text-indigo-500"></i>
                                                <span className="font-semibold text-sm">Core Principles</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {slice.corePrinciples.map((p, i) => (
                                                    <Tag 
                                                        key={`${slice.id}-${i}`} 
                                                        value={p.split(' (')[0]} 
                                                        severity={getPrincipleSeverity(p)}
                                                        className="text-xs"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </AccordionTab>
                            ))}
                        </Accordion>
                        
                        {/* View Fullscreen Button */}
                        <div className="flex justify-content-end mt-3">
                            <Button
                                label="View Fullscreen"
                                icon="pi pi-external-link"
                                className="sw-button sw-button--text"
                                size="small"
                                onClick={handleViewFullscreen}
                            />
                        </div>
                    </div>
                )}
            </Card>

            {/* Fullscreen Dialog */}
            <Dialog
                visible={showFullscreen}
                onHide={() => setShowFullscreen(false)}
                header={`Lesson ${lesson.lessonNumber}: ${lesson.technique}`}
                style={{ width: '90vw', maxWidth: '1200px' }}
                maximizable
                modal
                className="lesson-detail-modal"
            >
                <div className="p-4">
                    {/* Lesson Header */}
                    <div className="mb-4">
                        <div className="flex align-items-center gap-2 mb-2">
                            <Tag value={lesson.position} severity="info" />
                            <Tag value={`${lesson.slices?.length || 0} slices`} severity="info" />
                        </div>
                        
                        {lesson.overview && (
                            <div className="mb-3">
                                <h5 className="text-primary mb-2">Overview</h5>
                                <p className="line-height-3 m-0">{lesson.overview}</p>
                            </div>
                        )}
                        
                        {lesson.mindsetMinute && (
                            <div className="mb-3 p-3 surface-100 border-round-lg border-left-3 border-primary">
                                <div className="flex align-items-center gap-2 mb-2">
                                    <i className="pi pi-lightbulb text-orange-500"></i>
                                    <span className="font-semibold text-orange-500">Mindset Minute</span>
                                </div>
                                <p className="m-0 line-height-3">{lesson.mindsetMinute}</p>
                            </div>
                        )}
                        
                        {lesson.streetTip && (
                            <div className="p-3 surface-100 border-round-lg border-left-3 border-cyan-500">
                                <div className="flex align-items-center gap-2 mb-2">
                                    <i className="pi pi-shield text-cyan-500"></i>
                                    <span className="font-semibold text-cyan-500">Street Tip</span>
                                </div>
                                <p className="m-0 line-height-3">{lesson.streetTip}</p>
                            </div>
                        )}
                    </div>

                    {/* Slices */}
                    <div className="grid">
                        {lesson.slices?.map((slice, index) => (
                            <div key={slice.id || index} className="col-12 lg:col-6">
                                <Card className="h-full">
                                    <div className="flex justify-content-between align-items-start mb-3 pb-3 border-bottom-1 surface-border">
                                        <div className="flex-1">
                                            <div className="flex align-items-center gap-2 mb-1">
                                                <Tag value={`Slice ${slice.sliceNumber}`} severity="info" className="font-semibold" />
                                                {slice.isBonusSlice && <Tag value="BONUS" severity="warning" icon="pi pi-star" />}
                                            </div>
                                            <h6 className="m-0 mt-2 font-bold text-lg">{slice.title}</h6>
                                        </div>
                                    </div>

                                    {/* Essential Detail */}
                                    {slice.essentialDetail && (
                                        <div className="mb-3">
                                            <div className="flex align-items-center gap-2 mb-2">
                                                <i className="pi pi-check-circle text-green-500"></i>
                                                <span className="font-semibold text-green-600">Essential Detail</span>
                                            </div>
                                            <p className="m-0 text-sm pl-4 line-height-3">{slice.essentialDetail}</p>
                                        </div>
                                    )}

                                    {/* Most Common Mistake */}
                                    {slice.mostCommonMistake && (
                                        <div className="mb-3 p-2 surface-50 border-round-md border-left-2 border-red-400">
                                            <div className="flex align-items-center gap-2 mb-1">
                                                <i className="pi pi-exclamation-triangle text-red-500"></i>
                                                <span className="font-semibold text-red-600 text-sm">Most Common Mistake</span>
                                            </div>
                                            <p className="m-0 text-sm pl-4 line-height-3">{slice.mostCommonMistake}</p>
                                        </div>
                                    )}

                                    {/* Safety Tip */}
                                    {slice.safetyTip && (
                                        <div className="mb-3 p-2 surface-50 border-round-md border-left-2 border-orange-400">
                                            <div className="flex align-items-center gap-2 mb-1">
                                                <i className="pi pi-shield text-orange-500"></i>
                                                <span className="font-semibold text-orange-600 text-sm">Safety Tip</span>
                                            </div>
                                            <p className="m-0 text-sm pl-4 line-height-3">{slice.safetyTip}</p>
                                        </div>
                                    )}

                                    {/* Principles */}
                                    {slice.corePrinciples && slice.corePrinciples.length > 0 && (
                                        <div className="mt-3 pt-3 border-top-1 surface-border">
                                            <div className="flex align-items-center gap-2 mb-2">
                                                <i className="pi pi-compass text-indigo-500"></i>
                                                <span className="font-semibold text-sm">Core Principles</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {slice.corePrinciples.map((p, i) => (
                                                    <Tag 
                                                        key={`${slice.id}-${i}`} 
                                                        value={p.split(' (')[0]} 
                                                        severity={getPrincipleSeverity(p)}
                                                        className="text-xs"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default LessonCard;
