import type { Metadata } from "next";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";

export const metadata: Metadata = {
  title: "Stüdyo Sahibi Şartları | Studyom",
  description: "Studyom platformunda stüdyo sahipleri için kullanım şartları ve bilgilendirme metni.",
};

export default function StudioOwnerTermsPage() {
  return (
    <main className="bg-[var(--color-secondary)] pb-16 pt-12">
      <Section containerClassName="max-w-4xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            STÜDYO SAHİBİ METNİ
          </p>
          <h1 className="text-3xl font-semibold text-[var(--color-primary)]">
            Stüdyo Sahipleri İçin Kullanım Şartları ve Bilgilendirme Metni
          </h1>
          <p className="text-sm text-[var(--color-muted)]">
            Bu metin, Studyom platformunda “Stüdyo Sahibi” rolüyle yer alan kullanıcılar için geçerli kullanım şartlarını
            ve bilgilendirme esaslarını düzenler. Platform’da stüdyo ekleyerek veya stüdyo sahibi rolünü kullanarak
            aşağıdaki hükümleri kabul etmiş sayılırsınız.
          </p>
        </header>

        <Card className="space-y-4 p-6">
          <SectionBlock title="1. Studyom’un Rolü">
            <p className="text-sm text-[var(--color-muted)]">Studyom;</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-primary)]">
              <li>stüdyolar ile kullanıcıları buluşturan,</li>
              <li>rezervasyon ve iletişim süreçlerini kolaylaştıran,</li>
              <li>stüdyonun görünürlüğünü ve zaman yönetimini destekleyen</li>
            </ul>
            <p className="text-sm text-[var(--color-muted)]">bir aracı platformdur.</p>
            <p className="text-sm text-[var(--color-muted)]">Studyom;</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-primary)]">
              <li>stüdyo işletmez,</li>
              <li>hizmet sunmaz,</li>
              <li>fiyat belirlemez,</li>
              <li>taraflar adına taahhütte bulunmaz.</li>
            </ul>
            <p className="text-sm text-[var(--color-muted)]">Platform, stüdyo ile kullanıcı arasındaki ilişkide taraf değildir.</p>
          </SectionBlock>

          <SectionBlock title="2. Stüdyo Sahibi Sorumluluğu">
            <p className="text-sm text-[var(--color-muted)]">Stüdyo sahibi;</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-primary)]">
              <li>
                Platform’a eklediği stüdyonun gerçek, aktif ve kendisine ait veya yetkili olduğu bir işletme olduğunu,
              </li>
              <li>Paylaşılan tüm bilgilerin doğru, güncel ve yanıltıcı olmayan nitelikte olduğunu,</li>
              <li>İletişim bilgilerinin ulaşılabilir olduğunu</li>
            </ul>
            <p className="text-sm text-[var(--color-muted)]">
              kabul ve beyan eder. Yanıltıcı, eksik veya gerçeğe aykırı bilgi verilmesi hâlinde Studyom, stüdyo profilini
              askıya alma veya yayından kaldırma hakkını saklı tutar.
            </p>
          </SectionBlock>

          <SectionBlock title="3. Yayınlanma ve Onay Süreci">
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-primary)]">
              <li>Platform’a eklenen stüdyolar, inceleme sürecinin ardından yayına alınır.</li>
              <li>İnceleme sürecinde stüdyo herkese açık olarak listelenmez.</li>
              <li>Studyom, gerekli gördüğü durumlarda ek bilgi veya doğrulama talep edebilir.</li>
              <li>Onaylanmayan stüdyolar yayına alınmaz ve gerekçe bildirilebilir.</li>
            </ul>
            <p className="text-sm text-[var(--color-muted)]">
              Onay, stüdyonun Platform’da yayınlanmasına izin verilmesi anlamına gelir; bir kalite veya hizmet garantisi
              teşkil etmez.
            </p>
          </SectionBlock>

          <SectionBlock title="4. Rezervasyon ve Hizmet Süreci">
            <p className="text-sm text-[var(--color-muted)]">Stüdyo sahibi;</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-primary)]">
              <li>Rezervasyon taleplerini zamanında yanıtlamayı,</li>
              <li>Uygunluk, oda ve ekipman bilgilerini güncel tutmayı,</li>
              <li>Kullanıcılarla kurulan iletişimde makul ve profesyonel davranmayı</li>
            </ul>
            <p className="text-sm text-[var(--color-muted)]">
              kabul eder. Rezervasyon, kullanım, iptal ve ödeme koşulları stüdyo ile kullanıcı arasında belirlenir.
              Studyom bu süreçlerin içeriğine müdahale etmez.
            </p>
          </SectionBlock>

          <SectionBlock title="5. Fiyatlandırma ve Kampanyalar">
            <p className="text-sm text-[var(--color-muted)]">Stüdyo sahibi;</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-primary)]">
              <li>Platform’da paylaştığı fiyat bilgilerinin gerçek olduğunu,</li>
              <li>Kampanya veya indirim gibi uygulamaların kendi tercihine bağlı olduğunu</li>
            </ul>
            <p className="text-sm text-[var(--color-muted)]">
              kabul eder. Studyom, fiyatlara müdahale etmez ve stüdyo adına indirim taahhüdünde bulunmaz.
            </p>
          </SectionBlock>

          <SectionBlock title="6. İçerik ve Görseller">
            <p className="text-sm text-[var(--color-muted)]">Stüdyo sahibi;</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-primary)]">
              <li>Platform’a yüklediği metin, görsel ve bağlantıların kullanım hakkına sahip olduğunu,</li>
              <li>Bu içeriklerin üçüncü kişilerin haklarını ihlal etmediğini</li>
            </ul>
            <p className="text-sm text-[var(--color-muted)]">
              kabul eder. Studyom, içerikleri Platform’un işleyişi kapsamında yayınlama hakkına sahiptir.
            </p>
          </SectionBlock>

          <SectionBlock title="7. Askıya Alma ve Yayından Kaldırma">
            <p className="text-sm text-[var(--color-muted)]">Aşağıdaki durumlarda Studyom, stüdyo profilini geçici veya kalıcı olarak yayından kaldırabilir:</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-primary)]">
              <li>Yanıltıcı veya gerçeğe aykırı bilgi verilmesi</li>
              <li>Sürekli ulaşılamama veya kullanıcı şikâyetleri</li>
              <li>Platformun güvenliğini veya düzenini bozacak davranışlar</li>
              <li>Kullanım şartlarına aykırılık</li>
            </ul>
            <p className="text-sm text-[var(--color-muted)]">
              Bu işlemler, platformdaki kullanıcı güvenini korumak amacıyla yapılır.
            </p>
          </SectionBlock>

          <SectionBlock title="8. Değişiklikler">
            <p className="text-sm text-[var(--color-muted)]">
              Bu metin, Platform işleyişi veya mevzuat gereği güncellenebilir. Güncel metin Platform’da yayımlandığı
              tarihten itibaren geçerlidir.
            </p>
          </SectionBlock>

          <SectionBlock title="9. Son Hüküm">
            <p className="text-sm text-[var(--color-muted)]">
              Studyom, stüdyolar için bir ilan alanı değil; düzen, erişilebilirlik ve zaman yönetimi sağlayan bir
              altyapıdır. Platform’da yer almak, bu düzenin parçası olmayı ve temel sorumlulukları kabul etmeyi
              gerektirir.
            </p>
          </SectionBlock>
        </Card>
      </Section>
    </main>
  );
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-base font-semibold text-[var(--color-primary)]">{title}</h2>
      {children}
      <div className="h-px w-full bg-[var(--color-border)]" />
    </div>
  );
}
