'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import type { Lesson } from '@/app/data/curriculum';

interface OptimizedLessonCardProps {
    lesson: Lesson;
    onViewFullscreen: (lesson: Lesson) => void;
    className?: string;
}

// Color mapping for positions - matches the filter colors
const getPositionColor = (position: string): string => {
    const colorMap: Record<string, string> = {
        'Mount': 'blue',
        'Back': 'red',
        'Standing': 'orange',
        'Guard': 'green',
        'Side Mount': 'purple'
    };
    return colorMap[position] || 'gray';
};

const OptimizedLessonCard: React.FC<OptimizedLessonCardProps> = ({ 
    lesson, 
    onViewFullscreen,
    className = '' 
}) => {
    const handleTitleClick = () => {
        onViewFullscreen(lesson);
    };

    const hasBonusSlices = lesson.slices?.some(slice => slice.isBonusSlice);
    const positionColor = getPositionColor(lesson.position || '');

    return (
        <div className={`sw-optimized-lesson-card ${className}`} onClick={handleTitleClick}>
            <div className="sw-lesson-card-content">
                {/* Lesson Number - Subtle prefix */}
                <span className="sw-lesson-number-text">L{lesson.lessonNumber}</span>
                
                {/* Lesson Title - Primary focal point, clickable */}
                <h3 
                    className="sw-lesson-title"
                    title="Click to view full lesson details"
                >
                    {lesson.technique}
                </h3>
                
                {/* Metadata Line - Position, Slices, Bonus */}
                <div className="sw-lesson-metadata">
                    <span className={`sw-position-tag sw-position-tag--${positionColor}`}>
                        {lesson.position}
                    </span>
                    <span className="sw-metadata-separator">•</span>
                    <span className="sw-slice-count">
                        {lesson.slices?.length || 0} slices
                    </span>
                    {hasBonusSlices && (
                        <>
                            <span className="sw-metadata-separator">•</span>
                            <span className="sw-bonus-text">
                                <i className="pi pi-star"></i> BONUS
                            </span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OptimizedLessonCard;
