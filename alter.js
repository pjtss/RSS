const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').find(l => l.startsWith('DATABASE_URL=')).split('=')[1].trim().replace(/\"/g, '');
const { Client } = require('pg');
const client = new Client({ connectionString: env, ssl: { rejectUnauthorized: false } });

async function run() {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS "us_intensity_stocks" (
      "code" text PRIMARY KEY NOT NULL,
      "company" text NOT NULL,
      "intensity" integer NOT NULL,
      "price" text NOT NULL,
      "change_rate" text NOT NULL,
      "added_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);
  console.log('Done creating table us_intensity_stocks');
  await client.end();
}
run().catch(console.error);
