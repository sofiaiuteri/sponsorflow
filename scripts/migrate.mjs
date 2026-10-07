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
// AI research state (added 2026-10-07)
await sql`ALTER TABLE lists ADD COLUMN IF NOT EXISTS profile text NOT NULL DEFAULT ''`;
await sql`ALTER TABLE lists ADD COLUMN IF NOT EXISTS research_status text NOT NULL DEFAULT 'idle'`;
await sql`ALTER TABLE lists ADD COLUMN IF NOT EXISTS research_note text NOT NULL DEFAULT ''`;
await sql`ALTER TABLE lists ADD COLUMN IF NOT EXISTS researched_at timestamptz`;
// Outreach (added 2026-10-07)
await sql`
  CREATE TABLE IF NOT EXISTS campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id uuid UNIQUE NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'draft',
    from_name text NOT NULL DEFAULT 'Sofia Iuteri',
    sender_intro text NOT NULL DEFAULT '',
    signature text NOT NULL DEFAULT '',
    daily_cap int NOT NULL DEFAULT 8,
    followup_days int NOT NULL DEFAULT 4,
    followups boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;
await sql`
  CREATE TABLE IF NOT EXISTS outreach_emails (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    prospect_id uuid NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
    step int NOT NULL DEFAULT 1,
    to_email text NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    status text NOT NULL DEFAULT 'draft',
    resend_id text,
    error text NOT NULL DEFAULT '',
    sent_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (prospect_id, step)
  )`;
await sql`CREATE INDEX IF NOT EXISTS outreach_campaign_idx ON outreach_emails(campaign_id, status)`;
await sql`CREATE INDEX IF NOT EXISTS outreach_to_idx ON outreach_emails(lower(to_email))`;
await sql`
  CREATE TABLE IF NOT EXISTS suppressions (
    email text PRIMARY KEY,
    reason text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
// Orders (added 2026-10-07)
await sql`ALTER TABLE lists ADD COLUMN IF NOT EXISTS order_status text NOT NULL DEFAULT 'manual'`;
await sql`ALTER TABLE lists ADD COLUMN IF NOT EXISTS contact_name text NOT NULL DEFAULT ''`;
await sql`ALTER TABLE lists ADD COLUMN IF NOT EXISTS website text NOT NULL DEFAULT ''`;
await sql`ALTER TABLE lists ADD COLUMN IF NOT EXISTS amount_cents int`;
await sql`ALTER TABLE lists ADD COLUMN IF NOT EXISTS paid_at timestamptz`;
await sql`ALTER TABLE lists ADD COLUMN IF NOT EXISTS notified_at timestamptz`;
console.log("tables ready");
