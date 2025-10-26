'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PRINCIPLES } from '@/app/data/principles.base';

interface PrincipleUsage {
    name: string;
    count: number;
    id: number;
}

interface AnimatedBarChartProps {
    data: PrincipleUsage[];
    className?: string;
}

const AnimatedBarChart: React.FC<AnimatedBarChartProps> = ({ 
    data, 
    className = '' 
}) => {
    const [animationStep, setAnimationStep] = useState(0);
    const [isAnimating, setIsAnimating] = useState(true);

    const getCategory = (id: number): string => {
        if (id <= 10) return 'Biomechanical';
        if (id <= 20) return 'Tactical';
        if (id <= 30) return 'Psychological';
        return 'Advanced';
    };

    const getCategoryColor = (category: string): string => {
        switch (category) {
            case 'Biomechanical': return '#3B82F6';
            case 'Tactical': return '#10B981';
            case 'Psychological': return '#F59E0B';
            case 'Advanced': return '#8B5CF6';
            default: return '#6B7280';
        }
    };

    const sortedData = useMemo(() => {
        const principleMap = new Map<number, number>();
        
        data.forEach(({ name, count }) => {
            const principle = PRINCIPLES.find(p => p.name === name);
            if (principle) {
                principleMap.set(principle.id, count);
            }
        });

        return PRINCIPLES
            .map((principle) => {
                const count = principleMap.get(principle.id) || 0;
                const category = getCategory(principle.id);
                
                return {
                    id: principle.id,
                    name: principle.name,
                    count,
                    category,
                    color: getCategoryColor(category)
                };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 12); // Show top 12 principles
    }, [data]);

    const maxCount = Math.max(...sortedData.map(d => d.count), 1);

    useEffect(() => {
        if (!isAnimating) return;

        const interval = setInterval(() => {
            setAnimationStep(prev => (prev + 1) % sortedData.length);
        }, 2000);

        return () => clearInterval(interval);
    }, [isAnimating, sortedData.length]);

    const handleBarClick = (principle: any) => {
        console.log('Clicked principle:', principle);
    };

    return (
        <div className={`sw-animated-bar-chart ${className}`}>
            <div className="sw-chart-container">
                <div className="sw-chart-header">
                    <h4>Top Principles by Usage</h4>
                    <button
                        className="sw-animation-toggle"
                        onClick={() => setIsAnimating(!isAnimating)}
                    >
                        {isAnimating ? 'Pause' : 'Play'} Animation
                    </button>
                </div>
                
                <div className="sw-bars-container">
                    {sortedData.map((principle, index) => {
                        const width = (principle.count / maxCount) * 100;
                        const isHighlighted = index === animationStep;
                        
                        return (
                            <div
                                key={principle.id}
                                className={`sw-bar-row ${isHighlighted ? 'highlighted' : ''}`}
                                onClick={() => handleBarClick(principle)}
                            >
                                <div className="sw-bar-label">
                                    <span className="sw-principle-name">{principle.name}</span>
                                    <span className="sw-principle-category">{principle.category}</span>
                                </div>
                                
                                <div className="sw-bar-track">
                                    <div
                                        className="sw-bar-fill"
                                        style={{
                                            width: `${width}%`,
                                            backgroundColor: principle.color,
                                            animationDelay: `${index * 0.1}s`
                                        }}
                                    >
                                        <span className="sw-bar-count">{principle.count}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="sw-chart-legend">
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
        </div>
    );
};

export default AnimatedBarChart;
