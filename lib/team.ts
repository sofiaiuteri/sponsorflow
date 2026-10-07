import { Resend } from "resend";
import { sql } from "./db";
import { FROM_ADDRESS } from "./outreach";

// The Experience Exchange team applications (form lives on the TEE site, data lives here).
export const TEE_ROLES = [
  "Campus Correspondent",
  "Graphic & Layout Designer",
  "Social Media & Content Creator",
  "Photographer & Videographer",
  "Writer",
  "Podcast Host & Producer",
  "Business & Partnerships",
  "Events & Trips",
  "Not sure yet",
] as const;
export const APPLICATION_STATUSES = ["New", "Interviewing", "Accepted", "Declined"] as const;

const TEE_EMAIL = "siuteri@mail.wlu.edu";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://sponsorflowhq.com";

export type Application = {
  id: string; name: string; email: string; school: string; class_year: string; major: string; role: string; why: string;
  samples: string; hours: string; instagram: string; status: string; notes: string; created_at: string;
};

export async function saveApplication(a: Omit<Application, "id" | "status" | "notes" | "created_at">) {
  const [row] = (await sql`
    INSERT INTO tee_applications (name, email, school, class_year, major, role, why, samples, hours, instagram)
    VALUES (${a.name}, ${a.email}, ${a.school}, ${a.class_year}, ${a.major}, ${a.role}, ${a.why}, ${a.samples}, ${a.hours}, ${a.instagram})
    RETURNING id`) as { id: string }[];

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const first = a.name.split(/\s+/)[0] || "there";
    await resend.emails.send({
      from: `The Experience Exchange <${FROM_ADDRESS}>`,
      to: [a.email],
      replyTo: TEE_EMAIL,
      subject: "Thanks for applying to The Experience Exchange!",
      text: `Hi ${first},\n\nThanks so much for applying to join The Experience Exchange as ${/^[aeiou]/i.test(a.role) ? "an" : "a"} ${a.role}! We read every application and will get back to you within a week.\n\nIn the meantime, follow along on Instagram at @expowlu, and feel free to reply to this email with any questions.\n\nSofia Iuteri\nFounder & Editor-in-Chief, The Experience Exchange\nhttps://theexperienceexchange.vercel.app`,
    });
    await resend.emails.send({
      from: `TEE applications <${FROM_ADDRESS}>`,
      to: [process.env.REPLY_FORWARD_TO || "sofiaiuteri@icloud.com"],
      replyTo: a.email,
      subject: `New TEE applicant: ${a.name} (${a.role}${a.school ? `, ${a.school}` : ""})`,
      text: `${a.name} (${a.email}) applied for ${a.role}.\n\nSchool: ${a.school || "-"} · Year: ${a.class_year || "-"} · Major: ${a.major || "-"} · Hours/week: ${a.hours || "-"}\nInstagram: ${a.instagram || "-"}\nSamples: ${a.samples || "-"}\n\nWhy they want to join:\n${a.why || "-"}\n\nReview all applicants: ${SITE}/admin/team`,
    });
  }
  return row.id;
}
