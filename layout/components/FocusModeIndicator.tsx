'use client';

import React from 'react';

interface FocusModeIndicatorProps {
  visible: boolean;
  isFocusMode: boolean;
}

const FocusModeIndicator: React.FC<FocusModeIndicatorProps> = ({ visible, isFocusMode }) => {
  if (!visible) return null;

  return (
    <div className={`focus-mode-indicator ${isFocusMode ? 'active' : ''}`}>
      <i className="pi pi-eye" />
      Focus Mode {isFocusMode ? 'ON' : 'OFF'}
    </div>
  );
};

export default FocusModeIndicator;
