import { slugify } from "@/lib/geo";

export type LessonType = "online" | "in-person" | "both";

export type Teacher = {
  id: string;
  slug: string;
  displayName: string;
  city: string;
  district?: string;
  instruments: string[];
  genres: string[];
  level: string;
  lessonTypes: LessonType[];
  hourlyRateMin?: number | null;
  bio: string;
  portfolioUrls: string[];
  studiosUsed?: string[];
  isActive: boolean;
  updatedAt: string;
};

const teachers: Teacher[] = [
  {
    id: "t1",
    slug: "ayse-demir",
    displayName: "Ayşe Demir",
    city: "İstanbul",
    district: "Kadıköy",
    instruments: ["Vokal", "Piyano"],
    genres: ["Pop", "Caz"],
    level: "Orta/İleri",
    lessonTypes: ["online", "in-person"],
    hourlyRateMin: 900,
    bio: "Konservatuvar mezunu vokal ve piyano eğitmeni. Nefes, artikülasyon ve şarkı yorumu üzerine yoğunlaşır.",
    portfolioUrls: ["https://soundcloud.com/", "https://www.youtube.com/"],
    studiosUsed: ["Kadıköy - Moda", "Beşiktaş - Abbasağa"],
    isActive: true,
    updatedAt: "2024-12-15",
  },
  {
    id: "t2",
    slug: "mehmet-aksoy",
    displayName: "Mehmet Aksoy",
    city: "Ankara",
    district: "Çankaya",
    instruments: ["Elektrik Gitar"],
    genres: ["Rock", "Metal"],
    level: "Başlangıç/Orta",
    lessonTypes: ["online"],
    hourlyRateMin: 650,
    bio: "Ton, riff ve solo odaklı elektrik gitar dersleri. Ev stüdyosunda online kayıt ve pratik seansları sunar.",
    portfolioUrls: ["https://www.youtube.com/"],
    studiosUsed: ["Çankaya - Balgat"],
    isActive: true,
    updatedAt: "2025-01-05",
  },
  {
    id: "t3",
    slug: "elif-kaya",
    displayName: "Elif Kaya",
    city: "İzmir",
    district: "Konak",
    instruments: ["Keman"],
    genres: ["Klasik", "Film Müziği"],
    level: "Her seviye",
    lessonTypes: ["in-person", "online"],
    hourlyRateMin: 800,
    bio: "Orkestra deneyimli keman eğitmeni. Yay tekniği, vibrato ve repertuvar seçiminde destek olur.",
    portfolioUrls: ["https://www.instagram.com/"],
    studiosUsed: ["Bornova - Küçükpark"],
    isActive: true,
    updatedAt: "2024-11-20",
  },
  {
    id: "t4",
    slug: "burak-yalcin",
    displayName: "Burak Yalçın",
    city: "Bursa",
    district: "Nilüfer",
    instruments: ["Davul"],
    genres: ["Rock", "Funk", "Fusion"],
    level: "Orta/İleri",
    lessonTypes: ["in-person"],
    hourlyRateMin: null,
    bio: "Click ile çalışma, groove oturtma ve canlı performans hazırlığı üzerine odaklanır. Stüdyo prova eşliğinde dersler.",
    portfolioUrls: [],
    studiosUsed: ["Nilüfer - FSM"],
    isActive: true,
    updatedAt: "2024-10-02",
  },
  {
    id: "t5",
    slug: "selin-ozkan",
    displayName: "Selin Özkan",
    city: "İstanbul",
    district: "Şişli",
    instruments: ["Bas Gitar"],
    genres: ["R&B", "Jazz", "Pop"],
    level: "Her seviye",
    lessonTypes: ["both"],
    hourlyRateMin: 750,
    bio: "Groove, walking bass ve kulak geliştirme odaklı bas gitar dersleri. Teori ve pratik dengeli ilerler.",
    portfolioUrls: ["https://soundcloud.com/"],
    studiosUsed: ["Şişli - Bomonti"],
    isActive: true,
    updatedAt: "2024-12-01",
  },
  {
    id: "t6",
    slug: "cemre-arslan",
    displayName: "Cemre Arslan",
    city: "Antalya",
    district: "Muratpaşa",
    instruments: ["Akustik Gitar"],
    genres: ["Pop", "Folk"],
    level: "Başlangıç",
    lessonTypes: ["online"],
    hourlyRateMin: 500,
    bio: "Temel akorlar, ritim kalıpları ve şarkı eşlik üzerine başlangıç dersleri. Evde çalışma planı çıkarır.",
    portfolioUrls: [],
    studiosUsed: [],
    isActive: true,
    updatedAt: "2024-09-10",
  },
  {
    id: "t7",
    slug: "arda-simsek",
    displayName: "Arda Şimşek",
    city: "Eskişehir",
    district: "Tepebaşı",
    instruments: ["Prodüksiyon", "Piyano"],
    genres: ["Elektronik", "Lo-fi"],
    level: "Orta",
    lessonTypes: ["online", "in-person"],
    hourlyRateMin: 700,
    bio: "Ableton ile prodüksiyon, aranje ve miks temelleri. MIDI düzenleme ve sound design odaklı.",
    portfolioUrls: ["https://soundcloud.com/"],
    studiosUsed: ["Tepebaşı - merkez"],
    isActive: true,
    updatedAt: "2024-08-18",
  },
  {
    id: "t8",
    slug: "gokce-turan",
    displayName: "Gökçe Turan",
    city: "İstanbul",
    district: "Kadıköy",
    instruments: ["Vokal Koçluğu"],
    genres: ["Pop", "R&B"],
    level: "Her seviye",
    lessonTypes: ["both"],
    hourlyRateMin: 950,
    bio: "Ses sağlığı, rezonans, stil ve performans koçluğu. Kayıt öncesi hazırlık ve prova eşlikleri.",
    portfolioUrls: ["https://www.youtube.com/"],
    studiosUsed: ["Kadıköy - Rasimpaşa", "Şişli - Pangaltı"],
    isActive: true,
    updatedAt: "2025-01-02",
  },
].map((t) => ({
  ...t,
  slug: t.slug || slugify(t.displayName),
}));

export function getTeachersMock(): Teacher[] {
  return teachers.filter((t) => t.isActive);
}
