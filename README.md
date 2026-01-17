# ValidateStrategyLive 🚀

**AI-Powered Product Validation Platform for Founders & Product Teams.**

[![CI Status](https://github.com/anorbert-cmyk/validatestrategylive/actions/workflows/ci.yml/badge.svg)](https://github.com/anorbert-cmyk/validatestrategylive/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Stack: T3-ish](https://img.shields.io/badge/Stack-Vite_React_tRPC_Drizzle-green.svg)](https://init.tips/)

ValidateStrategyLive validates startup ideas in 24 hours using multi-agent AI analysis. It provides deep market research, competitor analysis, and strategic roadmaps to help founders build what people want.

---

## 📚 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Security](#-security)
- [Contributing](#-contributing)

---

## ✨ Features

- **Instant AI Analysis**: Transforms rough ideas into comprehensive validation reports.
- **Multi-Tier Reports**:
  - **Observer**: Quick market sniff test.
  - **Insider**: Deep dive & competitor analysis.
  - **Syndicate (APEX)**: Full strategic roadmap + 6-part deep analysis.
- **Interactive Dashboard**: Real-time progress tracking of AI agent operations.
- **Crypto & Fiat Payments**: Seamless checkout with Stripe and NOWPayments/Coinbase.
- **Wallet Auth**: SIWE (Sign-In With Ethereum) for web3 natives.
- **Magic Link Auth**: Passwordless email login for web2 users.

---

## 🛠 Tech Stack

### Frontend

- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI + Framer Motion
- **State Management**: TanStack Query (via tRPC) + Wouter (Routing)

### Backend

- **Runtime**: Node.js (Express)
- **API**: [tRPC](https://trpc.io/) (Type-safe API)
- **Database**: MySQL (PlanetScale) via [Drizzle ORM](https://orm.drizzle.team/)
- **AI Orchestration**: Perplexity API + OpenAI (reserved)

### DevOps

- **CI/CD**: GitHub Actions (Lint, Test, Build, Deploy)
- **Hosting**: Render (Web Service + Workers)
- **Package Manager**: pnpm

---

## 🏗 Architecture

The system follows a modular monolith architecture with clear separation of concerns:

```mermaid
graph TD
    Client[React Frontend] <-->|tRPC Typed API| Server[Express Server]
    Server <-->|SQL| DB[(PlantScale MySQL)]
    Server <-->|REST| AI[Perplexity/OpenAI APIs]
    Server <-->|Webhooks| Stripe[Stripe/Payment Providers]
    
    subgraph "Backend Services"
        Auth[Auth Service (JWT/SIWE)]
        Prompt[Prompt Loader]
        Queue[Retry Queue Worker]
        Cron[Email Sequence Cron]
    end
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v20+
- pnpm v9+
- MySQL Database (or PlanetScale connection)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/anorbert-cmyk/validatestrategylive.git
   cd validatestrategylive
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Copy `.env.example` to `.env` and fill in the required values.

   ```bash
   cp .env.example .env
   ```

4. **Initialize Database**

   ```bash
   pnpm db:push
   ```

5. **Start Development Server**

   ```bash
   pnpm dev
   ```

   The app will be available at `http://localhost:5000` (frontend proxies to backend).

---

## 🔑 Environment Variables

Required variables in `.env`:

```env
# Database
DATABASE_URL="mysql://..."

# Auth
JWT_SECRET="super-secret-key"
VITE_APP_URL="http://localhost:5000"

# AI
PERPLEXITY_API_KEY="pplx-..."

# Payments
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NOWPAYMENTS_API_KEY="..."

# Email
RESEND_API_KEY="re_..."
```

---

## 🔒 Security

- **Authentication**: Dual-stack auth (SIWE + Magic Link) with stateless JWT sessions.
- **PII Protection**: Logs automatically redact email and wallet addresses.
- **Replay Protection**: Nonces for SIWE and 24h expiration for email tokens.
- **Rate Limiting**: Express-rate-limit configured on API routes.
- **Headers**: Helmet.js security headers enabled.

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Development Workflow

1. Create a feature branch (`feat/amazing-feature`)
2. Commit changes (we use Conventional Commits)
3. Push to branch
4. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
