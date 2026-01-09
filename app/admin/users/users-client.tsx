"use client";

import { Fragment, useState } from "react";
import { Button } from "@/components/design-system/components/ui/button";
import { ROLE_KEYS, type RoleKey } from "@/lib/roles";

type UserRow = {
  id: string;
  email: string;
  fullName: string | null;
  name: string | null;
  role: string;
  roles: string[];
  city: string | null;
  intent: string[];
  isDisabled: boolean;
  isSuspended: boolean;
  isBanned: boolean;
  banReason: string | null;
  adminNote: string | null;
  isTeacher: boolean;
  isProducer: boolean;
  isStudioOwner: boolean;
  emailVerified: Date | string | null;
  createdAt: Date;
  updatedAt: Date;
  studios: Array<{ id: string; name: string; slug: string | null }>;
  teacherApp: { id: number; status: string } | null;
  producerApp: { id: number; status: string } | null;
};

const roleLabels: Record<RoleKey, string> = {
  musician: "Müzisyen",
  teacher: "Hoca",
  producer: "Üretici",
  studio_owner: "Stüdyo",
  admin: "Admin",
};

function statusLabel(user: UserRow) {
  if (user.isBanned) return "Yasaklı";
  if (user.isSuspended) return "Askıda";
  if (user.isDisabled) return "Pasif";
  return "Aktif";
}

function statusStyle(user: UserRow) {
  if (user.isBanned) return "bg-[var(--color-danger)]/20 text-[var(--color-danger)]";
  if (user.isSuspended) return "bg-[var(--color-warning)]/20 text-[var(--color-warning)]";
  if (user.isDisabled) return "bg-[var(--color-danger)]/20 text-[var(--color-danger)]";
  return "bg-[var(--color-success)]/20 text-[var(--color-success)]";
}

