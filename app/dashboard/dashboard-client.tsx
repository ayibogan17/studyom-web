"use client";

import { useMemo, useState } from "react";

import { SignOutButton } from "@/components/sign-out-button";
import {
  OpeningHours,
  Room,
  Slot,
  Studio,
} from "@/types/panel";

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

export function DashboardClient({ initialStudio, userName, userEmail }: Props) {
  const [studio, setStudio] = useState<Studio | null>(initialStudio ?? null);
  const [activeTab, setActiveTab] = useState<string>("panel");
  const [selectedRoomId, setSelectedRoomId] = useState(
    initialStudio?.rooms?.[0]?.id ?? "",
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [monthCursor, setMonthCursor] = useState<Date>(new Date());
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const rooms = studio?.rooms ?? [];
  const currentRoom =
    rooms.find((r) => r.id === selectedRoomId) ?? rooms[0] ?? null;

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

  const saveStudioMeta = async (data: {
    city?: string;
    district?: string;
    address?: string;
    phone?: string;
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
        setStudio(json.studio);
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
            },
          ],
        }),
      });
      const json = await res.json();
      if (res.ok && json.studio) {
        setStudio(json.studio);
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

  const toggleCourses = (roomId: string) => {
    setStudio((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              extras: {
                ...room.extras,
                acceptsCourses: !room.extras.acceptsCourses,
              },
            }
          : room,
      ),
    }));
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
    <div className="bg-gradient-to-b from-white via-orange-50/40 to-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-3 rounded-3xl border border-black/5 bg-white/80 p-6 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
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
          <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
            {status}
          </div>
        )}

        <nav className="mb-6 flex flex-wrap gap-2">
          {[
            { key: "panel", label: "Panel" },
            { key: "calendar", label: "Takvim" },
            ...rooms.map((r) => ({ key: `room-${r.id}`, label: r.name || "Oda" })),
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => handleTabChange(item.key)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                activeTab === item.key
                  ? "border-orange-500 bg-orange-500 text-white shadow-sm"
                  : "border-orange-100 bg-white text-gray-800 hover:border-orange-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {activeTab === "panel" && (
          <section className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-green-100 bg-green-50/80 p-4">
              <p className="text-sm font-semibold text-green-900">Puan ortalaması</p>
              <p className="mt-2 text-4xl font-bold text-green-800">
                {studio.ratings.length
                  ? (studio.ratings.reduce((a, b) => a + b, 0) / studio.ratings.length).toFixed(1)
                  : "0.0"}
              </p>
              <p className="mt-1 text-xs text-green-700">
                Yorumlar demo, gerçek veritabanı bağlantısı yok.
              </p>
            </div>

            <div className="rounded-2xl border border-orange-100 bg-orange-50/80 p-4">
              <p className="text-sm font-semibold text-orange-900">Rezervasyon özeti</p>
              <div className="mt-2 space-y-1 text-sm text-orange-800">
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
                {studio.calendarNote && (
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800">
                    {studio.calendarNote}
                  </span>
                )}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {studio.openingHours.map((h, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                      h.open
                        ? "border-gray-100 bg-gray-50"
                        : "border-red-100 bg-red-50 text-red-700"
                    }`}
                  >
                    <span className="font-semibold">{longDays[idx]}</span>
                    <span>{h.open ? `${h.openTime} - ${h.closeTime}` : "Kapalı"}</span>
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
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => {
                    setSelectedRoomId(room.id);
                    handleTabChange("calendar");
                  }}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    room.id === currentRoom.id
                      ? "border-orange-500 bg-orange-500 text-white"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:border-orange-300"
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

                  return (
                    <button
                      key={idx}
                      onClick={() => isOpen && handleDaySelect(date)}
                      className={`flex h-16 flex-col rounded-xl border text-left transition ${
                        !isOpen
                          ? "cursor-not-allowed border-red-100 bg-red-50 text-red-700"
                          : isSelected
                            ? "border-orange-500 bg-orange-50"
                            : "border-gray-200 bg-white hover:border-orange-300"
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
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
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
                            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-800 hover:border-orange-300"
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
          <section className="mt-2 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white/90 p-4 lg:col-span-2">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
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
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
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
                <input
                  className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                  value={currentRoom.color}
                  onChange={(e) =>
                    setStudio((prev) =>
                      prev
                        ? {
                            ...prev,
                            rooms: prev.rooms.map((r) =>
                              r.id === currentRoom.id ? { ...r, color: e.target.value } : r,
                            ),
                          }
                        : prev,
                    )
                  }
                />
                <span
                  className="h-5 w-5 rounded-full border"
                  style={{ backgroundColor: currentRoom.color }}
                  aria-hidden
                />
              </div>
              <h2 className="mt-3 text-2xl font-bold text-gray-900">
                {currentRoom.name}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Şehir/ilçe: {studio.city || "—"} {studio.district ? `• ${studio.district}` : ""}
              </p>

              <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-sm font-semibold text-gray-900">Fiyatlandırma</p>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  <select
                    className="rounded-lg border border-gray-200 px-3 py-2 focus:border-orange-400 focus:outline-none"
                    value={currentRoom.pricing.model}
                    onChange={(e) =>
                      setStudio((prev) =>
                        prev
                          ? {
                              ...prev,
                              rooms: prev.rooms.map((r) =>
                                r.id === currentRoom.id
                                  ? {
                                      ...r,
                                      pricing: { ...r.pricing, model: e.target.value as Room["pricing"]["model"] },
                                    }
                                  : r,
                              ),
                            }
                          : prev,
                      )
                    }
                  >
                    <option value="flat">Sabit (saatlik)</option>
                    <option value="daily">Günlük</option>
                    <option value="hourly">Saatlik</option>
                    <option value="variable">Değişken</option>
                  </select>
                  <input
                    className="w-28 rounded-lg border border-gray-200 px-3 py-2 focus:border-orange-400 focus:outline-none"
                    placeholder="Sabit"
                    value={currentRoom.pricing.flatRate ?? ""}
                    onChange={(e) =>
                      setStudio((prev) =>
                        prev
                          ? {
                              ...prev,
                              rooms: prev.rooms.map((r) =>
                                r.id === currentRoom.id
                                  ? {
                                      ...r,
                                      pricing: { ...r.pricing, flatRate: e.target.value },
                                    }
                                  : r,
                              ),
                            }
                          : prev,
                      )
                    }
                  />
                  <input
                    className="w-28 rounded-lg border border-gray-200 px-3 py-2 focus:border-orange-400 focus:outline-none"
                    placeholder="Günlük"
                    value={currentRoom.pricing.dailyRate ?? ""}
                    onChange={(e) =>
                      setStudio((prev) =>
                        prev
                          ? {
                              ...prev,
                              rooms: prev.rooms.map((r) =>
                                r.id === currentRoom.id
                                  ? {
                                      ...r,
                                      pricing: { ...r.pricing, dailyRate: e.target.value },
                                    }
                                  : r,
                              ),
                            }
                          : prev,
                      )
                    }
                  />
                  <input
                    className="w-28 rounded-lg border border-gray-200 px-3 py-2 focus:border-orange-400 focus:outline-none"
                    placeholder="Saatlik"
                    value={currentRoom.pricing.hourlyRate ?? ""}
                    onChange={(e) =>
                      setStudio((prev) =>
                        prev
                          ? {
                              ...prev,
                              rooms: prev.rooms.map((r) =>
                                r.id === currentRoom.id
                                  ? {
                                      ...r,
                                      pricing: { ...r.pricing, hourlyRate: e.target.value },
                                    }
                                  : r,
                              ),
                            }
                          : prev,
                      )
                    }
                  />
                  <input
                    className="w-28 rounded-lg border border-gray-200 px-3 py-2 focus:border-orange-400 focus:outline-none"
                    placeholder="Min (değişken)"
                    value={currentRoom.pricing.minRate ?? ""}
                    onChange={(e) =>
                      setStudio((prev) =>
                        prev
                          ? {
                              ...prev,
                              rooms: prev.rooms.map((r) =>
                                r.id === currentRoom.id
                                  ? {
                                      ...r,
                                      pricing: { ...r.pricing, minRate: e.target.value },
                                    }
                                  : r,
                              ),
                            }
                          : prev,
                      )
                    }
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
                  className="mt-3 rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"
                >
                  {saving ? "Kaydediliyor..." : "Oda bilgisi kaydet"}
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-sm font-semibold text-gray-900">Ekipman</p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-700">
                    <li>Davul: {currentRoom.equipment.hasDrum ? currentRoom.equipment.drumDetail : "Yok"}</li>
                    <li>Mikrofon: {currentRoom.equipment.micCount} adet</li>
                    <li>Gitar amfi: {currentRoom.equipment.guitarAmpCount}</li>
                    <li>Bas amfi: {currentRoom.equipment.hasBassAmp ? "Var" : "Yok"}</li>
                    <li>Klavye: {currentRoom.equipment.hasKeyboard ? currentRoom.equipment.keyboardDetail : "Yok"}</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-sm font-semibold text-gray-900">Özellikler</p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-700">
                    <li>Müzisyen kendi mikrofonu: {currentRoom.features.musicianMicAllowed ? "Evet" : "Hayır"}</li>
                    <li>Control room: {currentRoom.features.hasControlRoom ? "Var" : "Yok"}</li>
                    <li>Kulaklık: {currentRoom.features.hasHeadphones ? currentRoom.features.headphonesDetail || "Var" : "Yok"}</li>
                    <li>Teknisyen: {currentRoom.features.hasTechSupport ? "Var" : "Yok"}</li>
                  </ul>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-orange-100 bg-orange-50/80 p-3">
                  <p className="text-sm font-semibold text-orange-900">Ekstralar</p>
                  <ul className="mt-2 space-y-1 text-sm text-orange-800">
                    <li>Mix/Master: {currentRoom.extras.offersMixMaster ? "Var" : "Yok"}</li>
                    <li>Prodüksiyon: {currentRoom.extras.offersProduction ? currentRoom.extras.productionAreas.join(" • ") || "Var" : "Yok"}</li>
                    {currentRoom.extras.otherDetail && <li>Diğer: {currentRoom.extras.otherDetail}</li>}
                  </ul>
                </div>
                <div className="rounded-xl border border-green-100 bg-green-50/80 p-3">
                  <p className="text-sm font-semibold text-green-900">Kurslar</p>
                  <p className="mt-2 text-sm text-green-800">
                    {currentRoom.extras.acceptsCourses ? "Kurslara açık" : "Kurslara kapalı"}
                  </p>
                  <button
                    onClick={() => toggleCourses(currentRoom.id)}
                    className="mt-3 rounded-lg border border-green-300 bg-white px-3 py-2 text-xs font-semibold text-green-800 transition hover:border-green-500"
                  >
                    {currentRoom.extras.acceptsCourses ? "Kursları kapat" : "Kursları aç"}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white/90 p-4">
              <p className="text-sm font-semibold text-gray-900">Kısa bilgiler</p>
              <div className="mt-2 space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="min-w-[80px] font-semibold">Şehir/İlçe</span>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                    placeholder="İstanbul / Kadıköy"
                    value={`${studio.city ?? ""}${studio.district ? " / " + studio.district : ""}`}
                    onChange={(e) => {
                      const parts = e.target.value.split("/").map((p) => p.trim());
                      const city = parts[0] || "";
                      const district = parts[1] || "";
                      setStudio((prev) =>
                        prev ? { ...prev, city, district } : prev,
                      );
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="min-w-[80px] font-semibold">Telefon</span>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                    value={studio.phone ?? ""}
                    onChange={(e) =>
                      setStudio((prev) =>
                        prev ? { ...prev, phone: e.target.value } : prev,
                      )
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="min-w-[80px] font-semibold">Adres</span>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                    value={studio.address ?? ""}
                    onChange={(e) =>
                      setStudio((prev) =>
                        prev ? { ...prev, address: e.target.value } : prev,
                      )
                    }
                  />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  disabled={saving}
                  onClick={() =>
                    saveStudioMeta({
                      city: studio.city,
                      district: studio.district,
                      address: studio.address,
                      phone: studio.phone,
                    })
                  }
                  className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"
                >
                  {saving ? "Kaydediliyor..." : "Stüdyo bilgisi kaydet"}
                </button>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                  E-posta (giriş): {studio.ownerEmail}
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Not
                </p>
                <p className="mt-1 text-sm text-gray-700">
                  Değişiklikler DB&apos;ye kaydedilir. Daha detaylı ekipman/özellik editörü için
                  ayrı ekran eklenebilir.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
