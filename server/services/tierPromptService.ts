/**
 * Tier-Specific Prompt Service
 * Provides masterprompts for Observer, Insider, and Syndicate tiers
 * Based on the prompts in /prompts/ folder
 */

import { Tier } from "../../shared/pricing";
import { promptLoader } from "./promptLoader";

// Ensure prompts are loaded at startup
try {
  promptLoader.loadAll();
} catch (e) {
  console.error("Critical: Failed to load prompts at startup", e);
}

// ===========================================
// OBSERVER TIER - Single Part, Quick Validation
// ===========================================

export const OBSERVER_SYSTEM_PROMPT = promptLoader.get("observer/system");

export function getObserverPrompt(problem: string): string {
  return promptLoader.populate("observer/viability_check", { PROBLEM: problem });
}

// ===========================================
// INSIDER TIER - 2 Parts, Strategic Blueprint
// ===========================================

export const INSIDER_SYSTEM_PROMPT = promptLoader.get("insider/system");

export const INSIDER_PART_SCOPES: Record<number, string> = {}; // Deprecated in favor of direct loader access, keeping for potential interface compat if needed but logic below handles it.

export function getInsiderInitialPrompt(problem: string): string {
  // Part 1 is discovered and problem analysis
  return promptLoader.populate("insider/part1_discovery", { PROBLEM: problem });
}

export function getInsiderContinuePrompt(partNumber: 2): string {
  // Part 2 is strategic design & roadmap
  return promptLoader.get("insider/part2_strategy");
}

// ===========================================
// SYNDICATE TIER - 6 Parts, Full APEX Analysis
// Optimized for maximum quality with dedicated prompts per part
// ===========================================

export const SYNDICATE_SYSTEM_PROMPT = promptLoader.get("syndicate/system");

export const SYNDICATE_PART_SCOPES: Record<number, string> = {
  1: promptLoader.get("syndicate/part1_discovery"), // For reference if needed
};

export function getSyndicateInitialPrompt(problem: string): string {
  // Part 1
  return promptLoader.populate("syndicate/part1_discovery", { PROBLEM: problem });
}

export function getSyndicateContinuePrompt(partNumber: number, previousSummary: string): string {
  // Map part number to file key
  const partMap: Record<number, string> = {
    2: "syndicate/part2_competitor",
    3: "syndicate/part3_roadmap",
    4: "syndicate/part4_design",
    5: "syndicate/part5_advanced_design",
    6: "syndicate/part6_risk",
  };

  const key = partMap[partNumber];
  if (!key) throw new Error(`Invalid Syndicate part number: ${partNumber}`);

  return promptLoader.populate(key, { PREVIOUS_SUMMARY: previousSummary });
}

// Tier configuration for multi-part analysis
export const TIER_PART_CONFIG = {
  observer: { parts: 1, tokensPerPart: 3000 },
  insider: { parts: 2, tokensPerPart: 5000 },
  syndicate: { parts: 6, tokensPerPart: 6000 },
} as const;

// Helper to get tier-specific configuration
export function getTierPromptConfig(tier: Tier) {
  switch (tier) {
    case "standard":
      return {
        systemPrompt: OBSERVER_SYSTEM_PROMPT,
        parts: 1,
        getInitialPrompt: getObserverPrompt,
        getContinuePrompt: null,
      };
    case "medium":
      return {
        systemPrompt: INSIDER_SYSTEM_PROMPT,
        parts: 2,
        getInitialPrompt: getInsiderInitialPrompt,
        getContinuePrompt: getInsiderContinuePrompt,
      };
    case "full":
      return {
        systemPrompt: SYNDICATE_SYSTEM_PROMPT,
        parts: 6,
        getInitialPrompt: getSyndicateInitialPrompt,
        getContinuePrompt: getSyndicateContinuePrompt,
      };
    default:
      throw new Error(`Unknown tier: ${tier}`);
  }
}
