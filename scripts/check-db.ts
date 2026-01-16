
import { createConnection } from 'mysql2/promise';

async function checkDb() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("DATABASE_URL is not defined");
        process.exit(1);
    }

    console.log("Connecting to database to check tables...");
    console.log("URL:", connectionString.replace(/:[^:@]+@/, ':***@')); // Log masked URL to check host/db

    const connection = await createConnection(connectionString);

    try {
        const [tables] = await connection.query('SHOW TABLES');
        const tableNames = (tables as any[]).map(row => Object.values(row)[0]);

        console.log(`Found ${tableNames.length} tables:`);
        tableNames.forEach(t => console.log(`- ${t}`));

    } catch (error) {
        console.error("Error checking database:", error);
    } finally {
        await connection.end();
    }
}

checkDb();
