"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ExpenseItem = {
  label: string;
  amount: number;
};

type RoomOption = {
  id: string;
  name: string;
};

type MonthOption = {
  key: string;
  label: string;
};

type EditableExpenseItem = {
  label: string;
  amount: string;
};

type Props = {
  roomId: string;
  roomName: string;
  monthKey: string;
  monthLabel: string;
  roomOptions: RoomOption[];
  monthOptions: MonthOption[];
  initialItems: ExpenseItem[];
  searchAs?: string;
  compareAKey: string;
  compareBKey: string;
  shouldCompute: boolean;
};

const createEmptyRows = (): EditableExpenseItem[] => [
  { label: "", amount: "" },
  { label: "", amount: "" },
];

const toEditableRows = (items: ExpenseItem[]) => {
  const rows = items.map((item) => ({
    label: item.label,
    amount: item.amount ? String(item.amount) : "",
  }));
  while (rows.length < 2) rows.push({ label: "", amount: "" });
  return rows;
};

const parseAmount = (value: string) => {
  const normalized = value.replace(/[^\d.,-]/g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function ExpensesEditor({
  roomId,
  roomName,
  monthKey,
  monthLabel,
  roomOptions,
  monthOptions,
  initialItems,
  searchAs,
  compareAKey,
  compareBKey,
  shouldCompute,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<EditableExpenseItem[]>(
    initialItems.length > 0 ? toEditableRows(initialItems) : createEmptyRows(),
  );
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const total = useMemo(
    () => items.reduce((sum, item) => sum + parseAmount(item.amount), 0),
    [items],
  );

  const navigateWithSelection = (nextRoomId: string, nextMonthKey: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("roomId", nextRoomId);
    params.set("month", nextMonthKey);
    params.set("compareA", compareAKey);
    params.set("compareB", compareBKey);
    if (searchAs) params.set("as", searchAs);
    if (shouldCompute) params.set("calc", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const saveItems = () => {
    setStatus(null);
    startTransition(async () => {
      const payload = {
        roomId,
        monthKey,
        items: items.map((item) => ({
          label: item.label,
          amount: parseAmount(item.amount),
        })),
      };
      const res = await fetch("/api/studio/room-monthly-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        items?: ExpenseItem[];
      };
      if (!res.ok) {
        setStatus(json.error || "Giderler kaydedilemedi.");
        return;
      }
      setItems(json.items && json.items.length > 0 ? toEditableRows(json.items) : createEmptyRows());
      setStatus("Giderler kaydedildi.");
      router.refresh();
    });
  };

  return (
    <div className="rounded-2xl border border-orange-200/60 bg-orange-50/80 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Giderler</p>
          <p className="text-sm text-orange-700">
            {roomName} · {monthLabel}
          </p>
        </div>
        <p className="text-sm font-semibold text-orange-950">{Math.round(total).toLocaleString("tr-TR")} TL</p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-orange-700" htmlFor="expenses-room">
            Oda
          </label>
          <select
            id="expenses-room"
            value={roomId}
            onChange={(event) => navigateWithSelection(event.target.value, monthKey)}
            className="mt-2 h-11 w-full rounded-xl border border-orange-200 bg-white px-3 text-sm font-semibold text-orange-950 focus:border-orange-400 focus:outline-none"
          >
            {roomOptions.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-orange-700" htmlFor="expenses-month">
            Ay
          </label>
          <select
            id="expenses-month"
            value={monthKey}
            onChange={(event) => navigateWithSelection(roomId, event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-orange-200 bg-white px-3 text-sm font-semibold text-orange-950 focus:border-orange-400 focus:outline-none"
          >
            {monthOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item, index) => (
          <div key={`${monthKey}-${index}`} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <input
              value={item.label}
              onChange={(event) =>
                setItems((prev) =>
                  prev.map((row, rowIndex) =>
                    rowIndex === index ? { ...row, label: event.target.value } : row,
                  ),
                )
              }
              placeholder="Örn: kira"
              className="h-11 rounded-xl border border-orange-200 bg-white px-3 text-sm text-orange-950 placeholder:text-orange-300 focus:border-orange-400 focus:outline-none"
            />
            <div className="flex items-center rounded-xl border border-orange-200 bg-white focus-within:border-orange-400">
              <input
                value={item.amount}
                onChange={(event) =>
                  setItems((prev) =>
                    prev.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, amount: event.target.value } : row,
                    ),
                  )
                }
                inputMode="decimal"
                placeholder="30000"
                className="h-11 w-full rounded-l-xl bg-transparent px-3 text-sm text-orange-950 placeholder:text-orange-300 focus:outline-none"
              />
              <span className="pr-3 text-sm font-semibold text-orange-700">TL</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setItems((prev) => [...prev, { label: "", amount: "" }])}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-orange-200 bg-white px-4 text-sm font-semibold text-orange-800 transition hover:border-orange-300 hover:bg-orange-100"
        >
          + Satır ekle
        </button>
        <div className="flex items-center gap-3">
          {status ? <p className="text-sm text-orange-700">{status}</p> : null}
          <button
            type="button"
            onClick={saveItems}
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
