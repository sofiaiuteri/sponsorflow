/**
 * Deploy-time settings. All optional — the app works without them.
 *
 * NEXT_PUBLIC_CHECKOUT_URL  Stripe Payment Link (or similar) for the $29 beta.
 *                           When set, the beta form sends people there after submitting.
 * NEXT_PUBLIC_FORM_ENDPOINT Formspree / Basin / Getform URL that receives leads as JSON.
 *                           When unset, leads go to /api/lead and appear in server logs.
 */
export const CHECKOUT_URL = process.env.NEXT_PUBLIC_CHECKOUT_URL || "";
export const CHECKOUT_URL_DFY = process.env.NEXT_PUBLIC_CHECKOUT_URL_DFY || "";
export const FORM_ENDPOINT = process.env.NEXT_PUBLIC_FORM_ENDPOINT || "/api/lead";

export const CTA_LABEL = "Get 20 sponsor matches — $29";

export const TRUST_NOTE =
  "SponsorFlow identifies high-fit sponsorship prospects — not brands that have already agreed to sponsor your publication. Brand names are shown as examples; no affiliation is implied.";

export async function submitLead(payload: Record<string, unknown>) {
  const res = await fetch(FORM_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ ...payload, submittedAt: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`Lead submission failed (${res.status})`);
}
