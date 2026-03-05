import * as path from 'path';
import * as dotenv from 'dotenv';
import { Client } from 'pg';
import { execSync } from 'child_process';

function withSchema(baseUrl: string, schema: string) {
  const url = new URL(baseUrl);
  url.searchParams.set('schema', schema);
  return url.toString();
}

export default async function globalSetup() {
  dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) throw new Error('Missing DATABASE_URL in .env.test');

  const schema = `test_${Date.now()}`;
  const testUrl = withSchema(baseUrl, schema);

  //persist schema name for teardown
  process.env.DATABASE_URL = testUrl;
  process.env.DIRECT_DATABASE_URL = testUrl;

  //create schema
  const client = new Client({ connectionString: baseUrl });
  await client.connect();
  await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}";`);
  await client.end();

  //rum migrations against the schema
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: testUrl, DIRECT_DATABASE: testUrl },
  });

  //write schema to file for teardown
  const fs = await import('fs');
  fs.writeFileSync(path.resolve(__dirname, './.test-schema'), schema, 'utf8');
}
