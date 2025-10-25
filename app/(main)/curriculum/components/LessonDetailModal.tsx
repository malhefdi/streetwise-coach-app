'use client';

import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import type { Lesson } from '@/app/data/curriculum';

interface LessonDetailModalProps {
  visible: boolean;
  onHide: () => void;
  lesson: Lesson | null;
}

const LessonDetailModal: React.FC<LessonDetailModalProps> = ({ visible, onHide, lesson }) => {
  if (!lesson) return null;

  const getPrincipleSeverity = (principle: string): 'info' | 'success' | 'warning' | 'danger' => {
    const principleName = principle.split(' (')[0];
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
    return 'info';
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={`Lesson ${lesson.lessonNumber}: ${lesson.technique}`}
      style={{ width: '100vw', height: '100vh', maxHeight: '100vh' }}
      maximizable
      modal
      className="lesson-detail-modal"
    >
      <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
        {/* Lesson Header */}
        <Card className="mb-4">
          <div className="flex align-items-start gap-3 mb-3">
            <i className="pi pi-book text-4xl text-primary"></i>
            <div className="flex-1">
              <h4 className="m-0 mb-2 text-primary font-bold">
                Lesson {lesson.lessonNumber}: {lesson.technique}
              </h4>
              <Tag value={lesson.position} severity="info" className="mb-2" />
              
              {lesson.overview && (
                <div className="mb-3">
                  <div className="flex align-items-center gap-2 mb-2">
                    <i className="pi pi-info-circle text-primary"></i>
                    <span className="font-semibold text-primary">Overview</span>
                  </div>
                  <p className="m-0 text-color-secondary line-height-3 pl-4">{lesson.overview}</p>
                </div>
              )}
              
              {lesson.mindsetMinute && (
                <div className="mb-3 p-3 surface-100 border-round-lg border-left-3 border-primary">
                  <div className="flex align-items-center gap-2 mb-2">
                    <i className="pi pi-lightbulb text-orange-500 text-xl"></i>
                    <span className="font-semibold text-orange-500">Mindset Minute</span>
                  </div>
                  <p className="m-0 text-sm line-height-3">{lesson.mindsetMinute}</p>
                </div>
              )}
              
              {lesson.streetTip && (
                <div className="p-3 surface-100 border-round-lg border-left-3 border-cyan-500">
                  <div className="flex align-items-center gap-2 mb-2">
                    <i className="pi pi-shield text-cyan-500 text-xl"></i>
                    <span className="font-semibold text-cyan-500">Street Tip</span>
                  </div>
                  <p className="m-0 text-sm line-height-3">{lesson.streetTip}</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Slices */}
        <div className="mb-2">
          <h5 className="text-lg font-semibold mb-3 flex align-items-center gap-2">
            <i className="pi pi-th-large text-primary"></i>
            Technique Slices
          </h5>
        </div>
        
        <div className="grid">
          {lesson.slices.map((slice, index) => (
            <div key={slice.id || index} className="col-12">
              <Card className="mb-3 shadow-2">
                <div className="flex justify-content-between align-items-start mb-3 pb-3 border-bottom-1 surface-border">
                  <div className="flex-1">
                    <div className="flex align-items-center gap-2 mb-1">
                      <Tag value={`Slice ${slice.sliceNumber}`} severity="info" className="font-semibold" />
                      {slice.isBonusSlice && <Tag value="BONUS" severity="warning" icon="pi pi-star" />}
                    </div>
                    <h6 className="m-0 mt-2 font-bold text-lg">{slice.title}</h6>
                  </div>
                </div>

                {slice.description && (
                  <div className="mb-3">
                    <p className="m-0 text-sm text-color-secondary">{slice.description}</p>
                  </div>
                )}

                {slice.essentialDetail && (
                  <div className="mb-3">
                    <div className="flex align-items-center gap-2 mb-2">
                      <i className="pi pi-check-circle text-green-500"></i>
                      <span className="font-semibold text-green-600">Essential Detail</span>
                    </div>
                    <p className="m-0 text-sm pl-4 line-height-3">{slice.essentialDetail}</p>
                  </div>
                )}

                {slice.mostCommonMistake && (
                  <div className="mb-3 p-2 surface-50 border-round-md border-left-2 border-red-400">
                    <div className="flex align-items-center gap-2 mb-1">
                      <i className="pi pi-exclamation-triangle text-red-500"></i>
                      <span className="font-semibold text-red-600 text-sm">Most Common Mistake</span>
                    </div>
                    <p className="m-0 text-sm pl-4 line-height-3">{slice.mostCommonMistake}</p>
                  </div>
                )}

                {slice.safetyTip && (
                  <div className="mb-3 p-2 surface-50 border-round-md border-left-2 border-orange-400">
                    <div className="flex align-items-center gap-2 mb-1">
                      <i className="pi pi-shield text-orange-500"></i>
                      <span className="font-semibold text-orange-600 text-sm">Safety Tip</span>
                    </div>
                    <p className="m-0 text-sm pl-4 line-height-3">{slice.safetyTip}</p>
                  </div>
                )}

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
    </Dialog>
  );
};

export default LessonDetailModal;
