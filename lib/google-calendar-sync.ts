import type { Account } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_ROOM_COLOR, getGoogleCalendarColorId } from "@/lib/room-colors";

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

type SyncStudio = {
  id: string;
  name: string;
  ownerEmail: string;
  calendarSettings: {
    timezone: string;
  } | null;
};

type SyncBlock = {
  id: string;
  roomId: string;
  startAt: Date;
  endAt: Date;
  type: string;
  title: string | null;
  status: string | null;
  note: string | null;
  room: {
    id: string;
    name: string;
    color: string | null;
  };
  reservationRequest: {
    requesterName: string;
    requesterPhone: string;
    note: string | null;
    status: string;
    totalPrice: number | null;
    currency: string | null;
  } | null;
};

export type GoogleCalendarSyncResult =
  | {
      ok: true;
      created: number;
      updated: number;
      deleted: number;
      total: number;
      message: string;
    }
  | {
      ok: false;
      status: number;
      error: string;
      code?: "GOOGLE_CALENDAR_AUTH_REQUIRED";
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

const formatPayment = (value?: number | null, currency?: string | null) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "";
  const normalizedCurrency = (currency || "TRY").toUpperCase();
  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toLocaleString("tr-TR")} ${normalizedCurrency}`;
  }
};

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

  return prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: json.access_token,
      expires_at: nextExpiresAt ?? null,
      scope: json.scope ?? account.scope,
      token_type: json.token_type ?? account.token_type,
    },
  });
}

async function getGoogleAccountForOwnerEmail(ownerEmail: string) {
  return prisma.account.findFirst({
    where: {
      provider: "google",
      user: { email: { equals: ownerEmail, mode: "insensitive" } },
    },
  });
}

async function getStudioById(studioId: string): Promise<SyncStudio | null> {
  return prisma.studio.findUnique({
    where: { id: studioId },
    select: {
      id: true,
      name: true,
      ownerEmail: true,
      calendarSettings: { select: { timezone: true } },
    },
  });
}

async function getStudioByOwnerEmail(ownerEmail: string): Promise<SyncStudio | null> {
  return prisma.studio.findFirst({
    where: { ownerEmail: { equals: ownerEmail, mode: "insensitive" } },
    select: {
      id: true,
      name: true,
      ownerEmail: true,
      calendarSettings: { select: { timezone: true } },
    },
  });
}

async function getBlocksForStudio(studioId: string): Promise<SyncBlock[]> {
  return prisma.studioCalendarBlock.findMany({
    where: { studioId },
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
          totalPrice: true,
          currency: true,
        },
      },
    },
  });
}

async function syncGoogleCalendarInternal(
  studio: SyncStudio,
  account: Account,
): Promise<GoogleCalendarSyncResult> {
  let resolvedAccount = account;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (!resolvedAccount.access_token || (resolvedAccount.expires_at && resolvedAccount.expires_at <= nowInSeconds + 60)) {
    const refreshed = await refreshGoogleAccessToken(resolvedAccount);
    if (!refreshed?.access_token) {
      return {
        ok: false,
        status: 403,
        code: "GOOGLE_CALENDAR_AUTH_REQUIRED",
        error: "Google erişim izni yenilenemedi.",
      };
    }
    resolvedAccount = refreshed;
  }

  const blocks = await getBlocksForStudio(studio.id);
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
      resolvedAccount.access_token!,
      `/calendars/primary/events?${params.toString()}`,
    );

    if (!listResponse.ok) {
      const status = listResponse.status === 401 || listResponse.status === 403 ? 403 : 502;
      return {
        ok: false,
        status,
        code: status === 403 ? "GOOGLE_CALENDAR_AUTH_REQUIRED" : undefined,
        error: listResponse.error || "Google Takvim etkinlikleri alınamadı.",
      };
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
    const payment =
      formatPayment(block.reservationRequest?.totalPrice, block.reservationRequest?.currency) ||
      parsePrefixedLine(block.note, "Ücret:");
    const statusLabel = normalizeStatusLabel(block.reservationRequest?.status ?? block.status);
    const description = [
      displayName,
      phone,
      note,
      block.room.name || "Oda",
      payment ? `Alınacak ödeme: ${payment}` : "",
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
        resolvedAccount.access_token!,
        `/calendars/primary/events/${encodeURIComponent(existingEvent.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
      );
      if (!updateResponse.ok) {
        return {
          ok: false,
          status: 502,
          error: updateResponse.error || "Google Takvim etkinliği güncellenemedi.",
        };
      }
      updated += 1;
      continue;
    }

    const insertResponse = await googleRequest<{ id: string }>(
      resolvedAccount.access_token!,
      "/calendars/primary/events",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
    if (!insertResponse.ok) {
      return {
        ok: false,
        status: 502,
        error: insertResponse.error || "Google Takvim etkinliği oluşturulamadı.",
      };
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
      resolvedAccount.access_token!,
      `/calendars/primary/events/${encodeURIComponent(eventId)}`,
      { method: "DELETE" },
    );
    if (!deleteResponse.ok && deleteResponse.status !== 404) {
      return {
        ok: false,
        status: 502,
        error: deleteResponse.error || "Eski Google Takvim etkinliği silinemedi.",
      };
    }
    deleted += 1;
  }

  return {
    ok: true,
    created,
    updated,
    deleted,
    total: blocks.length,
    message: `Google Takvim senkronlandı. ${created} yeni, ${updated} güncel, ${deleted} kaldırıldı.`,
  };
}

async function syncWithStudio(studio: SyncStudio | null, options?: { requireAuth?: boolean }) {
  if (!studio) {
    return {
      ok: false,
      status: 404,
      error: "Stüdyo bulunamadı.",
    } satisfies GoogleCalendarSyncResult;
  }

  const account = await getGoogleAccountForOwnerEmail(studio.ownerEmail);
  if (!account || !hasCalendarScope(account.scope)) {
    return {
      ok: false,
      status: 403,
      code: "GOOGLE_CALENDAR_AUTH_REQUIRED",
      error: options?.requireAuth ? "Google Takvim izni gerekli." : "Google Takvim bağlı değil.",
    } satisfies GoogleCalendarSyncResult;
  }

  return syncGoogleCalendarInternal(studio, account);
}

export async function syncGoogleCalendarForStudio(
  studioId: string,
  options?: { requireAuth?: boolean },
): Promise<GoogleCalendarSyncResult> {
  const studio = await getStudioById(studioId);
  return syncWithStudio(studio, options);
}

export async function syncGoogleCalendarForOwnerEmail(
  ownerEmail: string,
  options?: { requireAuth?: boolean },
): Promise<GoogleCalendarSyncResult> {
  const studio = await getStudioByOwnerEmail(ownerEmail);
  return syncWithStudio(studio, options);
}

export async function triggerGoogleCalendarSyncForStudio(studioId: string) {
  try {
    const result = await syncGoogleCalendarForStudio(studioId);
    if (!result.ok && result.code !== "GOOGLE_CALENDAR_AUTH_REQUIRED") {
      console.error("google calendar auto sync failed", { studioId, status: result.status, error: result.error });
    }
    return result;
  } catch (error) {
    console.error("google calendar auto sync crashed", { studioId, error });
    return null;
  }
}
