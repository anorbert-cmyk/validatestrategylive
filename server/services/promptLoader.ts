import fs from 'fs';
import path from 'path';

// Define the structure of our prompt repository
interface PromptCache {
    [key: string]: string;
}

class PromptLoader {
    private cache: PromptCache = {};
    private promptsDir: string;
    private isLoaded: boolean = false;

    constructor() {
        // Determine prompts directory relative to this service file
        // Assuming this file is in server/services/
        // And prompts are in project_root/prompts/
        this.promptsDir = path.resolve(__dirname, '../../prompts');
    }

    /**
     * Synchronously load all prompts into memory.
     * This must be called at server startup.
     */
    public loadAll(): void {
        console.log('[PromptLoader] Loading prompts from:', this.promptsDir);

        try {
            this.loadTier('observer', ['system', 'viability_check']);
            this.loadTier('insider', ['system', 'part1_discovery', 'part2_strategy']);
            this.loadTier('syndicate', [
                'system',
                'part1_discovery',
                'part2_competitor',
                'part3_roadmap',
                'part4_design',
                'part5_advanced_design',
                'part6_risk'
            ]);

            this.isLoaded = true;
            console.log(`[PromptLoader] Successfully loaded ${Object.keys(this.cache).length} prompts.`);
        } catch (error) {
            console.error('[PromptLoader] Failed to load prompts:', error);
            throw error; // Critical failure, server should not start if prompts are missing
        }
    }

    private loadTier(tier: string, files: string[]) {
        files.forEach(file => {
            const filePath = path.join(this.promptsDir, tier, `${file}.md`);
            try {
                if (!fs.existsSync(filePath)) {
                    throw new Error(`Prompt file not found: ${filePath}`);
                }
                const content = fs.readFileSync(filePath, 'utf-8');
                this.cache[`${tier}/${file}`] = content;
            } catch (err) {
                console.error(`[PromptLoader] Error reading ${filePath}:`, err);
                throw err;
            }
        });
    }

    /**
     * Get a raw prompt template content by key (e.g., "observer/system")
     */
    public get(key: string): string {
        if (!this.isLoaded) {
            // Auto-load if accessed before explicit load (development convenience)
            // In production, explicit initialization is preferred
            this.loadAll();
        }

        const content = this.cache[key];
        if (!content) {
            throw new Error(`Prompt template not found for key: ${key}`);
        }
        return content;
    }

    /**
     * Helper to replace {{PLACEHOLDERS}} in the content
     */
    public populate(key: string, replacements: Record<string, string>): string {
        let content = this.get(key);
        for (const [placeholder, value] of Object.entries(replacements)) {
            // Replace all occurrences of {{PLACEHOLDER}}
            const regex = new RegExp(`{{${placeholder}}}`, 'g');
            content = content.replace(regex, value);
        }
        return content;
    }
}

export const promptLoader = new PromptLoader();
