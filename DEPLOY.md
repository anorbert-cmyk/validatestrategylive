# Deployment Guide

This project is configured for deployment on **Render** (Compute), **PlanetScale** (Database), and **Cloudflare R2** (Storage).

## 1. Prerequisites

- [ ] **PlanetScale**: Create a database and get the connection string (`DATABASE_URL`).
  - *Note: Ensure you are using the Hyper (MySQL-compatible) adapter or standard PlanetScale connection string.*
- [ ] **Cloudflare R2**: Create a bucket and generate an API Token with "Object Read & Write" permissions.
- [ ] **Render**: Connect your GitHub repository and create a new **Blueprint Instance** using `render.yaml`.

## 2. Environment Variables

You must configure the following Environment Variables in your Render Dashboard for **ALL** services (Web, Worker, Cron).

### Core Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `VITE_APP_URL` | The public URL of your app | `https://your-app.onrender.com` |
| `VITE_APP_ID` | Unique App ID | `validate-strategy-live` |
| `JWT_SECRET` | Secret for signing session cookies | `random-secure-string-at-least-32-chars` |
| `OWNER_OPEN_ID` | Your Admin OpenID (for access control) | `user_...` |

### Database (PlanetScale)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | The PlanetScale connection string (MySQL) |

### Cloudflare R2 Storage

| Variable | Description |
|----------|-------------|
| `R2_ACCOUNT_ID` | Cloudflare Account ID |
| `R2_ACCESS_KEY_ID` | R2 Token Access Key ID |
| `R2_SECRET_ACCESS_KEY` | R2 Token Secret Access Key |
| `R2_BUCKET_NAME` | Name of your R2 bucket |
| `R2_PUBLIC_URL` | (Optional) Public domain for the bucket |

### External APIs

| Variable | Description |
|----------|-------------|
| `OAUTH_SERVER_URL` | URL for the OAuth provider |
| `BUILT_IN_FORGE_API_URL` | Forge API for AI generation |
| `BUILT_IN_FORGE_API_KEY` | Forge API Key |
| `ADMIN_WALLET_ADDRESS` | Your crypto wallet for admin payments/management |

### Analytics (Optional)

| Variable | Description |
|----------|-------------|
| `VITE_ANALYTICS_ENDPOINT` | Umami/Plausible endpoint URL |
| `VITE_ANALYTICS_WEBSITE_ID` | Site ID for analytics |

## 3. Database Migration

After deploying, you may need to run database migrations. Since `drizzle-kit` is a dev dependency, it's recommended to run migrations **locally** pointing to your PlanetScale production branch, or set up a separate release command.

**Local Migration Command:**

```bash
DATABASE_URL="mysql://..." npm run db:push
```

## 4. Troubleshooting

- **Build Failures**: Check the Build Logs in Render. Ensure `drizzle-kit` isn't trying to run during build if it requires DB access.
- **Runtime Errors**: Check the Service Logs. Missing env vars are the most common cause.
