'use client';
import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { DataTable, DataTableSortEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { SelectButton, SelectButtonChangeEvent } from 'primereact/selectbutton';
import { Dropdown } from 'primereact/dropdown';
import { getCurriculum, getAllCurricula } from '@/app/data/curriculum';
import type { Lesson, Slice } from '@/app/data/curriculum';
import LessonDetailModal from './components/LessonDetailModal';

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
    setLessons(curriculum?.lessons || []);
  }, [curriculum]);

  // ----- table state -----
  const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [sortField, setSortField] = useState<'lesson' | 'position'>('lesson');
  const [sortOrder, setSortOrder] = useState<1 | 0 | -1 | null>(1);
  
  // Modal state for mobile
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showLessonModal, setShowLessonModal] = useState(false);

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

  // Handle row click - open modal on mobile, expand inline on desktop
  const handleRowClick = (lesson: Lesson) => {
    // On mobile, open modal; on desktop, use inline expansion
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      setSelectedLesson(lesson);
      setShowLessonModal(true);
    }
  };

  // ----- row expansion template -----
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

  // ----- render -----
  return (
    <div className="card" style={{ height: 'calc(100vh - 10rem)', display: 'flex', flexDirection: 'column' }}>
      <Card className="mb-3">{header}</Card>
      
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <DataTable
          value={lessons}
          dataKey="id"
          expandedRows={expandedRows}
          onRowToggle={(e) => {
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
          <Column 
            field="lessonNumber" 
            header="Class #" 
            sortable
            body={(rowData: Lesson) => (
              <div onClick={() => handleRowClick(rowData)} className="cursor-pointer">
                {rowData.lessonNumber}
              </div>
            )}
          />
          <Column 
            field="technique" 
            header="Lesson Title" 
            sortable
            body={(rowData: Lesson) => (
              <div onClick={() => handleRowClick(rowData)} className="cursor-pointer">
                {rowData.technique}
              </div>
            )}
          />
          <Column 
            field="position" 
            header="Position" 
            sortable
            body={(rowData: Lesson) => (
              <div onClick={() => handleRowClick(rowData)} className="cursor-pointer">
                {rowData.position}
              </div>
            )}
          />
        </DataTable>
      </div>
      
      {/* Lesson Detail Modal for Mobile */}
      <LessonDetailModal
        visible={showLessonModal}
        onHide={() => setShowLessonModal(false)}
        lesson={selectedLesson}
      />
      
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
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
          .p-datatable {
            font-size: 0.875rem;
          }
          
          .p-datatable .p-datatable-thead > tr > th,
          .p-datatable .p-datatable-tbody > tr > td {
            padding: 0.5rem;
          }
          
          .lesson-detail-modal .p-dialog-content {
            padding: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CurriculumPage;