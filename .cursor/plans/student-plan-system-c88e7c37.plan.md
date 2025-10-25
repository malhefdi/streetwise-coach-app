<!-- c88e7c37-1d6c-447d-af36-4ea6b7248a53 5db64adf-e5d5-48ca-b1b2-23cfd4d78776 -->
# Student Personalized Lesson Plan System

## Architecture Overview

Create a modular plan management system with:

- Data service abstraction layer (localStorage now, Supabase-ready)
- Student plan creation and management from student profile
- Plan-aware coaching sessions (replaces current coach page)
- Detailed progress tracking at step-level with confidence scores
- Read-only curriculum source as lesson selection pool

## Implementation Steps

### 1. Create Data Service Abstraction Layer

**File: `app/services/dataService.ts`**

Create a service interface that abstracts all data operations:

```typescript
// Service interface for all data operations
interface IDataService {
  // Students
  getStudents(): Promise<Student[]>;
  getStudent(id: string): Promise<Student | null>;
  createStudent(student: Omit<Student, 'id'>): Promise<Student>;
  updateStudent(id: string, updates: Partial<Student>): Promise<Student>;
  deleteStudent(id: string): Promise<void>;
  
  // Plans
  getStudentPlan(studentId: string): Promise<StudentPlan | null>;
  savePlan(studentId: string, plan: StudentPlan): Promise<void>;
  
  // Sessions
  getStudentSessions(studentId: string): Promise<CoachingSession[]>;
  saveSession(studentId: string, session: CoachingSession): Promise<void>;
  
  // Progress
  getStudentProgress(studentId: string): Promise<StudentProgress>;
  updateProgress(studentId: string, lessonId: string, progress: LessonProgress): Promise<void>;
}

// LocalStorage implementation
class LocalStorageDataService implements IDataService {
  // Implement all methods using localStorage
}

// Export singleton instance
export const dataService: IDataService = new LocalStorageDataService();
```

Key design: All data operations go through this service. Changing to Supabase later means implementing `SupabaseDataService` class without touching UI code.

### 2. Define Plan Data Types

**File: `app/types/plan.types.ts`**

```typescript
export interface StudentPlan {
  id: string;
  studentId: string;
  name: string; // e.g., "Ali's Beginner Path"
  description?: string;
  lessonIds: string[]; // Array of lesson IDs from curriculum (e.g., ["gc2-l1", "gc2-l3", "gc2-l5"])
  createdAt: string;
  updatedAt: string;
}

export interface LessonProgress {
  lessonId: string;
  slices: SliceProgress[];
  startedAt?: string;
  completedAt?: string;
  notes?: string;
}

export interface SliceProgress {
  sliceId: string;
  steps: StepProgress[];
}

export interface StepProgress {
  stepNumber: number;
  completed: boolean;
  confidence: number; // 0-100
  notes: string;
  importance: 'standard' | 'important' | 'critical';
  nextAction?: 'Teach' | 'Review' | 'Reteach';
}

export interface StudentProgress {
  studentId: string;
  lessons: Record<string, LessonProgress>; // lessonId -> progress
}

export interface CoachingSession {
  id: string;
  studentId: string;
  lessonId: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  progress: LessonProgress;
}
```

### 3. Update Student Type

**File: `app/types/student.types.ts`**

```typescript
export interface Student {
  id: string;
  name: string;
  rank: string;
  sessions: number;
  notes?: string;
  avatar?: string;
  planId?: string; // Reference to their current plan
  createdAt: string;
  updatedAt: string;
}
```

### 4. Refactor Students List Page

**File: `app/(main)/students/page.tsx`**

Update to use dataService:

```typescript
// Replace localStorage calls with:
const students = await dataService.getStudents();

// Update card to show plan status
{student.planId ? (
  <Tag value="Plan Assigned" severity="success" icon="pi pi-check" />
) : (
  <Tag value="No Plan" severity="warning" icon="pi pi-exclamation-triangle" />
)}
```

Add "Create Student" modal using PrimeReact Dialog with form (name, rank, avatar upload).

### 5. Create Plan Builder Component

**File: `app/(main)/students/[id]/components/PlanBuilder.tsx`**

Interactive lesson selector using PrimeReact PickList:

