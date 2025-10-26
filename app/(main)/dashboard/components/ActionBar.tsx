'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from 'primereact/button';

interface ActionBarProps {
    className?: string;
}

const ActionBar: React.FC<ActionBarProps> = ({ className = '' }) => {
    return (
        <div className={`sw-action-bar ${className}`}>
            <div className="flex flex-wrap gap-3 justify-content-center md:justify-content-start">
                <Link href="/coach" className="no-underline">
                    <Button
                        label="Start Coaching"
                        icon="pi pi-bolt"
                        className="sw-button sw-button--success"
                        size="large"
                    />
                </Link>
                
                <Link href="/students" className="no-underline">
                    <Button
                        label="View Students"
                        icon="pi pi-users"
                        className="sw-button sw-button--secondary"
                        size="large"
                    />
                </Link>
                
                <Link href="/curriculum" className="no-underline">
                    <Button
                        label="View Curriculum"
                        icon="pi pi-book"
                        className="sw-button sw-button--secondary"
                        size="large"
                    />
                </Link>
                
                <Link href="/session-history" className="no-underline">
                    <Button
                        label="Session History"
                        icon="pi pi-history"
                        className="sw-button sw-button--secondary"
                        size="large"
                    />
                </Link>
            </div>
        </div>
    );
};

export default ActionBar;
