const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').find(l => l.startsWith('DATABASE_URL=')).split('=')[1].trim().replace(/\"/g, '');
const { Client } = require('pg');
const client = new Client({ connectionString: env, ssl: { rejectUnauthorized: false } });

async function run() {
  await client.connect();
  await client.query('ALTER TABLE push_subscriptions DROP COLUMN IF EXISTS sec_enabled, DROP COLUMN IF EXISTS only_validated;');
  await client.query('ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS intensity_enabled BOOLEAN NOT NULL DEFAULT true;');
  await client.query('ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS rising_enabled BOOLEAN NOT NULL DEFAULT true;');
  console.log('Done altering database');
  await client.end();
}
run().catch(console.error);
