/**
 * CSV Import Script for PlanetScale Migration
 * Run with: npx tsx scripts/import-csv.ts
 * 
 * Prerequisites:
 * - Set DATABASE_URL environment variable
 * - CSV files in db/ folder
 */
import "dotenv/config";
import { parse } from "csv-parse/sync";
import fs from "fs";
import path from "path";
import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const DB_FOLDER = path.join(process.cwd(), "db");

// Table import order (respects foreign key dependencies)
const IMPORT_ORDER = [
    "users",
    "admin_wallets", // if exists
    "analysis_sessions",
    "purchases",
    "analysis_results",
    "analysis_operations",
    "analysis_operation_events",
    "email_subscribers",
    "email_sequence_status",
    "email_opens",
    "admin_challenges",
    "admin_notifications",
    "admin_audit_log",
    "used_signatures",
    "processed_webhooks",
    "retry_queue",
    "circuit_breaker_state",
    "hourly_metrics",
    "platform_stats",
];

function findCsvFile(tableName: string): string | null {
    const files = fs.readdirSync(DB_FOLDER);
    const match = files.find(f => f.startsWith(tableName + "_") && f.endsWith(".csv"));
    return match ? path.join(DB_FOLDER, match) : null;
}

function parseCSV(filePath: string): Record<string, unknown>[] {
    const content = fs.readFileSync(filePath, "utf-8");
    return parse(content, {
        columns: true,
        skip_empty_lines: true,
        cast: (value, context) => {
            if (value === "") return null;
            if (value === "0") return context.column === "isActive" || context.column === "isPriority" ? false : 0;
            if (value === "1") return context.column === "isActive" || context.column === "isPriority" ? true : 1;
            return value;
        },
    });
}

function escapeValue(value: unknown): string {
    if (value === null || value === undefined) return "NULL";
    if (typeof value === "boolean") return value ? "1" : "0";
    if (typeof value === "number") return String(value);
    if (typeof value === "string") {
        // Escape single quotes and backslashes
        return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
    }
    return `'${String(value)}'`;
}

async function importTable(db: ReturnType<typeof drizzle>, tableName: string, records: Record<string, unknown>[]) {
    if (records.length === 0) {
        console.log(`  ⏭️  ${tableName}: No records to import`);
        return;
    }

    const columns = Object.keys(records[0]);
    const columnList = columns.map(c => `\`${c}\``).join(", ");

    // Batch insert in chunks of 100
    const BATCH_SIZE = 100;
    let imported = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        const values = batch.map(record => {
            const vals = columns.map(col => escapeValue(record[col]));
            return `(${vals.join(", ")})`;
        }).join(",\n");

        const query = `INSERT INTO \`${tableName}\` (${columnList}) VALUES ${values}`;

        try {
            await db.execute(sql.raw(query));
            imported += batch.length;
        } catch (error: any) {
            if (error.code === "ER_DUP_ENTRY") {
                console.log(`  ⚠️  ${tableName}: Skipping duplicates in batch ${i}-${i + batch.length}`);
            } else {
                throw error;
            }
        }
    }

    console.log(`  ✅ ${tableName}: ${imported} records imported`);
}

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL environment variable is required");
        process.exit(1);
    }

    console.log("🚀 Starting CSV import to PlanetScale...\n");

    const db = drizzle(process.env.DATABASE_URL);

    for (const tableName of IMPORT_ORDER) {
        const csvPath = findCsvFile(tableName);

        if (!csvPath) {
            console.log(`  ⏭️  ${tableName}: No CSV file found`);
            continue;
        }

        try {
            const records = parseCSV(csvPath);
            await importTable(db, tableName, records);
        } catch (error) {
            console.error(`  ❌ ${tableName}: Import failed:`, error);
        }
    }

    console.log("\n✅ Import complete!");
}

main().catch(console.error);
