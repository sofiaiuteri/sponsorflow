# SponsorFlow

**Find the brands that should already be sponsoring you.**

Live at [sponsorflowhq.com](https://sponsorflowhq.com)

SponsorFlow helps small podcasts, newsletters, and student publications find sponsors. You tell it about your audience, and it researches brands that are a real fit, finds the right contact, and drafts the pitch for you.

I built it after doing this by hand for [The Experience Exchange](https://theexperienceexchange.vercel.app), the outdoor magazine I run at Washington and Lee. Our first issue brought in $5,000 in ad revenue, and I wanted to turn that process into a tool other small creators could use.

## What it does

- **AI sponsor research:** uses the Claude API to find brands that match a creator's niche and audience, with a reason for each match
- **Customer portal:** every order gets a private link where the customer sees their sponsor list and tracks outreach
- **Payments:** Stripe checkout with a webhook that creates the order automatically
- **Automated outreach:** scheduled email campaigns with follow-ups and daily send limits, sent from the product's own domain
- **Admin dashboard:** one place to manage orders, campaigns, and replies

## Built with

Next.js 16, React 19, TypeScript, Tailwind CSS 4, Neon Postgres, Claude API (Anthropic), Stripe, Resend, Vercel (hosting and cron jobs)

## Project layout

| What | Where |
| --- | --- |
| Pages and API routes | `app/` |
| Sponsor research (AI) | `lib/research.ts`, `lib/prompts.ts` |
| Outreach campaigns | `lib/outreach.ts` |
| Orders and payments | `lib/orders.ts`, `app/api/` |
| Database | `lib/db.ts`, `scripts/migrate.mjs` |

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

Needs a `.env.local` with the database, Anthropic, Stripe, and Resend keys.
