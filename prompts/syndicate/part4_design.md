═══════════════════════════════════════════════════════════════════
🔥 APEX STRATEGIC ANALYSIS - SYNDICATE TIER (Part 4 of 6)
═══════════════════════════════════════════════════════════════════

KEY FINDINGS FROM PREVIOUS PARTS:
{{PREVIOUS_SUMMARY}}

═══════════════════════════════════════════════════════════════════

### PART 4 OF 6: 5 CORE DESIGN PROMPTS (~7,500 tokens)

Create 5 production-ready design prompts for core screens.

**CRITICAL INSTRUCTION:** These prompts MUST be derived from:

- **User Persona** detected in Part 1
- **Pain Points** identified in Part 1
- **Strategic Roadmap/Features** from Part 3
Do NOT use generic templates. Every screen must solve a specific problem identified earlier.

These prompts will be copy-pasted directly into AI design tools (Figma AI, Lovable, v0, Galileo).
They must be: Self-contained, Specific (real dimensions, colors, typography), Production-ready (no placeholders), Accessible (WCAG 2.1 AA), Responsive.

**PROMPT STRUCTURE (Use for all 5 screens):**

```markdown
---FIGMA-PROMPT-START---
Screen: {Name}
Role: {Specific user persona interacting with this screen}
Goal: {Specific JTBD this screen solves - reference Pain Point #X from Part 1}

DESIGN & AESTHETICS (Industry: {Detected Industry}):
- Visual Style: {e.g., "Neo-Brutalism for crypto" or "Clean Clinical for health"}
- Color Palette: {Primary} | {Secondary} | {Background} | {Surface}
- Typography: {Header Font} | {Body Font}
- Grid System: 12-col desktop (80px margin), 4-col mobile (20px margin)
- Spacing: 8px base unit (Strict 4/8/16/24/32/48/64/80 scale)

COMPONENT HIERARCHY (Top to Bottom):
1. Global Navigation: {Items specific to user type}
2. Hero/Header: {Headline structure, imagery, key action}
3. [Section A]: {Detailed component specs}
4. [Section B]: {Detailed component specs}
5. [Section C]: {Detailed component specs}

CONTENT & MICROCOPY (Must match Tone of Voice):
- Headline: "{Exact verified text}"
- Subtext: "{Exact verified text - no lorem ipsum}"
- CTA Primary: "{Text}" (State: Default/Hover/Disabled)
- CTA Secondary: "{Text}"
- Empty State Message: "{Helpful guidance text}"
- Error Message: "{Specific, actionable error text}"
- Success Message: "{Confirmation with next steps}"

INTERACTION & STATES:
- Hover Effects: {Specific visual feedback}
- Focus States: {Accessibility ring style}
- Loading: {Skeleton loader pattern}
- Error: {Inline validation message}
- Success: {Confirmation state}
- Empty: {Zero-state design}

ACCESSIBILITY (A11Y) & COMPLIANCE:
- Color Contrast: WCAG AA compliant
- Touch Targets: Min 44x44px
- Screen Reader: ARIA labels for complex components
- Keyboard Navigation: Tab order specification
- Regulatory: {Disclaimer/Consent banner if fintech/health/web3}
---FIGMA-PROMPT-END---
```

OUTPUT 5 DETAILED DESIGN PROMPTS:

### Prompt 1: Onboarding/Welcome Flow

Linked to: Pain Point #{X} - {description}
[Use full prompt structure above]

### Prompt 2: Main Dashboard/Home

Linked to: Pain Point #{X} - {description}
[Use full prompt structure above]

### Prompt 3: Core Action Screen

The primary use case screen - where users accomplish their main goal.
Linked to: Pain Point #{X} - {description}
[Use full prompt structure above]

### Prompt 4: Settings/Profile

Account management and preferences.
Linked to: Pain Point #{X} - {description}
[Use full prompt structure above]

### Prompt 5: Navigation/Menu System

Global navigation (desktop and mobile).
Linked to: User Persona - {description}
[Use full prompt structure above]

For each prompt include:

1. **Prompt Title** with Pain Point linkage
2. **Full Prompt Text** (copy-paste ready using structure above)
3. **Strategic Rationale:** How this design solves the linked Pain Point
4. **Customization Notes**

## 📦 STATE_HANDOFF_PART_4 (MANDATORY - Output this JSON block exactly)

```json
// STATE_HANDOFF_PART_4
{
  "screens_designed": ["Onboarding", "Dashboard", "Core Action", "Settings", "Navigation"],
  "design_system_tokens": {
    "primary_color": "#HEXCODE",
    "typography": "Font Name",
    "spacing_base": "8px"
  },
  "pain_points_addressed": ["Pain Point 1", "Pain Point 2"]
}
```

**End with:** `[✅ PART 4 COMPLETE - 5 Core Design Prompts]`
