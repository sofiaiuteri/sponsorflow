// Creates the SponsorFlow tables. Safe to run repeatedly.
// Usage: node --env-file=.env.local scripts/migrate.mjs
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
await sql`
  CREATE TABLE IF NOT EXISTS lists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(12), 'hex'),
    publication text NOT NULL,
    summary text NOT NULL DEFAULT '',
    plan text NOT NULL DEFAULT 'list',
    customer_email text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;
await sql`
  CREATE TABLE IF NOT EXISTS prospects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id uuid NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    position int NOT NULL DEFAULT 0,
    brand text NOT NULL,
    category text NOT NULL DEFAULT '',
    fit text NOT NULL DEFAULT 'Medium',
    why text NOT NULL DEFAULT '',
    angle text NOT NULL DEFAULT '',
    opener text NOT NULL DEFAULT '',
    contact text NOT NULL DEFAULT '',
    reach text NOT NULL DEFAULT '',
    evidence text NOT NULL DEFAULT '',
    status text NOT NULL DEFAULT 'Prospect',
    notes text NOT NULL DEFAULT '',
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;
await sql`CREATE INDEX IF NOT EXISTS prospects_list_idx ON prospects(list_id, position)`;
console.log("tables ready");
