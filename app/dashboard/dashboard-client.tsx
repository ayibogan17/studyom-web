"use client";

import { useEffect, useMemo, useState, useRef } from "react";

import { SignOutButton } from "@/components/sign-out-button";
import { OpeningHours, Room, Slot, Studio } from "@/types/panel";

type Props = {
  initialStudio?: Studio;
  userName?: string | null;
  userEmail?: string | null;
};

const shortDays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const longDays = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

const defaultEquipment: Room["equipment"] = {
  hasDrum: false,
  drumDetail: "",
  micCount: 0,
  micDetails: [],
  guitarAmpCount: 0,
  guitarAmpDetails: [],
  hasBassAmp: false,
  bassDetail: "",
  hasDiBox: false,
  diDetail: "",
  hasPedal: false,
  pedalDetail: "",
  hasKeyboard: false,
  keyboardDetail: "",
  hasKeyboardStand: false,
  hasGuitarsForUse: false,
  guitarUseDetail: "",
};

const defaultFeatures: Room["features"] = {
  micCount: 0,
  micDetails: [],
  musicianMicAllowed: false,
  hasControlRoom: false,
  hasHeadphones: false,
  headphonesDetail: "",
  hasTechSupport: false,
};

const defaultExtras: Room["extras"] = {
  offersMixMaster: false,
  engineerPortfolioUrl: "",
  offersProduction: false,
  productionAreas: [],
  offersOther: false,
  otherDetail: "",
  acceptsCourses: false,
};

function normalizeRoom(room: Room): Room {
  return {
    ...room,
    equipment: room.equipment ?? { ...defaultEquipment },
    features: room.features ?? { ...defaultFeatures },
    extras: room.extras ?? { ...defaultExtras },
    images: room.images ?? [],
    slots: room.slots ?? {},
  };
}

function normalizeStudio(data: Studio | null): Studio | null {
  if (!data) return null;
  return {
    ...data,
    openingHours:
      data.openingHours?.length === 7
        ? data.openingHours
        : Array.from({ length: 7 }, () => ({
            open: true,
            openTime: "09:00",
            closeTime: "21:00",
          })),
    rooms: (data.rooms ?? []).map((r) => normalizeRoom(r)),
  };
}

const colorPalette = ["#1D4ED8", "#0EA5E9", "#10B981", "#F97316", "#F43F5E"];

const pickNextColor = (rooms: Room[]) => {
  const used = new Set(
    rooms
      .map((r) => r.color)
      .filter(Boolean)
      .map((c) => c!.toLowerCase()),
  );
  const next =
    colorPalette.find((c) => !used.has(c.toLowerCase())) ?? colorPalette[rooms.length % colorPalette.length];
  return next;
};

const pad = (n: number) => n.toString().padStart(2, "0");
const formatKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const weekdayIndex = (d: Date) => {
  // Monday = 0 ... Sunday = 6
  return (d.getDay() + 6) % 7;
};

const pricingLabel = (room: Room) => {
  const { pricing, type } = room;
  if (pricing.model === "flat" && pricing.flatRate) {
    return `Saatlik ${pricing.flatRate}₺`;
  }
  if (pricing.model === "daily" && pricing.dailyRate) {
    return `Günlük ${pricing.dailyRate}₺`;
  }
  if (pricing.model === "hourly" && pricing.hourlyRate) {
    return `Saatlik ${pricing.hourlyRate}₺`;
  }
  if (pricing.model === "variable" && pricing.minRate) {
    return `Değişken • min ${pricing.minRate}₺`;
  }
  return `${type} için ücret bilgisi eklenmedi`;
};

