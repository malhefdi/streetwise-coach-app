// Test Drill Service - Helper functions for test drill management and bidirectional lookup
import type { Curriculum, Lesson, Slice } from '@/app/data/curriculum';
import type { TestDrill, TestDrillItem, TestDrillReadiness, TestDrillSummary, EnhancedTestDrill, SprintGroup, SprintProgress, TestDrillProgress } from '@/app/types/test-drill.types';
import type { StudentPlan, StudentProgress } from '@/app/types/plan.types';
import { getGC2TestDrills } from '@/app/data/gc2.test';
import { getGC2TestDrillsEnhanced } from '@/app/data/gc2.test.enhanced';

/**
 * Helper function to extract lesson ID from slice ID
 */
export const getLessonIdFromSliceId = (sliceId: string): string => {
  return sliceId.split('-').slice(0, 2).join('-');
};

// Registry of test drill data by curriculum ID
const TEST_DRILL_REGISTRY: Record<string, TestDrill[]> = {
  gc2: getGC2TestDrills(),
  // Future curricula can be added here
};

// Registry of enhanced test drill data by curriculum ID
const ENHANCED_TEST_DRILL_REGISTRY: Record<string, EnhancedTestDrill[]> = {
  gc2: getGC2TestDrillsEnhanced(),
  // Future curricula can be added here
};

/**
 * Get test drills for a specific curriculum
 */
export const getTestDrillsForCurriculum = (curriculumId: string): TestDrill[] => {
  return TEST_DRILL_REGISTRY[curriculumId] || [];
};

/**
 * Get enhanced test drills for a specific curriculum
 */
export const getEnhancedTestDrillsForCurriculum = (curriculumId: string): EnhancedTestDrill[] => {
  return ENHANCED_TEST_DRILL_REGISTRY[curriculumId] || [];
};

/**
 * Resolve test drill references to full lesson/slice data using ID-based lookup
 */
export const resolveTestDrillReferences = (drill: TestDrill, curriculum: Curriculum): Array<{
  item: TestDrillItem;
  lessons: Lesson[];
  slices: Slice[];
  isValid: boolean;
}> => {
  if (!drill.items) return [];

  return drill.items.map(item => {
    const slices: Slice[] = [];
    const lessons: Lesson[] = [];
    
    // Use ID-based lookup for direct access
    item.ids.forEach(sliceId => {
      const slice = findSliceById(curriculum, sliceId);
      if (slice) {
        slices.push(slice);
        const lesson = curriculum.lessons.find(l => l.id === getLessonIdFromSliceId(sliceId));
        if (lesson && !lessons.find(l => l.id === lesson.id)) {
          lessons.push(lesson);
        }
      }
    });
    
    return {
      item,
      lessons,
      slices,
      isValid: slices.length === item.ids.length
    };
  });
};

/**
 * Helper function to find a slice by ID across all lessons
 */
const findSliceById = (curriculum: Curriculum, sliceId: string): Slice | undefined => {
  for (const lesson of curriculum.lessons) {
    const slice = lesson.slices.find(s => s.id === sliceId);
    if (slice) return slice;
  }
  return undefined;
};

/**
 * Find which test drills use a specific lesson/slice using ID-based lookup
 */
export const findLessonSliceUsageInDrills = (
  lessonId: string, 
  sliceId: string, 
  curriculum: Curriculum
): Array<{ drill: TestDrill; item: TestDrillItem }> => {
  const testDrills = getTestDrillsForCurriculum(curriculum.id);
  const results: Array<{ drill: TestDrill; item: TestDrillItem }> = [];

  // Find the lesson and slice
  const lesson = curriculum.lessons.find(l => l.id === lessonId);
  const slice = lesson?.slices.find(s => s.id === sliceId);
  
  if (!lesson || !slice) return results;

  // Search through all test drills using ID-based lookup
  testDrills.forEach(drill => {
    if (!drill.items) return;
    
    drill.items.forEach(item => {
      if (item.ids.includes(sliceId)) {
        results.push({ drill, item });
      }
    });
  });

  return results;
};

