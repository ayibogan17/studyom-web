"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/design-system/components/ui/card";
import { Badge } from "@/components/design-system/components/ui/badge";
import { Button } from "@/components/design-system/components/ui/button";
import { TeacherMessageThread } from "@/components/design-system/components/teachers/teacher-message-thread";

type TeacherThreadSummary = {
  id: string;
  teacherSlug: string;
  teacherName: string;
  lastMessage: string;
  lastDate: string;
};

type TeacherRequestSummary = {
  id: string;
  teacherSlug: string;
  teacherName: string;
  status: string;
  createdAt: string;
  messageText: string;
};

export function TeacherThreadsClient({
  threads,
  requests,
}: {
  threads: TeacherThreadSummary[];
  requests: TeacherRequestSummary[];
}) {
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const total = threads.length + requests.length;

  return (
    <Card className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-primary)]">Hocalar</h2>
        <Badge variant="muted">{total}</Badge>
      </div>

      {total === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">Henüz hoca mesajın yok.</p>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => {
            const isOpen = openThreadId === thread.id;
            return (
              <div
                key={thread.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-primary)]">{thread.teacherName}</p>
                    <p className="text-xs text-[var(--color-muted)]">Son mesaj: {thread.lastMessage}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setOpenThreadId(isOpen ? null : thread.id)}
                  >
                    {isOpen ? "Sohbeti kapat" : "Sohbeti aç"}
                  </Button>
                </div>
                {isOpen ? (
                  <div className="mt-4">
                    <TeacherMessageThread teacherSlug={thread.teacherSlug} teacherName={thread.teacherName} />
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-[var(--color-muted)]">{thread.lastDate}</p>
                )}
              </div>
            );
          })}

          {requests.map((req) => (
            <div
              key={req.id}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-primary)]">{req.teacherName}</p>
                  <p className="text-xs text-[var(--color-muted)]">
                    İlk mesaj isteği • {req.createdAt}
                  </p>
                </div>
                <Badge variant={req.status === "pending" ? "default" : "outline"}>
                  {req.status === "pending" ? "Beklemede" : "Reddedildi"}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-[var(--color-primary)]">{req.messageText}</p>
              <div className="mt-3">
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/hocalar/${req.teacherSlug}#messages`}>Profili gör</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
