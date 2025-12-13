---
description: How to set up the project for development
---

# Project Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   - Copy the example environment file:
     ```bash
     cp .env.example .env
     ```
   - Update `.env` with your local or development keys (Database URL, Auth secrets).

3. **Database Setup**
   - Ensure you have a Postgres database running (or use Vercel Postgres).
   - Generate the Prisma client:
     ```bash
     npm run db:generate
     ```
   - Push the schema to the database:
     ```bash
     npm run db:push
     ```
   - (Optional) Seed the database:
     ```bash
     npm run prisma:seed
     ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
