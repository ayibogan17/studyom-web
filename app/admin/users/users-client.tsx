"use client";

import { useState } from "react";
import { Button } from "@/components/design-system/components/ui/button";

type UserRow = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  city: string | null;
  intent: string[];
  isDisabled: boolean;
  createdAt: Date;
};

const roles = ["USER", "STUDIO", "ADMIN"] as const;

export default function UsersClient({ users }: { users: UserRow[] }) {
  const [rows, setRows] = useState(users);
  const [saving, setSaving] = useState<string | null>(null);

  const updateUser = async (id: string, payload: Partial<Pick<UserRow, "role" | "isDisabled">>) => {
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Kaydedilemedi");
      setRows((prev) => prev.map((u) => (u.id === id ? { ...u, ...payload } : u)));
    } catch (err) {
      console.error(err);
      alert("Kaydedilemedi");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="text-left text-[var(--color-muted)]">
          <tr>
            <th className="p-2">Kullanıcı</th>
            <th className="p-2">Rol</th>
            <th className="p-2">Şehir</th>
            <th className="p-2">Amaç</th>
            <th className="p-2">Durum</th>
            <th className="p-2">İşlem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {rows.map((user) => (
            <tr key={user.id} className="align-top">
              <td className="p-2">
                <div className="font-semibold text-[var(--color-primary)]">{user.fullName || "-"}</div>
                <div className="text-[var(--color-muted)]">{user.email}</div>
              </td>
              <td className="p-2">
                <select
                  className="rounded-md border border-[var(--color-border)] bg-transparent px-2 py-1"
                  value={user.role}
                  disabled={saving === user.id}
                  onChange={(e) => updateUser(user.id, { role: e.target.value })}
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </td>
              <td className="p-2">{user.city || "-"}</td>
              <td className="p-2">
                <div className="flex flex-wrap gap-1">
                  {user.intent?.length
                    ? user.intent.map((i) => (
                        <span key={i} className="rounded-full bg-[var(--color-secondary)] px-2 py-1 text-xs text-[var(--color-primary)]">
                          {i}
                        </span>
                      ))
                    : "-"}
                </div>
              </td>
              <td className="p-2">
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    user.isDisabled
                      ? "bg-[var(--color-danger)]/20 text-[var(--color-danger)]"
                      : "bg-[var(--color-success)]/20 text-[var(--color-success)]"
                  }`}
                >
                  {user.isDisabled ? "Pasif" : "Aktif"}
                </span>
              </td>
              <td className="p-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={saving === user.id}
                  onClick={() => updateUser(user.id, { isDisabled: !user.isDisabled })}
                >
                  {saving === user.id ? "Kaydediliyor..." : user.isDisabled ? "Aktifleştir" : "Pasifleştir"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
