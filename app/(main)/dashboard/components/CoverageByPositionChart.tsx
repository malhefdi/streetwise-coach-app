'use client';

import React from 'react';

interface PositionData {
    position: string;
    count: number;
    percentage: number;
}

interface CoverageByPositionChartProps {
    data: PositionData[];
    totalLessons: number;
    className?: string;
}

const CoverageByPositionChart: React.FC<CoverageByPositionChartProps> = ({ 
    data, 
    totalLessons, 
    className = '' 
}) => {
    const maxCount = Math.max(...data.map(d => d.count), 1);
    
    const positionIcons: Record<string, string> = {
        'Mount': 'pi pi-arrow-up',
        'Guard': 'pi pi-shield',
        'Standing': 'pi pi-user',
        'Side Mount': 'pi pi-arrow-right',
        'Back': 'pi pi-arrow-down',
        'Unknown': 'pi pi-question'
    };

    return (
        <div className={`sw-chart-container ${className}`}>
            <div className="sw-chart">
                {data.map(({ position, count, percentage }) => (
                    <div key={position} className="mb-3">
                        <div className="flex justify-content-between align-items-center mb-1">
                            <div className="flex align-items-center gap-2">
                                <i className={`${positionIcons[position] || positionIcons.Unknown} text-sm`}></i>
                                <span className="sw-chart-label font-medium text-sm">{position}</span>
                            </div>
                            <span className="sw-chart-label text-sm text-med">{count} lessons</span>
                        </div>
                        
                        <div className="relative">
                            <div className="sw-chart-grid h-2 bg-surface-200 border-round-full overflow-hidden">
                                <div 
                                    className="h-full bg-primary-500 transition-all duration-500 ease-out"
                                    style={{ 
                                        width: `${(count / maxCount) * 100}%`,
                                        background: 'linear-gradient(90deg, var(--sw-primary-400), var(--sw-primary-600))'
                                    }}
                                />
                            </div>
                            <div className="absolute top-0 right-0 h-2 flex align-items-center">
                                <span className="text-xs text-med ml-2">{percentage}%</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CoverageByPositionChart;
