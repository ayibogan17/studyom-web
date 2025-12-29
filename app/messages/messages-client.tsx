"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { Card } from "@/components/design-system/components/ui/card";
import { Button } from "@/components/design-system/components/ui/button";
import { Badge } from "@/components/design-system/components/ui/badge";
import { TeacherMessageThread } from "@/components/design-system/components/teachers/teacher-message-thread";
import { ProducerMessageThread } from "@/components/design-system/components/producers/producer-message-thread";
import { cn } from "@/components/design-system/lib/cn";

type TeacherThreadSummary = {
  id: string;
  teacherSlug: string;
  teacherName: string;
  teacherImage?: string | null;
  lastMessage: string;
  lastDate: string;
};

type TeacherRequestSummary = {
  id: string;
  teacherSlug: string;
  teacherName: string;
  teacherImage?: string | null;
  status: string;
  createdAt: string;
  messageText: string;
};

type ProducerThreadSummary = {
  id: string;
  producerSlug: string;
  producerName: string;
  producerImage?: string | null;
  lastMessage: string;
  lastDate: string;
};

type ProducerRequestSummary = {
  id: string;
  producerName: string;
  producerImage?: string | null;
  status: string;
  createdAt: string;
  messageText: string;
};

type StudioLeadSummary = {
  id: string;
  title: string;
  subtitle: string;
  createdAt: string;
  messageText: string;
};

type MessagesClientProps = {
  teacherThreads: TeacherThreadSummary[];
  teacherRequests: TeacherRequestSummary[];
  producerThreads: ProducerThreadSummary[];
  producerRequests: ProducerRequestSummary[];
  studioLeads: StudioLeadSummary[];
  routes: {
    teachers: string;
    production: string;
    studios: string;
  };
};

type ViewFilter = "all" | "chats" | "requests";

const viewTabs: Array<{ key: ViewFilter; label: string }> = [
  { key: "all", label: "Tümü" },
  { key: "chats", label: "Sohbetler" },
  { key: "requests", label: "İstekler" },
];

function getInitials(value: string) {
  const parts = value
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return `${first}${last}`.toUpperCase();
}

function StatusChip({ status }: { status: string }) {
  const value = status.toLowerCase();
  const label =
    value === "pending"
      ? "Beklemede"
      : value === "declined" || value === "rejected"
        ? "Reddedildi"
        : value === "accepted" || value === "approved"
          ? "Kabul edildi"
          : status;
  const tone =
    value === "pending"
      ? "bg-[var(--color-warning)]/20 text-[var(--color-warning)]"
      : value === "declined" || value === "rejected"
        ? "bg-[var(--color-danger)]/15 text-[var(--color-danger)]"
        : value === "accepted" || value === "approved"
          ? "bg-[var(--color-success)]/15 text-[var(--color-success)]"
          : "bg-[var(--color-secondary)] text-[var(--color-muted)]";
  return <span className={cn("rounded-full px-2 py-1 text-[11px] font-semibold", tone)}>{label}</span>;
}

function EmptyStateCard({
  title,
  actionLabel,
  actionHref,
}: {
  title: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <Card className="flex flex-col gap-3 border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="flex items-center gap-3 text-sm text-[var(--color-muted)]">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-secondary)]">
          <Inbox className="h-4 w-4" />
        </span>
        <p>{title}</p>
      </div>
      <Button asChild size="sm" className="w-fit">
        <Link href={actionHref}>{actionLabel}</Link>
      </Button>
    </Card>
  );
}

