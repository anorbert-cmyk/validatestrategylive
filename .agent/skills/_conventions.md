---
name: Shared Conventions
description: Global standards for Severity, Ticket Templates, Event Naming, and Definition of Done to ensure consistency across all Agents.
---

# Shared Conventions & Standards

This document defines the "source of truth" for quality, classification, and communication across all Skill Agents. Agents should reference these standards to maintain consistency.

---

## 1. Severity & Priority Levels

Use these definitions when triaging bugs, security findings, or design issues.

| Level | Priority | Definition | SLA (Response) |
| :--- | :--- | :--- | :--- |
| **Blocker** | **P0** | System is down, dataloss, active exploit, or critical flow broken for all users. No workaround. | Immediate |
| **High** | **P1** | Critical flow broken for some users, significant degraded performance, or high-risk vulnerability. Workaround difficult. | < 24 hrs |
| **Medium** | **P2** | Functional issue, cosmetic issue in key flow, or medium risk. Workaround exists. | Next Sprint |
| **Low** | **P3** | Minor cosmetic, typo, nice-to-have, or low risk edge case. | Backlog |

---

## 2. Ticket Templates

### A. Bug Report

```markdown
**Title:** [Component] Concise description of failure

**Severity:** [Blocker/High/Medium/Low]

**Context:**
- **URL/Path:** `/dashboard`
- **Environment:** Staging / Production
- **User Device:** Chrome / Mobile Safari

**Steps to Reproduce:**
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected vs Actual:**
- **Expected:** Modal opens with focus.
- **Actual:** Modal opens but nothing is clickable.

**Evidence:**
- [Screenshot or Log Snippet]
```

### B. Security Finding (AppSec/WSTG)

```markdown
**Title:** [Vulnerability Type] in [Component]

**Risk Rating:** [Critical/High/Medium/Low] (CVSS Score if available)

**Vulnerability:**
Brief explanation of the flaw (e.g., "Reflected XSS in search parameter").

**Impact:**
What an attacker can achieve (e.g., "Steal session cookies", "Drop database tables").

**Remediation:**
- [ ] Steps to fix (code level)
- [ ] Verification method

**Resources:**
- Link to OWASP/CWE definition
```

### C. Feature / User Story

```markdown
**Title:** [Feature] User value summary

**User Story:**
AS A [role]
I WANT [action/feature]
SO THAT [benefit/value]

**Acceptance Criteria:**
- [ ] Scenario 1: Happy path behavior
- [ ] Scenario 2: Error state / Edge case
- [ ] Performance: < 200ms latency
- [ ] A11y: Keyboard navigable + Screen reader labels

**Design/Tech Reference:**
- [Figma Link]
- [API Utils Path]
```

---

## 3. Observability Standards

### A. Event Naming (`noun.verb` or `context.action`)

Use `snake_case` or `dot.notation` consistently.

- **Bad:** `userClickedLogin`, `ErrorInDB`, `payment`
- **Good:**
  - `auth.login_success` / `auth.login_failed`
  - `payment.charge.created` / `payment.charge.failed`
  - `user.profile.updated`
  - `system.db.connection_timeout`

### B. Log Levels

- **ERROR:** System failure, data inconsistency, security event. **Needs Alert.**
- **WARN:** Handled error, retry, degraded mode. **Needs Monitoring.**
- **INFO:** State change, milestones (job started/finished).
- **DEBUG:** Payloads, variable states (No Secrets!). **Dev only.**

### C. PII & Secrets (Redaction Rules)

- **NEVER Log:** Passwords, API Keys, Full Credit Card Numbers, Session Tokens.
- **Mask/Hash:** Emails (`j***@example.com`), User IDs (if sensitive), IPs (if GDPR strict).

---

## 4. Definition of Done (Global)

Every code change or feature must pass this gate before merge.

### ✅ Functional

- [ ] Meets all Acceptance Criteria in the User Story.
- [ ] Happy path works.
- [ ] Error states (network down, invalid input) handled gracefully.

### ✅ Quality & Tests

- [ ] Unit tests written/updated (coverage not decreased).
- [ ] Integration test added for critical flows.
- [ ] No new linting/type errors.

### ✅ Security

- [ ] Inputs validated (Zod/Schema).
- [ ] Authz checks applied (Server-side).
- [ ] No secrets committed.

### ✅ Accessibility (A11y)

- [ ] Interactive elements have Focus states.
- [ ] Keyboard navigable (Tab/Enter/Space).
- [ ] Images have `alt`, Inputs have labels.

### ✅ Performance

- [ ] No massive bundle bloat (new heavy deps checked).
- [ ] N+1 queries avoided.

---

## 5. Version Control & Commits

Use **Conventional Commits** to keep history readable.

- `feat: allow users to change password`
- `fix: handle null state in profile header`
- `docs: update API spec for v2`
- `chore: bump dependencies`
- `refactor: extract validation logic to helper`
