"use client";

import type { ReactNode } from "react";
import { Fragment, useState } from "react";
import { Button } from "@/components/design-system/components/ui/button";

type TeacherItem = {
  id: number;
  userId: string;
  status: string;
  createdAt: Date;
  data: any;
  user: { id: string; email: string; fullName: string | null; city: string | null } | null;
};

const statuses = ["pending", "approved", "rejected", "closed"] as const;

export default function TeachersClient({ items }: { items: TeacherItem[] }) {
  const [rows, setRows] = useState(items);
  const [saving, setSaving] = useState<number | null>(null);
  const [openRow, setOpenRow] = useState<number | null>(null);

  const updateStatus = async (id: number, status: string) => {
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/teachers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Kaydedilemedi");
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (err) {
      console.error(err);
      alert("Kaydedilemedi");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <Fragment key={row.id}>
          <div className="rounded-xl border border-[var(--color-border)] p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--color-primary)]">
                  {row.user?.fullName || "İsim yok"} — {row.user?.email || row.userId}
                </p>
                <p className="text-xs text-[var(--color-muted)]">
                  {row.user?.city || "-"} · {new Date(row.createdAt).toLocaleString("tr-TR")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="rounded-md border border-[var(--color-border)] bg-transparent px-2 py-1 text-sm"
                  value={row.status}
                  disabled={saving === row.id}
                  onChange={(e) => updateStatus(row.id, e.target.value)}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={saving === row.id}
                  onClick={() => updateStatus(row.id, row.status === "approved" ? "pending" : "approved")}
                >
                  {saving === row.id ? "Kaydediliyor..." : row.status === "approved" ? "Beklemeye al" : "Onayla"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpenRow(openRow === row.id ? null : row.id)}
                >
                  {openRow === row.id ? "Detay gizle" : "Detaylar"}
                </Button>
              </div>
            </div>
            <TeacherDetails data={row.data} userCity={row.user?.city || null} />
          </div>
          {openRow === row.id ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)]/40 p-3 text-xs text-[var(--color-muted)]">
              <p className="font-semibold text-[var(--color-primary)]">Tüm veri</p>
              <pre className="mt-2 whitespace-pre-wrap text-[10px] text-[var(--color-primary)]">
                {JSON.stringify(row.data, null, 2)}
              </pre>
            </div>
          ) : null}
        </Fragment>
      ))}
      {rows.length === 0 ? <p className="text-sm text-[var(--color-muted)]">Başvuru yok.</p> : null}
    </div>
  );
}

function TeacherDetails({ data, userCity }: { data: Record<string, any> | null; userCity: string | null }) {
  const links: string[] = Array.isArray(data?.links) ? data.links.filter((l: string) => l) : [];
  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-2 text-xs text-[var(--color-muted)] sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Alanlar" value={<ChipList items={data?.instruments} />} />
        <Field label="Seviyeler" value={<ChipList items={data?.levels} />} />
        <Field label="Format" value={<ChipList items={data?.formats} />} />
        <Field label="Diller" value={<ChipList items={data?.languages} />} />
        <Field label="Şehir" value={data?.city || userCity || "-"} />
        <Field label="Ücret" value={data?.price || "-"} />
        <Field label="Yıl" value={data?.years || "-"} />
        <Field label="Öğrenci" value={data?.students || "-"} />
      </div>
      <div>
        <div className="text-xs font-semibold text-[var(--color-primary)]">Kısa açıklama</div>
        <p className="text-sm text-[var(--color-primary)]">{data?.statement || "Açıklama yok."}</p>
      </div>
      <div>
        <div className="text-xs font-semibold text-[var(--color-primary)]">Bağlantılar</div>
        {links.length === 0 ? (
          <p className="text-xs text-[var(--color-muted)]">Bağlantı yok.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-xs text-[var(--color-primary)]">
            {links.map((link) => (
              <li key={link}>
                <a href={link} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="font-semibold text-[var(--color-primary)]">{label}</div>
      <div>{value}</div>
    </div>
  );
}

function ChipList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return <span>-</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-[var(--color-secondary)] px-2 py-1 text-[10px] text-[var(--color-primary)]">
          {item}
        </span>
      ))}
    </div>
  );
}
