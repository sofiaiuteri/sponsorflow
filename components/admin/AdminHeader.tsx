import Link from "next/link";
import { logout } from "@/app/admin/actions";
import { Logo } from "@/components/Chrome";
import { sql } from "@/lib/db";

export async function AdminHeader() {
  const [{ unread, applicants }] = (await sql`
    SELECT (SELECT count(*) FROM inbound_replies WHERE NOT handled)::int AS unread,
      (SELECT count(*) FROM tee_applications WHERE status = 'New')::int AS applicants`) as { unread: number; applicants: number }[];
  return (
    <header className="border-b border-line/70 bg-paper/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Logo />
          <Link href="/admin/dashboard" className="text-[13.5px] text-ink-soft hover:text-ink">Dashboard</Link>
          <Link href="/admin/inbox" className="inline-flex items-center gap-1.5 text-[13.5px] text-ink-soft hover:text-ink">
            Inbox
            {unread > 0 && <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 font-sans text-[11px] font-semibold leading-none text-paper">{unread}</span>}
          </Link>
          <Link href="/admin" className="text-[13.5px] text-ink-soft hover:text-ink">Lists</Link>
          <Link href="/admin/team" className="inline-flex items-center gap-1.5 text-[13.5px] text-ink-soft hover:text-ink">
            Team
            {applicants > 0 && <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 font-sans text-[11px] font-semibold leading-none text-paper">{applicants}</span>}
          </Link>
        </div>
        <form action={logout}>
          <button className="text-[13.5px] text-ink-soft hover:text-ink">Sign out</button>
        </form>
      </div>
    </header>
  );
}
