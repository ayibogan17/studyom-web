export type SlotStatus = "empty" | "confirmed";

export type Slot = {
  timeLabel: string;
  status: SlotStatus;
  name?: string;
};

export type OpeningHours = {
  open: boolean;
  openTime: string; // "HH:mm"
  closeTime: string; // "HH:mm"
};

export type Pricing = {
  model: "flat" | "daily" | "hourly" | "variable";
  flatRate?: string;
  minRate?: string;
  dailyRate?: string;
  hourlyRate?: string;
};

export type Equipment = {
  hasDrum: boolean;
  drumDetail?: string;
  micCount: number;
  micDetails: string[];
  guitarAmpCount: number;
  guitarAmpDetails: string[];
  hasBassAmp: boolean;
  bassDetail?: string;
  hasDiBox: boolean;
  diDetail?: string;
  hasPedal: boolean;
  pedalDetail?: string;
  hasKeyboard: boolean;
  keyboardDetail?: string;
  hasKeyboardStand: boolean;
  hasGuitarsForUse: boolean;
  guitarUseDetail?: string;
};

export type Features = {
  micCount: number;
  micDetails: string[];
  musicianMicAllowed: boolean;
  hasControlRoom: boolean;
  hasHeadphones: boolean;
  headphonesDetail?: string;
  hasTechSupport: boolean;
};

export type Extras = {
  offersMixMaster: boolean;
  engineerPortfolioUrl?: string;
  offersProduction: boolean;
  productionAreas: string[];
  offersOther: boolean;
  otherDetail?: string;
  acceptsCourses?: boolean; // for drum/vokal inline toggle
};

export type Room = {
  id: string;
  name: string;
  type:
    | "Prova odası"
    | "Vokal kabini"
    | "Kayıt kabini"
    | "Davul kabini"
    | "Etüt odası"
    | string;
  color: string; // hex
  order?: number;
  pricing: Pricing;
  equipment: Equipment;
  features: Features;
  extras: Extras;
  images: string[];
  slots: Record<string, Slot[]>; // key: yyyy-mm-dd
};

export type Studio = {
  id?: string;
  name: string;
  city?: string;
  district?: string;
  address?: string;
  owner?: string;
  phone?: string;
  email?: string;
  ownerEmail?: string;
  openingHours: OpeningHours[];
  rooms: Room[];
  notifications: string[];
  ratings: number[];
  calendarNote?: string;
};