export default function UsersClient({ users }: { users: UserRow[] }) {
  const [rows, setRows] = useState(users);
  const [saving, setSaving] = useState<string | null>(null);
  const [openRow, setOpenRow] = useState<string | null>(null);

  const updateRow = (id: string, patch: Partial<UserRow>) => {
    setRows((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  };

  const updateUser = async (id: string, payload: Record<string, unknown>) => {
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Kaydedilemedi");
      setRows((prev) => prev.map((u) => (u.id === id ? { ...u, ...(payload as Partial<UserRow>) } : u)));
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
            <th className="p-2">Roller</th>
            <th className="p-2">Şehir</th>
            <th className="p-2">Durum</th>
            <th className="p-2">Güncelleme</th>
            <th className="p-2">İşlem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {rows.map((user) => (
            <Fragment key={user.id}>
              <tr className="align-top">
                <td className="p-2">
                  <div className="font-semibold text-[var(--color-primary)]">{user.fullName || user.name || "-"}</div>
                  <div className="text-[var(--color-muted)]">{user.email}</div>
                </td>
                <td className="p-2">
                  <div className="flex flex-wrap gap-1 text-xs text-[var(--color-primary)]">
                    {user.roles.length
                      ? user.roles.map((role) => (
                          <span key={role} className="rounded-full bg-[var(--color-secondary)] px-2 py-1">
                            {roleLabels[role as RoleKey] ?? role}
                          </span>
                        ))
                      : "-"}
                  </div>
                </td>
                <td className="p-2">{user.city || "-"}</td>
                <td className="p-2">
                  <span className={`rounded-full px-2 py-1 text-xs ${statusStyle(user)}`}>
                    {statusLabel(user)}
                  </span>
                </td>
                <td className="p-2 text-xs text-[var(--color-muted)]">
                  {new Date(user.updatedAt).toLocaleDateString("tr-TR")}
                </td>
                <td className="p-2 space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpenRow(openRow === user.id ? null : user.id)}
                  >
                    {openRow === user.id ? "Detay gizle" : "Detaylar"}
                  </Button>
                </td>
              </tr>
              {openRow === user.id ? (
                <tr className="bg-[var(--color-secondary)]/40">
                  <td colSpan={6} className="p-3">
                    <div className="grid gap-4 text-xs text-[var(--color-muted)] lg:grid-cols-3">
                      <div className="space-y-2">
                        <p className="font-semibold text-[var(--color-primary)]">Roller</p>
                        <div className="space-y-1">
                          {ROLE_KEYS.map((role) => (
                            <label key={role} className="flex items-center gap-2 text-xs text-[var(--color-primary)]">
                              <input
                                type="checkbox"
                                checked={user.roles.includes(role)}
                                disabled={role === "musician"}
                                onChange={(e) => {
                                  const nextRoles = e.target.checked
                                    ? Array.from(new Set([...user.roles, role]))
                                    : user.roles.filter((r) => r !== role);
                                  updateRow(user.id, { roles: nextRoles });
                                }}
                              />
                              {roleLabels[role]}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="font-semibold text-[var(--color-primary)]">Durum</p>
                        <select
                          className="w-full rounded-md border border-[var(--color-border)] bg-transparent px-2 py-1"
                          value={user.isBanned ? "banned" : user.isSuspended ? "suspended" : "active"}
                          onChange={(e) => {
                            const value = e.target.value;
                            updateRow(user.id, {
                              isBanned: value === "banned",
                              isSuspended: value === "suspended",
                            });
                          }}
                        >
                          <option value="active">Aktif</option>
                          <option value="suspended">Askıya al</option>
                          <option value="banned">Yasakla</option>
                        </select>
                        <div>
                          <p className="font-semibold text-[var(--color-primary)]">Yasak nedeni</p>
                          <input
                            value={user.banReason ?? ""}
                            onChange={(e) => updateRow(user.id, { banReason: e.target.value })}
                            className="mt-2 h-9 w-full rounded-lg border border-[var(--color-border)] bg-transparent px-2 text-[var(--color-primary)]"
                            placeholder="Yasak nedeni"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="font-semibold text-[var(--color-primary)]">Admin notu</p>
                        <textarea
                          value={user.adminNote ?? ""}
                          onChange={(e) => updateRow(user.id, { adminNote: e.target.value })}
                          className="h-24 w-full resize-none rounded-lg border border-[var(--color-border)] bg-transparent p-2 text-[var(--color-primary)]"
                          placeholder="İç not"
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-xs text-[var(--color-muted)] sm:grid-cols-2">
                      <div>
                        <span className="font-semibold text-[var(--color-primary)]">Stüdyolar:</span>
                        {user.studios.length === 0 ? (
                          " -"
                        ) : (
                          <ul className="mt-1 space-y-1">
                            {user.studios.map((studio) => (
                              <li key={studio.id}>
                                <a
                                  href={studio.slug ? `/studyo/${studio.slug}` : "#"}
                                  className="underline underline-offset-4"
                                >
                                  {studio.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-[var(--color-primary)]">Hoca başvurusu:</span>{" "}
                        {user.teacherApp ? `#${user.teacherApp.id} (${user.teacherApp.status})` : "-"}
                      </div>
                      <div>
                        <span className="font-semibold text-[var(--color-primary)]">Üretici başvurusu:</span>{" "}
                        {user.producerApp ? `#${user.producerApp.id} (${user.producerApp.status})` : "-"}
                      </div>
                      <div>
                        <span className="font-semibold text-[var(--color-primary)]">E-posta doğrulama:</span>{" "}
                        {user.emailVerified ? "Doğrulandı" : "Bekliyor"}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={saving === user.id}
                        onClick={() =>
                          updateUser(user.id, {
                            roles: user.roles,
                            isSuspended: user.isSuspended,
                            isBanned: user.isBanned,
                            isDisabled: user.isSuspended || user.isBanned,
                            banReason: user.banReason ?? null,
                            adminNote: user.adminNote ?? null,
                          })
                        }
                      >
                        {saving === user.id ? "Kaydediliyor..." : "Kaydet"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : null}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
