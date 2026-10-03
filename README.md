# SponsorFlow

Find the brands that should already be sponsoring you.

Next.js 16 + Tailwind 4. No database, no auth: the intake profile and outreach statuses live in `localStorage`, and sponsor matches are generated client-side from `lib/sponsors.ts`.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
```

## Pages

- `/` landing, sample results, intake form, pricing, FAQ
- `/dashboard` sponsor intelligence dashboard (demo profile until the intake form is submitted)
- `/beta` $29 founding beta signup + contact form
- `/api/lead` logs form submissions to server logs

## Deploy settings (optional)

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_FORM_ENDPOINT` | Formspree/Basin URL for leads, so they arrive in your inbox. Defaults to `/api/lead` (server logs only). |
| `NEXT_PUBLIC_CHECKOUT_URL` | Stripe Payment Link. When set, the beta form sends buyers to checkout after they submit. |

Deploy: push to GitHub, then import the repo on Vercel. No other config is needed.
