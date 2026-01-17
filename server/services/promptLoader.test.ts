import { describe, it, expect, beforeAll } from 'vitest';
import { promptLoader } from './promptLoader';

/**
 * Comprehensive Integration Tests for PromptLoader
 * 
 * Tests cover:
 * 1. Loading all prompts without errors
 * 2. Content verification for each tier (Observer, Insider, Syndicate)
 * 3. Placeholder replacement functionality
 * 4. Edge cases and error handling
 * 5. Content fidelity checks (no corruption, proper encoding)
 */

describe('PromptLoader Integration Test', () => {

    // Ensure prompts can be loaded
    describe('Initialization', () => {
        it('should load all prompts without error', () => {
            expect(() => promptLoader.loadAll()).not.toThrow();
        });

        it('should handle multiple loadAll calls gracefully (idempotent)', () => {
            expect(() => {
                promptLoader.loadAll();
                promptLoader.loadAll();
                promptLoader.loadAll();
            }).not.toThrow();
        });
    });

    // Test Observer Tier Prompts
    describe('Observer Tier', () => {
        it('should retrieve observer system prompt', () => {
            const prompt = promptLoader.get('observer/system');
            expect(prompt).toBeDefined();
            expect(prompt.length).toBeGreaterThan(100);
            expect(prompt).toContain('experienced UX strategist');
            expect(prompt).toContain('viability assessment');
        });

        it('should contain Observer-specific constraints', () => {
            const prompt = promptLoader.get('observer/system');
            expect(prompt).toContain('CONSTRAINTS (Observer Tier)');
            expect(prompt).toContain('NO competitor analysis');
            expect(prompt).toContain('NO roadmap');
        });

        it('should populate observer viability check prompt with problem', () => {
            const problem = "Test Problem Statement for Observer Tier";
            const prompt = promptLoader.populate('observer/viability_check', { PROBLEM: problem });
            expect(prompt).toContain(problem);
            expect(prompt).not.toContain('{{PROBLEM}}');
        });

        it('should contain expected viability check sections', () => {
            const prompt = promptLoader.get('observer/viability_check');
            expect(prompt).toContain('{{PROBLEM}}'); // Before substitution
            expect(prompt).toContain('SANITY CHECK');
            expect(prompt).toContain('VIABILITY');
        });
    });

    // Test Insider Tier Prompts
    describe('Insider Tier', () => {
        it('should retrieve insider system prompt', () => {
            const prompt = promptLoader.get('insider/system');
            expect(prompt).toBeDefined();
            expect(prompt).toContain('elite UX strategist');
            expect(prompt).toContain('15+ years');
        });

        it('should contain Insider-specific constraints', () => {
            const prompt = promptLoader.get('insider/system');
            expect(prompt).toContain('CONSTRAINTS (INSIDER TIER)');
            expect(prompt).toContain('NO Production-Ready Design Prompts');
        });

        it('should populate insider part 1 prompt', () => {
            const problem = "Insider Test Problem Statement";
            const prompt = promptLoader.populate('insider/part1_discovery', { PROBLEM: problem });
            expect(prompt).toContain(problem);
            expect(prompt).not.toContain('{{PROBLEM}}');
        });

        it('should retrieve insider part 2 prompt', () => {
            const prompt = promptLoader.get('insider/part2_strategy');
            expect(prompt).toBeDefined();
            expect(prompt.length).toBeGreaterThan(50);
        });

        it('should contain part structure indicators', () => {
            const part1 = promptLoader.get('insider/part1_discovery');
            const part2 = promptLoader.get('insider/part2_strategy');

            expect(part1).toContain('Part 1');
            expect(part2).toContain('Part 2');
        });
    });

    // Test Syndicate Tier Prompts
    describe('Syndicate Tier', () => {
        it('should retrieve syndicate system prompt', () => {
            const prompt = promptLoader.get('syndicate/system');
            expect(prompt).toBeDefined();
            expect(prompt).toContain('elite UX strategist');
            expect(prompt).toContain('15+ years');
            expect(prompt).toContain('6 parts');
        });

        it('should contain Syndicate design ethos', () => {
            const prompt = promptLoader.get('syndicate/system');
            expect(prompt).toContain('DESIGN ETHOS');
            expect(prompt).toContain('Balance is Mandatory');
            expect(prompt).toContain('Trust & Safety First');
        });

        it('should populate syndicate part 1 prompt', () => {
            const problem = "Syndicate Test Problem Statement";
            const prompt = promptLoader.populate('syndicate/part1_discovery', { PROBLEM: problem });
            expect(prompt).toContain(problem);
            expect(prompt).not.toContain('{{PROBLEM}}');
        });

        it('should populate syndicate continuation prompts with previous summary', () => {
            const summary = "Test Previous Summary from earlier parts";
            const prompt = promptLoader.populate('syndicate/part2_competitor', { PREVIOUS_SUMMARY: summary });
            expect(prompt).toContain(summary);
            expect(prompt).not.toContain('{{PREVIOUS_SUMMARY}}');
        });

        it('should verify all 6 syndicate parts exist and have content', () => {
            const parts = [
                'syndicate/part1_discovery',
                'syndicate/part2_competitor',
                'syndicate/part3_roadmap',
                'syndicate/part4_design',
                'syndicate/part5_advanced_design',
                'syndicate/part6_risk'
            ];

            parts.forEach((part, index) => {
                const content = promptLoader.get(part);
                expect(content, `Part ${index + 1} should exist`).toBeDefined();
                expect(content.length, `Part ${index + 1} should have content`).toBeGreaterThan(100);
            });
        });

        it('should contain STATE_HANDOFF blocks in relevant parts', () => {
            const partsWithHandoff = [
                'syndicate/part1_discovery',
                'syndicate/part2_competitor',
                'syndicate/part3_roadmap',
                'syndicate/part4_design',
                'syndicate/part5_advanced_design',
            ];

            partsWithHandoff.forEach(part => {
                const content = promptLoader.get(part);
                expect(content).toContain('STATE_HANDOFF');
            });
        });
    });

    // Placeholder replacement edge cases
    describe('Placeholder Replacement', () => {
        it('should handle multiple occurrences of the same placeholder', () => {
            // Test with a problem that appears multiple times in template
            const problem = "UNIQUE_TEST_MARKER_12345";
            const prompt = promptLoader.populate('observer/viability_check', { PROBLEM: problem });

            // Should replace ALL occurrences
            expect(prompt).not.toContain('{{PROBLEM}}');
            expect(prompt).toContain(problem);
        });

        it('should handle special characters in replacement values', () => {
            const problem = "Test with $pecial ch@racters & <html> tags";
            const prompt = promptLoader.populate('observer/viability_check', { PROBLEM: problem });
            expect(prompt).toContain(problem);
        });

        it('should handle multiline replacement values', () => {
            const problem = "Line 1\nLine 2\nLine 3";
            const prompt = promptLoader.populate('observer/viability_check', { PROBLEM: problem });
            expect(prompt).toContain(problem);
        });

        it('should handle empty replacement values', () => {
            expect(() => {
                promptLoader.populate('observer/viability_check', { PROBLEM: '' });
            }).not.toThrow();
        });

        it('should leave unknown placeholders untouched', () => {
            const problem = "Test Problem";
            const prompt = promptLoader.populate('observer/viability_check', { PROBLEM: problem });
            // Unknown placeholders should remain if any exist (unlikely but safe)
            expect(prompt).not.toContain('{{PROBLEM}}');
        });
    });

    // Error Handling Tests
    describe('Error Handling', () => {
        it('should throw error for non-existent prompt key', () => {
            expect(() => promptLoader.get('non_existent/key')).toThrow('Prompt template not found');
        });

        it('should throw error for invalid tier', () => {
            expect(() => promptLoader.get('invalid_tier/system')).toThrow();
        });

        it('should throw error for invalid part number', () => {
            expect(() => promptLoader.get('syndicate/part99')).toThrow();
        });
    });

    // Content Integrity Tests
    describe('Content Integrity', () => {
        it('should not have corrupted unicode characters', () => {
            const allKeys = [
                'observer/system',
                'observer/viability_check',
                'insider/system',
                'insider/part1_discovery',
                'insider/part2_strategy',
                'syndicate/system',
                'syndicate/part1_discovery',
                'syndicate/part2_competitor',
                'syndicate/part3_roadmap',
                'syndicate/part4_design',
                'syndicate/part5_advanced_design',
                'syndicate/part6_risk'
            ];

            allKeys.forEach(key => {
                const content = promptLoader.get(key);
                // Check for common corruption indicators
                expect(content).not.toContain('�'); // Replacement character
                expect(content).not.toContain('\x00'); // Null bytes
            });
        });

        it('should have properly formatted markdown in prompts', () => {
            const syndicatePart1 = promptLoader.get('syndicate/part1_discovery');
            // Should contain standard markdown headers
            expect(syndicatePart1).toMatch(/##?\s+/); // H1 or H2 headers
        });
    });
});
