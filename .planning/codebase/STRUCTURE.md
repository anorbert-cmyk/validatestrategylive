# Project Structure

## Root
- `client/`: Frontend React application
- `server/`: Backend Express application
- `shared/`: Shared types and utilities (implied, folder exists)
- `drizzle/`: Database migrations and schema
- `prompts/`: AI System prompts (Masterprompts)
- `.planning/`: GSD documentation

## Client (`client/src`)
- `pages/`: Route components (Home, Checkout, AnalysisResult, etc.)
- `components/`: Reusable UI components
- `lib/`: Utilities
- `hooks/`: Custom React hooks

## Server (`server/`)
- `_core/`: Core server setup (index.ts, logger.ts)
- `routers.ts`: API route definitions
- `services/`: Business logic services (payment, AI, email)
- `middleware/`: Express middleware (auth, rate limit)
