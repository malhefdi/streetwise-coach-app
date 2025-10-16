'use client'; 
import React, { useState, useRef } from 'react';
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

import { Card } from 'primereact/card';
import type { Lesson, Slice, Step } from '@/app/data/catalog';
import { getCurriculum } from '@/app/data/catalog';

const gc2CurriculumEnriched = getCurriculum('gc2');

// Define a type for the step that includes our client-side state
type EditableStep = NonNullable<Slice['steps']>[0] & {
  id?: string;             // allow an id if you want to store one
  completed?: boolean;
  isEditing?: boolean;
};
type EditableSlice = Omit<Slice, 'steps'> & { steps?: EditableStep[] };
type EditableLesson = Omit<Lesson, 'slices'> & { slices: EditableSlice[] };

const principleColorMap: { [key: string]: string } = {
    Connection: 'bg-blue-500 text-white',
    Distance: 'bg-cyan-500 text-white',
    Pyramid: 'bg-teal-500 text-white',
    Creation: 'bg-green-500 text-white',
    Acceptance: 'bg-lime-500 text-white',
    Velocity: 'bg-yellow-500 text-black',
    Clock: 'bg-amber-500 text-black',
    River: 'bg-orange-500 text-white',
    Frame: 'bg-deep-orange-500 text-white',
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
    Overload: 'bg-deep-orange-300 text-black',
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
    const [lessons] = useState<Lesson[]>(gc2CurriculumEnriched.lessons);
    const [expandedRows, setExpandedRows] = useState<any>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [sortField, setSortField] = useState('lesson');
    const [sortOrder, setSortOrder] = useState<1 | 0 | -1 | null>(1);
    const [isCardVisible, setIsCardVisible] = useState(false);
    const [editableLesson, setEditableLesson] = useState<EditableLesson | null>(null);
    const menuRefs = useRef<{ [key: string]: Menu | null }>({});

    const sortOptions = [{ icon: 'pi pi-sort-numeric-down', value: 'lesson' }, { icon: 'pi pi-sort-alpha-down', value: 'position' }];

    const openLessonCard = (lesson: Lesson) => {
        // Create a deep copy for editing to not mutate the original data
        const lessonCopy = JSON.parse(JSON.stringify(lesson));
        setEditableLesson(lessonCopy);
        setIsCardVisible(true);
    };

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
            isEditing: true // Flag to render textarea
        };
        const updatedSlices = [...editableLesson.slices];
        const updatedSteps = [...(updatedSlices[sliceIndex].steps || []), newStep];
        updatedSlices[sliceIndex].steps = updatedSteps;
        setEditableLesson({ ...editableLesson, slices: updatedSlices });
    };

    const onSortFieldChange = (e: SelectButtonChangeEvent) => { if (e.value) { setSortField(e.value); setSortOrder(1); } };

    const header = (
        <div className="flex justify-content-between align-items-center flex-wrap gap-2">
            <h5 className="m-0">Gracie Combatives 2.0</h5>
            <div className="flex align-items-center gap-2">
                <SelectButton value={sortField} options={sortOptions} onChange={onSortFieldChange} optionLabel="value" itemTemplate={(option) => <i className={option.icon}></i>} />
                <span className="p-input-icon-left"><i className="pi pi-search" /><InputText type="search" onInput={(e) => setGlobalFilter(e.currentTarget.value)} placeholder="Search..." /></span>
            </div>
        </div>
    );

    const lessonTitleBodyTemplate = (rowData: Lesson) => <a href="#" onClick={(e) => { e.preventDefault(); openLessonCard(rowData); }} className="text-primary hover:underline font-semibold">{rowData.technique}</a>;

    const principlesBodyTemplate = (rowData: Lesson) => {
        // Build a stable unique array without depending on Set iteration (avoids downlevelIteration issues)
        const all = rowData.slices.flatMap(slice => slice.corePrinciples || []);
        const uniquePrinciples: string[] = [];
        all.forEach(p => { if (!uniquePrinciples.includes(p)) uniquePrinciples.push(p); });
        return <div className="flex flex-wrap gap-1">{uniquePrinciples.map(p => <Chip key={p} label={p} className={getPrincipleColor(p)} />)}</div>;
    };

    const actionsBodyTemplate = (rowData: Lesson) => <Button icon="pi pi-plus" rounded text onClick={() => console.log("Add lesson:", rowData)} />;

    const rowExpansionTemplate = (data: Lesson) => (
        <div className="p-3"><h5>Slices for Lesson {data.lesson}</h5><DataTable value={data.slices}><Column field="slice" header="#" /><Column field="title" header="Title" /><Column field="indicator" header="Indicator" /></DataTable></div>
    );

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
                <Checkbox checked={step.completed || false} onChange={(e: CheckboxChangeEvent) => updateStep(sliceIndex, stepIndex, 'completed', e.checked)} className="absolute" style={{ top: '1rem', right: '1rem' }} />
                <div className="font-bold mb-2">Step {step.stepNumber}: <span className={`text-sm font-normal ${step.importance === 'critical' ? 'text-red-500' : 'text-color-secondary'}`}>({step.importance})</span></div>
                <p className="m-0">{step.description}</p>
                <div className="absolute" style={{ bottom: '0.5rem', right: '0.5rem' }}>
                     <Menu model={menuItems} popup ref={el => menuRefs.current[menuKey] = el} id={menuKey} />
                     <Button icon="pi pi-ellipsis-v" rounded text onClick={(event) => menuRefs.current[menuKey]?.toggle(event)} aria-controls={menuKey} aria-haspopup />
                </div>
            </div>
        );
    };

    return (
        <div className="card" style={{ height: 'calc(100vh - 10rem)', display: 'flex', flexDirection: 'column' }}>
            <DataTable value={lessons} header={header} globalFilter={globalFilter} scrollable scrollHeight="flex" dataKey="lesson" sortField={sortField} sortOrder={sortOrder} onSort={(e: DataTableSortEvent) => { setSortField(e.sortField); setSortOrder(e.sortOrder ?? null); }} expandedRows={expandedRows ?? null} onRowToggle={(e) => setExpandedRows(e.data ?? null)} rowExpansionTemplate={rowExpansionTemplate}>
                <Column expander style={{ width: '3em' }} />
                <Column field="lesson" header="Class #" sortable />
                <Column header="Lesson Title" body={lessonTitleBodyTemplate} sortable sortField="technique" />
                <Column field="position" header="Position" sortable />
                <Column header="Core Principles" body={principlesBodyTemplate} style={{ minWidth: '20rem' }} />
                <Column header="Actions" body={actionsBodyTemplate} style={{ width: '5rem', textAlign: 'center' }} />
            </DataTable>

            {editableLesson && (
                <Dialog header={`Lesson ${editableLesson.lesson}: ${editableLesson.technique}`} visible={isCardVisible} style={{ width: '50vw' }} onHide={() => setIsCardVisible(false)}>
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

function CurriculumPage2() {
    const [lessons] = useState<Lesson[]>(gc2CurriculumEnriched.lessons);
  const [expandedRows, setExpandedRows] = useState<any>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sortField, setSortField] = useState('lesson');
  const [sortOrder, setSortOrder] = useState<1 | 0 | -1 | null>(1);
  const [isCardVisible, setIsCardVisible] = useState(false);
  const [editableLesson, setEditableLesson] = useState<EditableLesson | null>(null);
  const menuRefs = useRef<{ [key: string]: Menu | null }>({});

  const principleColorMap: Record<string, string> = {
    Connection: 'bg-blue-500 text-white',
    Distance: 'bg-cyan-500 text-white',
    Pyramid: 'bg-teal-500 text-white',
    Creation: 'bg-green-500 text-white',
    Momentum: 'bg-yellow-500 text-black',
    Anchor: 'bg-purple-500 text-white',
  };

  const getPrincipleColor = (principle: string) => {
    const name = principle.split(' (')[0];
    return principleColorMap[name] || 'bg-gray-300 text-black';
  };

  const principlesBody = (row: Lesson) => {
    const allPrinciples = row.slices.flatMap(s => s.corePrinciples || []);
    const unique = [... Array.from(new Set(allPrinciples))];
    return (
      <div className="flex flex-wrap gap-1">
        {unique.map(p => (
          <Chip key={p} label={p} className={getPrincipleColor(p)} />
        ))}
      </div>
    );
  };

  return (
    <div className="p-4">
      <Card title="Gracie Combatives 2.0 Curriculum" className="shadow-md border border-gray-200">
        <DataTable value={lessons} paginator rows={10} stripedRows responsiveLayout="scroll">
          <Column field="lesson" header="#" sortable style={{ width: '70px' }} />
          <Column field="technique" header="Technique" sortable />
          <Column field="position" header="Position" sortable />
          <Column header="Principles" body={principlesBody} />
        </DataTable>
      </Card>
    </div>
  );
}
