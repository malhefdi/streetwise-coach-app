'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { getCurriculum, getAllCurricula } from '@/app/data/curriculum';
import type { Lesson } from '@/app/data/curriculum';
import CompactStatsBar from './components/CompactStatsBar';
import MinimalFilterBar from './components/MinimalFilterBar';
import OptimizedLessonCard from './components/OptimizedLessonCard';
import LessonCard from './components/LessonCard'; // Keep for fullscreen dialog

const CurriculumPage = () => {
  // ----- curriculum selection -----
  const allCurricula = getAllCurricula();
  const [selectedCurriculumId, setSelectedCurriculumId] = useState('gc2');
  const curriculum = getCurriculum(selectedCurriculumId);
  const [lessons, setLessons] = useState<Lesson[]>(curriculum?.lessons || []);

  // ----- filters -----
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  // Update lessons when curriculum changes
  useEffect(() => {
    setLessons(curriculum?.lessons || []);
  }, [curriculum]);

  // ----- insights data -----
  const insightsData = useMemo(() => {
    if (!lessons.length) return { 
      totalLessons: 0, 
      totalSlices: 0, 
      avgSteps: 0, 
      positionsCovered: 0 
    };

    const totalSlices = lessons.reduce((acc, lesson) => acc + (lesson.slices?.length || 0), 0);
    const totalSteps = lessons.reduce((acc, lesson) => 
      acc + (lesson.slices?.reduce((sliceAcc, slice) => sliceAcc + (slice.steps?.length || 1), 0) || 0), 0
    );
    
    // Count unique positions
    const uniquePositions = new Set(lessons.map(lesson => lesson.position || 'Unknown'));
    
    return {
      totalLessons: lessons.length,
      totalSlices,
      avgSteps: lessons.length > 0 ? Math.round(totalSteps / lessons.length) : 0,
      positionsCovered: uniquePositions.size
    };
  }, [lessons]);

  // ----- filtered lessons -----
  const filteredLessons = useMemo(() => {
    let filtered = lessons;

    // Position filter
    if (selectedPositions.length > 0) {
      filtered = filtered.filter(lesson => 
        selectedPositions.includes(lesson.position || 'Unknown')
      );
    }

    return filtered;
  }, [lessons, selectedPositions]);

  // ----- unique positions for filter -----
  const uniquePositions = useMemo(() => {
    const positions = new Set(lessons.map(lesson => lesson.position || 'Unknown'));
    return Array.from(positions).map(position => ({ label: position, value: position }));
  }, [lessons]);

  // ----- curriculum options -----
  const curriculumOptions = allCurricula.map(curriculum => ({
    label: curriculum.name,
    value: curriculum.id
  }));

  // ----- handlers -----
  const handleViewFullscreen = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setShowFullscreen(true);
  };

  const handlePositionToggle = (position: string) => {
    setSelectedPositions(prev => 
      prev.includes(position) 
        ? prev.filter(p => p !== position)
        : [...prev, position]
    );
  };

  const clearFilters = () => {
    setSelectedPositions([]);
  };

  const hasActiveFilters = selectedPositions.length > 0;

  return (
    <div className="page-wrapper p-4">
      {/* Page Header */}
      <div className="sw-page-header">
        <h1 className="title-text">Curriculum</h1>
        <p className="sw-page-subtitle">
          Browse and explore lesson content across all programs.
        </p>
      </div>

      {/* Compact Stats Bar */}
      <CompactStatsBar
        totalLessons={insightsData.totalLessons}
        totalSlices={insightsData.totalSlices}
        avgSteps={insightsData.avgSteps}
        positionsCovered={insightsData.positionsCovered}
      />

      {/* Minimal Filter Bar */}
      <MinimalFilterBar
        selectedCurriculumId={selectedCurriculumId}
        curriculumOptions={curriculumOptions}
        selectedPositions={selectedPositions}
        uniquePositions={uniquePositions}
        globalFilter=""
        onCurriculumChange={setSelectedCurriculumId}
        onPositionToggle={handlePositionToggle}
        onSearchChange={() => {}}
      />

      {/* Empty State for No Lessons */}
      {filteredLessons.length === 0 && lessons.length > 0 && (
        <div className="sw-empty-state">
          <div className="sw-empty-state__icon">
            <i className="pi pi-filter"></i>
          </div>
          <div className="sw-empty-state__title">No lessons match your filters</div>
          <div className="sw-empty-state__description">
            Try adjusting your position filters or clearing them to see all lessons.
          </div>
          <div className="sw-empty-state__action">
            <Button
              label="Clear Filters"
              icon="pi pi-times"
              className="sw-button sw-button--primary"
              onClick={clearFilters}
            />
          </div>
        </div>
      )}

      {/* No Curriculum Data */}
      {lessons.length === 0 && (
        <div className="sw-empty-state">
          <div className="sw-empty-state__icon">
            <i className="pi pi-book"></i>
          </div>
          <div className="sw-empty-state__title">No curriculum data available</div>
          <div className="sw-empty-state__description">
            There are no lessons in the selected curriculum program.
          </div>
        </div>
      )}

      {/* Optimized Lesson Cards Grid */}
      {filteredLessons.length > 0 && (
        <div className="sw-grid sw-grid--auto-fit">
          {filteredLessons.map((lesson) => (
            <OptimizedLessonCard
              key={lesson.id}
              lesson={lesson}
              onViewFullscreen={handleViewFullscreen}
            />
          ))}
        </div>
      )}

      {/* Fullscreen Lesson Dialog */}
      <Dialog
        visible={showFullscreen}
        onHide={() => setShowFullscreen(false)}
        header={selectedLesson ? `Lesson ${selectedLesson.lessonNumber}: ${selectedLesson.technique}` : ''}
        style={{ width: '90vw', maxWidth: '1200px' }}
        maximizable
        modal
        className="lesson-detail-modal"
      >
        {selectedLesson && (
          <div className="p-4">
            {/* Lesson Header */}
            <div className="mb-4">
              <div className="flex align-items-center gap-2 mb-3">
                <span className="sw-position-text">{selectedLesson.position}</span>
                <span className="sw-slice-count">{selectedLesson.slices?.length || 0} slices</span>
              </div>
              
              {selectedLesson.overview && (
                <div className="mb-4">
                  <h5 className="text-primary mb-2">Overview</h5>
                  <p className="line-height-3 m-0">{selectedLesson.overview}</p>
                </div>
              )}
              
              {selectedLesson.mindsetMinute && (
                <div className="mb-4">
                  <div className="flex align-items-center gap-2 mb-2">
                    <i className="pi pi-lightbulb text-orange-500"></i>
                    <span className="font-semibold text-orange-500">Mindset Minute</span>
                  </div>
                  <p className="m-0 line-height-3 pl-6">{selectedLesson.mindsetMinute}</p>
                </div>
              )}
              
              {selectedLesson.streetTip && (
                <div className="mb-4">
                  <div className="flex align-items-center gap-2 mb-2">
                    <i className="pi pi-shield text-cyan-500"></i>
                    <span className="font-semibold text-cyan-500">Street Tip</span>
                  </div>
                  <p className="m-0 line-height-3 pl-6">{selectedLesson.streetTip}</p>
                </div>
              )}
            </div>

            {/* Slices */}
            <div className="grid">
              {selectedLesson.slices?.map((slice, index) => (
                <div key={slice.id || index} className="col-12 lg:col-6">
                  <div className="sw-slice-content">
                    <div className="flex justify-content-between align-items-start mb-3 pb-3 border-bottom-1 surface-border">
                      <div className="flex-1">
                        <div className="flex align-items-center gap-2 mb-2">
                          <span className="sw-slice-number">Slice {slice.sliceNumber}</span>
                          {slice.isBonusSlice && (
                            <span className="sw-bonus-text">
                              <i className="pi pi-star"></i> BONUS
                            </span>
                          )}
                        </div>
                        <h6 className="m-0 font-bold text-lg">{slice.title}</h6>
                      </div>
                    </div>

                    {/* Essential Detail */}
                    {slice.essentialDetail && (
                      <div className="mb-3">
                        <div className="flex align-items-center gap-2 mb-2">
                          <i className="pi pi-check-circle text-green-500"></i>
                          <span className="font-semibold text-green-600">Essential Detail</span>
                        </div>
                        <p className="m-0 text-sm pl-6 line-height-3">{slice.essentialDetail}</p>
                      </div>
                    )}

                    {/* Most Common Mistake */}
                    {slice.mostCommonMistake && (
                      <div className="mb-3">
                        <div className="flex align-items-center gap-2 mb-2">
                          <i className="pi pi-exclamation-triangle text-red-500"></i>
                          <span className="font-semibold text-red-600 text-sm">Most Common Mistake</span>
                        </div>
                        <p className="m-0 text-sm pl-6 line-height-3">{slice.mostCommonMistake}</p>
                      </div>
                    )}

                    {/* Safety Tip */}
                    {slice.safetyTip && (
                      <div className="mb-3">
                        <div className="flex align-items-center gap-2 mb-2">
                          <i className="pi pi-shield text-orange-500"></i>
                          <span className="font-semibold text-orange-600 text-sm">Safety Tip</span>
                        </div>
                        <p className="m-0 text-sm pl-6 line-height-3">{slice.safetyTip}</p>
                      </div>
                    )}

                    {/* Principles */}
                    {slice.corePrinciples && slice.corePrinciples.length > 0 && (
                      <div className="mt-3 pt-3 border-top-1 surface-border">
                        <div className="flex align-items-center gap-2 mb-2">
                          <i className="pi pi-compass text-indigo-500"></i>
                          <span className="font-semibold text-sm">Core Principles</span>
                        </div>
                        <div className="flex flex-wrap gap-1 pl-6">
                          {slice.corePrinciples.map((p, i) => (
                            <span 
                              key={`${slice.id}-${i}`} 
                              className="sw-principle-text"
                            >
                              {p.split(' (')[0]}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Dialog>

      <style jsx global>{`
        .lesson-detail-modal .p-dialog-content {
          padding: 0;
        }
        
        .lesson-detail-modal .p-dialog-header {
          background: var(--surface-card);
          border-bottom: 1px solid var(--surface-border);
        }
        
        /* Mobile grid optimizations */
        @media (max-width: 768px) {
          .sw-grid {
            grid-template-columns: 1fr !important;
            gap: var(--sw-space-sm) !important;
          }
          
          .sw-grid--auto-fit {
            grid-template-columns: 1fr !important;
          }
          
          .sw-grid--auto-fill {
            grid-template-columns: 1fr !important;
          }
        }
        
        /* Mobile page header optimizations */
        @media (max-width: 768px) {
          .sw-page-header {
            margin-bottom: var(--sw-space-md);
            
            h1 {
              font-size: 1.75rem; /* Smaller than desktop */
              margin-bottom: 0.5rem;
            }
            
            .sw-page-subtitle {
              font-size: 0.875rem;
              margin-bottom: 1rem;
            }
          }
        }
        
        /* Very small screens */
        @media (max-width: 480px) {
          .sw-page-header {
            h1 {
              font-size: 1.5rem;
            }
            
            .sw-page-subtitle {
              font-size: 0.8rem;
            }
          }
        }
      `}</style>
    </div>
  );
};

export default CurriculumPage;