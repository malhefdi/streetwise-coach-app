# StreetWise Coach V2 🥋

> A modern BJJ coaching platform built with Next.js 15, Supabase, and Tailwind CSS

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Enabled-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)

## 📖 Overview

StreetWise Coach is a comprehensive coaching platform designed for Brazilian Jiu-Jitsu instructors. It helps manage students, create personalized lesson plans, conduct coaching sessions, track progress, and prepare students for belt testing.

### Key Features

- 📊 **Dashboard** - Real-time insights, KPIs, and coaching analytics
- 👥 **Student Management** - Complete student profiles with progress tracking
- 🎯 **Coach Mode** - Interactive coaching sessions with step-by-step tracking
- 📚 **Curriculum Browser** - Browse and filter BJJ lessons from multiple curricula
- 📋 **Lesson Plan Builder** - Create personalized learning paths for each student
- 🏆 **Test Prep System** - Belt testing readiness tracker and evaluator
- 📈 **Analytics** - Performance metrics, trends, and progress visualization
- 🔄 **Session History** - Complete coaching session timeline

## 🚀 Quick Start

### Prerequisites

- Node.js 18.17 or later
- npm or yarn
- Supabase account (free tier works)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd streetwise-coach-app

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run database migrations
# Copy supabase/schema.sql and run it in Supabase SQL Editor

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see your app!

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 15 (App Router)
- React 18
- TypeScript 5.9
- Tailwind CSS 3.4
- PrimeReact 10.5
- Framer Motion 11
- Chart.js 4.4

**Backend:**
- Supabase (PostgreSQL)
- Supabase Auth
- Row Level Security (RLS)
- Real-time subscriptions

**State Management:**
- Zustand (complex state)
- Jotai (atomic state)
- React Query (server state)

**Validation:**
- Zod schemas
- Type-safe forms

### Project Structure

```
├── app/              # Next.js App Router pages
├── components/       # React components
├── lib/              # Core library code
│   ├── supabase/     # Supabase clients
│   ├── services/     # Business logic
│   ├── hooks/        # Custom hooks
│   └── utils/        # Utilities
├── types/            # TypeScript types
├── data/             # Static curriculum data
└── supabase/         # Database schema
```

## 📚 Documentation

- [Migration Guide](./MIGRATION_V2.md) - Upgrading from V1
- [API Documentation](./docs/api.md) - Service layer API
- [Database Schema](./supabase/schema.sql) - Complete DB schema
- [Type Definitions](./types/) - TypeScript types

## 🎯 Core Concepts

### Students

Students are managed with complete profiles including:
- Personal info (name, rank, avatar)
- Lesson plan assignment
- Progress tracking
- Session history
- Test drill readiness

### Lesson Plans

Create personalized learning paths:
- Select lessons from curriculum catalog
- Reorder lessons for optimal learning
- Track completion and progress
- Visualize student advancement

### Coaching Sessions

Interactive coaching interface:
- Step-by-step lesson execution
- Confidence tracking (0-100%)
- Importance levels (standard, important, critical)
- Next actions (Teach, Review, Reteach)
- Live dashboard with insights
- Auto-save progress

### Test Drills

Belt testing system:
- 5 test drills for GC2 curriculum
- Automatic readiness calculation
- Drill evaluator with scoring
- Sprint-based organization
- Pass/fail determination (90+ = pass)
- Override system with reason tracking

## 🔐 Authentication & Security

- **Supabase Auth** - Secure authentication
- **Row Level Security** - Database-level access control
- **Middleware** - Protected routes
- **Environment Variables** - Secure configuration

### RLS Policies

- Coaches can only access their own students
- Coaches can only modify their own students' data
- Users can only see their own profile

## 📊 Database Schema

### Main Tables

- `profiles` - User profiles
- `students` - Student information
- `lesson_plans` - Personalized learning paths
- `student_progress` - Step-level progress tracking
- `lesson_metadata` - Lesson start/completion dates
- `coaching_sessions` - Session history
- `test_drill_progress` - Test drill scores
- `test_drill_attempts` - Historical test attempts
- `custom_lessons` - Per-student lesson edits
- `student_feedback` - Coaching feedback

### Views

- `student_summary` - Students with progress stats
- `lesson_progress_summary` - Lesson completion stats

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev           # Start dev server
npm run build         # Build for production
npm run start         # Start production server

# Code Quality
npm run lint          # Run ESLint
npm run format        # Format with Prettier
npm run type-check    # TypeScript checking

# Supabase
npm run supabase:generate-types  # Generate DB types
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🎨 UI Components

### Design System

- **Colors:** Brand blues, BJJ belt colors, semantic colors
- **Typography:** Inter (sans), Poppins (display), JetBrains Mono
- **Animations:** Framer Motion transitions
- **Shadows:** Soft, medium, strong levels
- **Spacing:** Consistent 4px grid

### Component Library

```tsx
// Example: Using a service
import { StudentsService } from '@/lib/services'

const students = await StudentsService.getStudents()

// Example: Using types
import type { Student, CreateStudent } from '@/types'

const newStudent: CreateStudent = {
  name: 'John Doe',
  rank: 'white',
  notes: 'Beginner',
}
```

## 📈 Performance

- **Server Components** - Default to SSR
- **Image Optimization** - Next.js Image component
- **Code Splitting** - Automatic route-based splitting
- **Caching** - Strategic use of cache headers
- **Database Indexes** - Optimized queries

## 🧪 Testing

```bash
# Run tests (when implemented)
npm run test           # Unit tests
npm run test:e2e       # E2E tests
npm run test:coverage  # Coverage report
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Environment Setup

1. Add environment variables in Vercel dashboard
2. Connect Supabase project
3. Deploy!

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is private and proprietary.

## 🆘 Support

For issues and questions:

1. Check the [Migration Guide](./MIGRATION_V2.md)
2. Review documentation
3. Open an issue on GitHub

## 🎯 Roadmap

### V2.1 (Planned)
- [ ] Video integration per lesson
- [ ] Coach-to-student messaging
- [ ] Mobile app (React Native)
- [ ] Export reports (PDF)
- [ ] Batch student import
- [ ] Attendance tracking

### V2.2 (Future)
- [ ] Multi-coach support
- [ ] Student portal
- [ ] Payment integration
- [ ] Advanced analytics
- [ ] AI-powered recommendations

## 🙏 Acknowledgments

- **Gracie University** - For the excellent GC2 curriculum
- **PrimeReact** - For the UI component library
- **Supabase** - For the backend infrastructure
- **Vercel** - For hosting and deployment

---

Built with ❤️ for BJJ coaches by the StreetWise team
