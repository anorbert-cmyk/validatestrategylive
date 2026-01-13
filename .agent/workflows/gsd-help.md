---
description: Display available GSD commands and usage
---

## Get Shit Done (GSD) Framework

A structured approach to project planning and execution.

## Core Workflow

```
/gsd-map-codebase     → Analyze existing code (brownfield)
/gsd-new-project      → Initialize project planning
/gsd-create-roadmap   → Define phases of work
/gsd-plan-phase [N]   → Create executable plan for phase
/gsd-execute-plan [path] → Execute a plan with atomic commits
```

## Status & Progress

```
/gsd-status           → Current project state
/gsd-progress         → Detailed progress breakdown
```

## Session Management

```
/gsd-pause-work       → Save state and stop
/gsd-resume-work      → Continue from checkpoint
/gsd-resume-task      → Resume specific task
```

## Phase Management

```
/gsd-discuss-phase [N]  → Gather context before planning
/gsd-research-phase [N] → Investigate unknowns
/gsd-add-phase          → Add new phase to roadmap
/gsd-insert-phase       → Insert phase between existing
/gsd-remove-phase       → Remove phase from roadmap
```

## Troubleshooting

```
/gsd-debug            → Diagnose issues
/gsd-verify-work      → Validate completed work
/gsd-check-todos      → Find TODO comments in code
```

## Directory Structure

```
.planning/
├── PROJECT.md        # Project definition
├── ROADMAP.md        # Phase breakdown
├── STATE.md          # Current state
├── config.json       # Workflow settings
├── codebase/         # Codebase analysis docs
│   ├── STACK.md
│   ├── ARCHITECTURE.md
│   ├── STRUCTURE.md
│   ├── CONVENTIONS.md
│   ├── TESTING.md
│   ├── INTEGRATIONS.md
│   └── CONCERNS.md
└── phases/
    ├── 01-setup/
    │   ├── phase-PLAN.md
    │   └── phase-SUMMARY.md
    └── 02-core/
        └── ...
```

// turbo-all
