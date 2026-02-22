import 'dotenv/config';
import fs from 'fs';
// global fetch is available in modern Node versions

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const API_KEY = process.env.SUPABASE_ACCESS_TOKEN;
const SQL_FILE = 'supabase_setup.sql';

if (!PROJECT_REF || !API_KEY) {
    throw new Error('Missing SUPABASE_PROJECT_REF or SUPABASE_ACCESS_TOKEN in environment.');
}

async function runMigration() {
    try {
        console.log('Reading SQL file...');
        const sql = fs.readFileSync(SQL_FILE, 'utf8');

        console.log('Sending SQL to Supabase Management API...');
        // Try the standard Management API endpoint for running queries
        // Note: This endpoint usually requires a Personal Access Token.
        // We are testing if this "sb_secret" key works here.
        const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({ query: sql })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`API Request Failed: ${response.status} ${response.statusText} - ${text}`);
        }

        const result = await response.json();
        console.log('Migration successful!');
        console.log('Result:', JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
