import { SlotStatus, Studio } from "@/types/panel";

const today = new Date();
const pad = (n: number) => n.toString().padStart(2, "0");
const dateKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const createSlots = (
  startHour: number,
  endHour: number,
  status: SlotStatus = "empty",
) => {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    slots.push({
      timeLabel: `${pad(h)}:00 - ${pad(h + 1)}:00`,
      status,
    });
  }
  return slots;
};

const todayKey = dateKey(today);
const tomorrowKey = dateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));

export const mockStudio: Studio = {
  name: "Stüdyom Demo",
  city: "İstanbul",
  district: "Kadıköy",
  address: "Bahariye Caddesi 12/3",
  owner: "Demo Stüdyo",
  phone: "+90 555 000 0000",
  email: "demo@studyom.net",
  openingHours: [
    { open: true, openTime: "09:00", closeTime: "21:00" }, // Pzt
    { open: true, openTime: "09:00", closeTime: "21:00" }, // Sal
    { open: true, openTime: "09:00", closeTime: "21:00" }, // Çar
    { open: true, openTime: "10:00", closeTime: "22:00" }, // Per
    { open: true, openTime: "10:00", closeTime: "22:00" }, // Cum
    { open: true, openTime: "11:00", closeTime: "20:00" }, // Cmt
    { open: false, openTime: "00:00", closeTime: "00:00" }, // Paz
  ],
  notifications: [
    "Yeni rezervasyon talebi (demo)",
    "Ekipman listesi güncellendi (demo)",
    "Bu akşam 19:00 slotu onaylandı",
  ],
  ratings: [4.5, 3.8, 4.2, 4.9],
  calendarNote: "Saat 18:00 sonrası gürültü kısıtlaması var.",
  rooms: [
    {
      id: "room-1",
      name: "Oda 1",
      type: "Prova odası",
      color: "#6C63FF",
      pricing: { model: "flat", flatRate: "400" },
      equipment: {
        hasDrum: true,
        drumDetail: "Mapex Saturn",
        micCount: 4,
        micDetails: ["SM58 x2", "e935", "SM57"],
        guitarAmpCount: 2,
        guitarAmpDetails: ["Fender Hot Rod", "Marshall DSL"],
        hasBassAmp: true,
        bassDetail: "Ampeg BA-115",
        hasDiBox: true,
        diDetail: "Radial ProDI",
        hasPedal: false,
        pedalDetail: "",
        hasKeyboard: true,
        keyboardDetail: "Roland FP-30",
        hasKeyboardStand: true,
        hasGuitarsForUse: true,
        guitarUseDetail: "Telecaster (takım)",
      },
      features: {
        micCount: 4,
        micDetails: ["Dinamik ve kondansatör karışık"],
        musicianMicAllowed: true,
        hasControlRoom: false,
        hasHeadphones: true,
        headphonesDetail: "2 kulaklık, dağıtıcı ile",
        hasTechSupport: true,
      },
      extras: {
        offersMixMaster: false,
        engineerPortfolioUrl: "",
        offersProduction: true,
        productionAreas: ["Demoya uygun prodüksiyon", "Tam şarkı prodüksiyonu (sıfırdan)"],
        offersOther: true,
        otherDetail: "Kayıt günü kampanyası: 3 saat al 1 saat hediye",
        acceptsCourses: false,
      },
      images: [],
      slots: {
        [todayKey]: createSlots(10, 22, "empty"),
        [tomorrowKey]: createSlots(11, 20, "empty"),
      },
    },
    {
      id: "room-2",
      name: "Davul Kabini",
      type: "Davul kabini",
      color: "#EF6C00",
      pricing: { model: "hourly", hourlyRate: "350" },
      equipment: {
        hasDrum: true,
        drumDetail: "Pearl Masters",
        micCount: 6,
        micDetails: ["Kick In/Out", "Snare Top/Bottom", "OH x2"],
        guitarAmpCount: 0,
        guitarAmpDetails: [],
        hasBassAmp: false,
        bassDetail: "",
        hasDiBox: true,
        diDetail: "Radial J48",
        hasPedal: true,
        pedalDetail: "DW 5000 çift pedal",
        hasKeyboard: false,
        keyboardDetail: "",
        hasKeyboardStand: false,
        hasGuitarsForUse: false,
        guitarUseDetail: "",
      },
      features: {
        micCount: 6,
        micDetails: ["Kick/snare/overhead set"],
        musicianMicAllowed: true,
        hasControlRoom: true,
        hasHeadphones: true,
        headphonesDetail: "3 kulaklık, kişisel seviye kontrol",
        hasTechSupport: true,
      },
      extras: {
        offersMixMaster: true,
        engineerPortfolioUrl: "https://open.spotify.com/playlist/demo",
        offersProduction: false,
        productionAreas: [],
        offersOther: false,
        otherDetail: "",
        acceptsCourses: true,
      },
      images: [],
      slots: {
        [todayKey]: [
          ...createSlots(11, 18, "empty"),
          { timeLabel: "18:00 - 19:00", status: "confirmed" },
          { timeLabel: "19:00 - 20:00", status: "confirmed" },
          { timeLabel: "20:00 - 21:00", status: "empty" },
        ],
      },
    },
  ],
};
