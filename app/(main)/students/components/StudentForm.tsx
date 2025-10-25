'use client';

import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { dataService } from '@/app/services/dataService';
import type { Student } from '@/app/types/student.types';

interface StudentFormProps {
  visible: boolean;
  onHide: () => void;
  onSuccess: (student: Student) => void;
}

const RANK_OPTIONS = [
  { label: 'White Belt', value: 'White Belt' },
  { label: 'Blue Belt', value: 'Blue Belt' },
  { label: 'Purple Belt', value: 'Purple Belt' },
  { label: 'Brown Belt', value: 'Brown Belt' },
  { label: 'Black Belt', value: 'Black Belt' }
];

const StudentForm = ({ visible, onHide, onSuccess }: StudentFormProps) => {
  const [name, setName] = useState('');
  const [rank, setRank] = useState('White Belt');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!rank) {
      newErrors.rank = 'Rank is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const newStudent = await dataService.createStudent({
        name: name.trim(),
        rank,
        notes: notes.trim(),
        sessions: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Reset form
      setName('');
      setRank('White Belt');
      setNotes('');
      setErrors({});
      
      onSuccess(newStudent);
      onHide();
    } catch (error) {
      console.error('Error creating student:', error);
      alert('Failed to create student. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName('');
    setRank('White Belt');
    setNotes('');
    setErrors({});
    onHide();
  };

  return (
    <Dialog
      visible={visible}
      onHide={handleCancel}
      header="Add New Student"
      style={{ width: '500px' }}
      breakpoints={{ '768px': '95vw' }}
      modal
      className="p-fluid"
    >
      <div className="field mb-4">
        <label htmlFor="student-name" className="block font-semibold mb-2">
          Student Name *
        </label>
        <InputText
          id="student-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter student's full name"
          className={errors.name ? 'p-invalid' : ''}
          autoFocus
        />
        {errors.name && (
          <small className="p-error">{errors.name}</small>
        )}
      </div>

      <div className="field mb-4">
        <label htmlFor="student-rank" className="block font-semibold mb-2">
          Belt Rank *
        </label>
        <Dropdown
          id="student-rank"
          value={rank}
          onChange={(e) => setRank(e.value)}
          options={RANK_OPTIONS}
          placeholder="Select belt rank"
          className={errors.rank ? 'p-invalid' : ''}
        />
        {errors.rank && (
          <small className="p-error">{errors.rank}</small>
        )}
      </div>

      <div className="field mb-4">
        <label htmlFor="student-notes" className="block font-semibold mb-2">
          Notes (Optional)
        </label>
        <InputTextarea
          id="student-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about the student (goals, challenges, etc.)"
          rows={4}
        />
      </div>

      <div className="flex justify-content-end gap-2 mt-4">
        <Button
          label="Cancel"
          icon="pi pi-times"
          className="p-button-text"
          onClick={handleCancel}
          disabled={saving}
        />
        <Button
          label={saving ? 'Creating...' : 'Create Student'}
          icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-user-plus'}
          className="p-button-success"
          onClick={handleSubmit}
          disabled={saving}
        />
      </div>
    </Dialog>
  );
};

export default StudentForm;

