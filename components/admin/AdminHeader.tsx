import Link from "next/link";
import { logout } from "@/app/admin/actions";
import { Logo } from "@/components/Chrome";

export function AdminHeader() {
  return (
    <header className="border-b border-line/70 bg-paper/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-4">
          <Logo />
          <Link href="/admin" className="text-[13.5px] text-ink-soft hover:text-ink">Admin</Link>
        </div>
        <form action={logout}>
          <button className="text-[13.5px] text-ink-soft hover:text-ink">Sign out</button>
        </form>
      </div>
    </header>
  );
}
