"use client";

import { Section } from "@/components/design-system/components/shared/section";
import { Card } from "@/components/design-system/components/ui/card";

export default function HakkindaPage() {
  return (
    <main className="bg-[var(--color-secondary)]">
      <Section>
        <div className="space-y-4">
          <p className="text-sm font-semibold text-[var(--color-primary)]">Hakkında</p>
          <h1 className="text-3xl font-semibold text-[var(--color-primary)]">Studyom nedir?</h1>
          <Card className="space-y-3 text-[var(--color-primary)]">
            <p>Studyom, müzik üretiminin etrafındaki dağınıklığı toparlamak için kuruldu.</p>
            <p>
              Bir tarafta prova yapacak, kayıt alacak ya da şarkısını bir adım ileri taşımak isteyen müzisyenler var. Diğer
              tarafta stüdyosunu işletenler, ders veren hocalar, mix–mastering, edit, aranje gibi işleri yapan teknisyenler. Herkes
              aynı ekosistemin parçası ama çoğu zaman birbirini bulmak zor.
            </p>
            <p>
              Stüdyo aramak belirsizlik, stüdyo işletmek operasyon yükü, teknik hizmet sunmak ise çoğu zaman yanlış
              beklentiler ve dağınık iletişim demek.
            </p>
            <p>
              Studyom’un amacı bu parçaları tek bir yerde, net ve düzenli biçimde buluşturmak.
            </p>
            <div className="space-y-2">
              <p>Bu platformda:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  Müzisyenler; prova ve kayıt stüdyolarını, ders alabilecekleri hocaları ve şarkıları için teknik destek verecek
                  kişileri bulabilir
                </li>
                <li>Stüdyo sahipleri; mekânlarını, odalarını ve sundukları imkânları açıkça tanıtabilir</li>
                <li>Eğitmenler; verdikleri dersleri ve uzmanlık alanlarını görünür kılabilir</li>
                <li>Teknik hizmet sunanlar; mix, mastering, edit, aranje ya da enstrüman kayıt hizmetlerini net şekilde anlatabilir</li>
              </ul>
            </div>
            <p>
              Studyom, kimsenin işine karışmaz. Fiyatı, yöntemi, kuralları herkes kendisi belirler. Biz sadece bilgiyi sadeleştirir,
              beklentileri netleştirir ve doğru kişilerin birbirine ulaşmasını kolaylaştırırız.
            </p>
            <p>
              Burası bir sosyal ağ değil. Gösterişe değil, işin kendisine odaklanır. İletişimi uzatmaz, yanlış anlaşılmaları azaltır.
            </p>
            <p>
              Studyom, müzik üretiminin her aşamasında yer alan insanlar için karmaşayı azaltan, süreci netleştiren bir ortak zemindir.
            </p>
            <p>Müzik üretmek zaten emek ister. Studyom, bu emeğin önündeki gereksiz engelleri kaldırmak için var.</p>
            <p>
              Yapay zekâ üretimin bazı yollarını hızlandırabilir, kolaylaştırabilir. Ama müziğin özü hızda değil; birinin gerçekten
              çalmasında, bir sesin tereddüdünde, insanın kendinden bir şey bırakmasında saklıdır.
            </p>
            <p>Teknoloji değişir, araçlar dönüşür. Ama müzik, onu yapan insanlarla birlikte anlam kazanır.</p>
            <p>Gerçek sanatçılar var. Ve insanlar hissetmeye devam ettikçe, hep var olacaklar.</p>
          </Card>
        </div>
      </Section>
    </main>
  );
}
