/**
 * Perplexity AI Service
 * Handles both single-call and multi-part sequential analysis
 */

import { invokeLLM } from "../_core/llm";
import { Tier, isMultiPartTier, MULTI_PART_CONFIG } from "../../shared/pricing";

// System prompts for different analysis types
const SINGLE_ANALYSIS_SYSTEM_PROMPT = `You are an expert UX strategist and product analyst. Your role is to provide comprehensive, actionable insights for product and UX challenges.

When analyzing a problem statement:
1. Identify the core user needs and pain points
2. Analyze the competitive landscape
3. Provide strategic recommendations
4. Suggest practical implementation steps

Format your response in clear markdown with headers and bullet points for readability.`;

const MULTI_PART_SYSTEM_PROMPT = `You are an elite UX strategist conducting a comprehensive 4-part analysis. You maintain context across all parts of the conversation to build a cohesive strategic analysis.

Your analysis style is:
- Data-driven and research-backed
- Practical and implementation-focused
- Strategic yet actionable
- Clear and well-structured

You will be asked to complete 4 sequential parts, each building on the previous insights.`;

// Prompts for each part of the multi-part analysis
const PART_PROMPTS = {
  1: (problem: string) => `## Part 1: Discovery & Problem Analysis

Analyze the following problem statement in depth:

"${problem}"

Provide:
1. **Problem Decomposition**: Break down the core problem into its fundamental components
2. **User Persona Analysis**: Define the primary and secondary user personas affected
3. **Pain Point Mapping**: Identify and prioritize the key pain points
4. **Jobs-to-be-Done Framework**: What jobs are users trying to accomplish?
5. **Current State Assessment**: What solutions exist today and why are they insufficient?

Be thorough and specific. This analysis will inform the strategic recommendations in subsequent parts.`,

  2: `## Part 2: Strategic Design & Roadmap

Based on your Part 1 analysis, now provide:

1. **Strategic Vision**: Define the ideal end-state solution
2. **Design Principles**: 5-7 core principles that should guide the solution
3. **Feature Prioritization Matrix**: Using MoSCoW method (Must-have, Should-have, Could-have, Won't-have)
4. **Implementation Roadmap**: 
   - Phase 1 (MVP): Core features for initial launch
   - Phase 2 (Growth): Features for scaling
   - Phase 3 (Maturity): Advanced features
5. **Success Metrics**: Define KPIs for each phase

Ensure your recommendations directly address the pain points identified in Part 1.`,

  3: `## Part 3: AI Toolkit & Figma Prompts

Now provide practical tools for implementation:

1. **Figma Design Prompts**: 5 detailed prompts for generating UI mockups
   - Include specific style directions, color schemes, and layout preferences
   - Each prompt should target a key screen or user flow

2. **AI Implementation Prompts**: 
   - Prompts for generating user stories
   - Prompts for creating technical specifications
   - Prompts for writing marketing copy

3. **Component Library Suggestions**: 
   - Recommended UI components and patterns
   - Accessibility considerations
   - Responsive design guidelines

4. **User Testing Scripts**: 
   - 3 usability test scenarios
   - Key questions to ask users
   - Metrics to track during testing

Make these prompts copy-paste ready for immediate use.`,

  4: `## Part 4: Risk, Metrics & Rationale

Complete the analysis with:

1. **Risk Assessment Matrix**:
   - Technical risks and mitigations
   - Market risks and mitigations
   - User adoption risks and mitigations
   - Resource/timeline risks and mitigations

2. **Detailed Success Metrics**:
   - North Star Metric with rationale
   - Leading indicators
   - Lagging indicators
   - Benchmark targets

3. **Decision Rationale Document**:
   - Why this approach over alternatives
   - Trade-offs made and why
   - Assumptions that need validation

4. **Next Steps Checklist**:
   - Immediate actions (this week)
   - Short-term actions (this month)
   - Long-term actions (this quarter)

5. **Executive Summary**: 
   - 3-paragraph summary of the entire analysis
   - Key recommendations
   - Expected outcomes

This completes the comprehensive UX analysis.`,
};

export interface AnalysisCallbacks {
  onChunk?: (partNumber: number, chunk: string) => void;
  onPartComplete?: (partNumber: number, content: string) => void;
  onComplete?: (result: MultiPartResult) => void;
  onError?: (error: Error) => void;
}

