import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Account } from "@prisma/client";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_ROOM_COLOR, getGoogleCalendarColorId } from "@/lib/room-colors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const SYNC_SOURCE = "studyom";

type GoogleCalendarEvent = {
  id: string;
  extendedProperties?: {
    private?: Record<string, string | undefined>;
  };
};

const normalizeStatusLabel = (value?: string | null) => {
  const status = (value ?? "").trim().toLowerCase();
  if (status === "approved" || status === "onaylı" || status === "onayli") return "Onaylı";
  if (status === "cancelled" || status === "iptal" || status === "rejected" || status === "reddedildi") {
    return "İptal";
  }
  return "Beklemede";
};

const typeLabel = (value?: string | null) =>
  value === "manual_block" ? "Manuel blok" : "Rezervasyon";

const stripReservationPrefix = (value?: string | null) =>
  (value ?? "").replace(/^rezervasyon\s*-\s*/i, "").trim();

const parsePrefixedLine = (value: string | null | undefined, prefix: string) => {
  if (!value) return "";
  const match = value
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.toLowerCase().startsWith(prefix.toLowerCase()));
  return match ? match.slice(prefix.length).trim() : "";
};

const parseManualNote = (value: string | null | undefined) =>
  (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");

const hasCalendarScope = (scope?: string | null) =>
  (scope ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .includes(GOOGLE_CALENDAR_SCOPE);

const buildExtendedProps = (studioId: string, blockId: string, roomId: string) => ({
  private: {
    studyomSource: SYNC_SOURCE,
    studyomStudioId: studioId,
    studyomBlockId: blockId,
    studyomRoomId: roomId,
  },
});

async function googleRequest<T>(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  const response = await fetch(`${GOOGLE_CALENDAR_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    return {
      ok: false,
      status: response.status,
      error: json?.error?.message || "Google Calendar isteği başarısız.",
    };
  }

  if (response.status === 204) {
    return { ok: true, data: undefined as T };
  }

  const data = (await response.json()) as T;
  return { ok: true, data };
}

async function refreshGoogleAccessToken(account: Account) {
  const clientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret || !account.refresh_token) {
    return null;
  }

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const json = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  };

  if (!json.access_token) {
    return null;
  }

  const nextExpiresAt = json.expires_in
    ? Math.floor(Date.now() / 1000) + json.expires_in
    : account.expires_at;

  const updated = await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: json.access_token,
      expires_at: nextExpiresAt ?? null,
      scope: json.scope ?? account.scope,
      token_type: json.token_type ?? account.token_type,
    },
  });

  return updated;
}

async function getGoogleAccount(userId: string, email: string) {
  const account =
    (await prisma.account.findFirst({
      where: { userId, provider: "google" },
    })) ??
    (await prisma.account.findFirst({
      where: { provider: "google", user: { email: { equals: email, mode: "insensitive" } } },
    }));

  return account;
}

export async function POST() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; email?: string | null } | undefined;
  const userId = sessionUser?.id;
  const email = sessionUser?.email?.toLowerCase();

  if (!userId || !email) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  let account = await getGoogleAccount(userId, email);
  if (!account || !hasCalendarScope(account.scope)) {
    return NextResponse.json(
      { code: "GOOGLE_CALENDAR_AUTH_REQUIRED", error: "Google Takvim izni gerekli." },
      { status: 403 },
    );
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (!account.access_token || (account.expires_at && account.expires_at <= nowInSeconds + 60)) {
    const refreshed = await refreshGoogleAccessToken(account);
    if (!refreshed?.access_token) {
      return NextResponse.json(
        { code: "GOOGLE_CALENDAR_AUTH_REQUIRED", error: "Google erişim izni yenilenemedi." },
        { status: 403 },
      );
    }
    account = refreshed;
  }

  const studio = await prisma.studio.findFirst({
    where: { ownerEmail: { equals: email, mode: "insensitive" } },
    select: {
      id: true,
      name: true,
      calendarSettings: { select: { timezone: true } },
    },
  });

  if (!studio) {
    return NextResponse.json({ error: "Stüdyo bulunamadı." }, { status: 404 });
  }

  const blocks = await prisma.studioCalendarBlock.findMany({
    where: { studioId: studio.id },
    orderBy: { startAt: "asc" },
    select: {
      id: true,
      roomId: true,
      startAt: true,
      endAt: true,
      type: true,
      title: true,
      status: true,
      note: true,
      room: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      reservationRequest: {
        select: {
          requesterName: true,
          requesterPhone: true,
          note: true,
          status: true,
        },
      },
    },
  });

  const timezone = studio.calendarSettings?.timezone || "Europe/Istanbul";

  const existingEvents: GoogleCalendarEvent[] = [];
  let nextPageToken: string | undefined;
  do {
    const params = new URLSearchParams({
      maxResults: "2500",
      singleEvents: "true",
      privateExtendedProperty: `studyomStudioId=${studio.id}`,
      fields: "items(id,extendedProperties),nextPageToken",
    });
    if (nextPageToken) params.set("pageToken", nextPageToken);

    const listResponse = await googleRequest<{ items?: GoogleCalendarEvent[]; nextPageToken?: string }>(
      account.access_token!,
      `/calendars/primary/events?${params.toString()}`,
    );

    if (!listResponse.ok) {
      const status =
        listResponse.status === 401 || listResponse.status === 403 ? 403 : 502;
      const code = status === 403 ? "GOOGLE_CALENDAR_AUTH_REQUIRED" : undefined;
      return NextResponse.json(
        { code, error: listResponse.error || "Google Takvim etkinlikleri alınamadı." },
        { status },
      );
    }

    existingEvents.push(...(listResponse.data.items ?? []));
    nextPageToken = listResponse.data.nextPageToken;
  } while (nextPageToken);

  const eventByBlockId = new Map<string, GoogleCalendarEvent>();
  const duplicateEventIds: string[] = [];
  existingEvents.forEach((event) => {
    const blockId = event.extendedProperties?.private?.studyomBlockId;
    if (!blockId) return;
    if (eventByBlockId.has(blockId)) {
      duplicateEventIds.push(event.id);
      return;
    }
    eventByBlockId.set(blockId, event);
  });

  let created = 0;
  let updated = 0;
  let deleted = 0;

  for (const block of blocks) {
    const displayName =
      block.reservationRequest?.requesterName?.trim() ||
      stripReservationPrefix(block.title) ||
      (block.type === "manual_block" ? "Manuel blok" : "Rezervasyon");
    const phone =
      block.reservationRequest?.requesterPhone?.trim() ||
      parsePrefixedLine(block.note, "Telefon:");
    const note =
      block.reservationRequest?.note?.trim() ||
      parsePrefixedLine(block.note, "Not:") ||
      (block.type === "manual_block" ? parseManualNote(block.note) : "");
    const statusLabel = normalizeStatusLabel(block.reservationRequest?.status ?? block.status);
    const description = [
      displayName,
      phone,
      note,
      block.room.name || "Oda",
      `Tip: ${typeLabel(block.type)}`,
      `Durum: ${statusLabel}`,
    ]
      .filter((line) => Boolean(line && line.trim()))
      .join("\n");

    const payload = {
      summary: displayName,
      description,
      start: {
        dateTime: block.startAt.toISOString(),
        timeZone: timezone,
      },
      end: {
        dateTime: block.endAt.toISOString(),
        timeZone: timezone,
      },
      colorId: getGoogleCalendarColorId(block.room.color ?? DEFAULT_ROOM_COLOR),
      extendedProperties: buildExtendedProps(studio.id, block.id, block.roomId),
    };

    const existingEvent = eventByBlockId.get(block.id);
    if (existingEvent?.id) {
      const updateResponse = await googleRequest(
        account.access_token!,
        `/calendars/primary/events/${encodeURIComponent(existingEvent.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
      );
      if (!updateResponse.ok) {
        return NextResponse.json(
          { error: updateResponse.error || "Google Takvim etkinliği güncellenemedi." },
          { status: 502 },
        );
      }
      updated += 1;
      continue;
    }

    const insertResponse = await googleRequest<{ id: string }>(
      account.access_token!,
      "/calendars/primary/events",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
    if (!insertResponse.ok) {
      return NextResponse.json(
        { error: insertResponse.error || "Google Takvim etkinliği oluşturulamadı." },
        { status: 502 },
      );
    }
    created += 1;
  }

  const validBlockIds = new Set(blocks.map((block) => block.id));
  const staleEventIds = [
    ...duplicateEventIds,
    ...existingEvents
      .filter((event) => {
        const blockId = event.extendedProperties?.private?.studyomBlockId;
        return blockId ? !validBlockIds.has(blockId) : false;
      })
      .map((event) => event.id),
  ];

  for (const eventId of staleEventIds) {
    const deleteResponse = await googleRequest(
      account.access_token!,
      `/calendars/primary/events/${encodeURIComponent(eventId)}`,
      { method: "DELETE" },
    );
    if (!deleteResponse.ok && deleteResponse.status !== 404) {
      return NextResponse.json(
        { error: deleteResponse.error || "Eski Google Takvim etkinliği silinemedi." },
        { status: 502 },
      );
    }
    deleted += 1;
  }

  return NextResponse.json({
    ok: true,
    created,
    updated,
    deleted,
    total: blocks.length,
    message: `Google Takvim senkronlandı. ${created} yeni, ${updated} güncel, ${deleted} kaldırıldı.`,
  });
}
