"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Button } from "../ui/button";

const schema = z.object({
  studentName: z.string().min(2, "Ad Soyad gerekli"),
  studentEmail: z.string().email("Geçerli bir e-posta girin"),
  city: z.string().min(2, "Şehir girin"),
  preferredLessonType: z.enum(["online", "in-person", "both"]).optional(),
  message: z.string().min(10, "Mesaj en az 10 karakter olmalı").max(800, "Mesaj 800 karakteri geçemez"),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  teacherSlug: string;
  teacherName: string;
};

export function TeacherContactForm({ teacherSlug, teacherName }: Props) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      studentName: "",
      studentEmail: "",
      city: "",
      preferredLessonType: undefined,
      message: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/teacher-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, teacherSlug }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Gönderilemedi");
      }
      setStatus("success");
      form.reset({ studentName: "", studentEmail: "", city: "", preferredLessonType: undefined, message: "" });
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
      <div className="space-y-1">
        <p className="text-base font-semibold text-[var(--color-primary)]">İletişim Talebi</p>
        <p className="text-sm text-[var(--color-muted)]">
          Studyom ders satmaz, stüdyo ayarlamaz. Talebin doğrudan {teacherName}’e iletilir; planlama öğretmenle yapılır.
        </p>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="studentName">Ad Soyad</Label>
          <Input id="studentName" aria-invalid={!!form.formState.errors.studentName} {...form.register("studentName")} />
          {form.formState.errors.studentName && (
            <p className="text-xs text-[var(--color-danger)]">{form.formState.errors.studentName.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="studentEmail">E-posta</Label>
          <Input
            id="studentEmail"
            type="email"
            autoComplete="email"
            aria-invalid={!!form.formState.errors.studentEmail}
            {...form.register("studentEmail")}
          />
          {form.formState.errors.studentEmail && (
            <p className="text-xs text-[var(--color-danger)]">{form.formState.errors.studentEmail.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="city">Şehir</Label>
          <Input id="city" aria-invalid={!!form.formState.errors.city} {...form.register("city")} />
          {form.formState.errors.city && (
            <p className="text-xs text-[var(--color-danger)]">{form.formState.errors.city.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="preferredLessonType">Ders tipi tercihi</Label>
          <select
            id="preferredLessonType"
            aria-invalid={!!form.formState.errors.preferredLessonType}
            className="h-10 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
            defaultValue=""
            {...form.register("preferredLessonType")}
          >
            <option value="">Fark etmez</option>
            <option value="online">Online</option>
            <option value="in-person">Yüzyüze</option>
            <option value="both">Online + Yüzyüze</option>
          </select>
          {form.formState.errors.preferredLessonType && (
            <p className="text-xs text-[var(--color-danger)]">{form.formState.errors.preferredLessonType.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="message">Mesaj</Label>
          <Textarea
            id="message"
            rows={4}
            aria-invalid={!!form.formState.errors.message}
            placeholder="Kısa hedef, seviye veya istek notu yazın"
            {...form.register("message")}
          />
          {form.formState.errors.message && (
            <p className="text-xs text-[var(--color-danger)]">{form.formState.errors.message.message}</p>
          )}
        </div>
        {status === "success" && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            Talebin iletildi. Ders/stüdyo planlaması öğretmenle doğrudan yapılır.
          </div>
        )}
        {status === "error" && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            Gönderilemedi, lütfen tekrar dene.
          </div>
        )}
        <Button type="submit" full disabled={loading} aria-busy={loading}>
          {loading ? "Gönderiliyor..." : "İletişim talebi gönder"}
        </Button>
      </form>
    </div>
  );
}
