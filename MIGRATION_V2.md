# StreetWise Coach V2 Migration Guide

## 🚀 What's New in V2

### Architecture Improvements
- ✅ **Next.js 15** - Latest stable version with improved performance
- ✅ **Supabase Integration** - Full database backend replacing localStorage
- ✅ **Tailwind CSS** - Modern utility-first CSS framework
- ✅ **Type Safety** - Enhanced TypeScript with Zod validation
- ✅ **Better State Management** - Zustand/Jotai for complex state
- ✅ **Improved UI** - Modern design system with animations
- ✅ **Real-time Features** - Live updates and collaboration support

### New Features
- 🔐 **Authentication System** - Secure user authentication with Supabase Auth
- 📊 **Enhanced Analytics** - Better charts with Recharts
- 🎨 **Modern UI Components** - Improved design with Framer Motion animations
- ⚡ **Performance** - Optimized with server components and caching
- 🔄 **Real-time Sync** - Multi-device support with live updates

---

## 📋 Prerequisites

Before starting the migration, ensure you have:

1. **Node.js** 18.17 or later
2. **npm** or **yarn**
3. **Supabase Account** (free tier works)
4. **Git** for version control

---

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This will install all the new dependencies including:
- Next.js 15
- Supabase client libraries
- Tailwind CSS
- Zod for validation
- Zustand for state management
- And more...

### 2. Setup Supabase

#### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the database to be provisioned
4. Note your project URL and anon key

#### Run Database Migration

1. Copy the SQL schema:
   ```bash
   cat supabase/schema.sql
   ```

2. In Supabase Dashboard:
   - Go to **SQL Editor**
   - Paste the entire schema
   - Run the query

This will create:
- All necessary tables (students, lesson_plans, student_progress, etc.)
- Indexes for performance
- Row Level Security (RLS) policies
- Triggers for auto-updates
- Views for complex queries

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=StreetWise Coach
```

**⚠️ Important:** Never commit `.env.local` to version control!

### 4. Migrate Existing Data (Optional)

If you have existing data in localStorage, you can migrate it:

```bash
# TODO: Create migration script
npm run migrate:localStorage
```

This will:
1. Read all data from localStorage
2. Transform it to match the new schema
3. Upload to Supabase via the API

---

## 📁 New Project Structure

```
streetwise-coach-v2/
├── app/                          # Next.js 15 App Router
│   ├── (auth)/                   # Auth pages (login, signup)
│   ├── (dashboard)/              # Protected routes
│   │   ├── dashboard/            # Main dashboard
│   │   ├── students/             # Student management
│   │   ├── coach/                # Coaching sessions
│   │   ├── curriculum/           # Curriculum browser
│   │   ├── test-prep/            # Test drill system
│   │   └── analytics/            # Analytics
│   ├── api/                      # API routes
│   ├── globals.css               # Global styles + Tailwind
│   └── layout.tsx                # Root layout
│
├── components/                   # Reusable React components
│   ├── ui/                       # Base UI components
│   ├── dashboard/                # Dashboard components
│   ├── students/                 # Student components
│   ├── coach/                    # Coach mode components
│   └── shared/                   # Shared components
│
├── lib/                          # Core library code
│   ├── supabase/                 # Supabase clients
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── middleware.ts         # Auth middleware
│   ├── services/                 # Business logic services
│   │   ├── students.service.ts   # Student CRUD
│   │   ├── plans.service.ts      # Lesson plans
│   │   ├── progress.service.ts   # Progress tracking
│   │   ├── sessions.service.ts   # Coaching sessions
│   │   └── test-drills.service.ts # Test drills
│   ├── hooks/                    # Custom React hooks
│   ├── utils/                    # Utility functions
│   └── stores/                   # Zustand stores
│
├── types/                        # TypeScript type definitions
│   ├── supabase.types.ts         # Auto-generated DB types
│   ├── student.types.ts          # Student types + Zod
│   ├── plan.types.ts             # Plan types + Zod
│   ├── test-drill.types.ts       # Test drill types
│   └── curriculum.types.ts       # Curriculum types
│
├── data/                         # Static curriculum data
│   ├── gc2.curriculum.ts         # GC2 curriculum
│   ├── bbs1.curriculum.ts        # BBS1 curriculum
│   ├── gc2.test.ts               # GC2 test drills
│   └── principles.base.ts        # BJJ principles
│
├── supabase/                     # Supabase configuration
│   └── schema.sql                # Database schema
│
├── config/                       # App configuration
├── public/                       # Static assets
└── styles/                       # Additional styles
```

---

## 🔄 Migration Checklist

### Phase 1: Foundation ✅
- [x] Initialize Next.js 15 project
- [x] Setup Tailwind CSS
- [x] Configure Supabase
- [x] Create database schema
- [x] Migrate type definitions
- [x] Create service layer
- [x] Copy curriculum data

### Phase 2: Core Features (Next Steps)
- [ ] Migrate Dashboard
- [ ] Migrate Student Management
- [ ] Migrate Coach Mode
- [ ] Migrate Curriculum Browser
- [ ] Migrate Test Prep System
- [ ] Migrate Session History

### Phase 3: New Features
- [ ] Add authentication system
- [ ] Implement real-time updates
- [ ] Add improved analytics
- [ ] Create mobile-responsive UI
- [ ] Add export/import functionality

### Phase 4: Testing & Deployment
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Performance testing
- [ ] Deploy to Vercel
- [ ] Data migration from v1

---

## 🎯 Key Differences from V1

### Data Storage
- **V1:** localStorage (client-side only)
- **V2:** Supabase PostgreSQL (server-side, multi-device)

### Authentication
- **V1:** No authentication
- **V2:** Supabase Auth with email/password, magic links, OAuth

### State Management
- **V1:** React useState/useEffect only
- **V2:** Zustand stores for complex state, React Query for server state

### Styling
- **V1:** PrimeReact + SCSS
- **V2:** PrimeReact + Tailwind CSS + SCSS (hybrid approach)

### Type Safety
- **V1:** TypeScript interfaces
- **V2:** TypeScript + Zod validation schemas

### Services
- **V1:** localStorage service with sync methods
- **V2:** Supabase service with async/await, real-time subscriptions

---

## 🔧 Development Workflow

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm run start
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

### Format Code
```bash
npm run format
```

### Generate Supabase Types
```bash
npm run supabase:generate-types
```

---

## 📝 Using the New Services

### Example: Create a Student

```typescript
import { StudentsService } from '@/lib/services'

