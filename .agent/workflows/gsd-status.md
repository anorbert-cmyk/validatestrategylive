---
description: Check project progress and status
---

## Objective

Display current project state, phase progress, and next steps.

## Process

1. Read `.planning/STATE.md` for current position
2. Read `.planning/ROADMAP.md` for phase overview
3. Check each phase directory for completion status
4. Display progress summary

## Output Format

```
PROJECT: [Name]
CURRENT PHASE: [N] - [Name]
STATUS: [planning/executing/complete]

ROADMAP:
[x] Phase 1: [Name] - COMPLETE
[/] Phase 2: [Name] - IN PROGRESS (2/5 tasks)
[ ] Phase 3: [Name] - NOT STARTED
[ ] Phase 4: [Name] - NOT STARTED

NEXT STEP: /gsd-execute-plan .planning/phases/02-name/phase-PLAN.md
```

## Quick Commands

- `/gsd-status` - This command
- `/gsd-progress` - Detailed progress with task breakdown
- `/gsd-resume-work` - Continue from last checkpoint

// turbo-all
