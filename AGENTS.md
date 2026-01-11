# AGENTS.md - GameOnBaby Development Guide

## Project Overview

This is a Next.js 14 event registration platform with TypeScript, PostgreSQL (via Prisma), authentication (Kinde), and Tailwind CSS. The project follows T3 Stack conventions.

## Build Commands

| Command               | Description                                       |
| --------------------- | ------------------------------------------------- |
| `npm run dev`         | Start development server on http://localhost:3000 |
| `npm run build`       | Build for production                              |
| `npm run start`       | Start production server                           |
| `npm run lint`        | Run ESLint checks                                 |
| `npm run db:generate` | Generate Prisma client (runs on postinstall)      |
| `npm run db:push`     | Push schema changes to database                   |
| `npm run db:migrate`  | Deploy Prisma migrations                          |
| `npm run db:studio`   | Open Prisma Studio UI                             |

**Note:** No test framework is currently configured. Tests can be added with `npm install -D vitest @testing-library/react` and configured.

## Code Style Guidelines

### TypeScript

- Strict mode is enabled but `ignoreBuildErrors: true` in next.config.js - TypeScript errors won't break builds
- Use **type imports** over interfaces where natural: `import { type SomeType } from "..."`
- Prefer explicit types, but `any` is acceptable for:
  - External API responses (Kinde, etc.)
  - Complex nested objects where full typing is impractical
  - Legacy code migration (gradual typing preferred)
- Use `unknown` with type narrowing for truly uncertain types
- When in doubt, use the pattern: `value as Type` rather than `any` if you know what it should be

```typescript
// Preferred: use extracted types
import { type KindeUser } from "~/types";

// Acceptable: explicit any for external/unknown types
const handleCallback = (user: any) => { ... };

// Also acceptable: type assertion when you know the shape
const data = response.data as { id: string; name: string };
```

### Imports

Group imports in this order:

1. React imports (`"use client"`, `import React`)
2. Third-party packages
3. Path alias imports (`~/lib/`, `~/utils/`, `~/features/`)
4. Relative imports (`./`, `../`)

```typescript
// Correct
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Event } from "~/features/events/types";
import RegistrationForm from "./RegistrationForm";

// Type imports
import { type ClassValue, clsx } from "clsx";
import { type Event } from "~/features/events/types";
```

### Path Aliases

Use `~/*` for all imports from `src/`:

```typescript
import { db } from "~/lib/db";
import { cn } from "~/lib/utils";
import useUserProfile from "~/shared/hooks/useUserProfile";
```

### Naming Conventions

| Type             | Convention                    | Examples                                  |
| ---------------- | ----------------------------- | ----------------------------------------- |
| Components       | PascalCase                    | `RegistrationForm`, `EventList`           |
| Hooks            | camelCase + "use" prefix      | `useRegistrationStatus`, `useUserProfile` |
| Functions        | camelCase                     | `handleSubmit`, `fetchUserProfile`        |
| Variables        | camelCase                     | `isLoading`, `eventDate`                  |
| Constants        | UPPER_SNAKE_CASE or camelCase | `MAX_CAPACITY`, `initialState`            |
| Types/Interfaces | PascalCase                    | `User`, `RegistrationFormProps`           |
| Database models  | PascalCase                    | `User`, `Event`, `Registration`           |
| Files            | kebab-case                    | `registration-form.tsx`, `event-utils.ts` |
| CSS classes      | kebab-case                    | `text-white`, `flex-row`                  |

### Error Handling

Use the `withErrorHandling` wrapper for API routes:

```typescript
import { withErrorHandling } from "~/utils/errorHandler";
import { ApiError } from "~/utils/ApiError";

export const GET = withErrorHandling(async (request: Request) => {
  if (!event) {
    throw new ApiError("Event not found", 404, "NOT_FOUND");
  }
  return NextResponse.json(data);
});
```

For components:

