# Project State

## Current Phase
Phase 1: Critical Fixes & Compliance

## Context
We are stabilizing the codebase for production. A persistent `forwardRef` error needs addressing, likely caused by `vite-plugin-manus-runtime` or `recharts`. We also need to add legal pages to be compliant.

## Decisions
- Moving away from `streamdown` to `react-markdown` for CSP compliance.
- Removing `recharts` if it causes issues or replacing it with CSS-only charts for Admin dashboard to simplify dependencies.
- Using American English for legal documents.

## Blockers
- None currently.
