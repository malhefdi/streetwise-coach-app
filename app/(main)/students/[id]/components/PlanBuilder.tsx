'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { PickList, PickListChangeEvent } from 'primereact/picklist';
import { Dropdown } from 'primereact/dropdown';
import { getCurriculum, getAllCurricula, type Lesson, type Curriculum } from '@/app/data/curriculum';
import type { StudentPlan } from '@/app/types/plan.types';
import { dataService } from '@/app/services/dataService';

interface PlanBuilderProps {
  studentId: string;
  existingPlan?: StudentPlan | null;
  onSave?: () => void;
}

const PlanBuilder = ({ studentId, existingPlan, onSave }: PlanBuilderProps) => {
  const allCurricula = useMemo(() => getAllCurricula(), []);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState('gc2');
  const [planName, setPlanName] = useState(existingPlan?.name || '');
  const [planDescription, setPlanDescription] = useState(existingPlan?.description || '');
  const [source, setSource] = useState<Lesson[]>([]);
  const [target, setTarget] = useState<Lesson[]>([]);
  const [saving, setSaving] = useState(false);
  
  const currentCurriculum = useMemo(() => getCurriculum(selectedCurriculumId), [selectedCurriculumId]);

  useEffect(() => {
    if (!currentCurriculum) return;
    
    
    if (existingPlan) {
      // Load existing plan - collect lessons from all curricula
      const selectedIds = new Set(existingPlan.lessonIds);
      const selected: Lesson[] = [];
      const available: Lesson[] = [];
      
      // Maintain the order from the plan
      existingPlan.lessonIds.forEach(id => {
        // Find lesson in any curriculum
        for (const curriculum of allCurricula) {
          const lesson = curriculum.lessons.find(l => l.id === id);
          if (lesson) {
            selected.push(lesson);
            break;
          }
        }
      });
      
      // Add lessons from current curriculum to source
      currentCurriculum.lessons.forEach(lesson => {
        if (!selectedIds.has(lesson.id)) {
          available.push(lesson);
        }
      });
      
      setTarget(selected);
      setSource(available);
    } else {
      // New plan - all lessons from current curriculum available
      setSource([...currentCurriculum.lessons]);
      setTarget([]);
    }
  }, [existingPlan, currentCurriculum, selectedCurriculumId]);

  const onChange = (event: PickListChangeEvent) => {
    setSource(event.source);
    setTarget(event.target);
  };

  const handleSave = async () => {
    if (!planName.trim()) {
      alert('Please enter a plan name');
      return;
    }

    if (target.length === 0) {
      alert('Please select at least one lesson for the plan');
      return;
    }

    setSaving(true);
    try {
      const plan: StudentPlan = {
        id: existingPlan?.id || `plan-${Date.now()}`,
        studentId,
        name: planName.trim(),
        description: planDescription.trim(),
        lessonIds: target.map(l => l.id),
        createdAt: existingPlan?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await dataService.savePlan(studentId, plan);
      
      if (onSave) onSave();
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Failed to save plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const itemTemplate = (lesson: Lesson) => {
    return (
      <div className="p-2">
        <div className="font-bold mb-1">
          L{lesson.lessonNumber}: {lesson.technique}
        </div>
        <div className="text-sm text-500 mb-1">
          <i className="pi pi-tag mr-1"></i>
          {lesson.position}
        </div>
        {lesson.chapterTitle && (
          <div className="text-xs text-400">
            <i className="pi pi-book mr-1"></i>
            {lesson.chapterTitle}
            {lesson.chapter && ` • ${lesson.chapter}`}
          </div>
        )}
      </div>
    );
  };

  const curriculumOptions = useMemo(() => 
    allCurricula.map(curriculum => ({
      label: curriculum.name,
      value: curriculum.id
    })), [allCurricula]
  );

  return (
    <Card className="shadow-2 border-round-2xl">
      <h3 className="text-xl font-bold mb-3 flex align-items-center gap-2">
        <i className="pi pi-list text-primary"></i>
        {existingPlan ? 'Edit Lesson Plan' : 'Build Lesson Plan'}
      </h3>

      <div className="mb-4">
        <label htmlFor="plan-name" className="block font-semibold mb-2">
          Plan Name *
        </label>
        <InputText
          id="plan-name"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          placeholder="e.g., Beginner Fundamentals, Advanced Guard Work"
          className="w-full"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="plan-description" className="block font-semibold mb-2">
          Description (Optional)
        </label>
        <InputTextarea
          id="plan-description"
          value={planDescription}
          onChange={(e) => setPlanDescription(e.target.value)}
          placeholder="Describe the focus and goals of this plan..."
          rows={3}
          className="w-full"
        />
      </div>

      <div className="mb-3">
        <label className="block font-semibold mb-2">
          Select Curriculum
        </label>
        <Dropdown
          value={selectedCurriculumId}
          onChange={(e) => setSelectedCurriculumId(e.value)}
          options={curriculumOptions}
          placeholder="Choose a curriculum"
          className="w-full mb-3"
        />
      </div>

      <div className="mb-3">
        <label className="block font-semibold mb-2">
          Select Lessons ({target.length} selected)
        </label>
        <p className="text-sm text-color-secondary mb-3">
          Move lessons from left to right to add them to the plan. The order in the right column
          determines the sequence for coaching sessions. You can switch between curricula to add lessons from different programs.
        </p>
      </div>

      <PickList
        source={source}
        target={target}
        onChange={onChange}
        itemTemplate={itemTemplate}
        sourceHeader="Available Lessons"
        targetHeader="Student's Plan"
        sourceStyle={{ height: '400px' }}
        targetStyle={{ height: '400px' }}
        showSourceControls={true}
        showTargetControls={true}
        breakpoint="768px"
        dataKey="id"
        filterBy="technique,position"
      />

      <div className="flex justify-content-end gap-2 mt-4">
        <Button
          label="Cancel"
          icon="pi pi-times"
          className="p-button-text"
          onClick={() => {
            if (existingPlan) {
              // Reset to original plan
              const selectedIds = new Set(existingPlan.lessonIds);
              const selected: Lesson[] = [];
              const available: Lesson[] = [];
              
              existingPlan.lessonIds.forEach(id => {
                for (const curriculum of allCurricula) {
                  const lesson = curriculum.lessons.find(l => l.id === id);
                  if (lesson) {
                    selected.push(lesson);
                    break;
                  }
                }
              });
              
              currentCurriculum?.lessons.forEach(lesson => {
                if (!selectedIds.has(lesson.id)) {
                  available.push(lesson);
                }
              });
              
              setTarget(selected);
              setSource(available);
              setPlanName(existingPlan.name);
              setPlanDescription(existingPlan.description || '');
            }
          }}
          disabled={saving}
        />
        <Button
          label={saving ? 'Saving...' : 'Save Plan'}
          icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-save'}
          className="p-button-success"
          onClick={handleSave}
          disabled={saving}
        />
      </div>
    </Card>
  );
};

export default PlanBuilder;

