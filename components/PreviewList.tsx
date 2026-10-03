"use client";

import { useState } from "react";
import { SponsorList } from "@/components/SponsorList";
import { DEMO_PROFILE, generateMatches, type Status } from "@/lib/sponsors";

const matches = generateMatches(DEMO_PROFILE, 4);

export function PreviewList() {
  const [statuses, setStatuses] = useState<Record<string, Status>>({
    [matches[1].id]: "Replied",
    [matches[2].id]: "Contacted",
  });
  return (
    <SponsorList
      matches={matches}
      statuses={statuses}
      onStatus={(id, s) => setStatuses((prev) => ({ ...prev, [id]: s }))}
      defaultOpen={matches[0].id}
    />
  );
}
