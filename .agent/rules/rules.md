---
trigger: always_on
glob: "**/*"
description: Global coding standards, architecture rules, and best practices for GameOnBaby
---

# Project Rules & Standards

## 1. Technology Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (Strict mode, no `any`)
- **Styling**: Tailwind CSS + `clsx` + `tailwind-merge`
- **Database**: PostgreSQL (via Vercel Postgres)
- **ORM**: Prisma
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Auth**: Kinde Auth (primary) / NextAuth.js (legacy/adapter)

## 2. Architecture & Folder Structure
- **Feature-First**: Organize code by domain feature in `src/features/`.
  - `src/features/[feature-name]/components/`
  - `src/features/[feature-name]/hooks/`
  - `src/features/[feature-name]/types.ts`
- **Shared**: Use `src/shared/` for truly global, reusable code (UI kit, generic utils).
- **App Router**: `src/app/` should contain **only** route definitions, layouts, and page entry points. Move business logic to `features/`.

## 3. Coding Conventions
- **Exports**:
  - **Named Exports** for generic utilities, hooks, and types.
  - **Default Exports** for Page components (`page.tsx`) and Next.js special files (`layout.tsx`, `loading.tsx`).
- **Imports**:
  - Always use absolute imports with `~/` alias (e.g., `~/features/events/types`).
  - Avoid relative imports (`../../`) for cross-feature dependencies.
- **Naming**:
  - Components: PascalCase (e.g., `EventCard.tsx`)
  - Hooks: camelCase with `use` prefix (e.g., `useEventRegistration.ts`)
  - Props: Boolean props should start with `is`, `has`, or `should` (e.g., `isLoading`).

## 4. Best Practices
### TypeScript
- **No Explicit Any**: strictly typed. Use `unknown` if necessary but prefer discriminated unions or generics.
- **Zod Schemas**: Use Zod for all runtime validation (forms, API inputs). Infer TypeScript types from Zod schemas: `type Input = z.infer<typeof schema>`.

### Components
- **Server vs Client**: Default to Server Components. Add `"use client"` only when interaction (hooks, event listeners) is needed.
- **Composition**: Prefer composition over prop drilling. Use `children` prop.

### Database (Prisma)
- **Migrations**:
  - Run `npm run db:generate` after *any* schema change.
  - Use `npm run db:push` for local dev prototyping.
  - Use variable naming that matches the schema (camelCase fields).

### Styling
- **Tailwind**: Use utility classes.
- **Conditionals**: Use `cn()` (clsx + tailwind-merge) helper for conditional classes.
  ```tsx
  <div className={cn("base-style", isActive && "active-style")} />
  ```
