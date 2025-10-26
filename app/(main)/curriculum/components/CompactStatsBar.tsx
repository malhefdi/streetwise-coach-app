'use client';

import React from 'react';

interface CompactStatsBarProps {
    totalLessons: number;
    totalSlices: number;
    avgSteps: number;
    positionsCovered: number;
    className?: string;
}

const CompactStatsBar: React.FC<CompactStatsBarProps> = ({ 
    totalLessons, 
    totalSlices, 
    avgSteps, 
    positionsCovered,
    className = '' 
}) => {
    const stats = [
        {
            icon: 'pi pi-book',
            value: totalLessons,
            label: 'Total Lessons',
            iconColor: 'text-blue-500',
            valueColor: 'text-blue-600'
        },
        {
            icon: 'pi pi-th-large',
            value: totalSlices,
            label: 'Total Slices',
            iconColor: 'text-green-500',
            valueColor: 'text-green-600'
        },
        {
            icon: 'pi pi-chart-line',
            value: avgSteps,
            label: 'Avg Steps/Lesson',
            iconColor: 'text-orange-500',
            valueColor: 'text-orange-600'
        },
        {
            icon: 'pi pi-compass',
            value: positionsCovered,
            label: 'Positions Covered',
            iconColor: 'text-purple-500',
            valueColor: 'text-purple-600'
        }
    ];

    return (
        <div className={`sw-compact-stats-bar ${className}`}>
            {stats.map((stat, index) => (
                <div key={index} className="sw-stat-block">
                    <i className={`${stat.icon} ${stat.iconColor}`}></i>
                    <div className="sw-stat-content">
                        <span className={`sw-stat-number ${stat.valueColor}`}>
                            {stat.value}
                        </span>
                        <span className="sw-stat-label">
                            {stat.label}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CompactStatsBar;
