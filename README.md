# ValidateStrategyLive

ValidateStrategyLive is a modern SaaS platform designed to validate business strategies using AI-driven analysis. It leverages advanced prompt engineering and a multi-tier analysis engine (Observer, Insider, Syndicate) to provide actionable insights for entrepreneurs and businesses.

## 🏗️ Architecture

The project is built as a modular monolith using the T3 stack (modified):

- **Frontend:** React 19, Vite, Tailwind CSS, Radix UI
- **Backend:** Node.js, tRPC, Fastify (via adapter)
- **Database:** PlanetScale (MySQL) with Drizzle ORM
- **State Management:** React Query (Client), Event Sourcing (Server)

### Key Directories

- `client/`: Frontend React application
- `server/`: Backend application and tRPC routers
- `shared/`: Shared types and utilities
- `drizzle/`: Database schema and migrations
- `.github/`: CI/CD workflows

## 🚀 Getting Started

### Prerequisites

- Node.js v20+
- npm v10+

### Installation

```bash
# Install dependencies for all workspaces
npm install
```

### Development

```bash
# Start both frontend and backend in development mode
npm run dev
```

The application will be available at `http://localhost:5173`.

## 🧪 Testing & Verification

The project enforces strict type safety and automated testing.

### Run All Checks (CI Simulation)

```bash
# Linting, Type Checking, and Server Tests
npm run check
npm test
```

### Client-Side Tests (Vitest)

```bash
# Run frontend component tests
npm run test:client
```

## 📦 Building for Production

```bash
# Build frontend and server
npm run build
```

## 🔒 Security

Security is a core principle. The application includes:

- **Helmet** headers for CSP
- **Rate Limiting** (5 tiers)
- **Signature Verification** for admin actions
- **Input Validation** via Zod at all API boundaries

## 🤝 Contributing

1. Ensure all checks pass (`npm run check`)
2. Follow the "Modular Router" pattern in `server/routers/`
3. Add tests for critical logic
