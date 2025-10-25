'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Card } from 'primereact/card';
import { DataTable, DataTableSortEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { SelectButton, SelectButtonChangeEvent } from 'primereact/selectbutton';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { Checkbox, CheckboxChangeEvent } from 'primereact/checkbox';
import { Menu } from 'primereact/menu';
import { InputTextarea } from 'primereact/inputtextarea';

import { getCurriculum, getAllCurricula } from '@/app/data/curriculum';
import type { Lesson, Slice } from '@/app/data/curriculum';


// ---------- Editable types ----------
type EditableStep = NonNullable<Slice['steps']>[0] & {
  id?: string;
  completed?: boolean;
  isEditing?: boolean;
  importance?: 'standard' | 'important' | 'critical';
  confidence?: number;
};

type EditableSlice = Omit<Slice, 'steps'> & { steps?: EditableStep[] };
type EditableLesson = Omit<Lesson, 'slices'> & { slices: EditableSlice[] };

// ---------- Principle severity mapping (subtle colors) ----------
const getPrincipleSeverity = (principle: string): 'info' | 'success' | 'warning' | 'danger' => {
  const principleName = principle.split(' (')[0];
  
  // Group principles by category for consistent, subtle coloring
  const corePrinciples = ['Connection', 'Distance', 'Pyramid', 'Creation', 'Acceptance'];
  const movementPrinciples = ['Velocity', 'Clock', 'River', 'Frame', 'Kuzushi'];
  const controlPrinciples = ['Reconnaissance', 'Prevention', 'Tension', 'Fork', 'Posture'];
  const advancedPrinciples = ['False Surrender', 'Depletion', 'Isolation', 'Sacrifice', 'Momentum'];
  const specializedPrinciples = ['Pivot', 'Tagalong', 'Overload', 'Anchor', 'Ratchet'];
  
  if (corePrinciples.includes(principleName)) return 'success';
  if (movementPrinciples.includes(principleName)) return 'info';
  if (controlPrinciples.includes(principleName)) return 'warning';
  if (advancedPrinciples.includes(principleName)) return 'danger';
  if (specializedPrinciples.includes(principleName)) return 'info';
  
  return 'info'; // Default for any unmapped principles
};

const CurriculumPage = () => {
  // ----- curriculum selection -----
  const allCurricula = getAllCurricula();
  const [selectedCurriculumId, setSelectedCurriculumId] = useState('gc2');
  const curriculum = getCurriculum(selectedCurriculumId);
  const [lessons, setLessons] = useState<Lesson[]>(curriculum?.lessons || []);

  // Update lessons when curriculum changes
  useEffect(() => {
    console.log('Curriculum changed:', curriculum);
    console.log('Lessons data:', curriculum?.lessons);
    setLessons(curriculum?.lessons || []);
  }, [curriculum]);

  // ----- table state -----
  const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [sortField, setSortField] = useState<'lesson' | 'position'>('lesson');
  const [sortOrder, setSortOrder] = useState<1 | 0 | -1 | null>(1);

  // ----- editor state -----
  const [isCardVisible, setIsCardVisible] = useState(false);
  const [editableLesson, setEditableLesson] = useState<EditableLesson | null>(null);
  const menuRefs = useRef<{ [key: string]: Menu | null }>({});
  
  // ----- batch operations state -----
  const [selectedSteps, setSelectedSteps] = useState<Set<string>>(new Set());
  const [showBatchToolbar, setShowBatchToolbar] = useState(false);

  const sortOptions = [
    { icon: 'pi pi-sort-numeric-down', value: 'lesson' },
    { icon: 'pi pi-sort-alpha-down', value: 'position' }
  ];

  // ----- header with switcher -----
  const curriculumOptions = allCurricula.map(curriculum => ({
    label: curriculum.name,
    value: curriculum.id
  }));

  const header = (
    <div className="flex justify-content-between align-items-center flex-wrap gap-2">
      <div className="flex align-items-center gap-3">
        <h5 className="m-0">{curriculum?.name || 'Curriculum'}</h5>
        <Dropdown
          value={selectedCurriculumId}
          onChange={(e) => setSelectedCurriculumId(e.value)}
          options={curriculumOptions}
          placeholder="Select Curriculum"
          className="w-20rem"
        />
      </div>
      <div className="flex align-items-center gap-2">
        <SelectButton
          value={sortField}
          options={sortOptions}
          onChange={(e: SelectButtonChangeEvent) => e.value && (setSortField(e.value), setSortOrder(1))}
          optionLabel="value"
          itemTemplate={(option) => <i className={option.icon}></i>}
        />
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText type="search" onInput={(e) => setGlobalFilter(e.currentTarget.value)} placeholder="Search..." />
        </span>
      </div>
    </div>
  );

  // ----- row/columns helpers -----
  const openLessonCard = (lesson: Lesson) => {
    const lessonCopy: EditableLesson = JSON.parse(JSON.stringify(lesson));
    setEditableLesson(lessonCopy);
    setIsCardVisible(true);
  };

  const lessonTitleBodyTemplate = (rowData: Lesson) => (
    <a
      href="#"
      onClick={(e) => { 
        e.preventDefault(); 
        e.stopPropagation(); // Prevent row expansion when clicking title
        openLessonCard(rowData); 
      }}
      className="text-primary hover:underline font-semibold"
    >
      {rowData.technique}
    </a>
  );


  const actionsBodyTemplate = (rowData: Lesson) => (
    <Button 
      icon="pi pi-plus" 
      rounded 
      text 
      onClick={(e) => {
        e.stopPropagation(); // Prevent row expansion when clicking action button
        console.log('Add lesson:', rowData);
      }} 
    />
  );

  const rowExpansionTemplate = (data: Lesson) => (
    <div className="p-4 surface-ground">
      {/* Lesson Header Section */}
      <Card className="mb-4 shadow-3">
        <div className="flex align-items-start gap-3 mb-3">
          <i className="pi pi-book text-4xl text-primary"></i>
          <div className="flex-1">
            <h4 className="m-0 mb-2 text-primary font-bold">Lesson {data.lessonNumber}: {data.technique}</h4>
            {data.overview && (
              <div className="mb-3">
                <div className="flex align-items-center gap-2 mb-2">
                  <i className="pi pi-info-circle text-primary"></i>
                  <span className="font-semibold text-primary">Overview</span>
                </div>
                <p className="m-0 text-color-secondary line-height-3 pl-4">{data.overview}</p>
              </div>
            )}
            
            {/* Mindset Minute */}
            {data.mindsetMinute && (
              <div className="mb-3 p-3 surface-100 border-round-lg border-left-3 border-primary">
                <div className="flex align-items-center gap-2 mb-2">
                  <i className="pi pi-lightbulb text-orange-500 text-xl"></i>
                  <span className="font-semibold text-orange-500">Mindset Minute</span>
                </div>
                <p className="m-0 text-sm line-height-3">{data.mindsetMinute}</p>
              </div>
            )}
            
            {/* Street Tip */}
            {data.streetTip && (
              <div className="p-3 surface-100 border-round-lg border-left-3 border-cyan-500">
                <div className="flex align-items-center gap-2 mb-2">
                  <i className="pi pi-shield text-cyan-500 text-xl"></i>
                  <span className="font-semibold text-cyan-500">Street Tip</span>
                </div>
                <p className="m-0 text-sm line-height-3">{data.streetTip}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Slices Section */}
      <div className="mb-2">
        <h5 className="text-lg font-semibold mb-3 flex align-items-center gap-2">
          <i className="pi pi-th-large text-primary"></i>
          Technique Slices
        </h5>
      </div>
      
      <div className="grid">
        {data.slices.map((slice, index) => (
          <div key={slice.id || index} className="col-12 lg:col-6">
            <Card className="h-full shadow-2 hover:shadow-4 transition-duration-200">
              {/* Slice Header */}
              <div className="flex justify-content-between align-items-start mb-3 pb-3 border-bottom-1 surface-border">
                <div className="flex-1">
                  <div className="flex align-items-center gap-2 mb-1">
                    <Tag value={`Slice ${slice.sliceNumber}`} severity="info" className="font-semibold" />
                    {slice.isBonusSlice && <Tag value="BONUS" severity="warning" icon="pi pi-star" />}
                  </div>
                  <h6 className="m-0 mt-2 font-bold text-lg">{slice.title}</h6>
                </div>
              </div>

              {/* Essential Detail */}
              {slice.essentialDetail && (
                <div className="mb-3">
                  <div className="flex align-items-center gap-2 mb-2">
                    <i className="pi pi-check-circle text-green-500"></i>
                    <span className="font-semibold text-green-600">Essential Detail</span>
                  </div>
                  <p className="m-0 text-sm pl-4 line-height-3">{slice.essentialDetail}</p>
                </div>
              )}

              {/* Most Common Mistake */}
              {slice.mostCommonMistake && (
                <div className="mb-3 p-2 surface-50 border-round-md border-left-2 border-red-400">
                  <div className="flex align-items-center gap-2 mb-1">
                    <i className="pi pi-exclamation-triangle text-red-500"></i>
                    <span className="font-semibold text-red-600 text-sm">Most Common Mistake</span>
                  </div>
                  <p className="m-0 text-sm pl-4 line-height-3">{slice.mostCommonMistake}</p>
                </div>
              )}

              {/* Safety Tip */}
              {slice.safetyTip && (
                <div className="mb-3 p-2 surface-50 border-round-md border-left-2 border-orange-400">
                  <div className="flex align-items-center gap-2 mb-1">
                    <i className="pi pi-shield text-orange-500"></i>
                    <span className="font-semibold text-orange-600 text-sm">Safety Tip</span>
                  </div>
                  <p className="m-0 text-sm pl-4 line-height-3">{slice.safetyTip}</p>
                </div>
              )}

              {/* Principles */}
              {slice.corePrinciples && slice.corePrinciples.length > 0 && (
                <div className="mt-3 pt-3 border-top-1 surface-border">
                  <div className="flex align-items-center gap-2 mb-2">
                    <i className="pi pi-compass text-indigo-500"></i>
                    <span className="font-semibold text-sm">Core Principles</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {slice.corePrinciples.map((p, i) => (
                      <Tag 
                        key={`${slice.id}-${i}`} 
                        value={p.split(' (')[0]} 
                        severity={getPrincipleSeverity(p)}
                        className="text-xs"
                      />
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );

  // ----- step editor helpers -----
  const updateStep = (sliceIndex: number, stepIndex: number, field: keyof EditableStep, value: any) => {
    if (!editableLesson) return;
    const updatedSlices = [...editableLesson.slices];
    const updatedSteps = [...(updatedSlices[sliceIndex].steps || [])];
    updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], [field]: value };
    updatedSlices[sliceIndex].steps = updatedSteps;
    setEditableLesson({ ...editableLesson, slices: updatedSlices });
  };

  const addNewStep = (sliceIndex: number) => {
    if (!editableLesson) return;
    const newStep: EditableStep = {
      id: '',
      stepNumber: (editableLesson.slices[sliceIndex].steps?.length || 0) + 1,
      description: '',
      importance: 'standard',
      isEditing: true
    };
    const updatedSlices = [...editableLesson.slices];
    const updatedSteps = [...(updatedSlices[sliceIndex].steps || []), newStep];
    updatedSlices[sliceIndex].steps = updatedSteps;
    setEditableLesson({ ...editableLesson, slices: updatedSlices });
  };

  // ----- batch operations -----
  const toggleStepSelection = (stepId: string) => {
    setSelectedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      setShowBatchToolbar(newSet.size > 0);
      return newSet;
    });
  };

  const selectAllSteps = () => {
    const allStepIds = new Set<string>();
    lessons.forEach(lesson => {
      lesson.slices.forEach(slice => {
        slice.steps?.forEach(step => {
          if (step.id) allStepIds.add(step.id);
        });
      });
    });
    setSelectedSteps(allStepIds);
    setShowBatchToolbar(true);
  };

  const deselectAllSteps = () => {
    setSelectedSteps(new Set());
    setShowBatchToolbar(false);
  };

  const batchUpdateSteps = (field: keyof EditableStep, value: any) => {
    setLessons(prev => prev.map(lesson => ({
      ...lesson,
      slices: lesson.slices.map(slice => ({
        ...slice,
        steps: slice.steps?.map(step => 
          step.id && selectedSteps.has(step.id)
            ? { ...step, [field]: value }
            : step
        ) || []
      }))
    })));
    setSelectedSteps(new Set());
    setShowBatchToolbar(false);
  };


  const renderStepCard = (step: EditableStep, sliceIndex: number, stepIndex: number) => {
    const menuKey = `s${sliceIndex}-st${stepIndex}`;
    const importanceMenu = {
      label: 'Set Importance', icon: 'pi pi-star',
      items: [
        { label: 'Critical', command: () => updateStep(sliceIndex, stepIndex, 'importance', 'critical') },
        { label: 'Important', command: () => updateStep(sliceIndex, stepIndex, 'importance', 'important') },
        { label: 'Standard', command: () => updateStep(sliceIndex, stepIndex, 'importance', 'standard') }
      ]
    };
    const confidenceMenu = {
      label: 'Set Confidence', icon: 'pi pi-check-circle',
      items: [5, 4, 3, 2, 1].map(val => ({ label: `${val} / 5`, command: () => updateStep(sliceIndex, stepIndex, 'confidence', val) }))
    };
    const menuItems = [importanceMenu, confidenceMenu, { label: 'Flag for Next Class', icon: 'pi pi-flag' }];

    if (step.isEditing) {
      return (
        <div key={stepIndex} className="p-3 mb-2 surface-200 border-round">
          <InputTextarea
            defaultValue={step.description}
            rows={3}
            className="w-full mb-2"
            autoFocus
            onBlur={(e) => updateStep(sliceIndex, stepIndex, 'description', e.currentTarget.value)}
          />
          <Button label="Done" icon="pi pi-check" onClick={() => updateStep(sliceIndex, stepIndex, 'isEditing', false)} />
        </div>
      );
    }

    return (
      <div key={stepIndex} className="surface-100 border-round p-3 mb-2 relative">
        {/* Selection Checkbox */}
        <Checkbox
          checked={step.id ? selectedSteps.has(step.id) : false}
          onChange={() => step.id && toggleStepSelection(step.id)}
          className="absolute"
          style={{ top: '1rem', left: '1rem' }}
        />
        
        {/* Completion Checkbox */}
        <Checkbox
          checked={step.completed || false}
          onChange={(e: CheckboxChangeEvent) => updateStep(sliceIndex, stepIndex, 'completed', e.checked)}
          className="absolute"
          style={{ top: '1rem', right: '1rem' }}
        />
        
        <div className="font-bold mb-2 ml-6">
          Step {step.stepNumber}:{' '}
          <span className={`text-sm font-normal ${step.importance === 'critical' ? 'text-red-500' : 'text-color-secondary'}`}>
            ({step.importance})
          </span>
        </div>
        <p className="m-0 ml-6">{step.description}</p>
        <div className="absolute" style={{ bottom: '0.5rem', right: '0.5rem' }}>
          <Menu model={menuItems} popup ref={el => { menuRefs.current[menuKey] = el; }} id={menuKey} />
          <Button icon="pi pi-ellipsis-v" rounded text onClick={(event) => menuRefs.current[menuKey]?.toggle(event)} aria-controls={menuKey} aria-haspopup />
        </div>
      </div>
    );
  };

  // ----- render -----
  return (
    <div className="card" style={{ height: 'calc(100vh - 10rem)', display: 'flex', flexDirection: 'column' }}>
      <Card className="mb-3">{header}</Card>
      
      {/* Batch Operations Toolbar */}
      {showBatchToolbar && (
        <Card className="mb-3 sw-batch-toolbar">
          <div className="flex justify-content-between align-items-center">
            <div className="flex align-items-center gap-3">
              <h4 className="sw-batch-title m-0">
                {selectedSteps.size} step{selectedSteps.size !== 1 ? 's' : ''} selected
              </h4>
              <div className="flex gap-2 sw-batch-actions">
                <Button
                  label="Mark Complete"
                  icon="pi pi-check"
                  size="small"
                  severity="success"
                  onClick={() => batchUpdateSteps('completed', true)}
                />
                <Button
                  label="Mark Incomplete"
                  icon="pi pi-times"
                  size="small"
                  severity="danger"
                  onClick={() => batchUpdateSteps('completed', false)}
                />
                <Button
                  label="Set Critical"
                  icon="pi pi-star"
                  size="small"
                  severity="warning"
                  onClick={() => batchUpdateSteps('importance', 'critical')}
                />
                <Button
                  label="Set Important"
                  icon="pi pi-star-fill"
                  size="small"
                  severity="info"
                  onClick={() => batchUpdateSteps('importance', 'important')}
                />
                <Button
                  label="Set Standard"
                  icon="pi pi-circle"
                  size="small"
                  severity="secondary"
                  onClick={() => batchUpdateSteps('importance', 'standard')}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                label="Select All"
                icon="pi pi-check-square"
                size="small"
                outlined
                onClick={selectAllSteps}
              />
              <Button
                label="Deselect All"
                icon="pi pi-times"
                size="small"
                outlined
                severity="danger"
                onClick={deselectAllSteps}
              />
            </div>
          </div>
        </Card>
      )}

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <DataTable
          value={lessons}
          dataKey="id"
          expandedRows={expandedRows}
          onRowToggle={(e) => {
            console.log('Row toggle event:', e);
            console.log('Current expandedRows:', expandedRows);
            setExpandedRows(e.data as { [key: string]: boolean });
          }}
          rowExpansionTemplate={rowExpansionTemplate}
          scrollable
          scrollHeight="flex"
          virtualScrollerOptions={{ itemSize: 46 }}
          globalFilter={globalFilter}
        >
        <Column 
          expander 
          style={{ width: '3em' }} 
          headerStyle={{ textAlign: 'center' }}
          bodyStyle={{ textAlign: 'center' }}
        />
        <Column field="lessonNumber" header="Class #" sortable />
        <Column header="Lesson Title" body={lessonTitleBodyTemplate} sortable sortField="technique" />
        <Column field="position" header="Position" sortable />
        <Column header="Actions" body={actionsBodyTemplate} style={{ width: '5rem', textAlign: 'center' }} />
      </DataTable>
      </div>

      {editableLesson && (
        <Dialog
          header={`Lesson ${editableLesson.lessonNumber}: ${editableLesson.technique}`}
          visible={isCardVisible}
          style={{ width: '50vw' }}
          onHide={() => setIsCardVisible(false)}
        >
          <div className="m-0">
            <p className="text-color-secondary">{editableLesson.overview}</p>
            {editableLesson.slices.map((slice, sliceIndex) => (
              <div key={sliceIndex} className="mt-4">
                <h6 className="font-bold">{slice.title}</h6>
                {slice.steps && slice.steps.map((step, stepIndex) => renderStepCard(step, sliceIndex, stepIndex))}
                <Button label="Add Step" icon="pi pi-plus" className="p-button-text mt-2" onClick={() => addNewStep(sliceIndex)} />
              </div>
            ))}
          </div>
        </Dialog>
      )}
      
      <style jsx global>{`
        .p-datatable .p-datatable-tbody > tr > td:first-child {
          text-align: center;
        }
        
        .p-datatable .p-row-toggler {
          color: var(--primary-color);
          font-size: 1.2rem;
          transition: transform 0.2s ease;
        }
        
        .p-datatable .p-row-toggler:hover {
          color: var(--primary-600);
          transform: scale(1.1);
        }
        
        .p-datatable .p-row-toggler.p-row-toggler-icon {
          transform: rotate(0deg);
        }
        
        .p-datatable .p-row-toggler.p-row-toggler-icon.pi-chevron-right {
          transform: rotate(0deg);
        }
        
        .p-datatable .p-row-toggler.p-row-toggler-icon.pi-chevron-down {
          transform: rotate(90deg);
        }
        
        .p-datatable .p-datatable-tbody > tr.p-datatable-row-expansion {
          background: var(--surface-100);
        }
        
        .p-datatable .p-datatable-tbody > tr.p-datatable-row-expansion > td {
          padding: 1rem;
          border-top: 1px solid var(--surface-border);
        }
      `}</style>
    </div>
  );
};

export default CurriculumPage;
