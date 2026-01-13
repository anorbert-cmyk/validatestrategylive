---
description: Create detailed execution plan for a phase
---

## Objective

Create executable phase prompt with discovery, context injection, and task breakdown.

## Arguments

`[phase number]` - Optional, auto-detects next unplanned phase if not provided

## Output

One or more PLAN.md files in `.planning/phases/XX-name/`

## Context Loading

1. Load `.planning/STATE.md` (project state)
2. Load `.planning/ROADMAP.md` (phase definitions)
3. Load `.planning/phases/XX-name/{phase}-CONTEXT.md` if exists
4. Load `.planning/codebase/` documents for context

## Process

1. Validate `.planning/` directory exists
2. Validate phase number exists in roadmap (or detect next)
3. Perform mandatory discovery:
   - Level 0-3 as appropriate for phase complexity
4. Read project history (prior decisions, issues, concerns)
5. Break phase into concrete tasks
6. Estimate scope and split into multiple plans if needed
7. Create PLAN.md file(s) with executable structure

## Plan Structure

Each PLAN.md contains:

- `objective` - What this plan accomplishes
- `execution_context` - Files and references needed
- `context` - Current state and dependencies
- `tasks` - Specific executable steps
- `verification` - How to verify completion
- `success_criteria` - Checklist for completion
- `output` - Expected artifacts

## Next Steps

```
/gsd-execute-plan [path-to-PLAN.md]
```

// turbo-all
