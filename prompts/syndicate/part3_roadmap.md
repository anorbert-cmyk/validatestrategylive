═══════════════════════════════════════════════════════════════════
🔥 APEX STRATEGIC ANALYSIS - SYNDICATE TIER (Part 3 of 6)
═══════════════════════════════════════════════════════════════════

KEY FINDINGS FROM PREVIOUS PARTS:
{{PREVIOUS_SUMMARY}}

═══════════════════════════════════════════════════════════════════

### PART 3 OF 6: STRATEGIC ROADMAP (~6,500 tokens)

Create detailed implementation roadmap based on discovery and competitive insights.

OUTPUT THESE SECTIONS:

## Strategic Approach Selection

- **Primary Methodology:** (Lean UX, Design Sprint, JTBD, Service Design)
- **Why this approach:** Fit for this specific problem
- **"Behind the Decision":** Alternatives considered and rejected

## MANDATORY PHASE 0: Proof of Demand ("The Fake Door")

**CRITICAL:** This phase validates willingness to pay BEFORE writing code.

**Goal:** Test if users will open their wallets, not just say "I'd use that."

**Action Plan:**

1. Launch a landing page with "Pre-order" or "Join Waitlist" button
2. Simulate checkout flow (Stripe test mode or email capture)
3. Track conversion: Visitors → Button clicks → "Purchase" attempts

**Success Metric:** Target conversion rate based on industry benchmark (use live search to find: "average waitlist conversion rate for [Detected Industry]")

**Why This First:** If nobody clicks "Buy", the rest of the roadmap is irrelevant. The only real validation is a wallet opening.

**Fake Door Landing Page Components:**

- Headline: Benefit-driven value prop from Part 1 pain points
- Pricing Card: "Early Adopter" tier with real price
- CTA: "Pre-order Now" (triggers Stripe or captures email)
- Modal: "Processing your spot... You haven't been charged yet. You are #X on the waitlist."

## Phase-by-Phase Roadmap

Structure based on complexity (Week/Month/Quarter).

For each phase:

- **Objectives:** Primary and secondary goals
- **Key Deliverables:** With acceptance criteria
- **Critical Decision Points:** Stakeholders, deadlines
- **Dependencies:** Internal and external
- **Team Collaboration Touchpoints:** Who syncs when
- **Risk Factors:** With mitigation strategies

## Error Path Mapping (Top 7 Failure Scenarios)

For each:

- **What Goes Wrong:** User perspective
- **User Impact:** Emotional response, abandonment risk (H/M/L)
- **Recovery UX Pattern:** Real microcopy, visual treatment, interaction
- **Instrumentation:** What to log/track
- **Priority:** Based on likelihood × severity

## Team Collaboration Model

| Role | Responsibility | Time Allocation |
For solo founders: Modified approach with AI tools and async practices.

## Milestone Summary Table

| Milestone | Target Date | Owner | Success Criteria | Dependencies |

## Roadmap Summary (for subsequent parts)

150 words: Timeline, critical path, biggest risks, key decisions, resource bottlenecks.

## 📦 STATE_HANDOFF_PART_3 (MANDATORY - Output this JSON block exactly)

```json
// STATE_HANDOFF_PART_3
{
  "timeline_type": "QuickWin|Medium|Strategic",
  "phase_count": 4,
  "critical_milestones": ["Milestone 1", "Milestone 2", "Milestone 3"],
  "top_error_scenarios": ["Error 1", "Error 2", "Error 3"],
  "resource_bottlenecks": ["Bottleneck 1"]
}
```

**End with:** `[✅ PART 3 COMPLETE - Strategic Roadmap]`
