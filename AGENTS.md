# Streetwise Coach App - Agent Guide

## Build/Lint/Test Commands
- `npm run dev` - Start development server on localhost:3000
- `npm run build` - Production build (use this for typechecking)
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run check:data` - Validate data catalog
- Single test: `npx tsx <test-file>.test.ts` (e.g., `npx tsx app/data/gc2.test.ts`)

## Architecture
- **Framework**: Next.js 13 with App Router (React 18, TypeScript)
- **UI Library**: PrimeReact (Sakai theme) + PrimeFlex grid + PrimeIcons
- **Data Service**: localStorage abstraction layer (`app/services/dataService.ts`) designed for Supabase migration
- **Key Directories**: `app/(main)/*` (main routes), `app/data/*` (lesson catalog), `layout/*` (shared layout), `types/*` (TypeScript types)
- **Data Models**: Students, Plans, Progress (per-student), CoachingSessions - see `app/types/` for interfaces
- **Storage Keys**: `sw_students`, `sw_plans`, `sw_progress_{id}`, `sw_sessions_{id}`

## Code Style
- **Indentation**: 4 spaces, no tabs
- **Quotes**: Single quotes (`'`)
- **Semicolons**: Required
- **Line length**: 250 characters max
- **Imports**: Use `@/` path alias for root (e.g., `@/app/services/dataService`)
- **Types**: Strict TypeScript (`strict: true`), no `any` suppression unless necessary
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Components**: Functional components with hooks (useState, useEffect, useMemo)
- **Async**: Use async/await with try-catch error handling
- **ESLint**: Extends `next/core-web-vitals`, allows `<img>` elements (`@next/next/no-img-element: off`)
