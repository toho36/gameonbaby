---
description: How to run quality checks (linting, types)
---

# Quality Checks

1. **Linting**
   - Run ESLint to catch code style and quality issues:
     ```bash
     npm run lint
     ```

2. **Type Checking**
   - Run TypeScript compiler to check for type errors:
     ```bash
     npx tsc --noEmit
     ```

3. **Fixing Issues**
   - Many linting issues can be auto-fixed:
     ```bash
     npm run lint -- --fix
     ```