```typescript
const PlanBuilder = ({ studentId, existingPlan }: Props) => {
  const curriculum = getCurriculum('gc2');
  const [source, setSource] = useState<Lesson[]>(curriculum.lessons); // Available lessons
  const [target, setTarget] = useState<Lesson[]>([]); // Selected lessons
  
  // Use PrimeReact PickList for drag-and-drop lesson selection
  // Left side: All 36 GC2 lessons (read-only curriculum)
  // Right side: Student's selected lessons (in order)
  
  const onSave = async () => {
    const plan: StudentPlan = {
      id: existingPlan?.id || generateId(),
      studentId,
      name: planName,
      lessonIds: target.map(l => l.id),
      createdAt: existingPlan?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await dataService.savePlan(studentId, plan);
  };
  
  return (
    <Card>
      <h3>Build Lesson Plan</h3>
      <InputText 
        placeholder="Plan name (e.g., Beginner Fundamentals)"
        value={planName}
        onChange={...}
      />
      <PickList
        source={source}
        target={target}
        onChange={(e) => { setSource(e.source); setTarget(e.target); }}
        itemTemplate={(lesson) => (
          <div>
            <div className="font-bold">L{lesson.lessonNumber}: {lesson.technique}</div>
            <div className="text-sm text-500">{lesson.position}</div>
          </div>
        )}
        sourceHeader="Available Lessons"
        targetHeader="Student's Plan"
      />
      <Button label="Save Plan" icon="pi pi-save" onClick={onSave} />
    </Card>
  );
};
```

### 6. Update Student Profile Page

**File: `app/(main)/students/[id]/page.tsx`**

Add new tab for "Lesson Plan":

```typescript
<TabPanel header="Lesson Plan" leftIcon="pi pi-list mr-2">
  {student.planId ? (
    <>
      <PlanOverview plan={plan} progress={progress} />
      <Button 
        label="Edit Plan" 
        icon="pi pi-pencil"
        onClick={() => setShowPlanBuilder(true)}
      />
      <Button
        label="Start Coaching Session"
        icon="pi pi-play"
        severity="success"
        onClick={() => router.push(`/coach?student=${student.id}`)}
      />
    </>
  ) : (
    <PlanBuilder studentId={student.id} />
  )}
</TabPanel>
```

Add PlanOverview component showing:

- List of lessons in plan
- Progress bar for each lesson
- Overall plan completion percentage
- Quick stats (lessons completed, in progress, not started)

### 7. Transform Coach Page to Plan-Aware

**File: `app/(main)/coach/page.tsx`**

Major refactor to work with student plans:

```typescript
const CoachPage = () => {
  const searchParams = useSearchParams();
  const studentId = searchParams.get('student');
  
  const [student, setStudent] = useState<Student | null>(null);
  const [plan, setPlan] = useState<StudentPlan | null>(null);
  const [planLessons, setPlanLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  
  useEffect(() => {
    if (studentId) {
      loadStudentData(studentId);
    } else {
      // Fallback: show student selector
      setShowStudentSelector(true);
    }
  }, [studentId]);
  
  const loadStudentData = async (id: string) => {
    const s = await dataService.getStudent(id);
    setStudent(s);
    
    if (s.planId) {
      const p = await dataService.getStudentPlan(id);
      setPlan(p);
      
      // Filter curriculum to only show lessons in plan
      const curriculum = getCurriculum('gc2');
      const filtered = curriculum.lessons.filter(l => 
        p.lessonIds.includes(l.id)
      );
      // Maintain plan order
      const ordered = p.lessonIds
        .map(id => filtered.find(l => l.id === id))
        .filter(Boolean);
      setPlanLessons(ordered);
      
      const prog = await dataService.getStudentProgress(id);
      setProgress(prog);
    }
  };
  
  // Rest of coaching session logic stays same, but:
  // 1. Uses planLessons instead of all curriculum lessons
  // 2. Saves progress via dataService.updateProgress()
  // 3. Shows student name in header
  // 4. Auto-saves session periodically
};
```

If no student selected, show Dialog with student picker:

```typescript
<Dialog visible={showStudentSelector} onHide={() => router.push('/students')}>
  <h3>Select Student</h3>
  <DataTable 
    value={students}
    selectionMode="single"
    onRowClick={(e) => {
      router.push(`/coach?student=${e.data.id}`);
    }}
  />
</Dialog>
```

### 8. Create Plan Progress Component

**File: `app/(main)/students/[id]/components/PlanProgress.tsx`**

Visual progress dashboard for a student's plan:

