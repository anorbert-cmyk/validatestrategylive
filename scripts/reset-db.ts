
import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.production.local' });

async function resetDb() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("DATABASE_URL is not defined");
        process.exit(1);
    }

    console.log("Connecting to database...");
    const connection = await createConnection(connectionString);

    try {
        const [tables] = await connection.query('SHOW TABLES');
        const tableNames = (tables as any[]).map(row => Object.values(row)[0]);

        if (tableNames.length === 0) {
            console.log("No tables found.");
            return;
        }

        console.log(`Found ${tableNames.length} tables. Dropping...`);

        // Disable foreign key checks to allow dropping tables in any order
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        for (const table of tableNames) {
            console.log(`Dropping table: ${table}`);
            await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
        }

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log("All tables dropped successfully.");
    } catch (error) {
        console.error("Error resetting database:", error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

resetDb();
