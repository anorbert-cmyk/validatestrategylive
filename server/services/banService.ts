import fs from "fs";
import path from "path";

// Persistence file
const BANS_FILE = path.join(process.cwd(), "server", "bans.json");

interface BanData {
    [walletAddress: string]: {
        failedAttempts: number;
        lastAttempt: number;
        bannedUntil?: number;
    };
}

// In-memory cache to reduce IO
let banCache: BanData = {};

// Load on startup
try {
    if (fs.existsSync(BANS_FILE)) {
        banCache = JSON.parse(fs.readFileSync(BANS_FILE, "utf-8"));
    }
} catch (e) {
    console.error("Failed to load bans.json", e);
    banCache = {};
}

function saveBans() {
    try {
        fs.writeFileSync(BANS_FILE, JSON.stringify(banCache, null, 2));
    } catch (e) {
        console.error("Failed to save bans.json", e);
    }
}

export const BanService = {
    checkBan: (walletAddress: string) => {
        const normalized = walletAddress.toLowerCase();
        const data = banCache[normalized];

        if (data?.bannedUntil && Date.now() < data.bannedUntil) {
            const remainingMinutes = Math.ceil((data.bannedUntil - Date.now()) / 60000);
            throw new Error(`Wallet BANNED for security violation. Try again in ${remainingMinutes} minutes.`);
        }
    },

    recordFailedAttempt: (walletAddress: string) => {
        const normalized = walletAddress.toLowerCase();
        const now = Date.now();

        if (!banCache[normalized]) {
            banCache[normalized] = { failedAttempts: 0, lastAttempt: now };
        }

        // Reset counter if last attempt was long ago (e.g., 1 hour)
        if (now - banCache[normalized].lastAttempt > 60 * 60 * 1000) {
            banCache[normalized].failedAttempts = 0;
        }

        banCache[normalized].failedAttempts++;
        banCache[normalized].lastAttempt = now;

        // BAN LOGIC: 2 strikes
        if (banCache[normalized].failedAttempts >= 2) {
            // Ban for 24 hours
            banCache[normalized].bannedUntil = now + 24 * 60 * 60 * 1000;
            console.warn(`[SECURITY] Auto-banning wallet ${normalized} after 2 failed attempts.`);
        }

        saveBans();
    },

    resetAttempts: (walletAddress: string) => {
        const normalized = walletAddress.toLowerCase();
        if (banCache[normalized]) {
            delete banCache[normalized];
            saveBans();
        }
    }
};
