"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type FinanceItem = {
  label: string;
  amount: number;
};

type MonthOption = {
  key: string;
  label: string;
};

type EditableFinanceItem = {
  label: string;
  amount: string;
};

type Props = {
  type: "expenses" | "extraIncome";
  title: string;
  totalLabel: string;
  itemPlaceholder: string;
  monthKey: string;
  monthOptions: MonthOption[];
  initialItems: FinanceItem[];
  refreshMonthKey: string;
};

const createEmptyRows = (): EditableFinanceItem[] => [
  { label: "", amount: "" },
  { label: "", amount: "" },
];

const toEditableRows = (items: FinanceItem[]) => {
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

export function FinancialItemsEditor({
  type,
  title,
  totalLabel,
  itemPlaceholder,
  monthKey,
  monthOptions,
  initialItems,
  refreshMonthKey,
}: Props) {
  const router = useRouter();
  const [activeMonthKey, setActiveMonthKey] = useState(monthKey);
  const [items, setItems] = useState<EditableFinanceItem[]>(
    initialItems.length > 0 ? toEditableRows(initialItems) : createEmptyRows(),
  );
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingMonth, setIsLoadingMonth] = useState(false);

  useEffect(() => {
    setActiveMonthKey(monthKey);
    setItems(initialItems.length > 0 ? toEditableRows(initialItems) : createEmptyRows());
    setStatus(null);
  }, [initialItems, monthKey]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + parseAmount(item.amount), 0),
    [items],
  );

  const activeMonthLabel =
    monthOptions.find((option) => option.key === activeMonthKey)?.label ?? activeMonthKey;

  const loadMonth = async (nextMonthKey: string) => {
    setActiveMonthKey(nextMonthKey);
    setStatus(null);
    setIsLoadingMonth(true);
    try {
      const params = new URLSearchParams({
        type,
        monthKey: nextMonthKey,
      });
      const res = await fetch(`/api/studio/room-monthly-expenses?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        items?: FinanceItem[];
      };
      if (!res.ok) {
        setStatus(json.error || `${title} yüklenemedi.`);
        setItems(createEmptyRows());
        return;
      }
      setItems(json.items && json.items.length > 0 ? toEditableRows(json.items) : createEmptyRows());
    } finally {
      setIsLoadingMonth(false);
    }
  };

  const saveItems = async () => {
    setStatus(null);
    setIsSaving(true);
    try {
      const payload = {
        type,
        monthKey: activeMonthKey,
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
        items?: FinanceItem[];
      };
      if (!res.ok) {
        setStatus(json.error || `${title} kaydedilemedi.`);
        return;
      }
      setItems(json.items && json.items.length > 0 ? toEditableRows(json.items) : createEmptyRows());
      setStatus(`${title} kaydedildi.`);
      if (activeMonthKey === refreshMonthKey) {
        router.refresh();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <details className="rounded-2xl border border-orange-200/60 bg-orange-50/80">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">{title}</p>
          <p className="text-sm text-orange-700">{activeMonthLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-orange-700">{totalLabel}</p>
          <p className="text-sm font-semibold text-orange-950">
            {Math.round(total).toLocaleString("tr-TR")} TL
          </p>
        </div>
      </summary>

      <div className="border-t border-orange-200/60 px-6 pb-6 pt-5">
        <div>
          <label className="text-xs font-semibold text-orange-700" htmlFor={`${type}-month`}>
            Ay
          </label>
          <select
            id={`${type}-month`}
            value={activeMonthKey}
            onChange={(event) => void loadMonth(event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-orange-200 bg-white px-3 text-sm font-semibold text-orange-950 focus:border-orange-400 focus:outline-none"
          >
            {monthOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 space-y-3">
          {items.map((item, index) => (
            <div key={`${type}-${monthKey}-${index}`} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
              <input
                value={item.label}
                onChange={(event) =>
                  setItems((prev) =>
                    prev.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, label: event.target.value } : row,
                    ),
                  )
                }
                placeholder={itemPlaceholder}
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

        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <div />
          <div className="flex items-center rounded-xl border border-orange-200 bg-orange-100">
            <input
              value={Math.round(total).toLocaleString("tr-TR")}
              readOnly
              aria-label={totalLabel}
              className="h-11 w-full rounded-l-xl bg-transparent px-3 text-sm font-semibold text-orange-950 focus:outline-none"
            />
            <span className="pr-3 text-sm font-semibold text-orange-700">TL</span>
          </div>
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
              onClick={() => void saveItems()}
              disabled={isSaving || isLoadingMonth}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingMonth ? "Yükleniyor..." : isSaving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      </div>
    </details>
  );
}