const ensureSlotsForDay = (
  room: Room,
  day: Date,
  openingHours: OpeningHours[],
): Room => {
  const key = formatKey(day);
  if (room.slots[key]) return room;

  const dayIdx = weekdayIndex(day);
  const info = openingHours[dayIdx];
  if (!info || !info.open) {
    return { ...room, slots: { ...room.slots, [key]: [] } };
  }

  const [startHour] = info.openTime.split(":").map(Number);
  const [endHour] = info.closeTime.split(":").map(Number);
  const generated: Slot[] = [];
  for (let h = startHour; h < endHour; h++) {
    generated.push({
      timeLabel: `${pad(h)}:00 - ${pad(h + 1)}:00`,
      status: "empty",
    });
  }

  return { ...room, slots: { ...room.slots, [key]: generated } };
};

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function DashboardClient({ initialStudio, userName, userEmail }: Props) {
  const [studio, setStudio] = useState<Studio | null>(
    normalizeStudio(initialStudio ?? null),
  );
  const [activeTab, setActiveTab] = useState<string>("panel");
  const [selectedRoomId, setSelectedRoomId] = useState(
    initialStudio?.rooms?.[0]?.id ?? "",
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [monthCursor, setMonthCursor] = useState<Date>(new Date());
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [hoursDraft, setHoursDraft] = useState<OpeningHours[]>(
    normalizeStudio(initialStudio ?? null)?.openingHours ?? [],
  );
  const [showRatings, setShowRatings] = useState(false);
  const [editingHours, setEditingHours] = useState(false);
  const [dragRoomId, setDragRoomId] = useState<string | null>(null);
  const [showPalette, setShowPalette] = useState(false);
  const [showEquipment, setShowEquipment] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const studioRooms = studio?.rooms ?? [];
  const orderedRooms = useMemo(() => {
    if (!studio?.rooms) return [];
    return [...studio.rooms].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name),
    );
  }, [studio?.rooms]);
  const currentRoomRaw =
    orderedRooms.find((r) => r.id === selectedRoomId) ?? orderedRooms[0] ?? null;
  const currentRoom = currentRoomRaw ? normalizeRoom(currentRoomRaw) : null;

  // sync hours draft when studio changes
  useEffect(() => {
    if (studio?.openingHours) {
      setHoursDraft(studio.openingHours);
    }
  }, [studio?.openingHours]);

  useEffect(() => {
    if (!orderedRooms.length) return;
    const exists = orderedRooms.some((r) => r.id === selectedRoomId);
    if (!exists) {
      setSelectedRoomId(orderedRooms[0].id);
      setActiveTab(`room-${orderedRooms[0].id}`);
    }
  }, [orderedRooms, selectedRoomId]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key.startsWith("room-")) {
      const id = key.replace("room-", "");
      setSelectedRoomId(id);
    }
  };

  const handleDaySelect = (day: Date) => {
    if (!currentRoom) return;
    setStudio((prev) =>
      prev
        ? {
            ...prev,
            rooms: prev.rooms.map((room) => {
              if (room.id !== currentRoom.id) return room;
              return ensureSlotsForDay(room, day, prev.openingHours);
            }),
          }
        : prev,
    );
    setSelectedDate(day);
  };

  const updateSlot = (
    index: number,
    patch: Partial<Slot>,
    date: Date | null,
  ) => {
    if (!currentRoom || !date || !studio) return;
    setStudio((prev) =>
      prev
        ? {
            ...prev,
            rooms: prev.rooms.map((room) => {
              if (room.id !== currentRoom.id) return room;
              const roomWithSlots = ensureSlotsForDay(
                room,
                date,
                prev.openingHours,
              );
              const key = formatKey(date);
              const updatedSlots = roomWithSlots.slots[key].map((slot, i) =>
                i === index ? { ...slot, ...patch } : slot,
              );
              return {
                ...roomWithSlots,
                slots: { ...roomWithSlots.slots, [key]: updatedSlots },
              };
            }),
          }
        : prev,
    );
  };

  const updateSlotAndPersist = async (
    index: number,
    patch: Partial<Slot>,
    date: Date | null,
  ) => {
    if (!currentRoom || !date) return;
    updateSlot(index, patch, date);
    try {
      await fetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: currentRoom.id,
          date: formatKey(date),
          timeLabel: slotList[index]?.timeLabel,
          status: patch.status,
          name: patch.name,
        }),
      });
    } catch (e) {
      console.error("Slot save failed", e);
      setStatus("Slot kaydedilemedi");
    }
  };

  const persistRoomOrder = async (ordered: Room[]) => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/studio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rooms: ordered.map((r) => ({ id: r.id, order: r.order ?? 0 })),
        }),
      });
      let json: { studio?: Studio | null; error?: string } | null = null;
      try {
        json = await res.json();
      } catch {
        // Ignore parse errors; treat empty body as ok
        json = null;
      }
      if (res.ok) {
        if (json?.studio) {
          setStudio(normalizeStudio(json.studio));
        }
        setStatus("Oda sırası kaydedildi");
      } else {
        const text = json?.error ?? (await res.text().catch(() => "")) ?? "";
        setStatus(text || `Kaydedilemedi (status ${res.status})`);
      }
    } catch (e) {
      console.error(e);
      setStatus("Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const saveStudioMeta = async (data: {
    city?: string;
    district?: string;
    address?: string;
    phone?: string;
    openingHours?: OpeningHours[];
  }) => {
    if (!studio) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/studio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studio: data }),
      });
      const json = await res.json();
      if (res.ok && json.studio) {
        setStudio(normalizeStudio(json.studio));
        if (data.openingHours) {
          setHoursDraft(data.openingHours);
        }
        setStatus("Kaydedildi");
      } else {
        setStatus(json.error || "Kaydedilemedi");
      }
    } catch (e) {
      console.error(e);
      setStatus("Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const saveRoomBasics = async (roomId: string, patch: Partial<Room>) => {
    if (!studio) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/studio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rooms: [
            {
              id: roomId,
              name: patch.name,
              type: patch.type,
              color: patch.color,
              pricing: patch.pricing,
              equipment: patch.equipment,
              extras: patch.extras,
              features: patch.features,
              images: patch.images,
              order: patch.order,
            },
          ],
        }),
      });
      const json = await res.json();
      if (res.ok && json.studio) {
        setStudio(normalizeStudio(json.studio));
        setStatus("Kaydedildi");
      } else {
        setStatus(json.error || "Kaydedilemedi");
      }
    } catch (e) {
      console.error(e);
      setStatus("Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const addRoom = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const existingPayload = buildRoomsPayload(orderedRooms);
      const newRoomOrder = orderedRooms.length;
      const nextColor = pickNextColor(orderedRooms);
      const res = await fetch("/api/studio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rooms: [
            ...existingPayload,
            {
              name: `Yeni Oda ${studioRooms.length + 1}`,
              type: "Prova odası",
              color: nextColor,
              order: newRoomOrder,
              pricing: { model: "flat", flatRate: "" },
              equipment: defaultEquipment,
              features: defaultFeatures,
              extras: defaultExtras,
              images: [],
            },
          ],
        }),
      });
      const json = await res.json();
      if (res.ok && json.studio) {
        const normalized = normalizeStudio(json.studio);
        setStudio(normalized);
        if (normalized?.rooms?.length) {
          const newest =
            [...normalized.rooms].sort(
              (a, b) => (b.order ?? 0) - (a.order ?? 0) || b.name.localeCompare(a.name),
            )[0] ?? normalized.rooms[normalized.rooms.length - 1];
          setSelectedRoomId(newest.id);
          setActiveTab(`room-${newest.id}`);
        }
        setStatus("Yeni oda eklendi");
      } else {
        setStatus(json.error || "Oda eklenemedi");
      }
    } catch (e) {
      console.error(e);
      setStatus("Oda eklenemedi");
    } finally {
      setSaving(false);
    }
  };

  const metrics = useMemo(() => {
    if (!studio) {
      return { todayConfirmed: 0, weekConfirmed: 0, occupancy: 0 };
    }
    const now = new Date();
    const todayKey = formatKey(now);
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - weekdayIndex(now),
    );
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    let todayConfirmed = 0;
    let weekConfirmed = 0;
    let weekTotal = 0;

    studio.rooms.forEach((room) => {
      Object.entries(room.slots).forEach(([key, slots]) => {
        const dateObj = parseKey(key);
        const confirmed = slots.filter((s) => s.status === "confirmed").length;
        if (key === todayKey) {
          todayConfirmed += confirmed;
        }
        if (dateObj >= start && dateObj <= end) {
          weekConfirmed += confirmed;
          weekTotal += slots.length;
        }
      });
    });

    const occupancy =
      weekTotal === 0 ? 0 : Math.round((weekConfirmed / weekTotal) * 1000) / 10;

    return { todayConfirmed, weekConfirmed, occupancy };
  }, [studio]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText("https://studyom.net/studio/demo");
    } catch (e) {
      console.error("Link kopyalanamadı", e);
    }
  };

  const buildRoomsPayload = (rooms: Room[]) =>
    rooms.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      color: r.color,
      order: r.order ?? 0,
      pricing: r.pricing,
      equipment: r.equipment ?? defaultEquipment,
      features: r.features ?? defaultFeatures,
      extras: r.extras ?? defaultExtras,
      images: r.images ?? [],
    }));

  const startOfMonth = new Date(
    monthCursor.getFullYear(),
    monthCursor.getMonth(),
    1,
  );
  const startOffset = weekdayIndex(startOfMonth);
  const daysInMonth = new Date(
    monthCursor.getFullYear(),
    monthCursor.getMonth() + 1,
    0,
  ).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const slotList = (() => {
    if (!currentRoom || !selectedDate || !studio) return [];
    const key = formatKey(selectedDate);
    const withSlots = ensureSlotsForDay(currentRoom, selectedDate, studio.openingHours);
    return withSlots.slots[key] || [];
  })();

  if (!studio) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-gray-600">
        Studio verisi yüklenemedi.
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-b from-white via-blue-50/40 to-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-3 rounded-3xl border border-black/5 bg-white/80 p-6 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Stüdyo paneli
            </p>
            <h1 className="text-3xl font-bold text-gray-900">
              Hoş geldin{userName ? `, ${userName}` : ""}!
            </h1>
            <p className="text-sm text-gray-600">
              Flutter panelindeki akışın web uyarlaması. Slotları düzenleyebilir,
              kurs aç/kapa yapabilir ve açılış saatlerini görebilirsin. Veriler
              demo/moktur.
            </p>
            {userEmail && (
              <p className="text-sm text-gray-700">
                Giriş yaptığın e-posta:{" "}
                <span className="font-semibold">{userEmail}</span>
              </p>
            )}
          </div>
          <SignOutButton />
        </header>

        {status && (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {status}
          </div>
        )}

        <nav className="mb-6 flex flex-wrap gap-2">
          {[
            { key: "panel", label: "Panel" },
            { key: "calendar", label: "Takvim" },
            ...orderedRooms.map((r) => ({ key: `room-${r.id}`, label: r.name || "Oda" })),
          ].map((item) => (
            <button
              key={item.key}
              draggable={item.key.startsWith("room-")}
              onDragStart={() => {
                if (item.key.startsWith("room-")) setDragRoomId(item.key.replace("room-", ""));
              }}
              onDragOver={(e) => {
                if (!item.key.startsWith("room-")) return;
                e.preventDefault();
              }}
              onDrop={() => {
                if (!item.key.startsWith("room-")) return;
                const targetId = item.key.replace("room-", "");
                if (!dragRoomId || dragRoomId === targetId) return;
                const newOrder = [...orderedRooms];
                const from = newOrder.findIndex((r) => r.id === dragRoomId);
                const to = newOrder.findIndex((r) => r.id === targetId);
                if (from === -1 || to === -1) return;
                const [moved] = newOrder.splice(from, 1);
                newOrder.splice(to, 0, moved);
                const withOrder = newOrder.map((r, idx) => ({ ...r, order: idx }));
                setStudio((prev) => (prev ? { ...prev, rooms: withOrder } : prev));
                persistRoomOrder(withOrder);
                setDragRoomId(null);
              }}
              onDragEnd={() => setDragRoomId(null)}
              onClick={() => handleTabChange(item.key)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                activeTab === item.key
                  ? "border-blue-500 bg-blue-500 text-white shadow-sm"
                  : "border-blue-100 bg-white text-gray-800 hover:border-blue-200"
              }`}
            >
              {item.key.startsWith("room-") && (
                <span
                  className="mr-2 inline-block h-3 w-3 rounded-full border border-white/70"
                  style={{
                    backgroundColor:
                      orderedRooms.find((r) => `room-${r.id}` === item.key)?.color ?? "#1D4ED8",
                  }}
                  aria-hidden
                />
              )}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
          <button
            onClick={addRoom}
            className="rounded-full border border-dashed border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-blue-300 hover:text-blue-700"
          >
            + Oda ekle
          </button>
        </nav>

        {activeTab === "panel" && (
          <section className="grid gap-4 lg:grid-cols-3">
            <button
              onClick={() => setShowRatings(true)}
              className="rounded-2xl border border-green-100 bg-green-50/80 p-4 text-left transition hover:border-green-200 hover:shadow-sm"
            >
              <p className="text-sm font-semibold text-green-900">Puan</p>
              <p className="mt-2 text-4xl font-bold text-green-800">
                {studio.ratings.length
                  ? (studio.ratings.reduce((a, b) => a + b, 0) / studio.ratings.length).toFixed(1)
                  : "0.0"}
              </p>
              <p className="mt-1 text-xs text-green-700 underline">Yorumları aç</p>
            </button>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
              <p className="text-sm font-semibold text-blue-900">Rezervasyon özeti</p>
              <div className="mt-2 space-y-1 text-sm text-blue-800">
                <p>Bugün onaylanan: {metrics.todayConfirmed}</p>
                <p>Bu hafta onaylanan: {metrics.weekConfirmed}</p>
                <p>Doluluk: {metrics.occupancy}%</p>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
              <p className="text-sm font-semibold text-blue-900">Bildirimler</p>
              <ul className="mt-2 space-y-1 text-sm text-blue-800">
                {studio.notifications.slice(0, 3).map((n, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white/90 p-4 lg:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Açılış saatleri</p>
                  <p className="text-xs text-gray-600">
                    Tüm odalar için geçerli. Kapalı günler kırmızı görünür.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingHours((v) => !v)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-800 hover:border-blue-300"
                  >
                    {editingHours ? "İptal" : "Saatleri düzenle"}
                  </button>
                  {editingHours && (
                    <button
                      disabled={saving}
                      onClick={() =>
                        saveStudioMeta({
                          openingHours: hoursDraft,
                        })
                      }
                      className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {saving ? "Kaydediliyor..." : "Kaydet"}
                    </button>
                  )}
                </div>
                {studio.calendarNote && (
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                    {studio.calendarNote}
                  </span>
                )}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {(editingHours ? hoursDraft : studio.openingHours).map((h, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col gap-2 rounded-xl border px-3 py-2 text-sm ${
                      h.open
                        ? "border-gray-100 bg-gray-50 text-gray-900"
                        : "border-red-100 bg-red-50 text-red-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{longDays[idx]}</span>
                      {editingHours ? (
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={h.open}
                            onChange={(e) =>
                              setHoursDraft((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, open: e.target.checked } : item,
                                ),
                              )
                            }
                          />
                          Açık
                        </label>
                      ) : (
                        <span>{h.open ? `${h.openTime} - ${h.closeTime}` : "Kapalı"}</span>
                      )}
                    </div>
                    {editingHours && h.open && (
                      <div className="flex items-center gap-2 text-xs">
                        <input
                          className="w-20 rounded-lg border border-gray-200 px-2 py-1"
                          value={h.openTime}
                          onChange={(e) =>
                            setHoursDraft((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, openTime: e.target.value } : item,
                              ),
                            )
                          }
                        />
                        <span>-</span>
                        <input
                          className="w-20 rounded-lg border border-gray-200 px-2 py-1"
                          value={h.closeTime}
                          onChange={(e) =>
                            setHoursDraft((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, closeTime: e.target.value } : item,
                              ),
                            )
                          }
                        />
                      </div>
                    )}
                    {!editingHours && (
                      <span>{h.open ? `${h.openTime} - ${h.closeTime}` : "Kapalı"}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-purple-50/80 p-4">
              <p className="text-sm font-semibold text-purple-900">Hızlı paylaşım</p>
              <p className="mt-2 text-sm text-purple-800">
                Demo stüdyo linki panoya kopyalanır.
              </p>
              <button
                onClick={copyLink}
                className="mt-3 w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
              >
                Linki kopyala
              </button>
            </div>
          </section>
        )}

        {activeTab === "calendar" && currentRoom && (
          <section className="mt-2 rounded-3xl border border-black/5 bg-white/80 p-5 shadow-sm backdrop-blur">
            <div className="mb-2 flex items-center gap-2 text-xs text-gray-600">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: currentRoom.color }}
              />
              <span>Takvim vurguları oda rengine göre</span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Takvim</p>
                <p className="text-xs text-gray-600">
                  {currentRoom.name} için slotları düzenle. Kapalı günler tıklanamaz.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setMonthCursor(
                      new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1),
                    )
                  }
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  Önceki
                </button>
                <div className="min-w-[160px] text-center text-sm font-semibold">
                  {monthCursor.toLocaleDateString("tr-TR", {
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                <button
                  onClick={() =>
                    setMonthCursor(
                      new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1),
                    )
                  }
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  Sonraki
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {orderedRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => {
                    setSelectedRoomId(room.id);
                    handleTabChange("calendar");
                  }}
                  style={
                    room.id === currentRoom.id
                      ? { backgroundColor: room.color, borderColor: room.color, color: "#fff" }
                      : { borderColor: "#e5e7eb" }
                  }
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    room.id === currentRoom.id ? "" : "bg-gray-50 text-gray-700 hover:border-blue-300"
                  }`}
                >
                  {room.name}
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-3">
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-gray-700">
                {shortDays.map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-2 text-sm">
                {Array.from({ length: totalCells }).map((_, idx) => {
                  const dayNum = idx - startOffset + 1;
                  if (dayNum < 1 || dayNum > daysInMonth) {
                    return <div key={idx} />;
                  }
                  const date = new Date(
                    monthCursor.getFullYear(),
                    monthCursor.getMonth(),
                    dayNum,
                  );
                  const key = formatKey(date);
                  const dayIdx = weekdayIndex(date);
                  const isOpen = studio.openingHours[dayIdx]?.open;
                  const slots = currentRoom.slots[key] || [];
                  const confirmed = slots.filter((s) => s.status === "confirmed").length;
                  const isSelected =
                    selectedDate &&
                    formatKey(selectedDate) === key &&
                    selectedRoomId === currentRoom.id;
                  const selectedStyle = isSelected
                    ? {
                        borderColor: currentRoom.color,
                        backgroundColor: `${currentRoom.color}22`,
                      }
                    : {};

                  return (
                    <button
                      key={idx}
                      onClick={() => isOpen && handleDaySelect(date)}
                      style={selectedStyle}
                      className={`flex h-16 flex-col rounded-xl border text-left transition ${
                        !isOpen
                          ? "cursor-not-allowed border-red-100 bg-red-50 text-red-700"
                          : !isSelected
                            ? "border-gray-200 bg-white hover:border-blue-300"
                            : ""
                      }`}
                    >
                      <span className="px-2 py-1 text-sm font-semibold">{dayNum}</span>
                      {confirmed > 0 && (
                        <span className="px-2 text-xs text-green-700">
                          {confirmed} onaylı
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDate && currentRoom && (
              <div className="mt-4 rounded-2xl border border-gray-100 bg-white/90 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {currentRoom.name} •{" "}
                      {selectedDate.toLocaleDateString("tr-TR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                    <p className="text-xs text-gray-600">
                      Slotların durumunu değiştir. İsim kutucuğu opsiyonel.
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                    {pricingLabel(currentRoom)}
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {slotList.length === 0 && (
                    <p className="text-sm text-gray-600">
                      Bu gün için slot yok (kapalı veya henüz oluşturulmadı).
                    </p>
                  )}
                  {slotList.map((slot, i) => (
                    <div
                      key={i}
                      className={`flex flex-col gap-2 rounded-xl border px-3 py-2 sm:flex-row sm:items-center sm:gap-3 ${
                        slot.status === "confirmed"
                          ? "border-green-200 bg-green-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="min-w-[140px] font-semibold text-gray-900">
                        {slot.timeLabel}
                      </div>
                      <input
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                        placeholder="İsim (opsiyonel)"
                        value={slot.name ?? ""}
                        onChange={(e) =>
                          updateSlotAndPersist(i, { name: e.target.value }, selectedDate)
                        }
                      />
                      <div className="flex gap-2">
                        {slot.status !== "confirmed" && (
                          <button
                            onClick={() =>
                              updateSlotAndPersist(i, { status: "confirmed" }, selectedDate)
                            }
                            className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                          >
                            Onayla
                          </button>
                        )}
                        {slot.status !== "empty" && (
                          <button
                            onClick={() =>
                              updateSlotAndPersist(i, { status: "empty", name: "" }, selectedDate)
                            }
                            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-800 hover:border-blue-300"
                          >
                            Boşalt
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab.startsWith("room-") && currentRoom && (
          <section className="mt-2 grid gap-4">
            <div className="rounded-2xl border border-gray-100 bg-white/90 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-400 focus:outline-none"
                  value={currentRoom.name}
                  onChange={(e) =>
                    setStudio((prev) =>
                      prev
                        ? {
                            ...prev,
                            rooms: prev.rooms.map((r) =>
                              r.id === currentRoom.id ? { ...r, name: e.target.value } : r,
                            ),
                          }
                        : prev,
                    )
                  }
                />
                <select
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
                  value={currentRoom.type}
                  onChange={(e) =>
                    setStudio((prev) =>
                      prev
                        ? {
                            ...prev,
                            rooms: prev.rooms.map((r) =>
                              r.id === currentRoom.id ? { ...r, type: e.target.value } : r,
                            ),
                          }
                        : prev,
                    )
                  }
                >
                  {["Prova odası", "Vokal kabini", "Kayıt kabini", "Davul kabini", "Etüt odası"].map(
                    (t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ),
                  )}
                </select>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-8 w-8 rounded-full border border-gray-200"
                    style={{ backgroundColor: currentRoom.color }}
                    aria-hidden
                  />
                  <button
                    type="button"
                    onClick={() => setShowPalette((v) => !v)}
                    className="rounded-full border border-gray-200 p-2 text-xs text-gray-700 hover:border-blue-300 hover:text-blue-700"
                    aria-label="Renk değiştir"
                  >
                    ✏️
                  </button>
                </div>
                {showPalette && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {colorPalette.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setStudio((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  rooms: prev.rooms.map((r) =>
                                    r.id === currentRoom.id ? { ...r, color: c } : r,
                                  ),
                                }
                              : prev,
                          );
                          setShowPalette(false);
                        }}
                        className="h-9 w-9 rounded-full border border-gray-200 ring-offset-2 hover:ring-2 hover:ring-blue-400"
                        style={{ backgroundColor: c }}
                        aria-label={`Renk ${c}`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <h2 className="mt-3 text-2xl font-bold text-gray-900">
                {currentRoom.name}
              </h2>
              <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-gray-900">
                <p className="text-sm font-semibold text-gray-900">Fiyatlandırma</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-900">
                  <label className="flex items-center gap-2">
                    <span>Ücretlendirme</span>
                    <select
                      className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-400 focus:outline-none"
                      value={
                        currentRoom.pricing.model === "daily" ||
                        currentRoom.pricing.model === "hourly"
                          ? currentRoom.pricing.model
                          : "hourly"
                      }
                      onChange={(e) => {
                        const nextModel = e.target.value as Room["pricing"]["model"];
                        const rate =
                          nextModel === "daily"
                            ? currentRoom.pricing.dailyRate ?? currentRoom.pricing.hourlyRate ?? ""
                            : currentRoom.pricing.hourlyRate ?? currentRoom.pricing.dailyRate ?? "";
                        setStudio((prev) =>
                          prev
                            ? {
                                ...prev,
                                rooms: prev.rooms.map((r) =>
                                  r.id === currentRoom.id
                                    ? {
                                        ...r,
                                        pricing: {
                                          ...r.pricing,
                                          model: nextModel,
                                          dailyRate: nextModel === "daily" ? rate : "",
                                          hourlyRate: nextModel === "hourly" ? rate : "",
                                          flatRate: "",
                                          minRate: "",
                                        },
                                      }
                                    : r,
                                ),
                              }
                            : prev,
                        );
                      }}
                    >
                      <option value="daily">Günlük</option>
                      <option value="hourly">Saatlik</option>
                    </select>
                  </label>
                  <input
                    className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-400 focus:outline-none"
                    placeholder="Ücret"
                    value={
                      currentRoom.pricing.model === "daily"
                        ? currentRoom.pricing.dailyRate ?? ""
                        : currentRoom.pricing.hourlyRate ?? ""
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      setStudio((prev) =>
                        prev
                          ? {
                              ...prev,
                              rooms: prev.rooms.map((r) =>
                                r.id === currentRoom.id
                                  ? {
                                      ...r,
                                      pricing: {
                                        ...r.pricing,
                                        dailyRate:
                                          (r.pricing.model === "daily" ? val : r.pricing.dailyRate) ?? "",
                                        hourlyRate:
                                          (r.pricing.model === "hourly" ? val : r.pricing.hourlyRate) ?? "",
                                        flatRate: "",
                                        minRate: "",
                                      },
                                    }
                                  : r,
                              ),
                            }
                          : prev,
                      );
                    }}
                  />
                </div>
                <button
                  disabled={saving}
                  onClick={() =>
                    saveRoomBasics(currentRoom.id, {
                      name: currentRoom.name,
                      type: currentRoom.type,
                      color: currentRoom.color,
                      pricing: currentRoom.pricing,
                    })
                  }
                  className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Kaydediliyor..." : "Oda bilgisi kaydet"}
                </button>
                {currentRoom.type === "Prova odası" && (
                  <div className="mt-4 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
                    <button
                      type="button"
                      onClick={() => setShowEquipment((v) => !v)}
                      className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
                    >
                      Ekipman
                      <span className="text-xs text-gray-500">{showEquipment ? "Gizle" : "Göster"}</span>
                    </button>
                    {showEquipment && (
                      <div className="mt-2 grid gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-800">Davul var mı?</p>
                      <div className="mt-1 flex gap-2">
                        {["Evet", "Hayır"].map((label, idx) => {
                          const val = idx === 0;
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() =>
                                setStudio((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        rooms: prev.rooms.map((r) =>
                                          r.id === currentRoom.id
                                            ? {
                                                ...r,
                                                equipment: {
                                                  ...r.equipment,
                                                  hasDrum: val,
                                                  drumDetail: val ? r.equipment?.drumDetail ?? "" : "",
                                                },
                                              }
                                            : r,
                                        ),
                                      }
                                    : prev,
                                )
                              }
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                currentRoom.equipment?.hasDrum === val
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-200 text-gray-800"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      {currentRoom.equipment?.hasDrum && (
                        <input
                          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
                          value={currentRoom.equipment?.drumDetail ?? ""}
                          onChange={(e) =>
                            setStudio((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    rooms: prev.rooms.map((r) =>
                                      r.id === currentRoom.id
                                        ? { ...r, equipment: { ...r.equipment, drumDetail: e.target.value } }
                                        : r,
                                    ),
                                  }
                                : prev,
                            )
                          }
                          placeholder="Örn: Mapex Saturn"
                        />
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-800">Kaç gitar amfiniz var?</p>
                      <div className="mt-1 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="h-8 w-8 rounded-full border border-gray-300 text-sm font-semibold text-gray-900"
                            onClick={() => {
                              const next = Math.max(0, (currentRoom.equipment?.guitarAmpCount ?? 0) - 1);
                              setStudio((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      rooms: prev.rooms.map((r) => {
                                        if (r.id !== currentRoom.id) return r;
                                        const prevDetails = r.equipment?.guitarAmpDetails ?? [];
                                        const nextDetails =
                                          next === 0
                                            ? []
                                            : Array.from({ length: next }, (_, i) => prevDetails[i] ?? "Örn: Fender Hot Rod");
                                        return {
                                          ...r,
                                          equipment: { ...r.equipment, guitarAmpCount: next, guitarAmpDetails: nextDetails },
                                        };
                                      }),
                                    }
                                  : prev,
                              );
                            }}
                          >
                            -
                          </button>
                          <span className="text-sm font-semibold text-gray-900">
                            {currentRoom.equipment?.guitarAmpCount ?? 0} adet
                          </span>
                        </div>
                        <button
                          type="button"
                          className="h-8 w-8 rounded-full border border-gray-300 text-sm font-semibold text-gray-900"
                          onClick={() => {
                            const next = (currentRoom.equipment?.guitarAmpCount ?? 0) + 1;
                            setStudio((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    rooms: prev.rooms.map((r) => {
                                      if (r.id !== currentRoom.id) return r;
                                      const prevDetails = r.equipment?.guitarAmpDetails ?? [];
                                      const nextDetails = Array.from({ length: next }, (_, i) => prevDetails[i] ?? "Örn: Fender Hot Rod");
                                      return {
                                        ...r,
                                        equipment: { ...r.equipment, guitarAmpCount: next, guitarAmpDetails: nextDetails },
                                      };
                                    }),
                                  }
                                : prev,
                            );
                          }}
                        >
                          +
                        </button>
                      </div>
                      {(currentRoom.equipment?.guitarAmpCount ?? 0) > 0 && (
                        <div className="mt-2 space-y-2">
                          {(currentRoom.equipment?.guitarAmpDetails ?? []).map((val, idx) => (
                            <input
                              key={idx}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
                              value={val}
                              placeholder={`Amfi ${idx + 1} (örn: Marshall DSL)`}
                              onChange={(e) =>
                                setStudio((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        rooms: prev.rooms.map((r) =>
                                          r.id === currentRoom.id
                                            ? {
                                                ...r,
                                                equipment: {
                                                  ...r.equipment,
                                                  guitarAmpDetails: (r.equipment?.guitarAmpDetails ?? []).map(
                                                    (d, i) => (i === idx ? e.target.value : d),
                                                  ),
                                                },
                                              }
                                            : r,
                                        ),
                                      }
                                    : prev,
                                )
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-800">Bas amfisi var mı?</p>
                      <div className="mt-1 flex gap-2">
                        {["Evet", "Hayır"].map((label, idx) => {
                          const val = idx === 0;
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() =>
                                setStudio((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        rooms: prev.rooms.map((r) =>
                                          r.id === currentRoom.id
                                            ? {
                                                ...r,
                                                equipment: {
                                                  ...r.equipment,
                                                  hasBassAmp: val,
                                                  bassDetail: val ? r.equipment?.bassDetail ?? "" : "",
                                                },
                                              }
                                            : r,
                                        ),
                                      }
                                    : prev,
                                )
                              }
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                currentRoom.equipment?.hasBassAmp === val
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-200 text-gray-800"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      {currentRoom.equipment?.hasBassAmp && (
                        <input
                          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
                          value={currentRoom.equipment?.bassDetail ?? ""}
                          onChange={(e) =>
                            setStudio((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    rooms: prev.rooms.map((r) =>
                                      r.id === currentRoom.id
                                        ? { ...r, equipment: { ...r.equipment, bassDetail: e.target.value } }
                                        : r,
                                    ),
                                  }
                                : prev,
                            )
                          }
                          placeholder="Örn: Ampeg BA-115"
                        />
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-800">Kaç adet mikrofon var?</p>
                      <div className="mt-1 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="h-8 w-8 rounded-full border border-gray-300 text-sm font-semibold text-gray-900"
                            onClick={() => {
                              const next = Math.max(0, (currentRoom.equipment?.micCount ?? 0) - 1);
                              setStudio((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      rooms: prev.rooms.map((r) => {
                                        if (r.id !== currentRoom.id) return r;
                                        const prevDetails = r.equipment?.micDetails ?? [];
                                        const nextDetails =
                                          next === 0
                                            ? []
                                            : Array.from({ length: next }, (_, i) => prevDetails[i] ?? "");
                                        return {
                                          ...r,
                                          equipment: { ...r.equipment, micCount: next, micDetails: nextDetails },
                                        };
                                      }),
                                    }
                                  : prev,
                              );
                            }}
                          >
                            -
                          </button>
                          <span className="text-sm font-semibold text-gray-900">
                            {currentRoom.equipment?.micCount ?? 0} adet
                          </span>
                        </div>
                        <button
                          type="button"
                          className="h-8 w-8 rounded-full border border-gray-300 text-sm font-semibold text-gray-900"
                          onClick={() => {
                            const next = (currentRoom.equipment?.micCount ?? 0) + 1;
                            setStudio((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    rooms: prev.rooms.map((r) => {
                                      if (r.id !== currentRoom.id) return r;
                                      const prevDetails = r.equipment?.micDetails ?? [];
                                      const nextDetails = Array.from({ length: next }, (_, i) => prevDetails[i] ?? "");
                                      return {
                                        ...r,
                                        equipment: { ...r.equipment, micCount: next, micDetails: nextDetails },
                                      };
                                    }),
                                  }
                                : prev,
                            );
                          }}
                        >
                          +
                        </button>
                      </div>
                      {(currentRoom.equipment?.micCount ?? 0) > 0 && (
                        <div className="mt-2 space-y-2">
                          {(currentRoom.equipment?.micDetails ?? []).map((detail, idx) => (
                            <input
                              key={idx}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
                              value={detail}
                              placeholder={`Mikrofon ${idx + 1} (örn: SM58)`}
                              onChange={(e) =>
                                setStudio((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        rooms: prev.rooms.map((r) =>
                                          r.id === currentRoom.id
                                            ? {
                                                ...r,
                                                equipment: {
                                                  ...r.equipment,
                                                  micDetails: (r.equipment?.micDetails ?? []).map((m, i) =>
                                                    i === idx ? e.target.value : m,
                                                  ),
                                                },
                                              }
                                            : r,
                                        ),
                                      }
                                    : prev,
                                )
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-800">DI Box var mı?</p>
                      <div className="mt-1 flex gap-2">
                        {["Evet", "Hayır"].map((label, idx) => {
                          const val = idx === 0;
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() =>
                                setStudio((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        rooms: prev.rooms.map((r) =>
                                          r.id === currentRoom.id
                                            ? { ...r, equipment: { ...r.equipment, hasDiBox: val } }
                                            : r,
                                        ),
                                      }
                                    : prev,
                                )
                              }
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                currentRoom.equipment?.hasDiBox === val
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-200 text-gray-800"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-800">Klavye var mı?</p>
                      <div className="mt-1 flex gap-2">
                        {["Evet", "Hayır"].map((label, idx) => {
                          const val = idx === 0;
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() =>
                                setStudio((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        rooms: prev.rooms.map((r) =>
                                          r.id === currentRoom.id
                                            ? {
                                                ...r,
                                                equipment: {
                                                  ...r.equipment,
                                                  hasKeyboard: val,
                                                  keyboardDetail: val ? r.equipment?.keyboardDetail ?? "" : "",
                                                },
                                              }
                                            : r,
                                        ),
                                      }
                                    : prev,
                                )
                              }
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                currentRoom.equipment?.hasKeyboard === val
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-200 text-gray-800"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      {currentRoom.equipment?.hasKeyboard && (
                        <input
                          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
                          value={currentRoom.equipment?.keyboardDetail ?? ""}
                          onChange={(e) =>
                            setStudio((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    rooms: prev.rooms.map((r) =>
                                      r.id === currentRoom.id
                                        ? { ...r, equipment: { ...r.equipment, keyboardDetail: e.target.value } }
                                        : r,
                                    ),
                                  }
                                : prev,
                            )
                          }
                          placeholder="Örn: Roland FP-30"
                        />
                      )}
                      {!currentRoom.equipment?.hasKeyboard && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-gray-800">Klavye sehpası var mı?</p>
                          <div className="mt-1 flex gap-2">
                            {["Evet", "Hayır"].map((label, idx) => {
                              const val = idx === 0;
                              return (
                                <button
                                  key={label}
                                  type="button"
                                  onClick={() =>
                                    setStudio((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            rooms: prev.rooms.map((r) =>
                                              r.id === currentRoom.id
                                                ? { ...r, equipment: { ...r.equipment, hasKeyboardStand: val } }
                                                : r,
                                            ),
                                          }
                                        : prev,
                                    )
                                  }
                                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                    currentRoom.equipment?.hasKeyboardStand === val
                                      ? "bg-blue-600 text-white"
                                      : "bg-gray-200 text-gray-800"
                                  }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-800">Kullanıma hazır ekstra gitar var mı?</p>
                      <div className="mt-1 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="h-8 w-8 rounded-full border border-gray-300 text-sm font-semibold text-gray-900"
                            onClick={() => {
                              const nextCount =
                                ((currentRoom.equipment?.guitarUseDetail || "").split("|").filter(Boolean).length ?? 0) - 1;
                              const count = Math.max(0, nextCount);
                              setStudio((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      rooms: prev.rooms.map((r) => {
                                        if (r.id !== currentRoom.id) return r;
                                        const prevList = (r.equipment?.guitarUseDetail || "")
                                          .split("|")
                                          .filter(Boolean);
                                        const next = Array.from({ length: count }, (_, i) => prevList[i] ?? "Örn: Telecaster (takım)");
                                        return {
                                          ...r,
                                          equipment: { ...r.equipment, guitarUseDetail: next.join("|") },
                                        };
                                      }),
                                    }
                                  : prev,
                              );
                            }}
                          >
                            -
                          </button>
                          <span className="text-sm font-semibold text-gray-900">
                            {(currentRoom.equipment?.guitarUseDetail || "").split("|").filter(Boolean).length || 0} adet
                          </span>
                        </div>
                        <button
                          type="button"
                          className="h-8 w-8 rounded-full border border-gray-300 text-sm font-semibold text-gray-900"
                          onClick={() => {
                            const count =
                              (currentRoom.equipment?.guitarUseDetail || "").split("|").filter(Boolean).length + 1;
                            setStudio((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    rooms: prev.rooms.map((r) => {
                                      if (r.id !== currentRoom.id) return r;
                                      const prevList = (r.equipment?.guitarUseDetail || "")
                                        .split("|")
                                        .filter(Boolean);
                                      const next = Array.from({ length: count }, (_, i) => prevList[i] ?? "Örn: Telecaster (takım)");
                                      return {
                                        ...r,
                                        equipment: { ...r.equipment, guitarUseDetail: next.join("|") },
                                      };
                                    }),
                                  }
                                : prev,
                            );
                          }}
                        >
                          +
                        </button>
                      </div>
                      {currentRoom.equipment?.guitarUseDetail
                        ?.split("|")
                        .filter(Boolean)
                        .map((detail, idx) => (
                          <input
                            key={idx}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
                            value={detail}
                            placeholder={`Gitar ${idx + 1} (örn: Telecaster)`}
                            onChange={(e) =>
                              setStudio((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      rooms: prev.rooms.map((r) => {
                                        if (r.id !== currentRoom.id) return r;
                                        const parts = (r.equipment?.guitarUseDetail || "")
                                          .split("|")
                                          .filter(Boolean);
                                        parts[idx] = e.target.value;
                                        return {
                                          ...r,
                                          equipment: { ...r.equipment, guitarUseDetail: parts.join("|") },
                                        };
                                      }),
                                    }
                                  : prev,
                              )
                            }
                          />
                        ))}
                    </div>
                      </div>
                    )}
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        saveRoomBasics(currentRoom.id, {
                          name: currentRoom.name,
                          type: currentRoom.type,
                          color: currentRoom.color,
                          pricing: currentRoom.pricing,
                          equipment: currentRoom.equipment,
                        })
                      }
                      className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                    >
                      {saving ? "Kaydediliyor..." : "Ekipman bilgisi kaydet"}
                    </button>
                  </div>
                )}
                <div className="mt-4 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Görseller</p>
                      <p className="text-xs text-gray-600">Max 5 MB, ilk görsel kapak olur.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:border-blue-400"
                    >
                      Görsel ekle
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files ?? []);
                      if (!files.length) return;
                      const valid = files.filter((f) => f.size <= 5 * 1024 * 1024);
                      if (!valid.length) {
                        setStatus("5 MB üzeri dosyalar eklenemez.");
                        e.target.value = "";
                        return;
                      }
                      try {
                        const images = await Promise.all(valid.map((f) => toBase64(f)));
                        setStudio((prev) =>
                          prev
                            ? {
                                ...prev,
                                rooms: prev.rooms.map((r) =>
                                  r.id === currentRoom.id
                                    ? { ...r, images: [...(r.images ?? []), ...images] }
                                    : r,
                                ),
                              }
                            : prev,
                        );
                        setStatus("Görsel eklendi (kaydetmeyi unutma)");
                      } catch (err) {
                        console.error(err);
                        setStatus("Görsel eklenemedi.");
                      } finally {
                        e.target.value = "";
                      }
                    }}
                  />
                  {currentRoom.images?.length ? (
                    <div className="grid grid-cols-2 gap-2">
                      {currentRoom.images.map((src, idx) => (
                        <div key={idx} className="relative overflow-hidden rounded-lg border border-gray-200 bg-white">
                          <img src={src} alt={`Oda görsel ${idx + 1}`} className="h-28 w-full object-cover" />
                          <div className="flex items-center justify-between px-2 py-1 text-[11px] text-gray-700">
                            <span>{idx === 0 ? "Kapak" : `Görsel ${idx + 1}`}</span>
                            <button
                              type="button"
                              className="text-red-600 hover:underline"
                              onClick={() =>
                                setStudio((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        rooms: prev.rooms.map((r) =>
                                          r.id === currentRoom.id
                                            ? {
                                                ...r,
                                                images: (r.images ?? []).filter((_, i) => i !== idx),
                                              }
                                            : r,
                                        ),
                                      }
                                    : prev,
                                )
                              }
                            >
                              Sil
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600">Henüz görsel eklenmedi.</p>
                  )}
                </div>
                <div className="mt-4 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Kurslara açık mısınız?</p>
                      <p className="text-xs text-gray-600">Hocalar uygun odaları önerir.</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setStudio((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  rooms: prev.rooms.map((r) =>
                                    r.id === currentRoom.id
                                      ? { ...r, extras: { ...r.extras, acceptsCourses: true } }
                                      : r,
                                  ),
                                }
                              : prev,
                          )
                        }
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                          currentRoom.extras?.acceptsCourses
                            ? "bg-green-600 text-white"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        Evet
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setStudio((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  rooms: prev.rooms.map((r) =>
                                    r.id === currentRoom.id
                                      ? { ...r, extras: { ...r.extras, acceptsCourses: false } }
                                      : r,
                                  ),
                                }
                              : prev,
                          )
                        }
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                          currentRoom.extras?.acceptsCourses
                            ? "bg-gray-200 text-gray-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        Hayır
                      </button>
                    </div>
                  </div>
                  <p className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
                    Kurslara açığız derseniz Hocalarımız sizinle iletişime geçecektir. Buradaki
                    amacımız yetenekli olup da ders verecek odası olmayan müzisyenlerimizi,
                    stüdyolarının boş vakitlerini doldurmaya çalışan siz stüdyo sahipleriyle
                    buluşturmak. Bizim önerimiz: <strong>Hocalarımıza normal ücret üzerinden %20 indirim uygulanması.</strong> Tabi tercih sizin.
                  </p>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      saveRoomBasics(currentRoom.id, {
                        name: currentRoom.name,
                        type: currentRoom.type,
                        color: currentRoom.color,
                        pricing: currentRoom.pricing,
                        extras: { ...currentRoom.extras, acceptsCourses: currentRoom.extras?.acceptsCourses ?? false },
                      })
                    }
                    className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {saving ? "Kaydediliyor..." : "Kurs ayarını kaydet"}
                  </button>
                </div>
                <button
                  disabled={saving || orderedRooms.length <= 1}
                  onClick={() => {
                    if (!currentRoom) return;
                    if (!window.confirm("Bu odayı silmek istediğine emin misin?")) return;
                    setSaving(true);
                    fetch("/api/studio", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        rooms: [{ id: currentRoom.id, _delete: true }],
                      }),
                    })
                      .then((res) => res.json())
                      .then((json) => {
                        if (json.studio) {
                          const normalized = normalizeStudio(json.studio);
                          setStudio(normalized);
                          if (normalized?.rooms?.length) {
                            setSelectedRoomId(normalized.rooms[0].id);
                            setActiveTab(`room-${normalized.rooms[0].id}`);
                          }
                          setStatus("Oda silindi");
                        } else {
                          setStatus(json.error || "Oda silinemedi");
                        }
                      })
                      .catch(() => setStatus("Oda silinemedi"))
                      .finally(() => setSaving(false));
                  }}
                  className="mt-2 rounded-lg border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 transition hover:border-red-400 disabled:opacity-50"
                >
                  Odayı sil
                </button>
              </div>

              <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">Oda içerikleri temizlendi</p>
                <p className="mt-1">
                  Bu sekmede şimdilik sadece ad, tür, renk ve fiyat alanları kaldı. Yeni UI eklenene kadar
                  başka bölüm yok.
                </p>
              </div>
            </div>
          </section>
        )}
        </div>
      </div>

      {showRatings && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Yorumlar (demo)</h3>
              <button
                onClick={() => setShowRatings(false)}
                className="rounded-full border border-gray-200 px-3 py-1 text-sm"
              >
                Kapat
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {studio?.ratings.length ? (
                studio.ratings.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2"
                  >
                    <span className="mt-1 h-6 w-6 rounded-full bg-green-100 text-center text-sm font-semibold text-green-800">
                      {r.toFixed(1)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Demo yorum {i + 1}</p>
                      <p className="text-xs text-gray-700">Gerçek yorumlar entegrasyon sonrası gelecek.</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">Henüz puan yok.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
