'use client';
import React, { useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from 'primereact/card';
import { DataTable, DataTableSortEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Chip } from 'primereact/chip';
import { InputText } from 'primereact/inputtext';
import { SelectButton, SelectButtonChangeEvent } from 'primereact/selectbutton';
import { Dialog } from 'primereact/dialog';
import { Checkbox, CheckboxChangeEvent } from 'primereact/checkbox';
import { Menu } from 'primereact/menu';
import { InputTextarea } from 'primereact/inputtextarea';

import CurriculumSwitcher from '../_templates/CurriculumSwitcher';
import { getCurriculum } from '@/app/data/curriculumEngine';
import type { Lesson, Slice } from '@/app/data/types/curriculum.types';


// ---------- Editable types ----------
type EditableStep = NonNullable<Slice['steps']>[0] & {
  id?: string;
  completed?: boolean;
  isEditing?: boolean;
};

type EditableSlice = Omit<Slice, 'steps'> & { steps?: EditableStep[] };
type EditableLesson = Omit<Lesson, 'slices'> & { slices: EditableSlice[] };

// ---------- Principle chip colors (Tailwind-friendly) ----------
const principleColorMap: Record<string, string> = {
  Connection: 'bg-blue-500 text-white',
  Distance: 'bg-cyan-500 text-white',
  Pyramid: 'bg-teal-500 text-white',
  Creation: 'bg-green-500 text-white',
  Acceptance: 'bg-lime-500 text-black',
  Velocity: 'bg-yellow-500 text-black',
  Clock: 'bg-amber-500 text-black',
  River: 'bg-orange-500 text-white',
  Frame: 'bg-orange-600 text-white',             // (replaced deep-orange)
  Kuzushi: 'bg-purple-500 text-white',
  Reconnaissance: 'bg-indigo-500 text-white',
  Prevention: 'bg-gray-500 text-white',
  Tension: 'bg-pink-500 text-white',
  Fork: 'bg-red-500 text-white',
  Posture: 'bg-blue-300 text-black',
  'False Surrender': 'bg-cyan-300 text-black',
  Depletion: 'bg-teal-300 text-black',
  Isolation: 'bg-green-300 text-black',
  Sacrifice: 'bg-lime-300 text-black',
  Momentum: 'bg-yellow-300 text-black',
  Pivot: 'bg-amber-300 text-black',
  Tagalong: 'bg-orange-300 text-black',
  Overload: 'bg-orange-700 text-white',          // (replaced deep-orange-300/500)
  Anchor: 'bg-purple-300 text-black',
  Ratchet: 'bg-indigo-300 text-black',
  Buoyancy: 'bg-gray-300 text-black',
  'Head Control': 'bg-pink-300 text-black',
  Redirection: 'bg-red-300 text-black',
  Mobility: 'bg-blue-100 text-black',
  Centerline: 'bg-cyan-100 text-black',
  Grandmaster: 'bg-teal-100 text-black'
};

const getPrincipleColor = (principle: string) => {
  const principleName = principle.split(' (')[0];
  return principleColorMap[principleName] || 'bg-gray-400 text-white';
};

const CurriculumPage = () => {
  // ----- curriculum selection (query param or localStorage) -----
  const qs = useSearchParams();
  const curId = (qs.get('cur') as 'gc2' | 'bbs1') ||
    (typeof window !== 'undefined' ? ((localStorage.getItem('curId') as 'gc2' | 'bbs1') || 'gc2') : 'gc2');

  const curriculum = getCurriculum(curId);
  const [lessons] = useState<Lesson[]>(curriculum.lessons);

  // ----- table state -----
  const [expandedRows, setExpandedRows] = useState<any>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sortField, setSortField] = useState<'lesson' | 'position'>('lesson');
  const [sortOrder, setSortOrder] = useState<1 | 0 | -1 | null>(1);

  // ----- editor state -----
  const [isCardVisible, setIsCardVisible] = useState(false);
  const [editableLesson, setEditableLesson] = useState<EditableLesson | null>(null);
  const menuRefs = useRef<{ [key: string]: Menu | null }>({});

  const sortOptions = [
    { icon: 'pi pi-sort-numeric-down', value: 'lesson' },
    { icon: 'pi pi-sort-alpha-down', value: 'position' }
  ];

  // ----- header with switcher -----
  const header = (
    <div className="flex justify-content-between align-items-center flex-wrap gap-2">
      <div className="flex align-items-center gap-3">
        <h5 className="m-0">{curriculum.name}</h5>
        <CurriculumSwitcher />
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
      onClick={(e) => { e.preventDefault(); openLessonCard(rowData); }}
      className="text-primary hover:underline font-semibold"
    >
      {rowData.technique}
    </a>
  );

  const renderPrinciples = (row: Lesson) => {
    // lesson-level principles if present, else collect from slices
    const lessonAny = row as any;
    const principles: string[] =
      lessonAny.principleRefs ||
      Array.from(new Set(row.slices.flatMap(s => (s as any).corePrinciples || [])));

    if (!principles?.length) return <span className="text-500">—</span>;

    return (
      <div className="flex flex-wrap gap-1">
        {principles.map((p, i) => (
          <Chip key={`${row.id || row.technique}-${i}`} label={p} className={getPrincipleColor(p)} />
        ))}
      </div>
    );
  };

  const actionsBodyTemplate = (rowData: Lesson) => (
    <Button icon="pi pi-plus" rounded text onClick={() => console.log('Add lesson:', rowData)} />
  );

  const rowExpansionTemplate = (data: Lesson) => (
    <div className="p-3">
      <h5 className="mt-0">Slices for Lesson {data.lessonNumber}</h5>
      <DataTable value={data.slices} size="small">
        <Column field="slice" header="#" style={{ width: 80 }} />
        <Column field="title" header="Title" />
        <Column field="indicator" header="Indicator" />
      </DataTable>
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
        <Checkbox
          checked={step.completed || false}
          onChange={(e: CheckboxChangeEvent) => updateStep(sliceIndex, stepIndex, 'completed', e.checked)}
          className="absolute"
          style={{ top: '1rem', right: '1rem' }}
        />
        <div className="font-bold mb-2">
          Step {step.stepNumber}:{' '}
          <span className={`text-sm font-normal ${step.importance === 'critical' ? 'text-red-500' : 'text-color-secondary'}`}>
            ({step.importance})
          </span>
        </div>
        <p className="m-0">{step.description}</p>
        <div className="absolute" style={{ bottom: '0.5rem', right: '0.5rem' }}>
          <Menu model={menuItems} popup ref={el => (menuRefs.current[menuKey] = el)} id={menuKey} />
          <Button icon="pi pi-ellipsis-v" rounded text onClick={(event) => menuRefs.current[menuKey]?.toggle(event)} aria-controls={menuKey} aria-haspopup />
        </div>
      </div>
    );
  };

  // ----- render -----
  return (
    <div className="card" style={{ height: 'calc(100vh - 10rem)', display: 'flex', flexDirection: 'column' }}>
      <Card className="mb-3">{header}</Card>

      <DataTable
        key={curId}   
        value={curriculum.lessons}
        header={null}
        globalFilter={globalFilter}
        scrollable
        scrollHeight="flex"
        dataKey="lesson"
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={(e: DataTableSortEvent) => { setSortField(e.sortField as any); setSortOrder(e.sortOrder ?? null); }}
        expandedRows={expandedRows ?? null}
        onRowToggle={(e) => setExpandedRows(e.data ?? null)}
        rowExpansionTemplate={rowExpansionTemplate}
      >
        <Column expander style={{ width: '3em' }} />
        <Column field="lessonNumber" header="Class #" sortable />
        <Column header="Lesson Title" body={lessonTitleBodyTemplate} sortable sortField="technique" />
        <Column field="position" header="Position" sortable />
        <Column header="Actions" body={actionsBodyTemplate} style={{ width: '5rem', textAlign: 'center' }} />
        <Column header="Principles" body={renderPrinciples} style={{ minWidth: 280 }} />
      </DataTable>

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
    </div>
  );
};

export default CurriculumPage;
