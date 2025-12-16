import { ContactForm } from "./_components/contact-form";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";

export default function ContactPage() {
  return (
    <main className="bg-[var(--color-secondary)]">
      <Section containerClassName="max-w-4xl">
        <div className="space-y-8">
          <header className="space-y-3">
            <h1 className="text-3xl font-semibold text-[var(--color-primary)]">İletişim</h1>
            <p className="text-base text-[var(--color-muted)]">
              Sorularınız, önerileriniz veya iş birlikleri için bizimle iletişime geçebilirsiniz. Mesajlarınızı en kısa sürede yanıtlıyoruz.
            </p>
          </header>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="space-y-5 p-5 md:p-6">
              <div className="space-y-1">
                <p className="text-base font-semibold text-[var(--color-primary)]">İletişim Formu</p>
                <p className="text-sm text-[var(--color-muted)]">
                  Tüm iletişim tek kanaldan yürütülür; telefon paylaşmıyoruz. Formu doldurun, size e-posta ile dönüş yapalım.
                </p>
              </div>
              <ContactForm />
            </Card>

            <Card className="space-y-3 p-5 md:p-6">
              <p className="text-base font-semibold text-[var(--color-primary)]">Doğrudan İletişim</p>
              <p className="text-sm text-[var(--color-primary)]">
                Bize e-posta göndermek isterseniz:
              </p>
              <a
                className="text-lg font-semibold text-[var(--color-primary)] hover:text-[var(--color-accent)]"
                href="mailto:admin@studyom.net"
              >
                admin@studyom.net
              </a>
              <p className="text-sm text-[var(--color-muted)]">
                Yoğunluk durumuna göre dönüş süresi değişebilir.
              </p>
            </Card>
          </div>
        </div>
      </Section>
    </main>
  );
}
