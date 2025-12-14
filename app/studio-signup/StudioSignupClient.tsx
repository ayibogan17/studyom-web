"use client";

import { cityDistricts } from "@/data/cityDistricts";
import { signIn } from "next-auth/react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useMapEvents } from "react-leaflet";
import type { LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";

import type {
  MapContainerProps,
  TileLayerProps,
  CircleMarkerProps,
} from "react-leaflet";

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false },
) as unknown as ComponentType<MapContainerProps>;
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  {
    ssr: false,
  },
) as unknown as ComponentType<TileLayerProps>;
const CircleMarker = dynamic(
  () => import("react-leaflet").then((m) => m.CircleMarker),
  { ssr: false },
) as unknown as ComponentType<CircleMarkerProps>;

type RawQuarter = { name?: string };
type RawDistrict = { name?: string; quarters?: RawQuarter[] };
type RawTown = { name?: string; districts?: RawDistrict[] };
type RawProvince = { name?: string; towns?: RawTown[] };

type LocationIndex = Record<string, Record<string, string[]>>;

type Coords = { lat: number; lng: number };

type FormState = {
  signupMethod: "email" | "google";
  ownerName: string;
  studioName: string;
  city: string;
  district: string;
  address: string;
  neighborhood: string;
  googleMapsUrl: string;
  email: string;
  password: string;
  passwordConfirm: string;
  website: string;
  verificationNote: string;
};

const initialState: FormState = {
  signupMethod: "email",
  ownerName: "",
  studioName: "",
  city: "",
  district: "",
  address: "",
  neighborhood: "",
  googleMapsUrl: "",
  email: "",
  password: "",
  passwordConfirm: "",
  website: "",
  verificationNote: "",
};

const buildLocationIndex = (raw: RawProvince[]): LocationIndex => {
  const map: LocationIndex = {};
  raw?.forEach((city) => {
    const cityName = city?.name?.trim();
    if (!cityName) return;
    const districtMap: Record<string, string[]> = {};
    (city.towns ?? []).forEach((town) => {
      const districtName = town?.name?.trim();
      if (!districtName) return;
      const neighborhoods = new Set<string>();
      (town.districts ?? []).forEach((d) => {
        (d.quarters ?? []).forEach((q) => {
          const qName = q?.name?.trim();
          if (qName) neighborhoods.add(qName);
        });
      });
      districtMap[districtName] = Array.from(neighborhoods).sort();
    });
    if (Object.keys(districtMap).length) {
      map[cityName] = districtMap;
    }
  });
  return map;
};

