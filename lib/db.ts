import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL!);

export const STATUSES = ["Prospect", "Contacted", "Replied", "Interested", "Sponsor", "Not now"] as const;
export type ProspectStatus = (typeof STATUSES)[number];
export const FITS = ["High", "Medium", "Low"] as const;

export type List = {
  id: string;
  token: string;
  publication: string;
  summary: string;
  plan: string;
  customer_email: string;
  profile: string;
  research_status: "idle" | "queued" | "running" | "done" | "error";
  research_note: string;
  researched_at: string | null;
  order_status: "manual" | "pending" | "paid";
  kind: "sponsors" | "recruiting";
  contact_name: string;
  website: string;
  amount_cents: number | null;
  paid_at: string | null;
  notified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Prospect = {
  id: string;
  list_id: string;
  position: number;
  brand: string;
  category: string;
  fit: string;
  why: string;
  angle: string;
  opener: string;
  contact: string;
  reach: string;
  evidence: string;
  status: ProspectStatus;
  notes: string;
  updated_at: string;
};

export async function getListByToken(token: string) {
  const rows = (await sql`SELECT * FROM lists WHERE token = ${token}`) as List[];
  return rows[0] ?? null;
}

export async function getListById(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const rows = (await sql`SELECT * FROM lists WHERE id = ${id}`) as List[];
  return rows[0] ?? null;
}

export async function getProspects(listId: string) {
  return (await sql`SELECT * FROM prospects WHERE list_id = ${listId} ORDER BY position, brand`) as Prospect[];
}

export async function getAllLists() {
  return (await sql`
    SELECT l.*,
      count(p.id)::int AS total,
      count(p.id) FILTER (WHERE p.status <> 'Prospect')::int AS worked
    FROM lists l LEFT JOIN prospects p ON p.list_id = l.id
    GROUP BY l.id ORDER BY l.created_at DESC`) as (List & { total: number; worked: number })[];
}
