import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Chrome";
import { Portal } from "@/components/Portal";
import { getListByToken, getProspects } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your sponsor list · SponsorFlow",
  robots: { index: false, follow: false },
};

export default async function ListPage({ params }: PageProps<"/l/[token]">) {
  const { token } = await params;
  const list = await getListByToken(token);
  if (!list) notFound();
  const prospects = await getProspects(list.id);

  return (
    <>
      <header className="border-b border-line/70 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Logo />
          <span className="text-[13px] text-ink-muted">Private link · don&apos;t share publicly</span>
        </div>
      </header>
      <main className="flex-1">
        <Portal token={token} list={list} initial={prospects} />
      </main>
    </>
  );
}