```typescript
const PlanProgress = ({ plan, progress }: Props) => {
  const curriculum = getCurriculum('gc2');
  
  const lessonStats = plan.lessonIds.map(lessonId => {
    const lesson = curriculum.lessons.find(l => l.id === lessonId);
    const lessonProgress = progress.lessons[lessonId];
    
    const totalSteps = lesson?.slices.reduce((sum, s) => 
      sum + (s.steps?.length || 0), 0
    ) || 0;
    
    const completedSteps = lessonProgress?.slices.reduce((sum, s) =>
      sum + s.steps.filter(st => st.completed).length, 0
    ) || 0;
    
    const avgConfidence = lessonProgress?.slices.flatMap(s => s.steps)
      .reduce((sum, st) => sum + st.confidence, 0) / totalSteps || 0;
    
    return {
      lesson,
      totalSteps,
      completedSteps,
      completion: (completedSteps / totalSteps) * 100,
      avgConfidence,
      status: completedSteps === 0 ? 'not-started' : 
              completedSteps === totalSteps ? 'completed' : 'in-progress'
    };
  });
  
  return (
    <div className="grid">
      {lessonStats.map(stat => (
        <div key={stat.lesson.id} className="col-12 md:col-6">
          <Card>
            <div className="flex justify-content-between mb-2">
              <h4>L{stat.lesson.lessonNumber}: {stat.lesson.technique}</h4>
              <Tag 
                value={stat.status}
                severity={stat.status === 'completed' ? 'success' : 
                         stat.status === 'in-progress' ? 'info' : 'secondary'}
              />
            </div>
            <ProgressBar value={stat.completion} />
            <div className="flex justify-content-between mt-2 text-sm">
              <span>Steps: {stat.completedSteps}/{stat.totalSteps}</span>
              <span>Confidence: {Math.round(stat.avgConfidence)}%</span>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
};
```

### 9. Update Dashboard Stats

**File: `app/(main)/dashboard/page.tsx`**

Add plan-related stats to dashboard:

- Total students with plans
- Average plan completion across all students
- Most common lessons in plans
- Recent coaching sessions with student names

### 10. Add Session History by Student

**File: `app/(main)/session-history/page.tsx`**

Update to show sessions grouped by student:

```typescript
const sessions = await dataService.getAllSessions();
const byStudent = groupBy(sessions, s => s.studentId);

// Display with student name, lesson, date, duration, completion
```

## Data Migration Strategy

All localStorage keys follow a pattern for easy migration:

```
sw_students -> students table
sw_plans -> plans table  
sw_progress_{studentId} -> progress table
sw_sessions_{studentId} -> sessions table
```

When migrating to Supabase:

1. Create new `SupabaseDataService` class
2. Implement same IDataService interface
3. Update single line: `export const dataService = new SupabaseDataService()`
4. No UI changes needed

## Future Extensibility

The architecture supports:

- Plan templates (save plan as template, apply to new students)
- Lesson mastery levels (novice, intermediate, advanced)
- Plan versioning (track plan changes over time)
- Shared plans across students
- Prerequisites/dependencies between lessons
- Custom lesson ordering with drag-and-drop
- Plan analytics (which lessons are most/least completed)

## Files to Create

1. `app/services/dataService.ts` - Data abstraction layer
2. `app/types/plan.types.ts` - Plan type definitions
3. `app/types/student.types.ts` - Student type definitions
4. `app/(main)/students/[id]/components/PlanBuilder.tsx` - Plan creation UI
5. `app/(main)/students/[id]/components/PlanProgress.tsx` - Progress visualization
6. `app/(main)/students/components/StudentForm.tsx` - Add/edit student modal

## Files to Modify

1. `app/(main)/students/page.tsx` - Add student creation, use dataService
2. `app/(main)/students/[id]/page.tsx` - Add plan tab, integrate plan builder
3. `app/(main)/coach/page.tsx` - Make plan-aware, filter lessons by plan
4. `app/(main)/dashboard/page.tsx` - Add plan stats
5. `app/(main)/session-history/page.tsx` - Group by student

## Testing Approach

1. Create a student without plan (verify warning tag)
2. Build a plan with 5 lessons from curriculum
3. Start coaching session from student profile
4. Verify only 5 lessons appear in coach page
5. Track progress through lessons with confidence scores
6. Return to student profile, verify progress updates
7. Edit plan to add more lessons
8. Verify coaching session includes new lessons

All UI uses existing Sakai/PrimeReact patterns with Card, Dialog, PickList, DataTable, ProgressBar, Tag, and Chart components.

### To-dos

- [ ] Create data service abstraction layer with localStorage implementation
- [ ] Define StudentPlan, LessonProgress, and related types
- [ ] Build PlanBuilder component with PickList for lesson selection
- [ ] Add plan tab to student profile with plan overview and builder
- [ ] Transform coach page to be plan-aware and filter lessons by student plan
- [ ] Build PlanProgress component showing per-lesson completion and confidence
- [ ] Create student creation modal on students list page
- [ ] Add plan-related stats to dashboard
- [ ] Group session history by student
- [ ] Update students list to use dataService and show plan status