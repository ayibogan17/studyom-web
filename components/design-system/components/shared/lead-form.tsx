import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";

const leadSchema = z.object({
  name: z.string().min(2, "Adınızı girin"),
  email: z.string().email("Geçerli bir e-posta girin"),
  phone: z.string().min(7, "Telefon girin"),
  message: z.string().min(5, "Mesajınızı girin"),
  studioSlug: z.string().optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "Onay gerekli" }) }),
});

type LeadFormValues = z.infer<typeof leadSchema>;

type LeadFormProps = {
  studioSlug?: string;
};

export function LeadForm({ studioSlug }: LeadFormProps) {
  const [loading, setLoading] = useState(false);
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
      studioSlug: studioSlug ?? "",
      consent: false,
    },
  });

  const onSubmit = async (values: LeadFormValues) => {
    setLoading(true);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Gönderilemedi");
      }
      toast.success("Talebin alındı. En kısa sürede dönüş yapacağız.");
      form.reset({ ...form.getValues(), message: "", consent: false });
    } catch (err) {
      console.error(err);
      toast.error("Gönderilemedi, lütfen tekrar dene.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="name">Ad Soyad</Label>
          <Input id="name" {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-xs text-[var(--color-danger)]">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">E-posta</Label>
          <Input id="email" type="email" {...form.register("email")} />
          {form.formState.errors.email && (
            <p className="text-xs text-[var(--color-danger)]">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="phone">Telefon</Label>
          <Input id="phone" type="tel" placeholder="05xx ..." {...form.register("phone")} />
          {form.formState.errors.phone && (
            <p className="text-xs text-[var(--color-danger)]">{form.formState.errors.phone.message}</p>
          )}
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="message">Mesaj</Label>
        <Textarea id="message" rows={4} {...form.register("message")} />
        {form.formState.errors.message && (
          <p className="text-xs text-[var(--color-danger)]">{form.formState.errors.message.message}</p>
        )}
      </div>
      <input type="hidden" value={studioSlug ?? ""} {...form.register("studioSlug")} />
      <label className="flex items-start gap-2 text-sm text-[var(--color-primary)]">
        <input type="checkbox" className="mt-1 h-4 w-4" {...form.register("consent")} />
        <span>Kişisel verilerimin talebim için işlenmesini onaylıyorum.</span>
      </label>
      {form.formState.errors.consent && (
        <p className="text-xs text-[var(--color-danger)]">{form.formState.errors.consent.message}</p>
      )}
      <Button type="submit" full disabled={loading}>
        {loading ? "Gönderiliyor..." : "Gönder"}
      </Button>
    </form>
  );
}
