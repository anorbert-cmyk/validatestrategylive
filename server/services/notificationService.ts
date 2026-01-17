import { sendEmail } from "./emailService";
import { githubService } from "./githubService";
import { LogEntry } from "../routers/adminLogRouter"; // Type import only

/**
 * Jules Notification Orchestrator
 * Handles the "Active Response" when a critical error is analyzed.
 */
export const notificationService = {

    /**
     * Notify Admin about a fix recommendation
     */
    async notifyFixReady(logEntry: LogEntry, analysis: string) {
        // 1. Send Email Alert
        await this.sendEmailAlert(logEntry, analysis);

        // 2. Create GitHub PR (if confident)
        // We only create PRs for extremely high confidence fixes to avoid noise
        if (analysis && analysis.includes("CONFIDENCE: HIGH")) {
            await this.createFixPR(logEntry, analysis);
        }
    },

    /**
     * Send Email Alert via Resend
     */
    async sendEmailAlert(logEntry: LogEntry, analysis: string) {
        const adminEmail = process.env.ADMIN_EMAIL || "norbertbarna@proton.me"; // Default to owner

        await sendEmail(adminEmail, {
            subject: `🚨 Jules Alert: Critical Error in ${process.env.NODE_ENV || 'production'}`,
            html: `
        <h2>Jules Sentinel Report</h2>
        <p><strong>Error:</strong> ${logEntry.message}</p>
        <p><strong>Time:</strong> ${new Date(logEntry.timestamp).toISOString()}</p>
        <hr />
        <h3>Analysis & Fix Suggestion:</h3>
        <pre style="background: #f4f4f5; padding: 10px; border-radius: 5px;">${analysis}</pre>
        <br />
        <a href="https://validatestrategy.com/admin/logs">View in Admin Console</a>
      `,
            text: `Jules Alert: Error detected.\n\nMessage: ${logEntry.message}\n\nAnalysis:\n${analysis}`
        });
    },

    /**
     * Create GitHub PR with the suggested fix
     */
    async createFixPR(logEntry: LogEntry, analysis: string) {
        const owner = process.env.GITHUB_OWNER || "norbertbarna"; // Should be env
        const repo = process.env.GITHUB_REPO || "ValidateStrategyLive";

        // 1. Get Main SHA
        const mainSha = await githubService.getRef(owner, repo);
        if (!mainSha) return;

        // 2. Create Branch
        const branchName = `fix/jules-${Date.now()}`;
        const branchCreated = await githubService.createBranch({
            owner, repo, ref: branchName, sha: mainSha
        });

        if (!branchCreated) return;

        // 3. Create File (Mocking payload for now - real impl would parse the 'code block' from LLM)
        // For safety, we currently just create a report file, not actual code overwrite
        // until we have a parser for the LLM output.
        await githubService.createFile({
            owner, repo,
            path: `reports/jules-fix-${Date.now()}.md`,
            message: `docs: add jules analysis for error ${Date.now()}`,
            content: Buffer.from(`# Jules Analysis\n\n${analysis}`).toString("base64"),
            branch: branchName
        });

        // 4. Open PR
        await githubService.createPR({
            owner, repo,
            title: `fix: Jules Automated Fix for Error ${Date.now()}`,
            body: `## Automated Fix Suggestion\n\n**Error**: \`${logEntry.message}\`\n\n### Analysis\n${analysis}\n\n> This PR was created automatically by Jules Sentinel. Please review carefully.`,
            head: branchName,
            base: "main"
        });
    }
};