- Use `try/catch` with `console.error` for async operations
- Handle errors gracefully with UI feedback (toast, alert)
- Use `error` state for form validation errors

### Component Structure

Follow this pattern for React components:

```typescript
"use client";

import React, { useState, useEffect } from "react";
// Third-party imports
// Path alias imports (~/*)
// Relative imports

interface ComponentProps {
  prop1: string;
  prop2?: number;
}

export default function ComponentName({ prop1, prop2 }: ComponentProps) {
  // 1. State declarations
  const [state, setState] = useState<Type>(initialValue);

  // 2. Custom hooks
  const hookResult = useCustomHook();

  // 3. useEffect hooks
  useEffect(() => {
    // side effects
  }, [dependencies]);

  // 4. Event handlers
  const handleClick = () => { /* ... */ };

  // 5. Early returns
  if (isLoading) return <LoadingSpinner />;

  // 6. Render
  return (/* JSX */);
}
```

### Form Validation

Use Zod with React Hook Form:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  email: z.string().email("Invalid email"),
});

type FormValues = z.infer<typeof formSchema>;

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<FormValues>({
  resolver: zodResolver(formSchema),
});
```

### Database (Prisma)

- Use `db` singleton from `~/lib/db` for all Prisma operations
- Use `select` to fetch only needed fields
- Handle `null` values explicitly
- Use `findUnique`, `findFirst`, `findMany`, `create`, `update`, `delete`, `upsert`

```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { id: true, email: true, role: true },
});
```

### State Management

Use Zustand stores (`~/stores/*.ts`):

```typescript
import { create } from "zustand";

interface Store {
  items: Item[];
  setItems: (items: Item[]) => void;
}

const useStore = create<Store>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
}));
```

### Styling with Tailwind

- Use `cn()` utility for conditional classes:

  ```typescript
  import { cn } from "~/lib/utils";

  <div className={cn(
    "base-class",
    condition && "conditional-class",
    anotherCondition ? "a" : "b"
  )}>
  ```

- Prefer Tailwind utility classes over custom CSS
- Use `GeistSans` font via `className={GeistSans.variable}`

### API Routes (Next.js App Router)

- Use `NextRequest`/`NextResponse` types
- Async handlers with proper error handling
- Route params typed explicitly:
  ```typescript
  export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } },
  ) {
    /* ... */
  }
  ```

### Authentication

- Use Kinde auth via `useKindeBrowserClient()` in client components
- Server-side auth via `getCurrentUser()` from `~/server/service/userService`
- Check permissions with `isUserModerator()`, `isUserAdmin()`

### File Organization

```
src/
├── app/           # Next.js App Router pages & API routes
├── components/    # Shared UI components
├── features/      # Feature-based modules
├── hooks/         # Custom React hooks
├── lib/           # Third-party config (db, utils)
├── server/        # Server-side logic (services)
├── shared/        # Shared across client/server
├── stores/        # Zustand state stores
├── types/         # TypeScript types
└── utils/         # Utility functions
```

### Environment Variables

All env vars must be defined in `src/env.js` using Zod schema:

- Server-only vars: defined in `server` block
- Client-exposed vars: prefix with `NEXT_PUBLIC_` in `client` block
- Use `SKIP_ENV_VALIDATION=true` to bypass validation during build

### Database Schema

Models defined in `db_schema.prisma`:

- `User` - with role enum (USER, MODERATOR, ADMIN)
- `Event` - with title, price, capacity, dates
- `Registration` - linked to Event
- `WaitingList` - overflow registrations
- `Payment` - linked to Registration

Run `npx prisma db push` after schema changes.

### Code Quality

- Run `npm run lint` before committing
- Fix TypeScript errors (ignore during build is temporary - configured in next.config.js)
- Use ESLint's `argsIgnorePattern: "^_"` for unused callback params
- Avoid console.log in production code - use proper error logging
- No comments unless explaining complex business logic
