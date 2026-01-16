/**
 * STATE_HANDOFF Type Definitions
 * 
 * These interfaces define the structured state passed between parts
 * in multi-part Perplexity analysis. Based on RLM (Recursive Language Models)
 * research to reduce context rot and maintain quality across parts.
 * 
 * @see https://arxiv.org/abs/2512.24601
 */

// ===========================================
// SYNDICATE TIER STATE HANDOFFS (6 Parts)
// ===========================================

export interface StateHandoffPart1 {
    detected_industry: 'Fintech' | 'Healthcare' | 'E-commerce' | 'SaaS' | 'Marketplace' | 'InternalTools' | 'Web3';
    detected_persona: 'SoloFounder' | 'DesignLead' | 'PM' | 'Enterprise' | 'Web3Native';
    core_jtbd: string;
    top_3_pain_points: [string, string, string];
    highest_risk_assumption: {
        id: string;
        statement: string;
        confidence: 'High' | 'Medium' | 'Low';
    };
    competitor_gap: string;
    pre_mortem_risks: string[];
}

export interface StateHandoffPart2 {
    competitor_count: number;
    competitor_summary: string;
    primary_differentiator: string;
    patterns_to_adopt: string[];
    patterns_to_avoid: string[];
    pricing_positioning: string;
}

export interface StateHandoffPart3 {
    timeline_type: 'QuickWin' | 'Medium' | 'Strategic';
    phase_count: number;
    critical_milestones: string[];
    top_error_scenarios: string[];
    resource_bottlenecks: string[];
}

export interface StateHandoffPart4 {
    screens_designed: string[];
    design_system_tokens: {
        primary_color: string;
        typography: string;
        spacing_base: string;
    };
    pain_points_addressed: string[];
}

export interface StateHandoffPart5 {
    edge_cases_covered: string[];
    industry_specific_screens: string[];
    accessibility_notes: string[];
}

// Part 6 is final, no handoff needed

// ===========================================
// INSIDER TIER STATE HANDOFFS (2 Parts)
// ===========================================

export interface InsiderStateHandoffPart1 {
    detected_industry: string;
    detected_persona: string;
    core_jtbd: string;
    top_3_pain_points: string[];
    competitor_count: number;
    highest_risk_assumption: {
        id: string;
        statement: string;
        confidence: 'High' | 'Medium' | 'Low';
    };
}

// Part 2 is final, no handoff needed

// ===========================================
// UNION TYPES FOR PARSING
// ===========================================

export type SyndicateStateHandoff =
    | StateHandoffPart1
    | StateHandoffPart2
    | StateHandoffPart3
    | StateHandoffPart4
    | StateHandoffPart5;

export type InsiderStateHandoff = InsiderStateHandoffPart1;

// ===========================================
// HELPER TYPE FOR RAW EXTRACTION
// ===========================================

export interface ExtractedStateHandoff {
    partNumber: number;
    rawJson: string;
    parsed: SyndicateStateHandoff | InsiderStateHandoff | null;
    extractionMethod: 'explicit' | 'fallback';
}
