---
description: Execute a PLAN.md file with atomic commits
---

## Objective

Execute a PLAN.md file with per-task atomic commits, create SUMMARY.md, update project state.

## Arguments

`[path-to-PLAN.md]` - Path to the plan file to execute

## Commit Strategy

- Each task → 1 commit immediately after completion
- Plan completion → 1 metadata commit (docs: SUMMARY + STATE + ROADMAP)

## Execution Strategies

**Strategy A: Fully Autonomous** (no checkpoints)

- Execute entire plan autonomously
- Create SUMMARY.md and commit

**Strategy B: Segmented** (has verify-only checkpoints)

- Execute in segments between checkpoints
- Pause at verification points

**Strategy C: Decision-Dependent** (has decision checkpoints)

- Execute with user input at decision points

## Deviation Rules

During execution, handle discoveries:

1. **Auto-fix bugs** - Fix immediately, document
2. **Auto-add critical** - Security/correctness gaps
3. **Auto-fix blockers** - Can't proceed without fix
4. **Ask about architectural** - Major structural changes → STOP and ask
5. **Log enhancements** - Nice-to-haves → log to ISSUES.md, continue

## Commit Rules

**Per-Task Commits:**

```bash
git add [specific-files]
git commit -m "{type}({phase}-{plan}): {task-name}"
```

Types: feat, fix, test, refactor, perf, chore

**Plan Metadata Commit:**

```bash
git add .planning/
git commit -m "docs({phase}-{plan}): complete [plan-name] plan"
```

**NEVER use:** `git add .` or `git add -A`

## Success Criteria

- [ ] All tasks executed
- [ ] Each task committed individually
- [ ] SUMMARY.md created with commit hashes
- [ ] STATE.md updated
- [ ] ROADMAP updated
- [ ] Metadata committed

// turbo-all
