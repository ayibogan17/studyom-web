"use client";

import { useMemo, useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { Card } from "@/components/design-system/components/ui/card";
import { Button } from "@/components/design-system/components/ui/button";
import { Badge } from "@/components/design-system/components/ui/badge";

const instrumentOptions = [
  "Keman",
  "Viyola",
  "Viyolonsel",
  "Kontrbas",
  "Flüt",
  "Yan flüt",
  "Klarnet",
  "Saksafon",
  "Trompet",
  "Trombon",
  "Bağlama (kısa/uzun sap)",
  "Cura",
  "Divan sazı",
  "Ud",
  "Kanun",
  "Ney",
  "Kabak kemane",
  "Gitar (elektro/akustik)",
  "Bas gitar",
  "Davul",
  "Piyano / Klavye",
  "Müzik prodüksiyonu",
  "Beat yapımı",
  "Aranje",
  "Mixing",
  "Mastering",
  "Sound design",
  "Müzik teorisi",
  "Armoni",
  "Solfej",
  "Nota okuma",
  "Ritim & tempo",
  "Ear training (kulak eğitimi)",
  "Beste & söz yazımı",
  "DJ’lik",
];

const levelOptions = ["Başlangıç", "Orta", "İleri"];
const formatOptions = ["Yüz yüze", "Online"];
const languageOptions = ["Türkçe", "İngilizce"];
const priceOptions = [
  "Saatlik 500–750 TL",
  "Saatlik 750–1000 TL",
  "Saatlik 1000 TL+",
  "Ücreti öğrenciyle konuşurum",
];
const yearOptions = ["0-1", "2-4", "5-9", "10+"];
const studentOptions = ["Henüz çalışmadım", "1-5", "6-20", "20+"];

const cityOptions = [
  "İstanbul",
  "İzmir",
  "Ankara",
  "Adana",
  "Adıyaman",
  "Afyonkarahisar",
  "Ağrı",
  "Aksaray",
  "Amasya",
  "Antalya",
  "Ardahan",
  "Artvin",
  "Aydın",
  "Balıkesir",
  "Bartın",
  "Batman",
  "Bayburt",
  "Bilecik",
  "Bingöl",
  "Bitlis",
  "Bolu",
  "Burdur",
  "Bursa",
  "Çanakkale",
  "Çankırı",
  "Çorum",
  "Denizli",
  "Diyarbakır",
  "Düzce",
  "Edirne",
  "Elazığ",
  "Erzincan",
  "Erzurum",
  "Eskişehir",
  "Gaziantep",
  "Giresun",
  "Gümüşhane",
  "Hakkâri",
  "Hatay",
  "Iğdır",
  "Isparta",
  "Kahramanmaraş",
  "Karabük",
  "Karaman",
  "Kars",
  "Kastamonu",
  "Kayseri",
  "Kırıkkale",
  "Kırklareli",
  "Kırşehir",
  "Kocaeli",
  "Konya",
  "Kütahya",
  "Malatya",
  "Manisa",
  "Mardin",
  "Mersin",
  "Muğla",
  "Muş",
  "Nevşehir",
  "Niğde",
  "Ordu",
  "Osmaniye",
  "Rize",
  "Sakarya",
  "Samsun",
  "Siirt",
  "Sinop",
  "Sivas",
  "Şanlıurfa",
  "Şırnak",
  "Tekirdağ",
  "Tokat",
  "Trabzon",
  "Tunceli",
  "Uşak",
  "Van",
  "Yalova",
  "Yozgat",
  "Zonguldak",
];

type Props = {
  initial: {
    instruments: string[];
    levels: string[];
    formats: string[];
    city: string;
    languages: string[];
    price: string;
    statement: string;
    bio: string;
    links: string[];
    years: string;
    students: string;
  };
};

export function TeacherProfileEditor({ initial }: Props) {
  const [locked, setLocked] = useState(true);
  const [instruments, setInstruments] = useState<string[]>(initial.instruments);
  const [levels, setLevels] = useState<string[]>(initial.levels);
  const [formats, setFormats] = useState<string[]>(initial.formats);
  const [city, setCity] = useState<string>(initial.city);
  const [languages, setLanguages] = useState<string[]>(initial.languages);
  const [price, setPrice] = useState<string>(initial.price);
  const [statement, setStatement] = useState<string>(initial.statement);
  const [bio, setBio] = useState<string>(initial.bio);
  const [links, setLinks] = useState<string[]>(initial.links.length ? initial.links : [""]);
  const [years, setYears] = useState<string>(initial.years);
  const [students, setStudents] = useState<string>(initial.students);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedCount = useMemo(() => instruments.length, [instruments.length]);

  const toggleValue = (value: string, list: string[], setList: (next: string[]) => void, max?: number) => {
    if (locked) return;
    const exists = list.includes(value);
    if (exists) {
      setList(list.filter((v) => v !== value));
      return;
    }
    if (max && list.length >= max) return;
    setList([...list, value]);
  };

  const handleSave = async () => {
    if (locked) return;
    setStatus(null);
    setSaving(true);
    const cleanLinks = links.map((l) => l.trim()).filter(Boolean);
    try {
      const res = await fetch("/api/teacher-panel/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruments,
          levels,
          formats,
          city: city.trim(),
          languages,
          price: price.trim(),
          statement: statement.trim(),
          bio: bio.trim(),
          links: cleanLinks,
          years: years.trim(),
          students: students.trim(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(json.error || "Kaydedilemedi.");
        setSaving(false);
        return;
      }
      setStatus("Bilgiler güncellendi.");
    } catch (err) {
      console.error(err);
      setStatus("Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-muted)]">
          {locked ? "Düzenleme kilitli. Değişiklik yapmak için kilidi aç." : "Düzenleme açık."}
        </p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setLocked((prev) => !prev)}
          aria-pressed={!locked}
        >
          {locked ? (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Kilidi aç
            </>
          ) : (
            <>
              <Unlock className="mr-2 h-4 w-4" />
              Kilitle
            </>
          )}
        </Button>
      </div>

      <Card className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[var(--color-primary)]">Öğretim bilgileri</p>
          <Badge variant="outline">{selectedCount} / 10 alan</Badge>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--color-muted)]">Alanlar</p>
          <div className="flex flex-wrap gap-2">
            {instrumentOptions.map((item) => {
              const active = instruments.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleValue(item, instruments, setInstruments, 10)}
                  aria-pressed={active}
                  disabled={locked}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    active
                      ? "bg-[var(--color-accent)] text-white"
                      : "border border-[var(--color-border)] text-[var(--color-primary)]"
                  } ${locked ? "opacity-60" : ""}`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[var(--color-muted)]">Seviyeler</p>
            <div className="flex flex-wrap gap-2">
              {levelOptions.map((item) => {
                const active = levels.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleValue(item, levels, setLevels)}
                    aria-pressed={active}
                    disabled={locked}
                    className={`rounded-full px-3 py-1 text-xs transition ${
                      active
                        ? "bg-[var(--color-accent)] text-white"
                        : "border border-[var(--color-border)] text-[var(--color-primary)]"
                    } ${locked ? "opacity-60" : ""}`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[var(--color-muted)]">Format</p>
            <div className="flex flex-wrap gap-2">
              {formatOptions.map((item) => {
                const active = formats.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleValue(item, formats, setFormats)}
                    aria-pressed={active}
                    disabled={locked}
                    className={`rounded-full px-3 py-1 text-xs transition ${
                      active
                        ? "bg-[var(--color-accent)] text-white"
                        : "border border-[var(--color-border)] text-[var(--color-primary)]"
                    } ${locked ? "opacity-60" : ""}`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[var(--color-muted)]">Şehir</p>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={locked}
              className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
            >
              <option value="">Seçiniz</option>
              {cityOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[var(--color-muted)]">Ders dili</p>
            <div className="flex flex-wrap gap-2">
              {languageOptions.map((item) => {
                const active = languages.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleValue(item, languages, setLanguages)}
                    aria-pressed={active}
                    disabled={locked}
                    className={`rounded-full px-3 py-1 text-xs transition ${
                      active
                        ? "bg-[var(--color-accent)] text-white"
                        : "border border-[var(--color-border)] text-[var(--color-primary)]"
                    } ${locked ? "opacity-60" : ""}`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[var(--color-muted)]">Ücret beklentisi</p>
            <select
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={locked}
              className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
            >
              <option value="">Seçiniz</option>
              {priceOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[var(--color-muted)]">Tecrübe (yıl)</p>
            <select
              value={years}
              onChange={(e) => setYears(e.target.value)}
              disabled={locked}
              className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
            >
              <option value="">Seçiniz</option>
              {yearOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[var(--color-muted)]">Öğrenci deneyimi</p>
            <select
              value={students}
              onChange={(e) => setStudents(e.target.value)}
              disabled={locked}
              className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
            >
              <option value="">Seçiniz</option>
              {studentOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className="space-y-3 p-6">
        <p className="text-sm font-semibold text-[var(--color-primary)]">Kısa açıklama</p>
        <textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          rows={4}
          maxLength={200}
          disabled={locked}
          className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-2 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          placeholder="Buraya yazdıklarınız /Hocalar sayfasındaki önizlemenizde gözükecektir. Kısaca yeteneklerinizden ve kendinizden bahsedin. Bu kısımda fiyatlandırmadan bahsetmeyin."
        />
        <p className="text-xs text-[var(--color-muted)]">{statement.trim().length} / 200</p>
      </Card>

      <Card className="space-y-3 p-6">
        <p className="text-sm font-semibold text-[var(--color-primary)]">Biyografi</p>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={6}
          maxLength={1500}
          disabled={locked}
          className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-2 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          placeholder="Burada kendinizden, portföyünüzden, iş ortamınızdan, ekipmanınızdan; uygun gördüğünüz tüm bilgilerden bahsedebilirsiniz. Ücretlendirmeyi kalite standartları açısından müşteri ile özelde konuşmanız ÖNERİLİR, ancak uygun görürseniz buraya da yazabilirsiniz."
        />
        <p className="text-xs text-[var(--color-muted)]">{bio.trim().length} / 1500</p>
      </Card>

      <Card className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[var(--color-primary)]">Bağlantılar</p>
        </div>
        <div className="space-y-2">
          {links.map((value, idx) => (
            <div key={`link-${idx}`} className="flex items-center gap-2">
              <input
                value={value}
                onChange={(e) =>
                  setLinks((prev) => prev.map((item, i) => (i === idx ? e.target.value : item)))
                }
                disabled={locked}
                className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                placeholder="https://"
              />
              {links.length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setLinks((prev) => prev.filter((_, i) => i !== idx))}
                  disabled={locked}
                >
                  Kaldır
                </Button>
              )}
            </div>
          ))}
          {links.length < 3 && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setLinks((prev) => [...prev, ""])}
              disabled={locked}
            >
              Yeni bağlantı ekle
            </Button>
          )}
          <p className="text-xs text-[var(--color-muted)]">
            Bağlantı eklemediysen tecrübe ve öğrenci deneyimi alanları zorunludur.
          </p>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {status ? <p className="text-sm text-[var(--color-muted)]">{status}</p> : <span />}
        <Button size="sm" onClick={handleSave} disabled={saving || locked}>
          {saving ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
        </Button>
      </div>
    </>
  );
}
