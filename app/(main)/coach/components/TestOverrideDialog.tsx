'use client';

import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';

interface TestOverrideDialogProps {
  visible: boolean;
  onHide: () => void;
  drillName: string;
  completedLessons: number;
  requiredLessons: number;
  onConfirm: (reason: string) => void;
}

const TestOverrideDialog: React.FC<TestOverrideDialogProps> = ({
  visible,
  onHide,
  drillName,
  completedLessons,
  requiredLessons,
  onConfirm,
}) => {
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!overrideReason.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onConfirm(overrideReason.trim());
      setOverrideReason('');
      onHide();
    } finally {
      setIsSubmitting(false);
    }
  };

  const canConfirm = overrideReason.trim().length > 0 && !isSubmitting;

  return (
    <Dialog
      header="Override Prerequisites?"
      visible={visible}
      onHide={onHide}
      style={{ width: '500px' }}
      modal
      className="sw-override-dialog"
    >
      <div className="flex flex-column gap-3">
        <div className="sw-override-warning">
          <Message 
            severity="warn"
            text={`Student has only completed ${completedLessons}/${requiredLessons} required lessons for ${drillName}. Allow test anyway?`}
          />
        </div>
        
        <div className="flex flex-column gap-2">
          <label className="font-semibold">
            Reason for Override <span className="text-red-500">*</span>
          </label>
          <InputTextarea 
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            placeholder="Explain why this override is necessary (e.g., student has prior experience, special circumstances, etc.)..."
            rows={4}
            className="sw-override-reason"
            maxLength={500}
          />
          <small className="text-color-secondary">
            {overrideReason.length}/500 characters
          </small>
        </div>
        
        <div className="flex gap-2 justify-content-end sw-override-actions">
          <Button 
            label="Cancel" 
            outlined
            onClick={onHide}
            disabled={isSubmitting}
          />
          <Button 
            label={isSubmitting ? 'Processing...' : 'Allow Test'}
            severity="warning"
            onClick={handleConfirm}
            disabled={!canConfirm}
            loading={isSubmitting}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default TestOverrideDialog;
