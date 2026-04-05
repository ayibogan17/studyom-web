import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";
import { Button } from "@/components/design-system/components/ui/button";

export const metadata: Metadata = {
  title: "Studyom Nasıl Kullanılır? | Studyom",
  description:
    "Studyom'a nasıl üye olunur, roller nasıl alınır ve onay sonrası hangi adımlar izlenir sorularının kısa rehberi.",
};

export default function StudyomHowToPage() {
  return (
    <main className="bg-[var(--color-secondary)] pb-16 pt-12">
      <Section containerClassName="max-w-4xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            KULLANIM REHBERİ
          </p>
          <h1 className="text-3xl font-semibold text-[var(--color-primary)]">Studyom nasıl kullanılır?</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Studyom; müzisyenleri, stüdyoları, üreticileri ve hocaları aynı platformda buluşturur. İster hizmet ara,
            ister hizmet ver; tek hesapla başlayabilir, ihtiyacına göre ilerleyebilirsin.
          </p>
        </header>

        <div className="flex flex-wrap gap-3">
          <Button asChild size="sm">
            <Link href="/signup">Üye Ol</Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link href="/profile">Profilim</Link>
          </Button>
        </div>

        <Card className="space-y-4 p-6">
          <SectionBlock title="1. Studyom ne işe yarar?">
            <p className="text-sm text-[var(--color-muted)]">
              Studyom üzerinden prova ve kayıt stüdyolarını inceleyebilir, üretici ve hocaları bulabilir, ihtiyacına
              göre doğru kişilere daha hızlı ulaşabilirsin. Üye olmadan da gezebilirsin; ama başvuru yapmak, profil
              oluşturmak ve rol almak için hesap gerekir.
            </p>
          </SectionBlock>

          <SectionBlock title="2. Nasıl üye olunur?">
            <p className="text-sm text-[var(--color-muted)]">
              <Link href="/signup" className="font-medium text-[var(--color-accent)] hover:underline">
                Üyelik
              </Link>{" "}
              sayfasından ad soyad, e-posta, telefon ve şehir bilgilerini doldurursun. Platformu ne amaçla
              kullanacağını da seçersin. Dilersen Google ile de devam edebilirsin.
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              E-posta ile kayıt olduysan hesabını doğrulaman gerekir. Doğrulama tamamlandıktan sonra hesabın aktif hale
              gelir.
            </p>
          </SectionBlock>

          <SectionBlock title="3. Üyelikten sonra ilk adım nedir?">
            <p className="text-sm text-[var(--color-muted)]">
              İlk durağın{" "}
              <Link href="/profile" className="font-medium text-[var(--color-accent)] hover:underline">
                profil
              </Link>{" "}
              sayfandır. Burada temel bilgilerini günceller, hesabının durumunu görür ve hangi rollere sahip olduğunu
              takip edersin. Profil sayfası hesap merkezindir.
            </p>
          </SectionBlock>

          <SectionBlock title="4. Roller nasıl alınır?">
            <p className="text-sm text-[var(--color-muted)]">
              Studyom&apos;da roller otomatik verilmez. Hoca, üretici veya stüdyo sahibi olmak için ilgili role başvurman
              gerekir. Başvurun incelenir; uygun bulunursa rolün aktif olur.
            </p>
          </SectionBlock>

          <SectionBlock title="5. Hoca, üretici veya stüdyo sahibi nasıl olunur?">
            <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--color-primary)]">
              <li>
                <span className="font-semibold">Hoca:</span>{" "}
                <Link href="/apply/teacher" className="text-[var(--color-accent)] hover:underline">
                  Öğretmen başvurusu
                </Link>{" "}
                yaparsın. Ders verdiğin alanları, çalışma biçimini ve kısa tanıtımını girersin.
              </li>
              <li>
                <span className="font-semibold">Üretici:</span>{" "}
                <Link href="/apply/producer" className="text-[var(--color-accent)] hover:underline">
                  Üretici başvurusu
                </Link>{" "}
                yaparsın. Çalıştığın alanları, nasıl iş aldığını ve portföyünü ya da deneyimini paylaşırsın.
              </li>
              <li>
                <span className="font-semibold">Stüdyo sahibi:</span>{" "}
                <Link href="/studio/new" className="text-[var(--color-accent)] hover:underline">
                  Stüdyo başvurusu
                </Link>{" "}
                yaparsın. Stüdyo adı, konum, iletişim ve doğrulama bilgilerini girersin.
              </li>
            </ul>
          </SectionBlock>

          <SectionBlock title="6. Başvurudan sonra ne olur?">
            <p className="text-sm text-[var(--color-muted)]">
              Başvuru yaptıktan sonra rolün hemen aktif olmaz. Önce inceleme sürecine girer. Bu aşamada profilinde rol
              durumunu beklemede olarak görebilirsin. Onaylandığında ilgili panelin açılır.
            </p>
          </SectionBlock>

          <SectionBlock title="7. Rol onaylandıktan sonra ne yapılır?">
            <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--color-primary)]">
              <li>Hoca rolün aktifse ders profilini ve çalışma bilgilerini düzenlersin.</li>
              <li>Üretici rolün aktifse hizmetlerini, alanlarını ve portföyünü görünür hale getirirsin.</li>
              <li>Stüdyo sahibi rolün aktifse stüdyonu ve detaylarını panelinden yönetmeye başlarsın.</li>
            </ul>
          </SectionBlock>

          <SectionBlock title="8. Kısaca akış">
            <ol className="list-decimal space-y-1 pl-5 text-sm text-[var(--color-primary)]">
              <li>Hesap oluştur.</li>
              <li>E-postanı doğrula.</li>
              <li>Profilini tamamla.</li>
              <li>İstediğin role başvur.</li>
              <li>Onay sürecini bekle.</li>
              <li>Rolün aktif olunca ilgili panelden yönetmeye başla.</li>
            </ol>
          </SectionBlock>

          <SectionBlock title="9. Neden Studyom?">
            <p className="text-sm text-[var(--color-muted)]">
              Amaç süreci uzatmak değil; müzisyenleri doğru insanlarla ve doğru yerlerle daha hızlı buluşturmak.
              Studyom, dağınık iletişimi azaltır, beklentileri netleştirir ve tek hesapla ilerleyebileceğin sade bir
              yapı sunar.
            </p>
          </SectionBlock>
        </Card>
      </Section>
    </main>
  );
}

function SectionBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-base font-semibold text-[var(--color-primary)]">{title}</h2>
      {children}
      <div className="h-px w-full bg-[var(--color-border)]" />
    </div>
  );
}
