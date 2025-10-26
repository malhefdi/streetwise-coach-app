'use client';

import React, { useMemo } from 'react';
import { PRINCIPLES } from '@/app/data/principles.base';

interface PrincipleUsage {
    name: string;
    count: number;
    id: number;
}

interface PrinciplesRadarChartProps {
    data: PrincipleUsage[];
    className?: string;
}

const PrinciplesRadarChart: React.FC<PrinciplesRadarChartProps> = ({ 
    data, 
    className = '' 
}) => {
    // Create principle usage map
    const principleMap = useMemo(() => {
        const map = new Map<number, number>();
        data.forEach(({ name, count }) => {
            const principle = PRINCIPLES.find(p => p.name === name);
            if (principle) {
                map.set(principle.id, count);
            }
        });
        return map;
    }, [data]);

    // Calculate positions for all 32 principles
    const principlePositions = useMemo(() => {
        return PRINCIPLES.map((principle, index) => {
            const angle = (index / PRINCIPLES.length) * 2 * Math.PI - Math.PI / 2;
            const count = principleMap.get(principle.id) || 0;
            const maxCount = Math.max(...Array.from(principleMap.values()), 1);
            const radius = 60 + (count / maxCount) * 40; // Base radius + dynamic sizing
            
            return {
                ...principle,
                count,
                angle,
                radius,
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
                intensity: count / maxCount
            };
        });
    }, [principleMap]);

    // Color categories for principles
    const getPrincipleColor = (id: number) => {
        if (id <= 10) return '#3B82F6'; // Blue - Biomechanical
        if (id <= 20) return '#10B981'; // Green - Tactical  
        if (id <= 30) return '#F59E0B'; // Orange - Psychological
        return '#8B5CF6'; // Purple - Advanced
    };

    // Get category name for legend
    const getCategoryName = (id: number) => {
        if (id <= 10) return 'Biomechanical';
        if (id <= 20) return 'Tactical';
        if (id <= 30) return 'Psychological';
        return 'Advanced';
    };

    return (
        <div className={`sw-principles-radar ${className}`}>
            <div className="sw-radar-container">
                <svg 
                    viewBox="0 0 200 200" 
                    className="w-full h-full"
                    style={{ maxHeight: '400px' }}
                >
                    {/* Grid circles */}
                    <g className="sw-radar-grid">
                        {[20, 40, 60, 80, 100].map((radius, i) => (
                            <circle
                                key={i}
                                cx="100"
                                cy="100"
                                r={radius}
                                fill="none"
                                stroke="var(--surface-border)"
                                strokeWidth="0.5"
                                opacity="0.3"
                            />
                        ))}
                    </g>

                    {/* Grid lines */}
                    <g className="sw-radar-lines">
                        {Array.from({ length: 8 }, (_, i) => {
                            const angle = (i / 8) * 2 * Math.PI;
                            const x1 = 100 + Math.cos(angle) * 100;
                            const y1 = 100 + Math.sin(angle) * 100;
                            return (
                                <line
                                    key={i}
                                    x1="100"
                                    y1="100"
                                    x2={x1}
                                    y2={y1}
                                    stroke="var(--surface-border)"
                                    strokeWidth="0.5"
                                    opacity="0.2"
                                />
                            );
                        })}
                    </g>

                    {/* Principle dots */}
                    {principlePositions.map((principle) => (
                        <g key={principle.id} className="sw-principle-dot">
                            <circle
                                cx={100 + principle.x}
                                cy={100 + principle.y}
                                r={Math.max(2, 3 + principle.intensity * 4)}
                                fill={getPrincipleColor(principle.id)}
                                opacity={0.7 + principle.intensity * 0.3}
                                className="transition-all duration-300 hover:opacity-100"
                                style={{ 
                                    filter: principle.count > 0 ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' : 'none'
                                }}
                            />
                            
                            {/* Principle labels */}
                            <text
                                x={100 + principle.x}
                                y={100 + principle.y - 8}
                                textAnchor="middle"
                                className="sw-principle-label"
                                fontSize="8"
                                fill="var(--text-color)"
                                opacity={principle.count > 0 ? 0.8 : 0.4}
                            >
                                {principle.name}
                            </text>
                            
                            {/* Count badges */}
                            {principle.count > 0 && (
                                <g className="sw-count-badge">
                                    <circle
                                        cx={100 + principle.x + 6}
                                        cy={100 + principle.y - 6}
                                        r="4"
                                        fill="var(--primary-color)"
                                    />
                                    <text
                                        x={100 + principle.x + 6}
                                        y={100 + principle.y - 4}
                                        textAnchor="middle"
                                        fontSize="6"
                                        fill="white"
                                        fontWeight="bold"
                                    >
                                        {principle.count}
                                    </text>
                                </g>
                            )}
                        </g>
                    ))}

                    {/* Center circle */}
                    <circle
                        cx="100"
                        cy="100"
                        r="8"
                        fill="var(--primary-color)"
                        opacity="0.8"
                    />
                    <text
                        x="100"
                        y="105"
                        textAnchor="middle"
                        fontSize="10"
                        fill="white"
                        fontWeight="bold"
                    >
                        32
                    </text>
                </svg>
            </div>

            {/* Legend */}
            <div className="sw-radar-legend">
                <div className="flex justify-content-center gap-4 mt-3">
                    <div className="flex align-items-center gap-2">
                        <div className="w-3 h-3 border-round" style={{ backgroundColor: '#3B82F6' }}></div>
                        <span className="text-xs">Biomechanical</span>
                    </div>
                    <div className="flex align-items-center gap-2">
                        <div className="w-3 h-3 border-round" style={{ backgroundColor: '#10B981' }}></div>
                        <span className="text-xs">Tactical</span>
                    </div>
                    <div className="flex align-items-center gap-2">
                        <div className="w-3 h-3 border-round" style={{ backgroundColor: '#F59E0B' }}></div>
                        <span className="text-xs">Psychological</span>
                    </div>
                    <div className="flex align-items-center gap-2">
                        <div className="w-3 h-3 border-round" style={{ backgroundColor: '#8B5CF6' }}></div>
                        <span className="text-xs">Advanced</span>
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="sw-radar-stats mt-3">
                <div className="flex justify-content-between align-items-center text-xs text-med">
                    <span>Total Principles: 32</span>
                    <span>Active: {data.length}</span>
                    <span>Max Usage: {Math.max(...data.map(d => d.count), 0)}</span>
                </div>
            </div>
        </div>
    );
};

export default PrinciplesRadarChart;
