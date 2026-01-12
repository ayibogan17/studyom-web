"use client";

import Link from "next/link";
import { Card } from "@/components/design-system/components/ui/card";
import { Section } from "@/components/design-system/components/shared/section";

type MemoryItem = {
  id: string;
  text: string;
  photoUrl: string | null;
  createdAt: string;
  jam: { id: string; title: string; studio: { name: string; district: string | null; city: string | null } };
  user: { name: string | null; fullName: string | null; image: string | null };
};

export default function OpenJamMemoriesClient({ memories }: { memories: MemoryItem[] }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2a0a4d] via-[#4c1d95] to-[#7c3aed]">
      <Section className="bg-transparent text-white">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-6 py-10 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">OpenJam</p>
          <h1 className="text-3xl font-semibold md:text-4xl">Jam hatıraları</h1>
          <p className="max-w-2xl text-sm text-white/85 md:text-base">
            Jam buluşmalarından kalan anılar burada. Her hatıra, OpenJam galerisine eklenir.
          </p>
          <Link
            href="/openjam"
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            OpenJam’e dön
          </Link>
        </div>
      </Section>

      <Section>
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
          {memories.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">Henüz hatıra yok.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {memories.map((memory) => {
                const location =
                  memory.jam.studio.district || memory.jam.studio.city || "Stüdyo";
                const userName =
                  memory.user.fullName || memory.user.name || "Kullanıcı";
                const userInitials = userName
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <Card key={memory.id} className="flex h-full flex-col gap-3 p-4">
                    <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                      {memory.user.image ? (
                        <img
                          src={memory.user.image}
                          alt={userName}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-secondary)] text-[10px] font-semibold text-[var(--color-primary)]">
                          {userInitials}
                        </span>
                      )}
                      <span>{userName}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-primary)]">
                        {memory.jam.title}
                      </p>
                      <p className="text-xs text-[var(--color-muted)]">
                        {memory.jam.studio.name} · {location}
                      </p>
                    </div>
                    {memory.photoUrl ? (
                      <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
                        <img
                          src={memory.photoUrl}
                          alt="Jam hatırası"
                          className="h-40 w-full object-cover"
                        />
                      </div>
                    ) : null}
                    <p className="text-sm text-[var(--color-primary)] whitespace-pre-line">
                      {memory.text}
                    </p>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
