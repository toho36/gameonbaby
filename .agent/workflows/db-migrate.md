---
description: How to handle database schema changes
---

# Database Migration Workflow

1. **Modify Schema**
   - Edit `prisma/schema.prisma` with your changes.

2. **Generate Client**
   - Update the generated Prisma Client to reflect changes:
     ```bash
     npm run db:generate
     ```

3. **Push Changes (Development)**
   - For rapid prototyping (resetting data is possible):
     ```bash
     npm run db:push
     ```

4. **Create Migration (Production/Staging)**
   - For permanent schema changes that need to be applied strictly:
     ```bash
     npx prisma migrate dev --name <migration_name>
     ```

5. **Deploy Migration**
   - Apply pending migrations to the database (e.g., in CI/CD):
     ```bash
     npm run db:migrate
     ```
