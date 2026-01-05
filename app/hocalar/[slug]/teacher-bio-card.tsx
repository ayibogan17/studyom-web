"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/design-system/components/ui/card";
import { Button } from "@/components/design-system/components/ui/button";

type Props = {
  bio: string;
};

const MAX_LENGTH = 420;

export function TeacherBioCard({ bio }: Props) {
  const [expanded, setExpanded] = useState(false);
  const safeBio = bio.trim();
  const isLong = safeBio.length > MAX_LENGTH;

  const displayText = useMemo(() => {
    if (!safeBio) return "";
    if (expanded || !isLong) return safeBio;
    return `${safeBio.slice(0, MAX_LENGTH).trim()}…`;
  }, [expanded, isLong, safeBio]);

  return (
    <Card className="space-y-3 p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--color-primary)]">Biyografi</p>
        {isLong ? (
          <Button type="button" size="sm" variant="secondary" onClick={() => setExpanded((prev) => !prev)}>
            {expanded ? "Kısalt" : "Devamını göster"}
          </Button>
        ) : null}
      </div>
      {safeBio ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--color-muted)]">{displayText}</p>
      ) : (
        <p className="text-sm text-[var(--color-muted)]">Biyografi eklenmedi.</p>
      )}
    </Card>
  );
}
