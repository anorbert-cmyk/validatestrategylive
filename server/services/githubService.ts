
const GITHUB_API_URL = "https://api.github.com";

interface PullRequestParams {
    owner: string;
    repo: string;
    title: string;
    body: string;
    head: string;
    base: string;
}

interface CreateFileParams {
    owner: string;
    repo: string;
    path: string;
    message: string;
    content: string; // Base64 encoded
    branch: string;
}

interface CreateBranchParams {
    owner: string;
    repo: string;
    ref: string;
    sha: string;
}

/**
 * Valid8 GitHub Service
 * Manages automated PR creation for Jules fixes.
 */
export const githubService = {
    /**
     * Get main branch SHA
     */
    async getRef(owner: string, repo: string, ref: string = "heads/main"): Promise<string | null> {
        const token = process.env.GITHUB_TOKEN;
        if (!token) return null;

        try {
            const res = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/git/ref/${ref}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/vnd.github.v3+json"
                }
            });

            if (!res.ok) return null;
            const data = await res.json();
            return data.object.sha;
        } catch (e) {
            console.error("[GitHub] Failed to get ref:", e);
            return null;
        }
    },

    /**
     * Create a new branch
     */
    async createBranch(params: CreateBranchParams): Promise<boolean> {
        const token = process.env.GITHUB_TOKEN;
        if (!token) return false;

        try {
            const res = await fetch(`${GITHUB_API_URL}/repos/${params.owner}/${params.repo}/git/refs`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/vnd.github.v3+json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ref: `refs/heads/${params.ref}`,
                    sha: params.sha
                })
            });

            return res.ok;
        } catch (e) {
            console.error("[GitHub] Failed to create branch:", e);
            return false;
        }
    },

    /**
     * Create or update a file (Commit)
     */
    async createFile(params: CreateFileParams): Promise<boolean> {
        const token = process.env.GITHUB_TOKEN;
        if (!token) return false;

        try {
            const res = await fetch(`${GITHUB_API_URL}/repos/${params.owner}/${params.repo}/contents/${params.path}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/vnd.github.v3+json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: params.message,
                    content: params.content,
                    branch: params.branch
                })
            });

            return res.ok;
        } catch (e) {
            console.error("[GitHub] Failed to create file:", e);
            return false;
        }
    },

    /**
     * Open a Pull Request
     */
    async createPR(params: PullRequestParams): Promise<string | null> {
        const token = process.env.GITHUB_TOKEN;
        if (!token) return null;

        try {
            const res = await fetch(`${GITHUB_API_URL}/repos/${params.owner}/${params.repo}/pulls`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/vnd.github.v3+json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(params)
            });

            if (!res.ok) {
                const err = await res.text();
                console.error("[GitHub] Failed to create PR:", err);
                return null;
            }

            const data = await res.json();
            return data.html_url;
        } catch (e) {
            console.error("[GitHub] Error creating PR:", e);
            return null;
        }
    }
};
