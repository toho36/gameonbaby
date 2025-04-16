# Folder Structure Optimization

This document outlines the changes made to optimize the project folder structure and the remaining tasks to complete the transition.

## New Folder Structure

The project has been reorganized to follow a feature-based structure:

```
src/
├── features/
│   ├── events/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── types.ts
│   │   └── index.ts
│   ├── registration/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types.ts
│   │   └── index.ts
│   └── admin/
│       ├── components/
│       └── hooks/
├── shared/
│   ├── components/
│   │   └── ui/
│   ├── hooks/
│   ├── utils/
│   └── index.ts
└── app/
    └── (Next.js app router structure)
```

## Completed Changes

1. Created new directory structure
2. Moved registration components to `src/features/registration/components/`
3. Moved event-related components to `src/features/events/components/`
4. Moved shared UI components to `src/shared/components/ui/`
5. Created type files for each feature
6. Added index.ts files for easier imports
7. Updated some imports in key files

## Remaining Tasks

1. Fix export issues in component files:

   - Ensure all components use named or default exports consistently
   - Update `Navbar.tsx` to use default export instead of named export

2. Update all import paths throughout the codebase:

   - Change `~/components/*` to `~/features/*/components/*` or `~/shared/components/*`
   - Change `~/hooks/*` to `~/features/*/hooks/*` or `~/shared/hooks/*`
   - Change `~/types/*` to appropriate feature types

3. Fix validation schema imports:

   - Move validation schemas to respective feature directories
   - Update import references

4. Update all app pages:

   - Update import paths in all pages in the `app/` directory

5. Test the application thoroughly:
   - Ensure all components render correctly
   - Verify that all functionality works as expected

## Migration Strategy

To complete the migration:

1. Start by fixing the named exports in shared components
2. Update imports in one feature area at a time (e.g., first registration, then events)
3. Test each section after updating
4. Use search and replace to fix remaining references
5. Once all imports are updated, you can safely remove the duplicate files in the old structure

## Benefits of the New Structure

- Better organization by feature domain
- Improved code discoverability
- Clearer boundaries between different parts of the application
- Easier to maintain and extend
- More scalable for team development
