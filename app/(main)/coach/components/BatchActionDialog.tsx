'use client';

import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Slider } from 'primereact/slider';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';

interface BatchActionDialogProps {
  visible: boolean;
  onHide: () => void;
  actionType: 'confidence' | 'complete' | 'incomplete';
  itemCount: number;
  onConfirm: (value?: number) => void;
}

const BatchActionDialog: React.FC<BatchActionDialogProps> = ({
  visible,
  onHide,
  actionType,
  itemCount,
  onConfirm,
}) => {
  const [batchConfidence, setBatchConfidence] = useState(50);

  const getTitle = () => {
    switch (actionType) {
      case 'confidence': return 'Batch Set Confidence';
      case 'complete': return 'Mark All Complete';
      case 'incomplete': return 'Mark All Incomplete';
      default: return 'Batch Action';
    }
  };

  const getMessage = () => {
    switch (actionType) {
      case 'confidence': return `Set confidence level for ${itemCount} steps`;
      case 'complete': return `Mark all ${itemCount} steps as complete?`;
      case 'incomplete': return `Mark all ${itemCount} steps as incomplete?`;
      default: return '';
    }
  };

  const getMessageSeverity = () => {
    switch (actionType) {
      case 'complete': return 'success';
      case 'incomplete': return 'warn';
      default: return 'info';
    }
  };

  const handleConfirm = () => {
    if (actionType === 'confidence') {
      onConfirm(batchConfidence);
    } else {
      onConfirm();
    }
    onHide();
  };

  return (
    <Dialog
      header={getTitle()}
      visible={visible}
      onHide={onHide}
      style={{ width: '400px' }}
      modal
      className="sw-batch-dialog"
    >
      <div className="flex flex-column gap-3">
        <Message 
          text={getMessage()}
          severity={getMessageSeverity()}
        />
        
        {actionType === 'confidence' && (
          <div className="flex flex-column gap-2">
            <label className="font-semibold">Confidence Level</label>
            <Slider 
              value={batchConfidence}
              onChange={(e) => setBatchConfidence(e.value as number)}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-content-center">
              <Tag 
                value={`${batchConfidence}%`}
                severity="info"
                className="text-lg"
              />
            </div>
          </div>
        )}
        
        <div className="flex gap-2 justify-content-end">
          <Button 
            label="Cancel" 
            outlined
            onClick={onHide}
          />
          <Button 
            label="Apply" 
            severity={actionType === 'incomplete' ? 'warning' : 'success'}
            onClick={handleConfirm}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default BatchActionDialog;
