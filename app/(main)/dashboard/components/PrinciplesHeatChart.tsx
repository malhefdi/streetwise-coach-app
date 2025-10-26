'use client';

import React from 'react';

interface PrincipleData {
    name: string;
    count: number;
}

interface PrinciplesHeatChartProps {
    data: PrincipleData[];
    className?: string;
}

const PrinciplesHeatChart: React.FC<PrinciplesHeatChartProps> = ({ 
    data, 
    className = '' 
}) => {
    const maxCount = Math.max(...data.map(d => d.count), 1);
    
    return (
        <div className={`sw-chart-container ${className}`}>
            <div className="sw-chart">
                <div className="grid">
                    {data.map(({ name, count }, index) => {
                        const height = (count / maxCount) * 100;
                        const intensity = Math.min(count / maxCount, 1);
                        
                        return (
                            <div key={name} className="col-3 text-center">
                                <div className="relative h-20 flex align-items-end justify-content-center">
                                    {/* Bar */}
                                    <div 
                                        className="w-3 border-round-top transition-all duration-500 ease-out"
                                        style={{ 
                                            height: `${height}%`,
                                            background: `linear-gradient(to top, 
                                                rgba(34, 197, 94, ${intensity * 0.3}), 
                                                rgba(34, 197, 94, ${intensity * 0.8})
                                            )`,
                                            minHeight: count > 0 ? '8px' : '0px'
                                        }}
                                    />
                                </div>
                                
                                {/* Label */}
                                <div className="mt-2">
                                    <div className="sw-chart-label text-xs text-med" style={{ 
                                        fontSize: '10px',
                                        lineHeight: '1.2',
                                        wordBreak: 'break-word' as const
                                    }}>
                                        {name}
                                    </div>
                                    <div className="text-xs text-low mt-1">
                                        {count}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PrinciplesHeatChart;