export default function StudioSignupClient() {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [locStatus, setLocStatus] = useState<string | null>(null);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [locationIndex, setLocationIndex] = useState<LocationIndex>({});

  useEffect(() => {
    let active = true;
    import("@/data/mahalleler.json")
      .then((mod) => {
        if (!active) return;
        const raw = (mod as { default?: RawProvince[] }).default ?? (mod as RawProvince[]);
        if (raw) {
          setLocationIndex(buildLocationIndex(raw));
        }
      })
      .catch((e) => {
        console.error("Mahalle verisi yüklenemedi", e);
      });
    return () => {
      active = false;
    };
  }, []);

  const cities = useMemo(() => {
    const priority = ["İstanbul", "İzmir", "Ankara", "Izmir"];
    const rank = (city: string) => {
      const idx = priority.findIndex((p) => p.toLowerCase() === city.toLowerCase());
      return idx === -1 ? priority.length : idx;
    };
    const sortWithPriority = (list: string[]) =>
      [...list].sort((a, b) => {
        const ra = rank(a);
        const rb = rank(b);
        if (ra !== rb) return ra - rb;
        return a.localeCompare(b, "tr");
      });

    const fromJson = Object.keys(locationIndex);
    if (fromJson.length) {
      return sortWithPriority(fromJson);
    }
    return sortWithPriority(Object.keys(cityDistricts));
  }, [locationIndex]);

  const districts = useMemo(() => {
    if (form.city && locationIndex[form.city]) {
      return Object.keys(locationIndex[form.city]).sort();
    }
    if (!form.city) return [];
    return cityDistricts[form.city] ?? [];
  }, [form.city, locationIndex]);

  const neighborhoods = useMemo(() => {
    if (form.city && form.district && locationIndex[form.city]?.[form.district]) {
      return locationIndex[form.city][form.district];
    }
    return [];
  }, [form.city, form.district, locationIndex]);

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      // İlçe ve mahalle seçimini şehir değişince sıfırla
      ...(key === "city" ? { district: "", neighborhood: "" } : {}),
      ...(key === "district" ? { neighborhood: "" } : {}),
    }));
    if (["city", "district", "neighborhood", "address", "googleMapsUrl"].includes(key)) {
      setPin(null);
      setLocStatus(null);
    }
  };

  const canSubmit =
    form.ownerName.trim() &&
    form.studioName.trim() &&
    form.city &&
    form.district &&
    form.address.trim() &&
    form.googleMapsUrl.trim() &&
    (neighborhoods.length === 0 || form.neighborhood.trim()) &&
    pin !== null &&
    (form.signupMethod === "google"
      ? true
      : form.email.trim() &&
        form.password.trim() &&
        form.passwordConfirm.trim() &&
        form.password === form.passwordConfirm);

  const handleSubmit = async () => {
    if (!canSubmit) {
      setStatus("Lütfen zorunlu alanları doldurun ve haritada pin oluşturun.");
      return;
    }
    setSubmitting(true);
    if (form.signupMethod === "email") {
      setStatus("Doğrulama e-postası gönderiliyor...");
      try {
        const res = await fetch("/api/signup/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email.trim(),
            name: form.ownerName.trim(),
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok) {
          setStatus("Doğrulama maili gönderildi. Gelen kutunuzu kontrol edin.");
        } else {
          setStatus(json.error || "Doğrulama maili gönderilemedi.");
        }
      } catch (e) {
        console.error(e);
        setStatus("Doğrulama maili gönderilemedi.");
      } finally {
        setSubmitting(false);
      }
    } else {
      setStatus("Bilgiler kaydedildi. Google doğrulaması tamamlandı.");
      setSubmitting(false);
    }
  };

  const parseGoogleMapsUrl = (url: string): Coords | null => {
    const val = url.trim();
    if (!val) return null;
    const lower = val.toLowerCase();
    if (!lower.includes("google") && !lower.includes("goo.gl") && !lower.includes("maps")) {
      return null;
    }
    // @lat,long
    const atMatch = val.match(/@([+-]?\d+\.\d+),\s*([+-]?\d+\.\d+)/);
    if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    // q=lat,long
    const qMatch = val.match(/[?&]q=([+-]?\d+\.\d+),\s*([+-]?\d+\.\d+)/);
    if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
    // !3dLAT!4dLON
    const dMatch = val.match(/!3d([+-]?\d+\.\d+)!4d([+-]?\d+\.\d+)/);
    if (dMatch) return { lat: parseFloat(dMatch[1]), lng: parseFloat(dMatch[2]) };
    // Generic lat,long pattern
    const generic = val.match(/([+-]?\d+\.\d+)[ ,]+([+-]?\d+\.\d+)/);
    if (generic) return { lat: parseFloat(generic[1]), lng: parseFloat(generic[2]) };
    return null;
  };

  const resolveShortMapsLink = async (url: string): Promise<Coords | null> => {
    try {
      const res = await fetch(`/api/maps/resolve?url=${encodeURIComponent(url)}`);
      if (!res.ok) return null;
      const json = (await res.json()) as { lat?: number; lng?: number };
      if (typeof json.lat === "number" && typeof json.lng === "number") {
        return { lat: json.lat, lng: json.lng };
      }
      return null;
    } catch (e) {
      console.error("Short link resolve failed", e);
      return null;
    }
  };

  const MapClickHandler = ({ onSelect }: { onSelect: (c: Coords) => void }) => {
    useMapEvents({
      click(e: LeafletMouseEvent) {
        onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
        setLocStatus("Pin haritada güncellendi (elle).");
      },
    });
    return null;
  };

  const geocodeAddress = async () => {
    if (!form.city || !form.district) {
      setLocStatus("İl ve ilçe seçin.");
      return;
    }
    const link = form.googleMapsUrl.trim();
    if (!link) {
      setLocStatus("Google Maps linki gerekli (Paylaş > Kopyala).");
      return;
    }

    setLocStatus("Google Maps linki okunuyor...");

    const parsed = parseGoogleMapsUrl(link);
    if (parsed) {
      setPin(parsed);
      setLocStatus("Google Maps linkinden konum alındı. Haritaya tıklayarak güncelleyebilirsin.");
      return;
    }

    const maybeShort = await resolveShortMapsLink(link);
    if (maybeShort) {
      setPin(maybeShort);
      setLocStatus("Google Maps kısa linkinden konum alındı. Haritaya tıklayarak güncelleyebilirsin.");
      return;
    }

    setPin(null);
    setLocStatus("Linkten koordinat çıkarılamadı. Paylaş > Kopyala linkini yapıştırmayı deneyin.");
  };

  return (
    <main className="min-h-screen bg-[#2C2C2C] text-white">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <section className="rounded-3xl border border-white/10 bg-[#262626] p-8 shadow-sm backdrop-blur">
          <header className="mb-6 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#2D9CDB]">
              Stüdyo Sahibi Üyelik
            </p>
            <h1 className="text-2xl font-bold text-white">Stüdyonu Studyom’a ekle</h1>
            <p className="text-sm text-gray-200">
              Bu form yalnızca stüdyo sahipleri içindir. Kullanıcı kayıt adımları farklıdır.
            </p>
          </header>

          {status && (
            <div className="mb-4 rounded-xl border border-[#2D9CDB]/30 bg-[#2D9CDB]/10 px-4 py-3 text-sm text-[#2D9CDB]">
              {status}
            </div>
          )}

          <div className="space-y-5">
            <div className="rounded-2xl border border-white/15 bg-black/25 p-4 shadow-sm">
              <p className="text-sm font-semibold text-white">Giriş yöntemi</p>
              <p className="text-xs text-gray-300">Aşağıdan birini seçerek devam edin.</p>
              <div className="mt-3 flex flex-col gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm hover:border-[#2D9CDB]/50 transition">
                  <input
                    type="radio"
                    name="signupMethod"
                    value="email"
                    checked={form.signupMethod === "email"}
                    onChange={(e) => update("signupMethod", e.target.value as "email")}
                  />
                  <span>E-posta ile üye ol</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm hover:border-[#2D9CDB]/50 transition">
                  <input
                    type="radio"
                    name="signupMethod"
                    value="google"
                    checked={form.signupMethod === "google"}
                    onChange={(e) => update("signupMethod", e.target.value as "google")}
                  />
                  <span>Google ile üye ol</span>
                </label>
              </div>
              {form.signupMethod === "google" ? (
                <div className="mt-3 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => signIn("google", { callbackUrl: "/studio-signup" })}
                    className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-black/40 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[#2D9CDB] hover:text-[#2D9CDB]"
                  >
                    Google ile doğrula
                  </button>
                  <p className="text-xs text-gray-300">
                    Google doğrulamasından sonra form ad soyad alanından devam eder.
                  </p>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <label className="block text-sm font-semibold text-white">
                    E-posta (kullanıcı adı)
                    <input
                      type="email"
                      className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:border-[#2D9CDB] focus:outline-none"
                      placeholder="ornek@mail.com"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                    />
                  </label>
                  <div className="grid gap-2">
                    <label className="block text-sm font-semibold text-white">
                      Şifre
                      <input
                        type="password"
                        className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:border-[#2D9CDB] focus:outline-none"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) => update("password", e.target.value)}
                      />
                    </label>
                    <label className="block text-sm font-semibold text-white">
                      Şifreyi doğrula
                      <input
                        type="password"
                        className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:border-[#2D9CDB] focus:outline-none"
                        placeholder="••••••••"
                        value={form.passwordConfirm}
                        onChange={(e) => update("passwordConfirm", e.target.value)}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            <label className="block text-sm font-semibold text-white">
              Ad Soyad
              <input
                type="text"
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:border-[#2D9CDB] focus:outline-none"
                placeholder="Adınızı ve soyadınızı yazın"
                value={form.ownerName}
                onChange={(e) => update("ownerName", e.target.value)}
              />
            </label>

            <label className="block text-sm font-semibold text-white">
              Stüdyo Adı
              <input
                type="text"
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:border-[#2D9CDB] focus:outline-none"
                placeholder="Örn: Blue Note Studio"
                value={form.studioName}
                onChange={(e) => update("studioName", e.target.value)}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-white">
                Şehir
                <select
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white focus:border-[#2D9CDB] focus:outline-none"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                >
                  <option value="">Şehir seçin</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold text-white">
                İlçe
                <select
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white focus:border-[#2D9CDB] focus:outline-none disabled:opacity-40"
                  value={form.district}
                  onChange={(e) => update("district", e.target.value)}
                  disabled={!form.city}
                >
                  <option value="">İlçe seçin</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-sm font-semibold text-white">
              Mahalle / Köy
              <select
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white focus:border-[#2D9CDB] focus:outline-none disabled:opacity-40"
                value={form.neighborhood}
                onChange={(e) => update("neighborhood", e.target.value)}
                disabled={!form.district || neighborhoods.length === 0}
              >
                <option value="">
                  {neighborhoods.length ? "Mahalle seçin" : "İlçe seçin"}
                </option>
                {neighborhoods.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-300">
                Kırsal adreslerde köy/mezra adı da mahalle olarak listelenir.
              </p>
            </label>

            <label className="block text-sm font-semibold text-white">
              Google Maps linki (kesin konum)
              <input
                type="url"
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:border-[#2D9CDB] focus:outline-none"
                placeholder="https://www.google.com/maps/place/.../@41.0,29.0,18z"
                value={form.googleMapsUrl}
                onChange={(e) => update("googleMapsUrl", e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-300">
                Paylaş &gt; Kopyala veya adres çubuğundan aldığınız linkte @41.xx,29.xx gibi koordinat olmalı.
                Haritada göster butonu önce bu linkten pini alır.
              </p>
            </label>

            <label className="block text-sm font-semibold text-white">
              Açık Adres
              <textarea
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-3 text-sm text-white placeholder:text-gray-400 focus:border-[#2D9CDB] focus:outline-none"
                rows={4}
                placeholder="Mahalle, cadde, bina ve numara bilgilerini eksiksiz yazın."
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-300">
                studyom.net&apos;te stüdyo konumunuzun doğru gözükmesi için adresinizi hatasız giriniz.
              </p>
            </label>

            <label className="block text-sm font-semibold text-white">
              Stüdyonuzun web sitesi (opsiyonel)
              <input
                type="url"
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:border-[#2D9CDB] focus:outline-none"
                placeholder="https://example.com"
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
              />
            </label>

            <label className="block text-sm font-semibold text-white">
              Stüdyonuzu onaylayabilmemiz için ek bilgi (opsiyonel)
              <textarea
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-3 text-sm text-white placeholder:text-gray-400 focus:border-[#2D9CDB] focus:outline-none"
                rows={3}
                placeholder="Doğrulama süreci için bize not bırakabilirsiniz."
                value={form.verificationNote}
                onChange={(e) => update("verificationNote", e.target.value)}
              />
            </label>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Haritada doğrula</p>
                  <p className="text-xs text-gray-300">
                    Linkten konum alırız; yanlışsa haritaya tıklayarak pini elle taşıyabilirsin.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={geocodeAddress}
                  className="rounded-xl border border-[#2D9CDB]/60 bg-[#2D9CDB]/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2D9CDB]/20"
                >
                  Haritada göster
                </button>
              </div>
              {locStatus && <p className="text-xs text-[#2D9CDB]">{locStatus}</p>}
              {pin && (
                <div className="overflow-hidden rounded-xl border border-white/10">
                  <MapContainer
                    center={[pin.lat, pin.lng]}
                    zoom={15}
                    scrollWheelZoom={false}
                    style={{ height: 260, width: "100%" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a> katkıcıları'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler onSelect={(c) => setPin(c)} />
                    <CircleMarker center={[pin.lat, pin.lng]} pathOptions={{ color: "#2D9CDB" }} radius={10} />
                  </MapContainer>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !canSubmit}
                className="w-full rounded-xl bg-[#2D9CDB] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Kaydediliyor..." : "Üyeliği Tamamla"}
              </button>
              <p className="mt-2 text-xs text-gray-300">
                Formunuz ekibimiz tarafından incelenip onaylanacaktır. Giriş yapmış olduğunuz mail
                üzerinden bilgi verilecektir. Onaylandıktan sonra giriş yapabilirsiniz.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
