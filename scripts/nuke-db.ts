
import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.production.local' });

async function nukeDb() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("DATABASE_URL is not defined");
        process.exit(1);
    }

    console.log("Connecting to database for NUKE operation...");
    const connection = await createConnection(connectionString);

    try {
        // Loop to ensure everything is gone (retries for foreign key constraints complexity)
        for (let attempt = 1; attempt <= 3; attempt++) {
            const [tables] = await connection.query('SHOW TABLES');
            const tableNames = (tables as any[]).map(row => Object.values(row)[0]);

            if (tableNames.length === 0) {
                console.log("Transformation Complete: Database is empty.");
                return;
            }

            console.log(`[Attempt ${attempt}] Found ${tableNames.length} tables. DESTROYING...`);

            // Disable foreign key checks globally for this session
            await connection.query('SET FOREIGN_KEY_CHECKS = 0');

            for (const table of tableNames) {
                process.stdout.write(`Dropping ${table}... `);
                try {
                    await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
                    console.log("✅");
                } catch (e: any) {
                    console.log(`❌ (${e.message})`);
                }
            }

            await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        }

        // Final check
        const [finalTables] = await connection.query('SHOW TABLES');
        if ((finalTables as any[]).length > 0) {
            console.error("FAILED to nuke all tables. Some still exist.");
            process.exit(1);
        }

    } catch (error) {
        console.error("Error nuking database:", error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

nukeDb();
