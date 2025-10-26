'use client';

import React from 'react';
import { Button } from 'primereact/button';

interface MinimalFilterBarProps {
    selectedCurriculumId: string;
    curriculumOptions: Array<{ label: string; value: string }>;
    selectedPositions: string[];
    uniquePositions: Array<{ label: string; value: string }>;
    globalFilter: string;
    onCurriculumChange: (value: string) => void;
    onPositionToggle: (position: string) => void;
    onSearchChange: (value: string) => void;
    className?: string;
}

// Color mapping for positions
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

const MinimalFilterBar: React.FC<MinimalFilterBarProps> = ({
    selectedCurriculumId,
    curriculumOptions,
    selectedPositions,
    uniquePositions,
    globalFilter,
    onCurriculumChange,
    onPositionToggle,
    onSearchChange,
    className = ''
}) => {
    return (
        <div className={`sw-minimal-filter-bar ${className}`}>
            {/* Curriculum Selector - Full width on mobile */}
            <div className="sw-curriculum-section">
                <div className="sw-curriculum-buttons">
                    {curriculumOptions.map((option) => {
                        const isActive = selectedCurriculumId === option.value;
                        
                        return (
                            <Button
                                key={option.value}
                                label={option.label}
                                className={`sw-curriculum-chip ${isActive ? 'sw-curriculum-chip--active' : 'sw-curriculum-chip--inactive'}`}
                                onClick={() => onCurriculumChange(option.value)}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Position Filters - Optimized for mobile touch */}
            <div className="sw-position-section">
                <div className="sw-position-buttons">
                    {uniquePositions.map((position) => {
                        const isActive = selectedPositions.includes(position.value);
                        const color = getPositionColor(position.value);
                        
                        return (
                            <Button
                                key={position.value}
                                label={position.label}
                                size="small"
                                className={`sw-position-chip sw-position-chip--${color} ${isActive ? 'sw-position-chip--active' : 'sw-position-chip--inactive'}`}
                                onClick={() => onPositionToggle(position.value)}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MinimalFilterBar;
