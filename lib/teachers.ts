import { getTeachersMock, type Teacher, type LessonType } from "@/data/teachers";
import { slugify } from "./geo";

export type TeacherFilters = {
  city?: string;
  district?: string;
  instrument?: string;
  lessonType?: LessonType | "";
  level?: string;
  q?: string;
};

export function listTeachers(filters: TeacherFilters = {}, source?: Teacher[]): Teacher[] {
  const base = source ?? getTeachersMock();
  const citySlug = filters.city ? slugify(filters.city) : "";
  const districtSlug = (() => {
    if (!filters.district) return "";
    const raw = filters.district;
    const tail = raw.includes("-") ? raw.split("-").pop() || raw : raw;
    return slugify(tail);
  })();
  const instrument = filters.instrument?.toLowerCase().trim() || "";
  const lessonType = filters.lessonType || "";
  const level = filters.level?.toLowerCase().trim() || "";
  const q = filters.q?.toLowerCase().trim() || "";

  return base.filter((t) => {
    if (citySlug && slugify(t.city) !== citySlug) return false;
    if (districtSlug) {
      const tDistrictSlug = t.district ? slugify(t.district) : "";
      if (!tDistrictSlug || tDistrictSlug !== districtSlug) return false;
    }
    if (instrument && !t.instruments.some((i) => i.toLowerCase().includes(instrument))) return false;
    if (lessonType && !t.lessonTypes.includes(lessonType as LessonType)) return false;
    if (level && !t.level.toLowerCase().includes(level)) return false;
    if (q) {
      const haystack = `${t.displayName} ${t.bio} ${t.instruments.join(" ")} ${t.genres.join(" ")}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function getTeacherBySlug(slug: string, source?: Teacher[]): Teacher | undefined {
  const base = source ?? getTeachersMock();
  return base.find((t) => t.slug === slug);
}

export function teacherFilterOptions(source?: Teacher[]) {
  const teachers = source ?? getTeachersMock();
  const extraInstruments = [
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
    "Bağlama (kısa / uzun sap)",
    "Cura",
    "Divan sazı",
    "Ud",
    "Kanun",
    "Ney",
    "Kabak kemane",
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
  const instruments = Array.from(
    new Set([...teachers.flatMap((t) => t.instruments), ...extraInstruments]),
  ).sort((a, b) => a.localeCompare(b, "tr"));
  const levels = Array.from(new Set(teachers.map((t) => t.level))).sort((a, b) =>
    a.localeCompare(b, "tr"),
  );
  return { instruments, levels };
}

export type TeacherLeadPayload = {
  teacherSlug: string;
  studentName: string;
  studentEmail: string;
  city: string;
  preferredLessonType?: LessonType;
  message: string;
};
