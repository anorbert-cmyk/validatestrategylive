import { describe, it, expect } from 'vitest';
import {
    OBSERVER_SYSTEM_PROMPT,
    getObserverPrompt,
    INSIDER_SYSTEM_PROMPT,
    getInsiderInitialPrompt,
    getInsiderContinuePrompt,
    SYNDICATE_SYSTEM_PROMPT,
    getSyndicateInitialPrompt,
    getSyndicateContinuePrompt,
    getTierPromptConfig,
    TIER_PART_CONFIG,
} from './tierPromptService';
import { Tier } from '../../shared/pricing';

/**
 * Integration Tests for tierPromptService
 * 
 * These tests verify that the tierPromptService properly serves prompts
 * loaded from external Markdown files via PromptLoader.
 * 
 * Tests cover:
 * 1. Exported constants are properly loaded
 * 2. Prompt generation functions work correctly
 * 3. getTierPromptConfig returns correct structures
 * 4. Edge cases and error handling
 */

describe('tierPromptService Integration', () => {

    // Observer Tier Tests
    describe('Observer Tier (standard)', () => {
        it('should export OBSERVER_SYSTEM_PROMPT as a non-empty string', () => {
            expect(OBSERVER_SYSTEM_PROMPT).toBeDefined();
            expect(typeof OBSERVER_SYSTEM_PROMPT).toBe('string');
            expect(OBSERVER_SYSTEM_PROMPT.length).toBeGreaterThan(100);
        });

        it('should contain Observer-specific content in system prompt', () => {
            expect(OBSERVER_SYSTEM_PROMPT).toContain('experienced UX strategist');
            expect(OBSERVER_SYSTEM_PROMPT).toContain('viability assessment');
        });

        it('should generate observer prompt with problem statement', () => {
            const problem = "Testing the Observer tier prompt generation";
            const prompt = getObserverPrompt(problem);

            expect(prompt).toContain(problem);
            expect(prompt).not.toContain('{{PROBLEM}}');
        });

        it('should handle special characters in observer problem', () => {
            const problem = "Problem with <script> & special $chars";
            const prompt = getObserverPrompt(problem);
            expect(prompt).toContain(problem);
        });
    });

    // Insider Tier Tests
    describe('Insider Tier (medium)', () => {
        it('should export INSIDER_SYSTEM_PROMPT as a non-empty string', () => {
            expect(INSIDER_SYSTEM_PROMPT).toBeDefined();
            expect(typeof INSIDER_SYSTEM_PROMPT).toBe('string');
            expect(INSIDER_SYSTEM_PROMPT.length).toBeGreaterThan(100);
        });

        it('should contain Insider-specific content in system prompt', () => {
            expect(INSIDER_SYSTEM_PROMPT).toContain('elite UX strategist');
            expect(INSIDER_SYSTEM_PROMPT).toContain('15+ years');
        });

        it('should generate insider initial prompt with problem statement', () => {
            const problem = "Testing the Insider tier Part 1";
            const prompt = getInsiderInitialPrompt(problem);

            expect(prompt).toContain(problem);
            expect(prompt).not.toContain('{{PROBLEM}}');
        });

        it('should generate insider continue prompt for part 2', () => {
            const prompt = getInsiderContinuePrompt(2);

            expect(prompt).toBeDefined();
            expect(prompt.length).toBeGreaterThan(50);
        });
    });

    // Syndicate Tier Tests
    describe('Syndicate Tier (full)', () => {
        it('should export SYNDICATE_SYSTEM_PROMPT as a non-empty string', () => {
            expect(SYNDICATE_SYSTEM_PROMPT).toBeDefined();
            expect(typeof SYNDICATE_SYSTEM_PROMPT).toBe('string');
            expect(SYNDICATE_SYSTEM_PROMPT.length).toBeGreaterThan(100);
        });

        it('should generate syndicate initial prompt with problem statement', () => {
            const problem = "Testing the Syndicate tier Part 1";
            const prompt = getSyndicateInitialPrompt(problem);

            expect(prompt).toContain(problem);
            expect(prompt).not.toContain('{{PROBLEM}}');
        });

        it('should generate syndicate continue prompts for parts 2-6', () => {
            const previousSummary = "Summary from previous parts";

            for (let part = 2; part <= 6; part++) {
                const prompt = getSyndicateContinuePrompt(part, previousSummary);

                expect(prompt, `Part ${part} should be defined`).toBeDefined();
                expect(prompt.length, `Part ${part} should have content`).toBeGreaterThan(100);
                expect(prompt, `Part ${part} should contain summary`).toContain(previousSummary);
                expect(prompt, `Part ${part} should not have raw placeholder`).not.toContain('{{PREVIOUS_SUMMARY}}');
            }
        });

        it('should throw error for invalid syndicate part number', () => {
            expect(() => getSyndicateContinuePrompt(0, "summary")).toThrow('Invalid Syndicate part number');
            expect(() => getSyndicateContinuePrompt(1, "summary")).toThrow('Invalid Syndicate part number'); // Part 1 uses initial prompt
            expect(() => getSyndicateContinuePrompt(7, "summary")).toThrow('Invalid Syndicate part number');
            expect(() => getSyndicateContinuePrompt(99, "summary")).toThrow('Invalid Syndicate part number');
        });

        it('should handle empty previousSummary', () => {
            const prompt = getSyndicateContinuePrompt(2, "");
            expect(prompt).toBeDefined();
            expect(prompt).not.toContain('{{PREVIOUS_SUMMARY}}');
        });
    });

    // getTierPromptConfig Tests
    describe('getTierPromptConfig', () => {
        it('should return correct config for standard tier', () => {
            const config = getTierPromptConfig('standard');

            expect(config.systemPrompt).toBe(OBSERVER_SYSTEM_PROMPT);
            expect(config.parts).toBe(1);
            expect(config.getInitialPrompt).toBe(getObserverPrompt);
            expect(config.getContinuePrompt).toBeNull();
        });

        it('should return correct config for medium tier', () => {
            const config = getTierPromptConfig('medium');

            expect(config.systemPrompt).toBe(INSIDER_SYSTEM_PROMPT);
            expect(config.parts).toBe(2);
            expect(config.getInitialPrompt).toBe(getInsiderInitialPrompt);
            expect(config.getContinuePrompt).toBe(getInsiderContinuePrompt);
        });

        it('should return correct config for full tier', () => {
            const config = getTierPromptConfig('full');

            expect(config.systemPrompt).toBe(SYNDICATE_SYSTEM_PROMPT);
            expect(config.parts).toBe(6);
            expect(config.getInitialPrompt).toBe(getSyndicateInitialPrompt);
            expect(config.getContinuePrompt).toBe(getSyndicateContinuePrompt);
        });

        it('should throw error for unknown tier', () => {
            expect(() => getTierPromptConfig('unknown' as Tier)).toThrow('Unknown tier');
        });
    });

    // TIER_PART_CONFIG Tests
    describe('TIER_PART_CONFIG', () => {
        it('should have correct observer configuration', () => {
            expect(TIER_PART_CONFIG.observer.parts).toBe(1);
            expect(TIER_PART_CONFIG.observer.tokensPerPart).toBe(3000);
        });

        it('should have correct insider configuration', () => {
            expect(TIER_PART_CONFIG.insider.parts).toBe(2);
            expect(TIER_PART_CONFIG.insider.tokensPerPart).toBe(5000);
        });

        it('should have correct syndicate configuration', () => {
            expect(TIER_PART_CONFIG.syndicate.parts).toBe(6);
            expect(TIER_PART_CONFIG.syndicate.tokensPerPart).toBe(6000);
        });
    });

    // Content Fidelity Tests
    describe('Content Fidelity', () => {
        it('should not have placeholder artifacts in generated prompts', () => {
            const problem = "Test problem statement";

            const observerPrompt = getObserverPrompt(problem);
            const insiderPrompt = getInsiderInitialPrompt(problem);
            const syndicatePrompt = getSyndicateInitialPrompt(problem);

            [observerPrompt, insiderPrompt, syndicatePrompt].forEach(prompt => {
                expect(prompt).not.toContain('{{');
                expect(prompt).not.toContain('}}');
            });
        });

        it('should maintain proper prompt structure after loading from files', () => {
            // Verify key structural elements are present
            expect(OBSERVER_SYSTEM_PROMPT).toContain('DESIGN ETHOS');
            expect(INSIDER_SYSTEM_PROMPT).toContain('DESIGN ETHOS');
            expect(SYNDICATE_SYSTEM_PROMPT).toContain('DESIGN ETHOS');
        });
    });
});
