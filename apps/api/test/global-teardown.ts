import * as path from 'path';
import * as dotenv from 'dotenv';
import { Client } from 'pg';
import * as fs from 'node:fs';

export default async function globalTeardown() {
  dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) throw new Error('Missing DATABASE_URL in .env.test');

  const schemaFile = path.resolve(__dirname, './.test-schema');
  const schema = fs.existsSync(schemaFile)
    ? fs.readFileSync(schemaFile, 'utf8').trim()
    : null;

  if (!schema) return;

  const client = new Client({ connectionString: baseUrl });
  await client.connect();
  await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE;`);
  await client.end();

  fs.unlinkSync(schemaFile);
}
