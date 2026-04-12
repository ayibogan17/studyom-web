export const ROOM_COLOR_OPTIONS = [
  { id: "tomato", label: "Domates", hex: "#D50000", googleColorId: "11" },
  { id: "tangerine", label: "Mandalina", hex: "#F4511E", googleColorId: "6" },
  { id: "banana", label: "Muz", hex: "#F6BF26", googleColorId: "5" },
  { id: "basil", label: "Fesleğen", hex: "#0B8043", googleColorId: "10" },
  { id: "sage", label: "Ada çayı", hex: "#33B679", googleColorId: "2" },
  { id: "turquoise", label: "Turkuaz", hex: "#039BE5", googleColorId: "7" },
  { id: "blueberry", label: "Yaban mersini", hex: "#3F51B5", googleColorId: "9" },
  { id: "lavender", label: "Lavanta", hex: "#7986CB", googleColorId: "1" },
  { id: "grape", label: "Üzüm", hex: "#8E24AA", googleColorId: "3" },
  { id: "flamingo", label: "Flamingo", hex: "#E67C73", googleColorId: "4" },
  { id: "graphite", label: "Grafit", hex: "#616161", googleColorId: "8" },
] as const;

export const ROOM_COLOR_HEXES = ROOM_COLOR_OPTIONS.map((color) => color.hex);

export const DEFAULT_ROOM_COLOR = ROOM_COLOR_OPTIONS[0].hex;

export const getGoogleCalendarColorId = (hex?: string | null) => {
  const normalized = hex?.trim().toLowerCase();
  return (
    ROOM_COLOR_OPTIONS.find((color) => color.hex.toLowerCase() === normalized)?.googleColorId ??
    ROOM_COLOR_OPTIONS[0].googleColorId
  );
};
