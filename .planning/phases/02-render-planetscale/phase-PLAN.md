# Phase 2: Render & PlanetScale Integration

## Objective

Migrate the application infrastructure to Render (hosting) + PlanetScale (MySQL database) for production deployment.

## Context

- Current: SQLite local database, Railway/local hosting
- Target: PlanetScale MySQL, Render hosting
- `render.yaml` already exists with basic configuration

## Tasks

### 1. Configure PlanetScale Database

- [x] Create PlanetScale database (if not exists)
- [x] Get connection string from PlanetScale dashboard
- [x] Update `DATABASE_URL` format for MySQL

### 2. Update Drizzle ORM for MySQL

- [x] Verify `drizzle/schema.ts` MySQL compatibility
- [x] Check for SQLite-specific syntax (e.g., `integer` vs `int`)
- [x] Update `drizzle.config.ts` for MySQL driver

### 3. Database Migration

- [x] Run `drizzle-kit generate:mysql` for migration files
- [x] Push schema to PlanetScale: `drizzle-kit push:mysql`
- [x] Verify tables created correctly

### 4. Configure Render Deployment

- [x] Update `render.yaml` with correct build/start commands
- [ ] Set environment variables in Render dashboard:
  - `DATABASE_URL` (PlanetScale connection)
  - `PERPLEXITY_API_KEY`
  - `STRIPE_SECRET_KEY`
  - `NOWPAYMENTS_API_KEY`
  - `RESEND_API_KEY`
  - `ADMIN_WALLET_ADDRESS`
  - `SESSION_SECRET`
  - `VITE_APP_URL`

### 5. Verification

- [ ] Deploy to Render staging
- [ ] Test database connection
- [ ] Test payment webhooks
- [ ] Test analysis flow end-to-end

## Success Criteria

- [ ] App running on Render
- [ ] Database connected to PlanetScale
- [ ] All API endpoints functional
- [ ] Webhooks receiving and processing
