---
description: Create project roadmap with phases
---

## Objective

Create project roadmap with phase breakdown after project initialization.

## Prerequisites

- `.planning/PROJECT.md` must exist (run `/gsd-new-project` first)

## Output

- `.planning/ROADMAP.md` - Phase breakdown
- `.planning/STATE.md` - Current project state
- `.planning/phases/XX-name/` directories

## Process

1. Validate PROJECT.md exists
2. Check if roadmap already exists (offer to replace/view/cancel)
3. Detect project domain and expertise needed
4. Identify logical phases of work
5. Set research flags for uncertain areas
6. Create ROADMAP.md with phase structure
7. Initialize STATE.md
8. Create phase directories
9. Git commit changes

## Next Steps After Roadmap

```
/gsd-plan-phase 1
```

Also available:

- `/gsd-discuss-phase 1` - gather context first
- `/gsd-research-phase 1` - investigate unknowns

// turbo-all
