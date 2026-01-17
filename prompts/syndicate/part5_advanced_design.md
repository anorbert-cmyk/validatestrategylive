═══════════════════════════════════════════════════════════════════
🔥 APEX STRATEGIC ANALYSIS - SYNDICATE TIER (Part 5 of 6)
═══════════════════════════════════════════════════════════════════

KEY FINDINGS FROM PREVIOUS PARTS:
{{PREVIOUS_SUMMARY}}

═══════════════════════════════════════════════════════════════════

### PART 5 OF 6: 5 ADVANCED DESIGN PROMPTS + EDGE CASES (~7,500 tokens)

Create 5 production-ready design prompts for edge cases and advanced states.

Most products fail on edge cases, not happy paths. These prompts ensure complete UX coverage.

**Use the same FIGMA-PROMPT structure from Part 4 for each prompt.**

OUTPUT 5 DETAILED DESIGN PROMPTS:

### Prompt 6: Empty States (First-Time User Experience)

Multiple scenarios:

- No data yet (new user) - encouraging, action-oriented
- No search results - helpful suggestions
- No notifications - "all caught up" positive framing
- Permission required - clear explanation and CTA
[Use full FIGMA-PROMPT structure]

### Prompt 7: Error States & Recovery Flows

- Form validation errors (inline, summary)
- API/system errors (temporary with retry, permanent with resolution)
- 404 / Not found (creative, helpful)
- Permission denied (clear explanation, resolution path)
[Use full FIGMA-PROMPT structure]

### Prompt 8: Loading & Skeleton Screens

- Skeleton screens (dashboard, list, card)
- Progress indicators (determinate, indeterminate)
- Optimistic UI patterns
- Lazy loading / infinite scroll
[Use full FIGMA-PROMPT structure]

### Prompt 9: Notifications & Alerts

- Toast notifications (success, error, warning, info)
- Modal alerts (destructive confirmation, important info)
- Inline alerts (page-level)
- Badge/indicator system
[Use full FIGMA-PROMPT structure]

### Prompt 10: Industry-Specific Screen

**CONDITIONAL BASED ON DETECTED INDUSTRY:**

**If Web3/Crypto/DeFi detected:**

- Wallet Connection Screen: Multi-wallet support (MetaMask, WalletConnect, Coinbase)
- Transaction Confirmation Modal: Gas estimation, slippage, network selection
- Token/NFT Display: Balance, price, portfolio value
- On-chain Activity Feed: Transaction history with explorer links

**If Fintech detected:**

- Account Overview: Balance, recent transactions, quick actions
- Payment/Transfer Flow: Amount input, recipient, confirmation
- Security/2FA Screen: Biometric, OTP, recovery options

**If SaaS/B2B detected:**

- Team Management: Invite, roles, permissions
- Billing/Subscription: Plans, usage, invoices
- Integration Settings: API keys, webhooks, connected apps

**If E-commerce detected:**

- Product Detail Page: Images, variants, add to cart
- Checkout Flow: Cart, shipping, payment, confirmation
- Order Tracking: Status, timeline, support

[Use full FIGMA-PROMPT structure with industry-specific components]

For each prompt include:

1. **Prompt Title** with Pain Point linkage
2. **Full Prompt Text** (copy-paste ready using FIGMA-PROMPT structure)
3. **Strategic Rationale:** How this design handles edge cases
4. **Customization Notes**

## 📦 STATE_HANDOFF_PART_5 (MANDATORY - Output this JSON block exactly)

```json
// STATE_HANDOFF_PART_5
{
  "edge_cases_covered": ["Empty State", "Error State", "Loading", "Notifications", "Industry-Specific"],
  "industry_specific_screens": ["Screen Name 1", "Screen Name 2"],
  "accessibility_notes": ["WCAG AA compliant", "44x44px touch targets"]
}
```

**End with:** `[✅ PART 5 COMPLETE - 5 Advanced Design Prompts + Edge Cases]`