// Create a new student
const newStudent = await StudentsService.createStudent({
  name: 'John Doe',
  rank: 'white',
  notes: 'Beginner student',
  avatar: null,
})
```

### Example: Update Progress

```typescript
import { ProgressService } from '@/lib/services'

// Update step progress
await ProgressService.updateStepProgress(
  studentId,
  lessonId,
  sliceId,
  stepNumber,
  {
    completed: true,
    confidence: 85,
    notes: 'Great technique!',
    importance: 'critical',
    next_action: 'Review',
  }
)
```

### Example: Save Coaching Session

```typescript
import { SessionsService } from '@/lib/services'

// Create a session
const session = await SessionsService.createSession({
  student_id: studentId,
  lesson_id: lessonId,
  lesson_name: 'Mount Escape',
  started_at: new Date().toISOString(),
  steps_completed: 5,
  total_steps: 8,
  completion_percentage: 62,
  notes: 'Good progress today',
})

// End the session later
await SessionsService.endSession(session.id)
```

---

## 🔐 Row Level Security (RLS)

All data is protected by RLS policies:

- **Coaches can only see their own students**
- **Coaches can only modify their own students' data**
- **Users can only see their own profile**

This is automatically enforced at the database level!

---

## 🚨 Common Issues & Solutions

### Issue: Supabase Connection Error
**Solution:** Check your environment variables are correct and the Supabase project is running.

### Issue: Build Errors with Tailwind
**Solution:** Ensure PostCSS and Tailwind config files are in the root directory.

### Issue: Type Errors
**Solution:** Run `npm run supabase:generate-types` to regenerate Supabase types.

### Issue: RLS Policy Errors
**Solution:** Ensure you're authenticated. The middleware should handle auth automatically.

---

## 📚 Additional Resources

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Zod Documentation](https://zod.dev)
- [PrimeReact Documentation](https://primereact.org)

---

## 🤝 Contributing

When contributing to V2:

1. Create a new branch from `main`
2. Make your changes
3. Run tests and type checking
4. Submit a pull request

---

## 📞 Support

If you encounter issues during migration:

1. Check this guide first
2. Review the code comments
3. Check existing issues on GitHub
4. Create a new issue with details

---

## ✨ Next Steps

After completing the foundation setup:

1. **Test the build:** `npm run build`
2. **Start developing:** Begin migrating features one by one
3. **Follow the migration checklist** above
4. **Test thoroughly** before deploying

Good luck with your V2 migration! 🚀
