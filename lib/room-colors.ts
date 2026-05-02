export const ROOM_COLOR_OPTIONS = [
  { id: "tomato", label: "Domates", hex: "#dc2127", googleColorId: "11", legacyHexes: ["#D50000"] },
  { id: "tangerine", label: "Mandalina", hex: "#ffb878", googleColorId: "6", legacyHexes: ["#F4511E"] },
  { id: "banana", label: "Muz", hex: "#fbd75b", googleColorId: "5", legacyHexes: ["#F6BF26"] },
  { id: "basil", label: "Fesleğen", hex: "#51b749", googleColorId: "10", legacyHexes: ["#0B8043"] },
  { id: "sage", label: "Ada çayı", hex: "#7ae7bf", googleColorId: "2", legacyHexes: ["#33B679"] },
  { id: "turquoise", label: "Turkuaz", hex: "#46d6db", googleColorId: "7", legacyHexes: ["#039BE5"] },
  { id: "blueberry", label: "Yaban mersini", hex: "#5484ed", googleColorId: "9", legacyHexes: ["#3F51B5"] },
  { id: "lavender", label: "Lavanta", hex: "#a4bdfc", googleColorId: "1", legacyHexes: ["#7986CB"] },
  { id: "grape", label: "Üzüm", hex: "#dbadff", googleColorId: "3", legacyHexes: ["#8E24AA"] },
  { id: "flamingo", label: "Flamingo", hex: "#ff887c", googleColorId: "4", legacyHexes: ["#E67C73"] },
  { id: "graphite", label: "Grafit", hex: "#e1e1e1", googleColorId: "8", legacyHexes: ["#616161"] },
] as const;

export const ROOM_COLOR_HEXES = ROOM_COLOR_OPTIONS.map((color) => color.hex);

export const DEFAULT_ROOM_COLOR = ROOM_COLOR_OPTIONS[0].hex;

const normalizeHex = (value?: string | null) => value?.trim().toLowerCase() ?? "";

export const findRoomColorOption = (value?: string | null) => {
  const normalized = normalizeHex(value);
  if (!normalized) return ROOM_COLOR_OPTIONS[0];
  return (
    ROOM_COLOR_OPTIONS.find(
      (color) =>
        color.hex.toLowerCase() === normalized ||
        color.legacyHexes.some((legacyHex) => legacyHex.toLowerCase() === normalized),
    ) ?? ROOM_COLOR_OPTIONS[0]
  );
};

export const normalizeRoomColor = (value?: string | null) => findRoomColorOption(value).hex;

export const normalizeRoomColorHex = (value?: string | null) => normalizeRoomColor(value).toLowerCase();

export const getRoomColorTextColor = (value?: string | null) => {
  const hex = normalizeRoomColor(value).replace("#", "");
  const expanded =
    hex.length === 3
      ? hex
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : hex;
  const r = Number.parseInt(expanded.slice(0, 2), 16);
  const g = Number.parseInt(expanded.slice(2, 4), 16);
  const b = Number.parseInt(expanded.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 160 ? "#111827" : "#ffffff";
};

export const getGoogleCalendarColorId = (hex?: string | null) => {
  return findRoomColorOption(hex).googleColorId;
};
