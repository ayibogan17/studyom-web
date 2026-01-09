"use client";

import { useState } from "react";
import { Button } from "@/components/design-system/components/ui/button";

type ContentBlock = {
  id: string;
  contentKey: string;
  title: string | null;
  body: string;
  status: string;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export default function ContentClient({ blocks }: { blocks: ContentBlock[] }) {
  const [rows, setRows] = useState(blocks);
  const [saving, setSaving] = useState<string | null>(null);
  const [selected, setSelected] = useState<ContentBlock | null>(null);
  const [newBlock, setNewBlock] = useState({ contentKey: "", title: "", body: "" });

  const createBlock = async () => {
    if (!newBlock.contentKey.trim()) {
      alert("content_key gerekli");
      return;
    }
    setSaving("new");
    try {
      const res = await fetch("/api/admin/content-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentKey: newBlock.contentKey,
          title: newBlock.title || null,
          body: newBlock.body || "",
          status: "draft",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Kaydedilemedi");
      setRows((prev) => [json.block as ContentBlock, ...prev]);
      setNewBlock({ contentKey: "", title: "", body: "" });
    } catch (err) {
      console.error(err);
      alert("Kaydedilemedi");
    } finally {
      setSaving(null);
    }
  };

  const saveBlock = async () => {
    if (!selected) return;
    setSaving(selected.id);
    try {
      const res = await fetch(`/api/admin/content-blocks/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selected.title ?? null,
          body: selected.body ?? "",
          status: selected.status,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Kaydedilemedi");
      setRows((prev) => prev.map((row) => (row.id === selected.id ? (json.block as ContentBlock) : row)));
    } catch (err) {
      console.error(err);
      alert("Kaydedilemedi");
    } finally {
      setSaving(null);
    }
  };

  const deleteBlock = async (id: string) => {
    if (!confirm("Silinsin mi?")) return;
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/content-blocks/${id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Silinemedi");
      setRows((prev) => prev.filter((row) => row.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      console.error(err);
      alert("Silinemedi");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        <div className="rounded-xl border border-[var(--color-border)] p-3 text-xs text-[var(--color-muted)]">
          <p className="font-semibold text-[var(--color-primary)]">Yeni blok</p>
          <div className="mt-2 grid gap-2">
            <input
              value={newBlock.contentKey}
              onChange={(e) => setNewBlock((prev) => ({ ...prev, contentKey: e.target.value }))}
              placeholder="content_key"
              className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-transparent px-2 text-[var(--color-primary)]"
            />
            <input
              value={newBlock.title}
              onChange={(e) => setNewBlock((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Başlık"
              className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-transparent px-2 text-[var(--color-primary)]"
            />
            <textarea
              value={newBlock.body}
              onChange={(e) => setNewBlock((prev) => ({ ...prev, body: e.target.value }))}
              placeholder="İçerik"
              className="h-24 w-full resize-none rounded-lg border border-[var(--color-border)] bg-transparent p-2 text-[var(--color-primary)]"
            />
            <Button variant="secondary" size="sm" disabled={saving === "new"} onClick={createBlock}>
              {saving === "new" ? "Kaydediliyor..." : "Oluştur"}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {rows.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">Blok yok.</p>
          ) : (
            rows.map((block) => (
              <div
                key={block.id}
                className={`flex items-center justify-between rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm ${
                  selected?.id === block.id ? "bg-[var(--color-secondary)]/40" : ""
                }`}
              >
                <div>
                  <p className="font-semibold text-[var(--color-primary)]">{block.contentKey}</p>
                  <p className="text-xs text-[var(--color-muted)]">{block.title || "Başlık yok"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelected(block)}>
                    Düzenle
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={saving === block.id}
                    onClick={() => deleteBlock(block.id)}
                    className="border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
                  >
                    Sil
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl border border-[var(--color-border)] p-4 text-xs text-[var(--color-muted)]">
          <p className="font-semibold text-[var(--color-primary)]">Detay</p>
          {!selected ? (
            <p className="mt-2">Bir blok seçin.</p>
          ) : (
            <div className="mt-3 space-y-2">
              <div>
                <p className="font-semibold text-[var(--color-primary)]">Key</p>
                <p>{selected.contentKey}</p>
              </div>
              <div>
                <p className="font-semibold text-[var(--color-primary)]">Başlık</p>
                <input
                  value={selected.title ?? ""}
                  onChange={(e) => setSelected({ ...selected, title: e.target.value })}
                  className="mt-1 h-9 w-full rounded-lg border border-[var(--color-border)] bg-transparent px-2 text-[var(--color-primary)]"
                />
              </div>
              <div>
                <p className="font-semibold text-[var(--color-primary)]">İçerik</p>
                <textarea
                  value={selected.body ?? ""}
                  onChange={(e) => setSelected({ ...selected, body: e.target.value })}
                  className="mt-1 h-36 w-full resize-none rounded-lg border border-[var(--color-border)] bg-transparent p-2 text-[var(--color-primary)]"
                />
              </div>
              <div>
                <p className="font-semibold text-[var(--color-primary)]">Durum</p>
                <select
                  value={selected.status}
                  onChange={(e) => setSelected({ ...selected, status: e.target.value })}
                  className="mt-1 h-9 w-full rounded-lg border border-[var(--color-border)] bg-transparent px-2 text-[var(--color-primary)]"
                >
                  <option value="draft">Taslak</option>
                  <option value="published">Yayında</option>
                </select>
              </div>
              <Button variant="secondary" size="sm" disabled={saving === selected.id} onClick={saveBlock}>
                {saving === selected.id ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
