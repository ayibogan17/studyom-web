"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/design-system/components/ui/input";
import { Textarea } from "@/components/design-system/components/ui/textarea";
import { Label } from "@/components/design-system/components/ui/label";
import { Button } from "@/components/design-system/components/ui/button";

const subjects = ["Stüdyo ekleme", "Teknik sorun", "İş birliği", "Diğer"] as const;

const contactSchema = z.object({
  name: z.string().min(2, "Ad Soyad gerekli"),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  subject: z
    .string()
    .min(1, "Konu seçin")
    .refine((value) => subjects.includes(value as (typeof subjects)[number]), "Geçerli bir konu seçin"),
  message: z.string().min(10, "Mesaj en az 10 karakter olmalı"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [loading, setLoading] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    setLoading(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          message: `[${values.subject}] ${values.message}`,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Gönderilemedi");
      }
      setStatus("success");
      form.reset({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="name">Ad Soyad</Label>
          <Input
            id="name"
            aria-invalid={!!form.formState.errors.name}
            {...form.register("name")}
          />
          {form.formState.errors.name && (
            <p className="text-xs text-[var(--color-danger)]">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">E-posta adresi</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!form.formState.errors.email}
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-[var(--color-danger)]">{form.formState.errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="subject">Konu</Label>
        <select
          id="subject"
          aria-invalid={!!form.formState.errors.subject}
          className="h-10 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-primary)] shadow-sm transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none"
          defaultValue=""
          {...form.register("subject")}
        >
          <option value="" disabled>
            Konu seçin
          </option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {form.formState.errors.subject && (
          <p className="text-xs text-[var(--color-danger)]">{form.formState.errors.subject.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="message">Mesaj</Label>
        <Textarea
          id="message"
          rows={5}
          aria-invalid={!!form.formState.errors.message}
          {...form.register("message")}
        />
        {form.formState.errors.message && (
          <p className="text-xs text-[var(--color-danger)]">{form.formState.errors.message.message}</p>
        )}
      </div>

      {status === "success" && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          Mesajınız alındı. En kısa sürede size dönüş yapacağız.
        </div>
      )}
      {status === "error" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          Gönderilemedi. Lütfen tekrar deneyin.
        </div>
      )}

      <Button type="submit" full disabled={loading} aria-busy={loading}>
        {loading ? "Gönderiliyor..." : "Mesajı Gönder"}
      </Button>
    </form>
  );
}
