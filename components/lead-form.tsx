"use client";

import { FormEvent, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function LeadForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: (formData.get("name") || "").toString().trim(),
      email: (formData.get("email") || "").toString().trim(),
      message: (formData.get("message") || "").toString().trim(),
    };

    if (!payload.email) {
      setStatus("error");
      setMessage("Lütfen e-posta adresinizi yazın.");
      return;
    }

    setStatus("loading");
    setMessage(null);

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Gönderilemedi.");
      }

      setStatus("success");
      setMessage("Teşekkürler! En kısa sürede dönüş yapacağız.");
      form.reset();
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Bir şey ters gitti.",
      );
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      action="/api/lead"
      method="post"
      className="rounded-2xl border border-black/5 bg-white/80 p-6 shadow-lg backdrop-blur"
    >
      <div className="grid gap-4">
        <div className="grid gap-2">
          <label htmlFor="name" className="text-sm font-medium text-gray-700">
            İsim
          </label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="Adınız"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none ring-2 ring-transparent transition focus:border-black focus:ring-black/10"
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            E-posta <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="ornek@studyom.net"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none ring-2 ring-transparent transition focus:border-black focus:ring-black/10"
          />
        </div>
        <div className="grid gap-2">
          <label
            htmlFor="message"
            className="text-sm font-medium text-gray-700"
          >
            Not / İhtiyaç
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            placeholder="Hangi şehirde, hangi tarihte stüdyo arıyorsunuz?"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none ring-2 ring-transparent transition focus:border-black focus:ring-black/10"
          />
        </div>
        {message && (
          <p
            className={`text-sm ${status === "success" ? "text-green-700" : "text-red-600"}`}
          >
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-black/90 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {status === "loading" ? "Gönderiliyor..." : "Gönder"}
        </button>
      </div>
    </form>
  );
}
