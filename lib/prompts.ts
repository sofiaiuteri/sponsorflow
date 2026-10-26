// Shared AI prompts (kept separate to avoid circular imports between lib modules).
export const RECRUIT_DRAFT_SYSTEM = `You write short recruiting outreach emails for a small organization. Each goes to one department, club, advisor, community or person.

Follow the structure and plain wording of this example very closely. Only adapt the organization, the school or group name, and who the opportunity is for:

<example>
Hi,

I'm Sofia, a student at Washington and Lee University and founder of The Experience Exchange, a student-run outdoor magazine.

We're inviting students from other universities to contribute stories, photography, and videos about outdoor experiences in their area. I thought this could be a great opportunity for WSU students involved in outdoor recreation to share their experiences and get their work published.

Would you be willing to pass this opportunity along to your trip leaders or members?

Here's our website if you'd like to learn more: https://theexperienceexchange.vercel.app/join

Thanks so much for your time!

Best,
</example>

Rules:
- Greet with "Hi [first name]," only if a contact's first name is given, otherwise just "Hi,".
- Straightforward, conversational language. No marketing copy, no flattering or scenic descriptions of the school or area, no lists of perks.
- Clearly say who the sender is and why they're writing, then make one simple request.
- Use the short name people actually use for the school (for example "WSU", "UVA", "Colorado College").
- Use the application link provided in place of the example link.
- No em dashes or en dashes anywhere.
- After "Best," end with the exact signature provided.
- Subject line: short and plain, for example "Outdoor magazine opportunity for WSU students".`;

// ---------- SponsorFlow sales outreach (Sofia's approved template) ----------

/** Fills the template's three blanks. It never writes copy, so nothing about the publication gets invented. */
export const SALES_FIELDS_SYSTEM = `You fill in three blanks for a fixed cold email template sent to independent publications (podcasts, newsletters, magazines, YouTube channels). You never write the email itself.

For each item, return:
- first_name: the first name of the person who will read the email, only if the notes make it clear (for example the publication is named after one person, or the email address is clearly a person's first name like derick@...). Otherwise an empty string. Never guess from a shared inbox like info@, hello@ or a show name.
- publication: the name people actually call it, cleaned up. Drop anything in parentheses, author credits and words like "team". For example "Derick's Substack (Derick Lugo)" becomes "Derick's Substack", "Your Daily Scholarship (No Debt College)" becomes "Your Daily Scholarship".
- niche: 2 to 5 lowercase words that complete "while looking at ___", describing the topic and format, for example "thru-hiking podcasts", "outdoor newsletters", "student magazines", "trail running podcasts". Base it only on the notes. Never mention a location unless it's the main topic.`;

export type SalesFields = { first_name: string; publication: string; niche: string };

export function salesEmail({ first_name, publication, niche }: SalesFields) {
  return {
    subject: `sponsor research for ${publication}`,
    body: `Hi ${first_name || "there"},

My name is Sofia Iuteri, and I'm the founder of The Experience Exchange, an independent outdoor adventure magazine based at Washington & Lee University. After securing advertisers like Walkabout Outfitter and Lex Running Shop, I saw firsthand how time-consuming it can be to find the right sponsors and contacts.

That experience led me to launch SponsorFlow, a service that helps independent creators identify potential sponsors and streamline their outreach.

I came across ${publication} while looking at ${niche}, and I think your audience is one brands would love to reach.

We're currently offering 20 researched sponsor prospects for $29, including brand-fit insights, pitch ideas, and suggested contacts. I'd be happy to share three complimentary prospects first so you can evaluate the research before committing. Would that be of interest?

Best,
Sofia Iuteri
Founder, SponsorFlow
https://sponsorflowhq.com`,
  };
}

/** Reuses the first email's greeting and publication so the follow-up matches it. */
export function salesFollowUp(greeting: string, publication: string) {
  return `${greeting}

I wanted to follow up on my note about sponsor research for ${publication}. The offer of three complimentary prospects still stands, and there's no obligation to purchase anything afterward. If that sounds useful, I'd be glad to put them together for you.

If now isn't a good time, no problem at all. I won't reach out again.

Best,
Sofia`;
}
