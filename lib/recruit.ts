import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { sql, type List } from "./db";
import { enrichContacts } from "./research";

// Recruiting agent: finds legitimate channels and people to recruit from, with published contacts,
// and stores them as prospects so the existing outreach engine can email them.
const client = new Anthropic();
const MODEL = "claude-opus-5-5";
const FALLBACK = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

const ChannelSchema = z.object({
  channels: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      fit: z.enum(["High", "Medium", "Low"]),
      why: z.string(),
      roles: z.string(),
      approach: z.string(),
      opener: z.string(),
      contact: z.string(),
      reach: z.string(),
      evidence: z.string(),
    }),
  ),
});

const recruitSystem = (count: number) => `You help small organizations (student publications, clubs, startups, small businesses) recruit people. Find exactly ${count} places or people to recruit from for the organization described by the user, and verify each with web search and by reading the pages.

Good sources, roughly in this mix:
- University departments and programs related to the roles (their staff or program contacts can forward opportunities to students).
- Student clubs and organizations related to the roles or the organization's mission.
- Career offices, job boards and student job platforms, plus online communities where people looking for these roles gather.
- For high-school recruiting: only teachers, journalism, yearbook or media advisors, and program coordinators. Never contact high-school students directly.
- Individual candidates: only adults (for example college students or recent graduates) whose own public portfolio or personal site invites collaborations or freelance work and publishes a contact email. At most a third of the list.

Strict rules:
- Use only contact details that the organization or person publishes for contact. Never guess or construct an email address.
- Do not use LinkedIn profiles, and do not gather contact details from LinkedIn.
- Prefer sources close to the organization's location first, then remote-friendly ones.
- Skip anything inactive or without a usable published contact.

For each, record: name, type (Department, Student club, Career office, Job board, Community, Teacher or advisor, Candidate), fit (High/Medium/Low), why it's a good source (one or two specific sentences), which roles it suits, the approach (for example "ask the coordinator to forward to students" or "invite to apply"), a warm one-sentence opening line with no em dashes, the contact (role or published name), where to reach them (email or form URL), and an evidence URL.`;

export async function researchRecruiting(listId: string, { count = 20 }: { count?: number } = {}) {
  const [list] = (await sql`SELECT * FROM lists WHERE id = ${listId}`) as List[];
  if (!list) return;
  await sql`UPDATE lists SET research_status = 'running', research_note = 'Finding recruiting channels and candidates…', updated_at = now() WHERE id = ${listId}`;
  try {
    const existing = (await sql`SELECT brand FROM prospects WHERE list_id = ${listId}`) as { brand: string }[];
    const prompt = [
      `Organization: ${list.publication}`,
      list.summary && `About: ${list.summary}`,
      list.profile && `Recruiting needs:\n${list.profile}`,
      existing.length ? `Already on the list (skip these): ${existing.map((e) => e.brand).join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: prompt }];
    let final: Anthropic.Beta.BetaMessage | null = null;
    for (let turn = 0; turn < 4; turn++) {
      final = await client.beta.messages
        .stream({
          model: MODEL,
          max_tokens: 32000,
          system: recruitSystem(count),
          output_config: { effort: "medium" },
          tools: [
            { type: "web_search_20260209", name: "web_search", max_uses: 14 },
            { type: "web_fetch_20260209", name: "web_fetch", max_uses: 14 },
          ],
          messages,
          ...FALLBACK,
        })
        .finalMessage();
      if (final.stop_reason !== "pause_turn") break;
      messages.push({ role: "assistant", content: final.content });
    }
    if (!final || final.stop_reason === "refusal") throw new Error("The research request was declined.");
    const notes = final.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    if (!notes.trim()) throw new Error("Research returned no notes");

    const parsed = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: "low", format: betaZodOutputFormat(ChannelSchema) },
      messages: [
        {
          role: "user",
          content: `Convert these recruiting research notes into the structured format. Copy emails and URLs exactly, keep wording close to the notes, replace any em dashes with commas or periods, and leave a field empty if the notes don't have it.\n\n<notes>\n${notes}\n</notes>`,
        },
      ],
      ...FALLBACK,
    });
    const channels = parsed.parsed_output?.channels ?? [];

    const seen = new Set(existing.map((e) => e.brand.toLowerCase()));
    const order = { High: 0, Medium: 1, Low: 2 };
    const fresh = channels.filter((c) => c.name && !seen.has(c.name.toLowerCase())).sort((a, b) => order[a.fit] - order[b.fit]);
    const [{ start }] = (await sql`SELECT coalesce(max(position), -1) + 1 AS start FROM prospects WHERE list_id = ${listId}`) as { start: number }[];
    for (const [i, c] of fresh.entries()) {
      await sql`
        INSERT INTO prospects (list_id, position, brand, category, fit, why, angle, opener, contact, reach, evidence)
        VALUES (${listId}, ${start + i}, ${c.name}, ${c.type}, ${c.fit}, ${c.why}, ${`${c.approach}. Roles: ${c.roles}`}, ${c.opener}, ${c.contact}, ${c.reach}, ${c.evidence})`;
    }
    await sql`
      UPDATE lists SET research_status = 'done', research_note = ${`Added ${fresh.length} recruiting channels and candidates`}, researched_at = now(), updated_at = now()
      WHERE id = ${listId}`;
    // Fill in any missing contacts with a dedicated lookup pass.
    if (fresh.some((c) => !c.reach.trim() || !/[@.]/.test(c.reach))) await enrichContacts(listId);
  } catch (err) {
    console.error("[recruit]", listId, err);
    const message = err instanceof Anthropic.APIError ? `AI service error (${err.status})` : err instanceof Error ? err.message : "Unknown error";
    await sql`UPDATE lists SET research_status = 'error', research_note = ${message.slice(0, 300)}, updated_at = now() WHERE id = ${listId}`;
  }
}