/**
 * Validate that all test drill references exist in the curriculum using ID-based lookup
 */
export const validateTestDrillSequence = (drill: TestDrill, curriculum: Curriculum): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (!drill.items) {
    return { isValid: true, errors: [] };
  }

  drill.items.forEach((item, index) => {
    item.ids.forEach(sliceId => {
      const slice = findSliceById(curriculum, sliceId);
      if (!slice) {
        errors.push(`Item ${index + 1}: Slice ID "${sliceId}" not found in curriculum`);
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Calculate test drill readiness based on student plan and progress
 */
export const calculateTestDrillReadiness = (
  drill: TestDrill,
  curriculum: Curriculum,
  studentPlan: StudentPlan | null,
  studentProgress: StudentProgress | null
): TestDrillReadiness => {
  if (!drill.items || !studentPlan || !studentProgress) {
    return {
      drillNumber: drill.drillNumber,
      isReady: false,
      missingLessons: [],
      completionPercentage: 0
    };
  }

  const incompleteLessons = new Set<string>();
  let completedItems = 0;
  const totalItems = drill.items.length;

  drill.items.forEach(item => {
    let itemCompleted = true;
    
    item.ids.forEach(sliceId => {
      const slice = findSliceById(curriculum, sliceId);
      if (!slice) {
        itemCompleted = false;
        return;
      }
      
      const lesson = curriculum.lessons.find(l => l.id === getLessonIdFromSliceId(sliceId));
      if (!lesson) {
        itemCompleted = false;
        return;
      }

      // Check if lesson is in student's plan
      const isInPlan = studentPlan.lessonIds.includes(lesson.id);
      if (!isInPlan) {
        incompleteLessons.add(lesson.id);
        itemCompleted = false;
        return;
      }

      // Check if lesson is completed
      const lessonProgress = studentProgress.lessons[lesson.id];
      if (!lessonProgress) {
        incompleteLessons.add(lesson.id);
        itemCompleted = false;
        return;
      }

      // Check if the specific slice is completed
      const sliceIndex = lesson.slices.indexOf(slice);
      if (sliceIndex < 0 || sliceIndex >= lessonProgress.slices.length) {
        incompleteLessons.add(lesson.id);
        itemCompleted = false;
        return;
      }
      
      const sliceProgress = lessonProgress.slices[sliceIndex];
      if (!sliceProgress || !sliceProgress.steps.every(step => step.completed)) {
        incompleteLessons.add(lesson.id);
        itemCompleted = false;
      }
    });
    
    if (itemCompleted) {
      completedItems++;
    }
  });

  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const isReady = incompleteLessons.size === 0 && completionPercentage === 100;

  return {
    drillNumber: drill.drillNumber,
    isReady,
    missingLessons: Array.from(incompleteLessons),
    completionPercentage
  };
};

/**
 * Get test drill summary for a student
 */
export const getTestDrillSummary = (
  curriculum: Curriculum,
  studentPlan: StudentPlan | null,
  studentProgress: StudentProgress | null
): TestDrillSummary => {
  const testDrills = getTestDrillsForCurriculum(curriculum.id);
  const readinessChecks = testDrills.map(drill => 
    calculateTestDrillReadiness(drill, curriculum, studentPlan, studentProgress)
  );

  const readyDrills = readinessChecks.filter(r => r.isReady).length;
  const completedDrills = 0; // This would come from test attempt history

  return {
    totalDrills: testDrills.length,
    readyDrills,
    completedDrills,
    // averageScore and lastAttemptDate would come from test attempt history
  };
};

/**
 * Get all test drills with readiness status
 */
export const getTestDrillsWithReadiness = (
  curriculum: Curriculum,
  studentPlan: StudentPlan | null,
  studentProgress: StudentProgress | null
): Array<{ drill: TestDrill; readiness: TestDrillReadiness }> => {
  const testDrills = getTestDrillsForCurriculum(curriculum.id);
  
  return testDrills.map(drill => ({
    drill,
    readiness: calculateTestDrillReadiness(drill, curriculum, studentPlan, studentProgress)
  }));
};

// ========== SPRINT-BASED FUNCTIONS ==========

/**
 * Calculate sprint group readiness based on student plan and progress
 */
export const calculateSprintReadiness = (
  sprintGroup: SprintGroup,
  curriculum: Curriculum,
  studentPlan: StudentPlan | null,
  studentProgress: StudentProgress | null
): boolean => {
  if (!studentPlan || !studentProgress) return false;
  
  return sprintGroup.techniques.every(technique => {
    return technique.ids.every(sliceId => {
      const slice = findSliceById(curriculum, sliceId);
      if (!slice) return false;
      
      const lesson = curriculum.lessons.find(l => l.id === getLessonIdFromSliceId(sliceId));
      if (!lesson) return false;
      
      const isInPlan = studentPlan.lessonIds.includes(lesson.id);
      if (!isInPlan) return false;
      
      const lessonProgress = studentProgress.lessons[lesson.id];
      if (!lessonProgress) return false;
      
      const sliceIndex = lesson.slices.indexOf(slice);
      if (sliceIndex < 0 || sliceIndex >= lessonProgress.slices.length) {
        return false;
      }
      
      const sliceProgress = lessonProgress.slices[sliceIndex];
      return sliceProgress && sliceProgress.steps.every(step => step.completed);
    });
  });
};

/**
 * Calculate enhanced test drill readiness based on sprint groups
 */
export const calculateEnhancedTestDrillReadiness = (
  drill: EnhancedTestDrill,
  curriculum: Curriculum,
  studentPlan: StudentPlan | null,
  studentProgress: StudentProgress | null
): TestDrillReadiness => {
  if (!drill.sprintGroups || !studentPlan || !studentProgress) {
    return {
      drillNumber: drill.drillNumber,
      isReady: false,
      missingLessons: [],
      completionPercentage: 0
    };
  }

  const readySprints = drill.sprintGroups.filter(sprint => 
    calculateSprintReadiness(sprint, curriculum, studentPlan, studentProgress)
  );

  const completionPercentage = drill.sprintGroups.length > 0 
    ? Math.round((readySprints.length / drill.sprintGroups.length) * 100) 
    : 0;

  const isReady = readySprints.length === drill.sprintGroups.length;

  return {
    drillNumber: drill.drillNumber,
    isReady,
    missingLessons: [], // Could be enhanced to show specific missing lessons
    completionPercentage
  };
};

/**
 * Get sprint progress for a test drill
 */
export const getSprintProgress = (
  drill: EnhancedTestDrill,
  testProgress: TestDrillProgress
): SprintProgress[] => {
  return drill.sprintGroups.map(group => {
    const progress = testProgress.sprintProgress?.find((sp: SprintProgress) => sp.groupNumber === group.groupNumber);
    return {
      groupNumber: group.groupNumber,
      isCompleted: progress?.isCompleted || false,
      completedAt: progress?.completedAt,
      notes: progress?.notes,
      timeSpent: progress?.timeSpent,
      qualityRating: progress?.qualityRating
    };
  });
};

/**
 * Get all enhanced test drills with readiness status
 */
export const getEnhancedTestDrillsWithReadiness = (
  curriculum: Curriculum,
  studentPlan: StudentPlan | null,
  studentProgress: StudentProgress | null
): Array<{ drill: EnhancedTestDrill; readiness: TestDrillReadiness }> => {
  const testDrills = getEnhancedTestDrillsForCurriculum(curriculum.id);
  
  return testDrills.map(drill => ({
    drill,
    readiness: calculateEnhancedTestDrillReadiness(drill, curriculum, studentPlan, studentProgress)
  }));
};
