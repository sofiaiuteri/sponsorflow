import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/Chrome";
import { Dashboard } from "@/components/Dashboard";

export const metadata: Metadata = {
  title: "Sponsor matches — SponsorFlow",
};

export default function DashboardPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Dashboard />
      </main>
      <SiteFooter />
    </>
  );
}
