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
  // Drum kit detayları (davul kabini)
  hasDrumKick?: boolean;
  drumKickDetail?: string;
  hasDrumSnare?: boolean;
  drumSnareDetail?: string;
  hasDrumToms?: boolean;
  drumTomsDetail?: string;
  hasDrumFloorTom?: boolean;
  drumFloorTomDetail?: string;
  hasDrumHihat?: boolean;
  drumHihatDetail?: string;
  hasDrumRide?: boolean;
  drumRideDetail?: string;
  hasDrumCrash1?: boolean;
  drumCrash1Detail?: string;
  hasDrumCrash2?: boolean;
  drumCrash2Detail?: string;
  hasDrumCrash3?: boolean;
  drumCrash3Detail?: string;
  hasDrumCrash4?: boolean;
  drumCrash4Detail?: string;
  hasDrumChina?: boolean;
  drumChinaDetail?: string;
  hasDrumSplash?: boolean;
  drumSplashDetail?: string;
  hasTwinPedal?: boolean;
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
  dawList?: string[]; // kayıt kabini
  recordingEngineerIncluded?: boolean; // kayıt kabini
  providesLiveAutotune?: boolean; // vokal
  rawTrackIncluded?: boolean; // vokal
  editServiceLevel?: "none" | "included" | "extra";
  mixServiceLevel?: "none" | "included" | "extra";
  productionServiceLevel?: "none" | "included" | "extra";
};

export type Extras = {
  offersMixMaster: boolean;
  engineerPortfolioUrl?: string;
  offersProduction: boolean;
  productionAreas: string[];
  offersOther: boolean;
  otherDetail?: string;
  acceptsCourses?: boolean; // for drum/vokal inline toggle
  vocalHasEngineer?: boolean;
  vocalLiveAutotune?: boolean;
  vocalRawIncluded?: boolean;
  vocalEditService?: "none" | "included" | "extra";
  vocalMixService?: "none" | "included" | "extra";
  vocalProductionService?: "none" | "included" | "extra";
  drumProRecording?: "none" | "included" | "extra";
  drumVideo?: "none" | "included" | "extra";
  drumProduction?: "none" | "extra";
  drumMix?: "none" | "extra";
  practiceDescription?: string; // etüt
  recordingMixService?: "none" | "extra";
  recordingProduction?: "none" | "extra";
  recordingProductionAreas?: string[];
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
