import type { Metadata } from "next";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";

export const metadata: Metadata = {
  title: "Üretici Şartları | Studyom",
  description: "Studyom platformunda “Üretici” rolü için kullanım şartları ve bilgilendirme metni.",
};

export default function ProducerTermsPage() {
  return (
    <main className="bg-[var(--color-secondary)] pb-16 pt-12">
      <Section containerClassName="max-w-4xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            ÜRETİCİ METNİ
          </p>
          <h1 className="text-3xl font-semibold text-[var(--color-primary)]">
            Üreticiler İçin Kullanım Şartları ve Bilgilendirme Metni
          </h1>
          <p className="text-sm text-[var(--color-muted)]">
            Bu metin, Studyom platformunda “Üretici” rolüyle yer alan kullanıcılar için geçerli özel şartları açıklar.
            Platform’da üretici rolüne başvurarak veya bu rolü kullanarak aşağıdaki maddeleri kabul etmiş sayılırsınız.
          </p>
        </header>

        <Card className="space-y-4 p-6">
          <SectionBlock title="1. Üretici Kimdir? Kapsam Nedir?">
            <p className="text-sm text-[var(--color-muted)]">
              Studyom’da Üretici; şarkılara enstrüman yazan, davul, bas, synth, beat veya aranje üreten, prodüksiyon
              sürecine yaratıcı katkı sağlayan, home studio veya stüdyo ortamında çalışan kullanıcıları kapsar.
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-primary)]">
              <li>Üretici; sadece teknik destek veren kişi değildir.</li>
              <li>Sadece “sesçi” değildir.</li>
              <li>Müzik üretimine yaratıcı katkı sunan kişidir.</li>
            </ul>
            <p className="text-sm text-[var(--color-muted)]">
              Studyom bu rolü, müzik üretiminin gerçek çeşitliliğini kapsayacak şekilde tanımlar.
            </p>
          </SectionBlock>

          <SectionBlock title="2. Studyom’un Rolü">
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-primary)]">
              <li>Studyom; üretici ile müzisyen arasında tanıştırıcı bir platformdur.</li>
              <li>İş taleplerini ve ilanları görünür kılar.</li>
              <li>Tarafların iletişim kurmasını kolaylaştırır.</li>
            </ul>
            <p className="text-sm text-[var(--color-muted)]">Studyom; üretimin içeriğine, sanatsal tercihlere, ortaya çıkan işin kalitesine müdahale etmez.</p>
            <p className="text-sm text-[var(--color-muted)]">
              Kısaca: Studyom işi yapmaz, işi yapacak insanları buluşturur.
            </p>
          </SectionBlock>

          <SectionBlock title="3. Hizmetin Ücretsiz Olduğu">
            <p className="text-sm text-[var(--color-muted)]">Studyom’da üretici olarak yer almak şu an için ücretsizdir.</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-primary)]">
              <li>Üreticilerden komisyon alınmaz.</li>
              <li>Platform, yapılan işten pay talep etmez.</li>
              <li>Ücret, teslim, ödeme ve benzeri konular üretici ile müzisyen arasında belirlenir.</li>
            </ul>
            <p className="text-sm text-[var(--color-muted)]">
              Bu model; üreticilerin özgür çalışmasını ve platformun tarafsız kalmasını amaçlar.
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              Ancak Platform, kullanıcı deneyimini ve güvenli iş akışını geliştirmek amacıyla, ilerleyen dönemlerde
              opsiyonel ödeme veya güvenli işlem altyapıları sunabilir. Bu tür değişiklikler, kullanıcıya açık şekilde
              duyurulur ve ek koşullar kapsamında uygulanır.
            </p>
          </SectionBlock>

          <SectionBlock title="4. Profil Bilgileri ve Sorumluluk">
            <p className="text-sm text-[var(--color-muted)]">
              Üretici, profilinde paylaştığı bilgilerin doğru, güncel, yanıltıcı olmayan bilgiler olduğunu kabul eder.
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              Gerçeği yansıtmayan iddialar, sahte referanslar veya abartılı beyanlar; üretici rolünün askıya alınmasına
              veya tamamen kaldırılmasına neden olabilir.
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              Bu bir ceza değil; platformun güvenini koruma refleksidir.
            </p>
          </SectionBlock>

          <SectionBlock title="5. İş Talepleri ve İletişim">
            <p className="text-sm text-[var(--color-muted)]">Studyom, üreticilere iş taleplerini iletebilir.</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-primary)]">
              <li>Her talebi kabul etmek zorunlu değildir.</li>
              <li>Üretici, çalışma koşullarını kabul etmekte özgürdür.</li>
            </ul>
            <p className="text-sm text-[var(--color-muted)]">
              Ancak: sürekli yanıtsız bırakılan talepler platform içi görünürlüğü olumsuz etkileyebilir.
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              Sessizlik yasak değildir; ama alışkanlık hâline gelirse sistem bunu fark eder.
            </p>
          </SectionBlock>

          <SectionBlock title="6. Görünürlük ve Değerlendirme Sistemi">
            <p className="text-sm text-[var(--color-muted)]">
              Studyom’da açık bir puanlama veya yıldız sistemi bulunmaz. Bunun yerine platform;
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-primary)]">
              <li>yanıt sürelerini,</li>
              <li>iletişim düzenini,</li>
              <li>profil güncelliğini,</li>
              <li>etkileşim sıklığını</li>
            </ul>
            <p className="text-sm text-[var(--color-muted)]">
              algoritmik olarak değerlendirir. Bu değerlendirme; üreticilerin listelenme sırasını, önerilme ihtimalini ve
              platform içi görünürlüğünü etkileyebilir.
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              Algoritmanın detayları bilinçli olarak açıklanmaz. Amaç; sistemi manipüle etmeyi değil, doğal, güvenilir ve
              sürdürülebilir davranışı ödüllendirmektir.
            </p>
          </SectionBlock>

          <SectionBlock title="7. Davranış ve Profesyonellik">
            <p className="text-sm text-[var(--color-muted)]">
              Üretici; saygılı, net, profesyonel bir iletişim dili kullanmayı kabul eder.
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              Uygunsuz, küçümseyici veya kötü niyetli davranışlar; rolün askıya alınmasına veya tamamen kaldırılmasına
              neden olabilir.
            </p>
            <p className="text-sm text-[var(--color-muted)]">Tatlısı şu: Kimse mükemmel olmak zorunda değil.</p>
            <p className="text-sm text-[var(--color-muted)]">Serti şu: Güveni zedeleyen, burada uzun süre kalmaz.</p>
          </SectionBlock>

          <SectionBlock title="8. Rolün Askıya Alınması">
            <p className="text-sm text-[var(--color-muted)]">
              Studyom aşağıdaki durumlarda üretici rolünü geçici veya kalıcı olarak kaldırabilir:
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-primary)]">
              <li>yanıltıcı profil bilgileri,</li>
              <li>sürekli olumsuz geri bildirim,</li>
              <li>kötüye kullanım,</li>
              <li>platform ilkelerine aykırı davranış.</li>
            </ul>
            <p className="text-sm text-[var(--color-muted)]">
              Bu kararlar, platformun genel sağlığını korumak amacıyla alınır.
            </p>
          </SectionBlock>

          <SectionBlock title="9. Değişiklikler">
            <p className="text-sm text-[var(--color-muted)]">
              Bu metin, platform işleyişi veya mevzuat gereği güncellenebilir. Güncel hâli Platform’da yayımlandığı
              tarihten itibaren geçerlidir.
            </p>
          </SectionBlock>

          <div className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-primary)]">
              Üreticiler İçin Küçük Ama İşe Yarayacak Öneriler
            </h2>
            <p className="text-sm text-[var(--color-muted)]">
              Bunlar kural değil; daha doğru işlerle eşleşmek ve görünürlüğünü artırmak için ipuçlarıdır:
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-primary)]">
              <li>Profilini süsleme, net ol</li>
              <li>Yapmadığın işi “yaparım” deme</li>
              <li>Yanıt veremeyeceksen, kısa da olsa haber ver</li>
              <li>Uzmanlık alanlarını dar tut, güven artar</li>
              <li>Her işe atlama; doğru işe gir</li>
            </ul>
            <p className="text-sm text-[var(--color-muted)]">
              Unutma: Studyom seni vitrine çıkarır. Seni seçtiren şey, tavrın ve tutarlılığın olur.
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

