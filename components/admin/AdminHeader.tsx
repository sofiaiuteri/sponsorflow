import Link from "next/link";
import { logout } from "@/app/admin/actions";
import { Logo } from "@/components/Chrome";
import { sql } from "@/lib/db";

export async function AdminHeader() {
  const [{ unread }] = (await sql`SELECT count(*)::int AS unread FROM inbound_replies WHERE NOT handled`) as { unread: number }[];
  return (
    <header className="border-b border-line/70 bg-paper/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-4">
          <Logo />
          <Link href="/admin/dashboard" className="text-[13.5px] text-ink-soft hover:text-ink">Dashboard</Link>
          <Link href="/admin/inbox" className="inline-flex items-center gap-1.5 text-[13.5px] text-ink-soft hover:text-ink">
            Inbox
            {unread > 0 && <span className="rounded-full bg-accent px-1.5 py-px text-[11px] font-medium text-paper">{unread}</span>}
          </Link>
          <Link href="/admin" className="text-[13.5px] text-ink-soft hover:text-ink">Lists</Link>
        </div>
        <form action={logout}>
          <button className="text-[13.5px] text-ink-soft hover:text-ink">Sign out</button>
        </form>
      </div>
    </header>
  );
}