function InboxRow({
  name,
  context,
  snippet,
  timestamp,
  avatarUrl,
  roleLabel,
  status,
  primaryAction,
  isOpen,
  onToggle,
  children,
}: {
  name: string;
  context?: string;
  snippet: string;
  timestamp: string;
  avatarUrl?: string | null;
  roleLabel?: string;
  status?: string;
  primaryAction?: { label: string; onClick?: () => void; href?: string; variant?: "primary" | "secondary" };
  isOpen?: boolean;
  onToggle?: () => void;
  children?: ReactNode;
}) {
  const avatar = avatarUrl ? (
    <img src={avatarUrl} alt={name} className="h-10 w-10 rounded-full object-cover" />
  ) : (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-secondary)] text-xs font-semibold text-[var(--color-primary)]">
      {getInitials(name)}
    </div>
  );

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition hover:border-[var(--color-accent)]/60",
        isOpen && "border-[var(--color-accent)]/40 bg-[var(--color-secondary)]",
      )}
    >
      <div
        className={cn("flex flex-wrap items-start justify-between gap-3", onToggle && "cursor-pointer")}
        role={onToggle ? "button" : undefined}
        tabIndex={onToggle ? 0 : undefined}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (!onToggle) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {avatar}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--color-primary)]">{name}</p>
            {context ? <p className="text-xs text-[var(--color-muted)]">{context}</p> : null}
            <p className="line-clamp-2 text-sm text-[var(--color-muted)]">{snippet}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {roleLabel ? (
              <Badge variant="outline" className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
                {roleLabel}
              </Badge>
            ) : null}
            {status ? <StatusChip status={status} /> : null}
          </div>
          {primaryAction ? (
            primaryAction.href ? (
              <Button
                asChild
                size="sm"
                variant={primaryAction.variant === "secondary" ? "secondary" : "primary"}
                onClick={(e) => e.stopPropagation()}
              >
                <Link href={primaryAction.href}>{primaryAction.label}</Link>
              </Button>
            ) : (
              <Button
                size="sm"
                variant={primaryAction.variant === "secondary" ? "secondary" : "primary"}
                onClick={(e) => {
                  e.stopPropagation();
                  primaryAction.onClick?.();
                }}
              >
                {primaryAction.label}
              </Button>
            )
          ) : null}
          <span className="text-[11px] text-[var(--color-muted)]">{timestamp}</span>
        </div>
      </div>
      {isOpen && children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

export function MessagesClient({
  teacherThreads,
  teacherRequests,
  producerThreads,
  producerRequests,
  studioLeads,
  routes,
}: MessagesClientProps) {
  const [view, setView] = useState<ViewFilter>("all");
  const [openItemKey, setOpenItemKey] = useState<string | null>(null);

  useEffect(() => {
    setOpenItemKey(null);
  }, [view]);

  const teacherChatRows = useMemo(() => teacherThreads, [teacherThreads]);
  const producerChatRows = useMemo(() => producerThreads, [producerThreads]);
  const teacherRequestRows = useMemo(
    () =>
      teacherRequests.filter(
        (req) => !["accepted", "approved"].includes(req.status.toLowerCase()),
      ),
    [teacherRequests],
  );

  const producerRequestRows = useMemo(
    () =>
      producerRequests.filter(
        (req) => !["accepted", "approved"].includes(req.status.toLowerCase()),
      ),
    [producerRequests],
  );
  const studioRequestRows = useMemo(() => studioLeads, [studioLeads]);

  const items = useMemo(() => {
    const rows: Array<{
      key: string;
      type: "chat" | "request";
      chatKind?: "teacher" | "producer";
      roleLabel: string;
      name: string;
      context?: string;
      snippet: string;
      timestamp: string;
      avatarUrl?: string | null;
      status?: string;
      teacherSlug?: string;
      teacherName?: string;
      producerSlug?: string;
      producerName?: string;
      detailText?: string;
    }> = [];

    teacherChatRows.forEach((thread) => {
      rows.push({
        key: `teacher-chat:${thread.id}`,
        type: "chat",
        chatKind: "teacher",
        roleLabel: "Hoca",
        name: thread.teacherName,
        snippet: thread.lastMessage,
        timestamp: thread.lastDate,
        avatarUrl: thread.teacherImage || null,
        teacherSlug: thread.teacherSlug,
        teacherName: thread.teacherName,
      });
    });

    producerChatRows.forEach((thread) => {
      rows.push({
        key: `producer-chat:${thread.id}`,
        type: "chat",
        chatKind: "producer",
        roleLabel: "Üretici",
        name: thread.producerName,
        snippet: thread.lastMessage,
        timestamp: thread.lastDate,
        avatarUrl: thread.producerImage || null,
        producerSlug: thread.producerSlug,
        producerName: thread.producerName,
      });
    });

    teacherRequestRows.forEach((req) => {
      rows.push({
        key: `teacher-request:${req.id}`,
        type: "request",
        roleLabel: "Hoca",
        name: req.teacherName,
        snippet: req.messageText,
        timestamp: req.createdAt,
        avatarUrl: req.teacherImage || null,
        status: req.status,
        teacherSlug: req.teacherSlug,
        detailText: req.messageText,
      });
    });

    producerRequestRows.forEach((req) => {
      rows.push({
        key: `producer-request:${req.id}`,
        type: "request",
        roleLabel: "Üretici",
        name: req.producerName,
        snippet: req.messageText,
        timestamp: req.createdAt,
        avatarUrl: req.producerImage || null,
        status: req.status,
        detailText: req.messageText,
      });
    });

    studioRequestRows.forEach((lead) => {
      rows.push({
        key: `studio-lead:${lead.id}`,
        type: "request",
        roleLabel: "Stüdyo",
        name: lead.title,
        context: lead.subtitle,
        snippet: lead.messageText,
        timestamp: lead.createdAt,
        detailText: lead.messageText,
      });
    });

    return rows;
  }, [teacherChatRows, producerChatRows, teacherRequestRows, producerRequestRows, studioRequestRows]);

  const filteredItems = useMemo(() => {
    if (view === "all") return items;
    if (view === "chats") return items.filter((item) => item.type === "chat");
    return items.filter((item) => item.type === "request");
  }, [items, view]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {viewTabs.map((tab) => (
          <Button
            key={tab.key}
            size="sm"
            variant={view === tab.key ? "primary" : "secondary"}
            onClick={() => setView(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-3">
          <EmptyStateCard title="Henüz hocayla bir görüşmen yok." actionLabel="Hocalara göz at" actionHref={routes.teachers} />
          <EmptyStateCard title="Henüz bir üreticiyle yazışman yok." actionLabel="Üretime göz at" actionHref={routes.production} />
          <EmptyStateCard title="Henüz stüdyolarla mesajın yok." actionLabel="Stüdyo bul" actionHref={routes.studios} />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isOpen = openItemKey === item.key;
            const canToggle = Boolean(item.detailText || item.type === "chat");
            const isChat = item.type === "chat";
            const primaryAction = isChat
              ? {
                  label: isOpen ? "Sohbeti kapat" : "Sohbeti aç",
                  onClick: () => setOpenItemKey((prev) => (prev === item.key ? null : item.key)),
                  variant: "secondary" as const,
                }
              : item.teacherSlug
                ? {
                    label: "Profili gör",
                    href: `/hocalar/${item.teacherSlug}`,
                    variant: "secondary" as const,
                  }
                : undefined;

            return (
              <InboxRow
                key={item.key}
                name={item.name}
                context={item.context}
                snippet={item.snippet}
                timestamp={item.timestamp}
                avatarUrl={item.avatarUrl || null}
                roleLabel={item.roleLabel}
                status={item.status}
                primaryAction={primaryAction}
                isOpen={isOpen}
                onToggle={
                  canToggle
                    ? () => setOpenItemKey((prev) => (prev === item.key ? null : item.key))
                    : undefined
                }
              >
                {item.type === "chat" && item.chatKind === "teacher" && item.teacherSlug && item.teacherName ? (
                  <TeacherMessageThread teacherSlug={item.teacherSlug} teacherName={item.teacherName} />
                ) : item.type === "chat" && item.chatKind === "producer" && item.producerSlug && item.producerName ? (
                  <ProducerMessageThread producerSlug={item.producerSlug} producerName={item.producerName} />
                ) : item.detailText ? (
                  <p className="whitespace-pre-line text-sm text-[var(--color-primary)]">{item.detailText}</p>
                ) : null}
              </InboxRow>
            );
          })}
        </div>
      )}
    </div>
  );
}
