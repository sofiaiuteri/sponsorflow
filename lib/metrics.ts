import { sql } from "./db";

// Business metrics for the owner dashboard. Weeks start Monday (Postgres date_trunc('week')).

export type CampaignStats = {
  id: string;
  publication: string;
  status: string;
  sent: number;
  delivered: number;
  replied: number;
  failed: number;
  queued: number;
  followups: number;
};

export async function getMetrics() {
  const [revenue] = (await sql`
    SELECT
      coalesce(sum(amount_cents), 0)::int AS total,
      coalesce(sum(amount_cents) FILTER (WHERE paid_at >= date_trunc('week', now())), 0)::int AS this_week,
      coalesce(sum(amount_cents) FILTER (WHERE paid_at >= date_trunc('week', now()) - interval '7 days' AND paid_at < date_trunc('week', now())), 0)::int AS last_week,
      count(*) FILTER (WHERE order_status = 'paid')::int AS orders,
      count(*) FILTER (WHERE order_status = 'paid' AND plan = 'list')::int AS list_orders,
      count(*) FILTER (WHERE order_status = 'paid' AND plan = 'dfy')::int AS dfy_orders,
      count(*) FILTER (WHERE order_status = 'pending' AND created_at > now() - interval '30 days')::int AS abandoned
    FROM lists`) as {
    total: number; this_week: number; last_week: number; orders: number; list_orders: number; dfy_orders: number; abandoned: number;
  }[];

  const [email] = (await sql`
    SELECT
      count(*) FILTER (WHERE sent_at IS NOT NULL)::int AS sent,
      count(*) FILTER (WHERE sent_at >= date_trunc('week', now()))::int AS sent_this_week,
      count(*) FILTER (WHERE sent_at >= date_trunc('week', now()) - interval '7 days' AND sent_at < date_trunc('week', now()))::int AS sent_last_week,
      count(*) FILTER (WHERE delivered_at IS NOT NULL)::int AS delivered,
      count(*) FILTER (WHERE status = 'replied')::int AS replied,
      count(*) FILTER (WHERE status = 'failed')::int AS failed
    FROM outreach_emails`) as {
    sent: number; sent_this_week: number; sent_last_week: number; delivered: number; replied: number; failed: number;
  }[];

  const [{ unsubscribed }] = (await sql`SELECT count(*)::int AS unsubscribed FROM suppressions`) as { unsubscribed: number }[];

  const campaigns = (await sql`
    SELECT c.id, l.publication, c.status,
      count(e.*) FILTER (WHERE e.sent_at IS NOT NULL AND e.step = 1)::int AS sent,
      count(e.*) FILTER (WHERE e.delivered_at IS NOT NULL AND e.step = 1)::int AS delivered,
      count(DISTINCT e.prospect_id) FILTER (WHERE e.status = 'replied')::int AS replied,
      count(e.*) FILTER (WHERE e.status = 'failed')::int AS failed,
      count(e.*) FILTER (WHERE e.status IN ('approved', 'draft'))::int AS queued,
      count(e.*) FILTER (WHERE e.step = 2 AND e.sent_at IS NOT NULL)::int AS followups
    FROM campaigns c JOIN lists l ON l.id = c.list_id LEFT JOIN outreach_emails e ON e.campaign_id = c.id
    GROUP BY c.id, l.publication, c.status
    ORDER BY l.publication`) as CampaignStats[];

  const daily = (await sql`
    SELECT to_char(d, 'YYYY-MM-DD') AS day,
      (SELECT count(*) FROM outreach_emails e WHERE e.sent_at >= d AND e.sent_at < d + interval '1 day')::int AS sent
    FROM generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day') AS d
    ORDER BY d`) as { day: string; sent: number }[];

  // TEE's own sponsor pipeline (the dogfooding test).
  const teePipeline = (await sql`
    SELECT p.status, count(*)::int AS n FROM prospects p JOIN lists l ON l.id = p.list_id
    WHERE l.publication = 'The Experience Exchange' GROUP BY p.status`) as { status: string; n: number }[];

  const customers = (await sql`
    SELECT id, token, publication, plan, customer_email, amount_cents, paid_at, notified_at, research_status
    FROM lists WHERE order_status = 'paid' ORDER BY paid_at DESC LIMIT 20`) as {
    id: string; token: string; publication: string; plan: string; customer_email: string; amount_cents: number | null;
    paid_at: string; notified_at: string | null; research_status: string;
  }[];

  const [{ researched }] = (await sql`SELECT count(*)::int AS researched FROM lists WHERE researched_at IS NOT NULL`) as { researched: number }[];

  const recentReplies = (await sql`
    SELECT p.brand, l.publication, p.status, p.updated_at FROM prospects p JOIN lists l ON l.id = p.list_id
    WHERE p.status IN ('Replied', 'Interested', 'Sponsor') ORDER BY p.updated_at DESC LIMIT 8`) as {
    brand: string; publication: string; status: string; updated_at: string;
  }[];

  return { revenue, email, unsubscribed, campaigns, daily, teePipeline, customers, researched, recentReplies };
}
