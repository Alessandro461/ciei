import { pool } from './db';

async function run() {
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log("Tables in database:");
        res.rows.forEach(row => {
            console.log(`- ${row.table_name}`);
        });
        
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

run();
