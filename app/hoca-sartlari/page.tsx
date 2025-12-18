import type { Metadata } from "next";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";

export const metadata: Metadata = {
  title: "Hoca Şartları | Studyom",
  description: "Studyom platformunda “Hoca” rolü için kullanım şartları ve bilgilendirme metni.",
};

export default function TeacherTermsPage() {
  return (
    <main className="bg-[var(--color-secondary)] pb-16 pt-12">
      <Section containerClassName="max-w-4xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">HOCA METNİ</p>
          <h1 className="text-3xl font-semibold text-[var(--color-primary)]">
            Hocalar İçin Kullanım Şartları ve Bilgilendirme Metni
          </h1>
          <p className="text-sm text-[var(--color-muted)]">
            Bu metin, Studyom platformu üzerinde “Hoca” rolüyle yer alan kullanıcılar için geçerli özel şartları açıklar.
            Platform’da hoca rolüne başvurarak veya bu rolü kullanarak aşağıdaki maddeleri kabul etmiş sayılırsınız.
          </p>
        </header>

        <Card className="space-y-4 p-6">
          <SectionBlock title="1. Studyom’un Hocalar İçin Rolü">
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-primary)]">
              <li>Studyom; hoca ile öğrenci arasında tanıştırıcı bir platformdur.</li>
              <li>Ders satmaz.</li>
              <li>Eğitim programı oluşturmaz.</li>
              <li>Derslerin içeriğine veya ücretine müdahale etmez.</li>
            </ul>
            <p className="text-sm text-[var(--color-muted)]">Studyom; öğrenciyi hocayla buluşturur, dersin kendisine karışmaz.</p>
          </SectionBlock>

          <SectionBlock title="2. Hizmetin Ücretsiz Olduğu">
            <p className="text-sm text-[var(--color-muted)]">Studyom’da hoca olarak yer almak ücretsizdir.</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-primary)]">
              <li>Hocalardan komisyon alınmaz.</li>
              <li>Derslerden pay talep edilmez.</li>
              <li>Öğrenci–hoca arasındaki ücret ve ödeme tamamen taraflar arasında belirlenir.</li>
            </ul>
            <p className="text-sm text-[var(--color-muted)]">
              Bu model, platformun bağımsız kalmasını, güven ilişkisini korumasını ve hocaların rahat çalışmasını amaçlar.
            </p>
          </SectionBlock>

          <SectionBlock title="3. Stüdyo Kullanımı">
            <p className="text-sm text-[var(--color-muted)]">Studyom; derslerin nerede yapılacağını belirlemez, stüdyo ayarlaması yapmaz.</p>
            <p className="text-sm text-[var(--color-muted)]">
              Stüdyo kullanımı gerekiyorsa: bu süreç hoca ve öğrenci arasında, varsa stüdyo ile doğrudan ayarlanır. Studyom
              bu ilişkide taraf değildir.
            </p>
          </SectionBlock>

          <SectionBlock title="4. Profil Bilgileri ve Sorumluluk">
            <p className="text-sm text-[var(--color-muted)]">
              Hoca, profilinde paylaştığı bilgilerin doğru, güncel, yanıltıcı olmayan bilgiler olduğunu kabul eder.
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              Gerçeği yansıtmayan, abartılı veya yanıltıcı içerikler; hoca profilinin askıya alınmasına veya platformdan
              kaldırılmasına neden olabilir. Bu bir ceza değil, kalite filtresidir.
            </p>
          </SectionBlock>

          <SectionBlock title="5. Öğrenci İletişimi">
            <p className="text-sm text-[var(--color-muted)]">Studyom, hocalara öğrenci iletişim talepleri iletir.</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-primary)]">
              <li>Hoca, bu talepleri kabul etmek zorunda değildir.</li>
              <li>Yanıt vermek bir zorunluluk değil, bir tercihtir.</li>
            </ul>
            <p className="text-sm text-[var(--color-muted)]">
              Ancak: sürekli yanıtsız bırakılan talepler platform içi görünürlüğü olumsuz etkileyebilir.
            </p>
          </SectionBlock>

          <SectionBlock title="6. Değerlendirme ve Görünürlük Sistemi">
            <p className="text-sm text-[var(--color-muted)]">
              Studyom’da açık bir puanlama veya yıldız sistemi bulunmaz. Ancak platform; yanıt sürelerini, iletişim
              düzenini, profil güncelliğini, kullanıcı etkileşimlerini algoritmik olarak değerlendirir.
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              Bu değerlendirme: hocaların listelenme sırasını, önerilme ihtimalini, görünürlüğünü etkileyebilir. Bu
              sistemin detayları bilinçli olarak şeffaflaştırılmamıştır. Amaç, sistemi manipüle etmek yerine doğal ve
              sağlıklı etkileşimi teşvik etmektir.
            </p>
          </SectionBlock>

          <SectionBlock title="7. Davranış ve İletişim">
            <p className="text-sm text-[var(--color-muted)]">
              Hoca; öğrencilere karşı saygılı, net, profesyonel bir iletişim dili kullanmayı kabul eder.
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              Uygunsuz, rahatsız edici veya kötü niyetli davranışlar; rolün askıya alınmasına veya tamamen kaldırılmasına
              neden olabilir.
            </p>
            <p className="text-sm text-[var(--color-muted)]">Tatlısı şu: Kimse mükemmel olmak zorunda değil.</p>
            <p className="text-sm text-[var(--color-muted)]">Serti şu: Güven bozan, burada kalmaz.</p>
          </SectionBlock>

          <SectionBlock title="8. Rolün Askıya Alınması">
            <p className="text-sm text-[var(--color-muted)]">
              Studyom, aşağıdaki durumlarda hoca rolünü geçici veya kalıcı olarak kaldırabilir:
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-primary)]">
              <li>yanıltıcı profil bilgileri,</li>
              <li>sürekli şikâyet,</li>
              <li>kötüye kullanım,</li>
              <li>platform ilkelerine aykırı davranış.</li>
            </ul>
            <p className="text-sm text-[var(--color-muted)]">Bu kararlar, platformun genel sağlığını korumak için alınır.</p>
          </SectionBlock>

          <SectionBlock title="9. Değişiklikler">
            <p className="text-sm text-[var(--color-muted)]">
              Bu metin, ihtiyaçlar doğrultusunda güncellenebilir. Güncel hâli Platform’da yayımlandığı tarihten itibaren
              geçerlidir.
            </p>
          </SectionBlock>

          <div className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-primary)]">
              Hocalar İçin Küçük Ama Önemli Öneriler
            </h2>
            <p className="text-sm text-[var(--color-muted)]">
              Bunlar kural değil; platformda daha görünür ve tercih edilir olmak için ipuçlarıdır:
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-primary)]">
              <li>Profilini “mükemmel” değil, dürüst yap</li>
              <li>Her talebi kabul etme, ama yanıtsız da bırakma</li>
              <li>Ders şartlarını baştan net söyle</li>
              <li>Ulaşılabilir saatlerini güncel tut</li>
              <li>Stüdyo kullanımını öğrenciyle önceden konuş</li>
            </ul>
            <p className="text-sm text-[var(--color-muted)]">
              Unutma: Studyom seni vitrine koyar. Öğrenciyi tutan şey, senin tavrındır.
            </p>
          </div>
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
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-base font-semibold text-[var(--color-primary)]">{title}</h2>
      {children}
      <div className="h-px w-full bg-[var(--color-border)]" />
    </div>
  );
}

