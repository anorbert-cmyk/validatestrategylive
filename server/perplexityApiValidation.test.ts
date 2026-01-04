/**
 * Perplexity API Key Validation Test
 * Tests that the API key is valid by making a lightweight API call
 * Skipped if env var is not set.
 */

import { describe, it, expect } from "vitest";

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

describe("Perplexity API Key Validation", () => {
  const hasApiKey = !!process.env.PERPLEXITY_API_KEY;

  it.skipIf(!hasApiKey)("should have PERPLEXITY_API_KEY configured", () => {
    expect(process.env.PERPLEXITY_API_KEY).toBeDefined();
    expect(process.env.PERPLEXITY_API_KEY).not.toBe("");
  });

  it.skipIf(!hasApiKey)("should successfully authenticate with Perplexity API", async () => {
    const apiKey = process.env.PERPLEXITY_API_KEY;

    const response = await fetch(PERPLEXITY_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      if (response.status === 401) {
        throw new Error(`Invalid Perplexity API key: ${errorText}`);
      }

      if (response.status === 429) {
        // Rate limited but key is valid
        return;
      }

      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("choices");
    expect(data.choices).toBeInstanceOf(Array);
    expect(data.choices.length).toBeGreaterThan(0);
  }, 30000);
});
