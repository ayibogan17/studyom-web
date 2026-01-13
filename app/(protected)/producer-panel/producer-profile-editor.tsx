"use client";

import { useMemo, useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { Card } from "@/components/design-system/components/ui/card";
import { Button } from "@/components/design-system/components/ui/button";
import { Badge } from "@/components/design-system/components/ui/badge";

const productionAreas = [
  "Davul yazımı",
  "Bas yazımı",
  "Gitar yazımı",
  "Telli enstrüman yazımı",
  "Üflemeli enstrüman yazımı",
  "Yaylı enstrüman yazımı",
  "Beat yapımı",
  "Aranje",
  "Müzik prodüksiyonu",
  "Mixing",
  "Mastering",
  "Sound design",
  "Beste & söz yazımı",
  "DJ edit / set hazırlama",
];

const workTypes = [
  "Şarkıya ekleme yapma (enstrüman, synth vs)",
  "Var olan projeye katkı",
  "Baştan sona prodüksiyon",
  "Revizyon / edit",
];

const workingModes = ["Online", "Kendi stüdyomda", "Müşteri stüdyosunda"];

const genreOptions = [
  "Rock",
  "Metal",
  "Pop",
  "Hip-hop / Rap",
  "Electronic",
  "Jazz",
  "Folk / Türk halk müziği",
  "Classical",
  "Experimental",
];

const priceOptions = ["Proje bazlı çalışırım", "Saatlik çalışırım", "İşe göre değişir"];
const projectOptions = ["1-5", "6-20", "20+"];
const yearsOptions = ["0-1", "2-4", "5-9", "10+"];

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
    areas: string[];
    workTypes: string[];
    modes: string[];
    city: string;
    genres: string[];
    price: string;
    years: string;
    projects: string;
    statement: string;
    bio: string;
  };
};

export function ProducerProfileEditor({ initial }: Props) {
  const [locked, setLocked] = useState(true);
  const [areas, setAreas] = useState<string[]>(initial.areas);
  const [workTypesState, setWorkTypesState] = useState<string[]>(initial.workTypes);
  const [modes, setModes] = useState<string[]>(initial.modes);
  const [city, setCity] = useState<string>(initial.city);
  const [genres, setGenres] = useState<string[]>(initial.genres);
  const [price, setPrice] = useState<string>(initial.price);
  const [years, setYears] = useState<string>(initial.years);
  const [projects, setProjects] = useState<string>(initial.projects);
  const [statement, setStatement] = useState<string>(initial.statement);
  const [bio, setBio] = useState<string>(initial.bio);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedCount = useMemo(() => areas.length, [areas.length]);
  const showCity = modes.some((mode) => mode !== "Online");

  const toggleValue = (
    value: string,
    list: string[],
    setList: (next: string[]) => void,
    max?: number,
  ) => {
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
    try {
      const res = await fetch("/api/producer-panel/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areas,
          workTypes: workTypesState,
          modes,
          city: showCity ? city.trim() : "",
          genres,
          price: price.trim(),
          years: years.trim(),
          projects: projects.trim(),
          statement: statement.trim(),
          bio: bio.trim(),
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
        <Button size="sm" variant="secondary" onClick={() => setLocked((prev) => !prev)} aria-pressed={!locked}>
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
          <p className="text-sm font-semibold text-[var(--color-primary)]">Üretim bilgileri</p>
          <Badge variant="outline">{selectedCount} / 10 alan</Badge>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--color-muted)]">Üretim alanları</p>
          <div className="flex flex-wrap gap-2">
            {productionAreas.map((item) => {
              const active = areas.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleValue(item, areas, setAreas, 10)}
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
            <p className="text-xs font-semibold text-[var(--color-muted)]">Çalışma tipi</p>
            <div className="flex flex-wrap gap-2">
              {workTypes.map((item) => {
                const active = workTypesState.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleValue(item, workTypesState, setWorkTypesState)}
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
            <p className="text-xs font-semibold text-[var(--color-muted)]">Çalışma modu</p>
            <div className="flex flex-wrap gap-2">
              {workingModes.map((item) => {
                const active = modes.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleValue(item, modes, setModes)}
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
          {showCity ? (
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
          ) : null}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[var(--color-muted)]">Türler</p>
            <div className="flex flex-wrap gap-2">
              {genreOptions.map((item) => {
                const active = genres.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleValue(item, genres, setGenres, 5)}
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
            <p className="text-xs font-semibold text-[var(--color-muted)]">Proje sayısı</p>
            <select
              value={projects}
              onChange={(e) => setProjects(e.target.value)}
              disabled={locked}
              className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
            >
              <option value="">Seçiniz</option>
              {projectOptions.map((item) => (
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
              {yearsOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className="space-y-3 p-6">
        <p className="text-sm font-semibold text-[var(--color-primary)]">Kısa Açıklama</p>
        <textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          rows={4}
          maxLength={200}
          disabled={locked}
          className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-2 text-sm text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          placeholder="Buraya yazdıklarınız /Üretim sayfasındaki önizlemenizde gözükecektir. Kısaca yeteneklerinizden ve kendinizden bahsedin. Bu kısımda fiyatlandırmadan bahsetmeyin."
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        {status ? <p className="text-sm text-[var(--color-muted)]">{status}</p> : <span />}
        <Button size="sm" onClick={handleSave} disabled={saving || locked}>
          {saving ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
        </Button>
      </div>
    </>
  );
}
