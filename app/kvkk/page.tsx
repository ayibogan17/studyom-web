import type { Metadata } from "next";
import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";

export const metadata: Metadata = {
  title: "Gizlilik ve KVKK | Studyom",
  description: "Gizlilik politikası ve kişisel verilerin korunmasına ilişkin aydınlatma metni.",
};

export default function KvkkPage() {
  return (
    <main className="bg-[var(--color-secondary)] pb-16 pt-12">
      <Section containerClassName="max-w-4xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            KVKK METNİ
          </p>
          <h1 className="text-3xl font-semibold text-[var(--color-primary)]">
            Gizlilik Politikası ve Kişisel Verilerin Korunması Aydınlatma Metni
          </h1>
          <p className="text-sm text-[var(--color-muted)]">
            Bu metin, Studyom (“Platform”) tarafından sunulan hizmetler kapsamında elde edilen kişisel verilerin
            işlenmesine ilişkin olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca kullanıcıların
            bilgilendirilmesi amacıyla hazırlanmıştır.
          </p>
        </header>

        <Card className="space-y-4 p-6">
          <SectionBlock
            title="1. Veri Sorumlusu"
            body="Kişisel verileriniz, veri sorumlusu sıfatıyla Studyom tarafından, bu metinde açıklanan kapsamda işlenmektedir."
          />

          <SectionBlock title="2. İşlenen Kişisel Veriler">
            <p className="text-sm text-[var(--color-muted)]">
              Platformu kullandığınızda aşağıdaki kişisel veriler işlenebilir:
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-primary)]">
              <li>Kimlik bilgileri (ad, soyad)</li>
              <li>İletişim bilgileri (e-posta adresi)</li>
              <li>Konum bilgisi (şehir)</li>
              <li>Hesap ve kullanıcı bilgileri</li>
              <li>Platform kullanım ve işlem kayıtları</li>
              <li>Talep, başvuru ve mesaj içerikleri</li>
              <li>Teknik veriler (IP adresi, tarayıcı bilgisi, cihaz bilgisi)</li>
            </ul>
            <p className="text-sm text-[var(--color-muted)]">
              Platform, gereksiz veya amacını aşan veri toplamamayı ilke edinmiştir.
            </p>
          </SectionBlock>

          <SectionBlock title="3. Kişisel Verilerin İşlenme Amaçları">
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-primary)]">
              <li>Kullanıcı hesabının oluşturulması ve yönetilmesi</li>
              <li>Platform hizmetlerinin sunulması ve geliştirilmesi</li>
              <li>Stüdyo, müzisyen, teknisyen ve hoca eşleştirme süreçlerinin yürütülmesi</li>
              <li>Kullanıcı taleplerinin ve başvurularının değerlendirilmesi</li>
              <li>Platform güvenliğinin sağlanması</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            </ul>
            <p className="text-sm text-[var(--color-muted)]">
              Studyom, kişisel verileri ticari amaçla satmaz, izinsiz paylaşmaz.
            </p>
          </SectionBlock>

          <SectionBlock title="4. Hukuki Sebep">
            <p className="text-sm text-[var(--color-muted)]">
              Kişisel verileriniz KVKK’nın 5. maddesi uyarınca aşağıdaki hukuki sebeplere dayanılarak işlenmektedir:
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-primary)]">
              <li>Bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması</li>
              <li>Veri sorumlusunun hukuki yükümlülüğünü yerine getirmesi</li>
              <li>Meşru menfaatler kapsamında zorunlu olması</li>
              <li>Açık rızanızın bulunması</li>
            </ul>
          </SectionBlock>

          <SectionBlock title="5. Verilerin Aktarılması">
            <p className="text-sm text-[var(--color-muted)]">Kişisel verileriniz:</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-primary)]">
              <li>Yetkili kamu kurum ve kuruluşlarına (yasal zorunluluk hâlinde)</li>
              <li>Teknik hizmet sağlayıcılara (barındırma, e-posta, bildirim servisleri vb.)</li>
            </ul>
            <p className="text-sm text-[var(--color-muted)]">
              yalnızca hizmetin gerektirdiği ölçüde aktarılabilir. Studyom, kullanıcı verilerini reklam veya pazarlama
              amacıyla üçüncü kişilere devretmez.
            </p>
          </SectionBlock>

          <SectionBlock title="6. Verilerin Saklanma Süresi">
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-primary)]">
              <li>İşleme amacının gerektirdiği süre boyunca</li>
              <li>İlgili mevzuatta öngörülen saklama süreleri kadar</li>
            </ul>
            <p className="text-sm text-[var(--color-muted)]">
              saklanır. Süre sonunda veriler silinir, yok edilir veya anonim hâle getirilir.
            </p>
          </SectionBlock>

          <SectionBlock title="7. Platformun Rolü ve Sorumluluk Sınırı">
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-primary)]">
              <li>Studyom; hizmet sunan taraf değildir.</li>
              <li>Eğitim, kayıt, prodüksiyon veya teknik hizmet vermez.</li>
              <li>Taraflar arasındaki ilişkide aracı platform olarak faaliyet gösterir.</li>
            </ul>
            <p className="text-sm text-[var(--color-muted)]">
              Platform, taraflar arasındaki hizmetin içeriğinden veya kalitesinden sorumlu değildir.
            </p>
          </SectionBlock>

          <SectionBlock title="8. Veri Güvenliği">
            <p className="text-sm text-[var(--color-muted)]">
              Kişisel verilerin güvenliği için uygun teknik ve idari tedbirler alınmaktadır. Yetkisiz erişim, veri kaybı
              ve hukuka aykırı işleme risklerine karşı makul güvenlik önlemleri uygulanır.
            </p>
          </SectionBlock>

          <SectionBlock title="9. Kullanıcının Hakları">
            <p className="text-sm text-[var(--color-muted)]">KVKK’nın 11. maddesi uyarınca kullanıcılar;</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-primary)]">
              <li>Kişisel verilerinin işlenip işlenmediğini öğrenme</li>
              <li>İşlenmişse buna ilişkin bilgi talep etme</li>
              <li>Amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
              <li>Kanuna aykırı işlenmişse silinmesini veya yok edilmesini isteme</li>
            </ul>
            <p className="text-sm text-[var(--color-muted)]">
              Bu haklara ilişkin talepler, Platform üzerinden veya yazılı olarak iletilebilir.
            </p>
          </SectionBlock>

          <SectionBlock title="10. Değişiklikler">
            <p className="text-sm text-[var(--color-muted)]">
              Bu metin, mevzuat veya Platform işleyişindeki değişikliklere bağlı olarak güncellenebilir. Güncellenmiş
              metin Platform üzerinde yayımlandığı tarihten itibaren geçerli olur.
            </p>
          </SectionBlock>
        </Card>
      </Section>
    </main>
  );
}

function SectionBlock({
  title,
  body,
  children,
}: {
  title: string;
  body?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-base font-semibold text-[var(--color-primary)]">{title}</h2>
      {body ? <p className="text-sm text-[var(--color-muted)]">{body}</p> : null}
      {children}
      <div className="h-px w-full bg-[var(--color-border)]" />
    </div>
  );
}
