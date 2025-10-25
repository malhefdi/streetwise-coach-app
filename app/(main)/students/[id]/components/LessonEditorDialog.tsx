'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Slider } from 'primereact/slider';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import type { Lesson, Slice, Step } from '@/app/data/curriculum';

interface LessonEditorDialogProps {
  visible: boolean;
  onHide: () => void;
  lesson: Lesson | null;
  studentId: string;
  onSave: (updatedLesson: Lesson) => Promise<void>;
}

const LessonEditorDialog: React.FC<LessonEditorDialogProps> = ({
  visible,
  onHide,
  lesson,
  studentId,
  onSave
}) => {
  const [editedLesson, setEditedLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    if (lesson) {
      setEditedLesson({ ...lesson });
    }
  }, [lesson]);

  if (!editedLesson) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editedLesson);
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Lesson updated successfully'
      });
      onHide();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update lesson'
      });
    } finally {
      setSaving(false);
    }
  };

  const addSlice = () => {
    const newSlice: Slice = {
      id: `slice-${Date.now()}`,
      sliceNumber: editedLesson.slices.length + 1,
      title: 'New Slice',
      description: '',
      steps: [
        {
          id: `step-${Date.now()}`,
          stepNumber: 1,
          description: 'New Step'
        }
      ]
    };
    
    setEditedLesson({
      ...editedLesson,
      slices: [...editedLesson.slices, newSlice]
    });
  };

  const updateSlice = (sliceIndex: number, updatedSlice: Slice) => {
    const newSlices = [...editedLesson.slices];
    newSlices[sliceIndex] = updatedSlice;
    setEditedLesson({ ...editedLesson, slices: newSlices });
  };

  const removeSlice = (sliceIndex: number) => {
    const newSlices = [...editedLesson.slices];
    newSlices.splice(sliceIndex, 1);
    // Renumber slices
    newSlices.forEach((slice, index) => {
      slice.sliceNumber = index + 1;
    });
    setEditedLesson({ ...editedLesson, slices: newSlices });
  };

  const addStep = (sliceIndex: number) => {
    const slice = editedLesson.slices[sliceIndex];
    const newStep: Step = {
      id: `step-${Date.now()}`,
      stepNumber: slice.steps.length + 1,
      description: 'New Step'
    };
    
    const newSlices = [...editedLesson.slices];
    newSlices[sliceIndex].steps = [...newSlices[sliceIndex].steps, newStep];
    setEditedLesson({ ...editedLesson, slices: newSlices });
  };

  const updateStep = (sliceIndex: number, stepIndex: number, updatedStep: Step) => {
    const newSlices = [...editedLesson.slices];
    newSlices[sliceIndex].steps[stepIndex] = updatedStep;
    setEditedLesson({ ...editedLesson, slices: newSlices });
  };

  const removeStep = (sliceIndex: number, stepIndex: number) => {
    const newSlices = [...editedLesson.slices];
    newSlices[sliceIndex].steps.splice(stepIndex, 1);
    // Renumber steps
    newSlices[sliceIndex].steps.forEach((step, index) => {
      step.stepNumber = index + 1;
    });
    setEditedLesson({ ...editedLesson, slices: newSlices });
  };

  const exportLesson = () => {
    const dataStr = JSON.stringify(editedLesson, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lesson-${editedLesson.technique.replace(/\s+/g, '-').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importLesson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedLesson = JSON.parse(e.target?.result as string);
        setEditedLesson(importedLesson);
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Lesson imported successfully'
        });
      } catch (error) {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Invalid lesson file'
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={visible}
        onHide={onHide}
        header={`Edit Lesson: ${editedLesson.technique}`}
        style={{ width: '95vw', height: '90vh' }}
        modal
        maximizable
        className="lesson-editor-dialog"
      >
        <div className="grid h-full">
          {/* Left Column - Lesson Details */}
          <div className="col-12 md:col-4">
            <Card title="Lesson Information" className="mb-3 h-full">
              <div className="flex flex-column gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-2">Lesson Number</label>
                  <InputText
                    value={editedLesson.lessonNumber}
                    onChange={(e) => setEditedLesson({
                      ...editedLesson,
                      lessonNumber: parseInt(e.target.value) || 0
                    })}
                    type="number"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">Technique Name</label>
                  <InputText
                    value={editedLesson.technique}
                    onChange={(e) => setEditedLesson({
                      ...editedLesson,
                      technique: e.target.value
                    })}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">Position</label>
                  <InputText
                    value={editedLesson.position}
                    onChange={(e) => setEditedLesson({
                      ...editedLesson,
                      position: e.target.value
                    })}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">Chapter Title</label>
                  <InputText
                    value={editedLesson.chapterTitle || ''}
                    onChange={(e) => setEditedLesson({
                      ...editedLesson,
                      chapterTitle: e.target.value
                    })}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">Overview</label>
                  <InputTextarea
                    value={editedLesson.overview || ''}
                    onChange={(e) => setEditedLesson({
                      ...editedLesson,
                      overview: e.target.value
                    })}
                    rows={4}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Mindset Minute</label>
                  <InputTextarea
                    value={editedLesson.mindsetMinute || ''}
                    onChange={(e) => setEditedLesson({
                      ...editedLesson,
                      mindsetMinute: e.target.value
                    })}
                    rows={3}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Street Tip</label>
                  <InputTextarea
                    value={editedLesson.streetTip || ''}
                    onChange={(e) => setEditedLesson({
                      ...editedLesson,
                      streetTip: e.target.value
                    })}
                    rows={3}
                    className="w-full"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Slices and Steps */}
          <div className="col-12 md:col-8">
            <div className="flex justify-content-between align-items-center mb-3">
              <h5>Slices & Steps ({editedLesson.slices.length} slices)</h5>
              <div className="flex gap-2">
                <Button
                  icon="pi pi-download"
                  label="Export"
                  size="small"
                  outlined
                  onClick={exportLesson}
                />
                <label htmlFor="import-lesson" className="p-button p-button-outlined p-button-sm">
                  <i className="pi pi-upload mr-2"></i>
                  Import
                </label>
                <input
                  id="import-lesson"
                  type="file"
                  accept=".json"
                  onChange={importLesson}
                  style={{ display: 'none' }}
                />
                <Button
                  icon="pi pi-plus"
                  label="Add Slice"
                  size="small"
                  onClick={addSlice}
                />
              </div>
            </div>

            <div className="slices-container" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <Accordion multiple>
                {editedLesson.slices.map((slice, sliceIndex) => (
                  <AccordionTab
                    key={slice.id}
                    header={
                      <div className="flex justify-content-between align-items-center w-full">
                        <span className="font-semibold">
                          Slice {slice.sliceNumber}: {slice.title}
                        </span>
                        <div className="flex align-items-center gap-2">
                          <Tag value={`${slice.steps.length} steps`} severity="info" />
                          <Button
                            icon="pi pi-trash"
                            size="small"
                            severity="danger"
                            text
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSlice(sliceIndex);
                            }}
                          />
                        </div>
                      </div>
                    }
                  >
                    <div className="grid">
                      {/* Slice Details */}
                      <div className="col-12 md:col-6">
                        <Card title="Slice Information" className="mb-3">
                          <div className="flex flex-column gap-3">
                            <div>
                              <label className="block text-sm font-semibold mb-2">Title</label>
                              <InputText
                                value={slice.title}
                                onChange={(e) => updateSlice(sliceIndex, {
                                  ...slice,
                                  title: e.target.value
                                })}
                                className="w-full"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-semibold mb-2">Description</label>
                              <InputTextarea
                                value={slice.description || ''}
                                onChange={(e) => updateSlice(sliceIndex, {
                                  ...slice,
                                  description: e.target.value
                                })}
                                rows={3}
                                className="w-full"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold mb-2">Essential Detail</label>
                              <InputTextarea
                                value={slice.essentialDetail || ''}
                                onChange={(e) => updateSlice(sliceIndex, {
                                  ...slice,
                                  essentialDetail: e.target.value
                                })}
                                rows={2}
                                className="w-full"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold mb-2">Most Common Mistake</label>
                              <InputTextarea
                                value={slice.mostCommonMistake || ''}
                                onChange={(e) => updateSlice(sliceIndex, {
                                  ...slice,
                                  mostCommonMistake: e.target.value
                                })}
                                rows={2}
                                className="w-full"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold mb-2">Safety Tip</label>
                              <InputTextarea
                                value={slice.safetyTip || ''}
                                onChange={(e) => updateSlice(sliceIndex, {
                                  ...slice,
                                  safetyTip: e.target.value
                                })}
                                rows={2}
                                className="w-full"
                              />
                            </div>
                          </div>
                        </Card>
                      </div>

                      {/* Steps */}
                      <div className="col-12 md:col-6">
                        <Card title="Steps">
                          <div className="flex justify-content-between align-items-center mb-3">
                            <span className="font-semibold">Steps ({slice.steps.length})</span>
                            <Button
                              icon="pi pi-plus"
                              label="Add Step"
                              size="small"
                              onClick={() => addStep(sliceIndex)}
                            />
                          </div>
                          
                          <div className="flex flex-column gap-2">
                            {slice.steps.map((step, stepIndex) => (
                              <Card key={step.id} className="p-2 step-card">
                                <div className="flex flex-column gap-2">
                                  <div className="flex justify-content-between align-items-center">
                                    <span className="font-semibold">Step {step.stepNumber}</span>
                                    <Button
                                      icon="pi pi-trash"
                                      size="small"
                                      severity="danger"
                                      text
                                      onClick={() => removeStep(sliceIndex, stepIndex)}
                                    />
                                  </div>
                                  
                                  <InputTextarea
                                    value={step.description}
                                    onChange={(e) => updateStep(sliceIndex, stepIndex, {
                                      ...step,
                                      description: e.target.value
                                    })}
                                    rows={2}
                                    className="w-full"
                                    placeholder="Step description..."
                                  />
                                </div>
                              </Card>
                            ))}
                          </div>
                        </Card>
                      </div>
                    </div>
                  </AccordionTab>
                ))}
              </Accordion>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            label="Cancel"
            icon="pi pi-times"
            outlined
            onClick={onHide}
            disabled={saving}
          />
          <Button
            label="Save Changes"
            icon="pi pi-check"
            onClick={handleSave}
            loading={saving}
          />
        </div>
      </Dialog>

      <style jsx>{`
        .lesson-editor-dialog .p-dialog-content {
          padding: 1rem;
        }
        
        .slices-container {
          border: 1px solid var(--surface-border);
          border-radius: 0.5rem;
          padding: 1rem;
        }
        
        .step-card {
          border: 1px solid var(--surface-border);
          transition: all 0.2s ease;
        }
        
        .step-card:hover {
          border-color: var(--primary-color);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .lesson-editor-dialog .p-accordion .p-accordion-header {
          background: var(--surface-50);
        }
        
        .lesson-editor-dialog .p-accordion .p-accordion-header:hover {
          background: var(--surface-100);
        }
      `}</style>
    </>
  );
};

export default LessonEditorDialog;
