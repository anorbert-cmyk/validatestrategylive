---
description: Map codebase structure and create analysis documents
---

## Objective

Analyze existing codebase using parallel exploration to produce structured codebase documents.

## Output

`.planning/codebase/` folder with 7 structured documents:

| Document | Purpose |
|----------|---------|
| `STACK.md` | Languages, frameworks, dependencies |
| `ARCHITECTURE.md` | Patterns, layers, data flow |
| `STRUCTURE.md` | Directory layout, where things live |
| `CONVENTIONS.md` | Code style, naming patterns |
| `TESTING.md` | Test framework, patterns |
| `INTEGRATIONS.md` | External services, APIs |
| `CONCERNS.md` | Tech debt, known issues, fragile areas |

## Process

1. Check if `.planning/codebase/` already exists
2. Create `.planning/codebase/` directory
3. Analyze codebase for each document type:
   - Stack + Integrations (technology focus)
   - Architecture + Structure (organization focus)
   - Conventions + Testing (quality focus)
   - Concerns (issues focus)
4. Write all 7 documents
5. Offer next steps: `/gsd-new-project` or `/gsd-plan-phase`

## When to Use

- Brownfield projects before initialization
- Refreshing codebase map after significant changes
- Before major refactoring
- Onboarding to unfamiliar codebase

// turbo-all
