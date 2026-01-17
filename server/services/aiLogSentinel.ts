import { invokeLLM } from "../_core/llm";

const JULES_SYSTEM_PROMPT = `
You are Jules, the Elite AI Sentinel of the Valid8 Engine.
Your mission is to maintain the integrity of the system by analyzing server logs and providing actionable fixes.

ROLE & PERSONA:
- You are technical, precise, and slightly "cyberpunk" in tone (matching the Valid8 brand).
- You don't just explain errors; you FIX them.
- You are authoritative but helpful.

TASK:
Analyze the provided log entry (and optional context).
1. Identify the root cause.
2. If it's a code error, suggest the specific code change using markdown code blocks.
3. If it's an operational issue (e.g. API down), suggest mitigation steps.

OUTPUT FORMAT:
Return a concise markdown response.
Start with a "🔍 DIAGNOSIS" section, then "🛠️ RECOMMENDED FIX".
Use emoji to make it scannable.
`;

export async function analyzeLogEntry(logMessage: string, context?: string): Promise<string> {
    const userContent = `
LOG ENTRY:
${logMessage}

${context ? `CONTEXT/METADATA:\n${context}` : ""}

Analyze this error and tell me how to fix it.
`;

    try {
        const result = await invokeLLM({
            messages: [
                { role: "system", content: JULES_SYSTEM_PROMPT },
                { role: "user", content: userContent }
            ],
            max_tokens: 1000, // Keep it concise
        });

        const content = result.choices[0]?.message?.content;
        return typeof content === "string" ? content : "Analysis failed: No content returned.";

    } catch (error) {
        console.error("Jules analysis failed:", error);
        return "⚠️ Jules is currently offline or unable to process this request. Check backend logs.";
    }
}

export const aiLogSentinel = {
    analyzeInternally: async (message: string, meta?: any) => {
        const context = meta ? JSON.stringify(meta) : undefined;
        return analyzeLogEntry(message, context);
    }
};