export interface SingleAnalysisResult {
  content: string;
  generatedAt: number;
}

export interface MultiPartResult {
  part1: string;
  part2: string;
  part3: string;
  part4: string;
  fullMarkdown: string;
  generatedAt: number;
}

/**
 * Generate single-call analysis for Standard and Medium tiers
 */
export async function generateSingleAnalysis(
  problemStatement: string,
  tier: "standard" | "medium"
): Promise<SingleAnalysisResult> {
  const tierPrompt = tier === "standard" 
    ? "Provide a focused analysis with key insights and recommendations."
    : "Provide a comprehensive analysis with detailed strategic insights, market positioning, and implementation recommendations.";

  const response = await invokeLLM({
    messages: [
      { role: "system", content: SINGLE_ANALYSIS_SYSTEM_PROMPT },
      { 
        role: "user", 
        content: `Analyze the following problem statement:\n\n"${problemStatement}"\n\n${tierPrompt}\n\nFormat your response in clear markdown.`
      },
    ],
  });

  const rawContent = response.choices[0]?.message?.content;
  const content = typeof rawContent === "string" ? rawContent : "";

  return {
    content,
    generatedAt: Date.now(),
  };
}

/**
 * Generate multi-part sequential analysis for Full/Premium tier
 * Maintains conversation context across all 4 parts
 */
export async function generateMultiPartAnalysis(
  problemStatement: string,
  callbacks?: AnalysisCallbacks
): Promise<MultiPartResult> {
  const result: MultiPartResult = {
    part1: "",
    part2: "",
    part3: "",
    part4: "",
    fullMarkdown: "",
    generatedAt: 0,
  };

  // Conversation history to maintain context
  const conversationHistory: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: MULTI_PART_SYSTEM_PROMPT },
  ];

  try {
    // Process each of the 4 parts sequentially
    for (let partNum = 1; partNum <= 4; partNum++) {
      console.log(`[Perplexity] Starting Part ${partNum}/4 generation`);

      // Build the prompt for this part
      const userPrompt = partNum === 1 
        ? PART_PROMPTS[1](problemStatement)
        : PART_PROMPTS[partNum as 2 | 3 | 4];

      // Add user prompt to conversation history
      conversationHistory.push({ role: "user", content: userPrompt });

      // Make API call with full conversation context
      const response = await invokeLLM({
        messages: conversationHistory,
      });

      const rawContent = response.choices[0]?.message?.content;
      const partContent = typeof rawContent === "string" ? rawContent : "";

      // Store the result
      const partKey = `part${partNum}` as keyof Pick<MultiPartResult, "part1" | "part2" | "part3" | "part4">;
      result[partKey] = partContent;

      // Add assistant response to conversation history for next part
      conversationHistory.push({ role: "assistant", content: partContent });

      // Notify part completion
      callbacks?.onPartComplete?.(partNum, partContent);

      console.log(`[Perplexity] Completed Part ${partNum}/4, length: ${partContent.length}`);
    }

    // Combine all parts into full markdown
    result.fullMarkdown = [
      "# UX Analysis Report\n",
      "## Part 1: Discovery & Problem Analysis\n",
      result.part1,
      "\n---\n",
      "## Part 2: Strategic Design & Roadmap\n",
      result.part2,
      "\n---\n",
      "## Part 3: AI Toolkit & Figma Prompts\n",
      result.part3,
      "\n---\n",
      "## Part 4: Risk, Metrics & Rationale\n",
      result.part4,
    ].join("\n");

    result.generatedAt = Date.now();

    // Notify completion
    callbacks?.onComplete?.(result);

    console.log(`[Perplexity] Multi-part analysis completed, total length: ${result.fullMarkdown.length}`);

    return result;

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[Perplexity] Multi-part analysis failed:", err);
    callbacks?.onError?.(err);
    throw err;
  }
}

/**
 * Generate analysis based on tier
 */
export async function generateAnalysis(
  problemStatement: string,
  tier: Tier,
  callbacks?: AnalysisCallbacks
): Promise<SingleAnalysisResult | MultiPartResult> {
  if (isMultiPartTier(tier)) {
    return generateMultiPartAnalysis(problemStatement, callbacks);
  } else {
    return generateSingleAnalysis(problemStatement, tier as "standard" | "medium");
  }
}
