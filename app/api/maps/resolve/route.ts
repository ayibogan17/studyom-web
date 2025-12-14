import { NextResponse } from "next/server";

const allowedHosts = [
  "maps.app.goo.gl",
  "goo.gl",
  "goo.gl/maps",
  "maps.google.com",
  "www.google.com",
  "maps.googleusercontent.com",
];

const parseCoords = (url: string) => {
  const d = url.match(/!3d([+-]?\d+\.\d+)!4d([+-]?\d+\.\d+)/);
  if (d) return { lat: parseFloat(d[1]), lng: parseFloat(d[2]) };
  const q = url.match(/[?&]q=([+-]?\d+\.\d+),\s*([+-]?\d+\.\d+)/);
  if (q) return { lat: parseFloat(q[1]), lng: parseFloat(q[2]) };
  const at = url.match(/@([+-]?\d+\.\d+),\s*([+-]?\d+\.\d+)/);
  if (at) return { lat: parseFloat(at[1]), lng: parseFloat(at[2]) };
  const generic = url.match(/([+-]?\d+\.\d+)[ ,]+([+-]?\d+\.\d+)/);
  if (generic) return { lat: parseFloat(generic[1]), lng: parseFloat(generic[2]) };
  return null;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get("url") || "";
  if (!target) {
    return NextResponse.json({ error: "url gerekli" }, { status: 400 });
  }

  try {
    const parsed = new URL(target);
    if (!allowedHosts.some((h) => parsed.hostname.includes(h))) {
      return NextResponse.json({ error: "Desteklenmeyen host" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Geçersiz url" }, { status: 400 });
  }

  try {
    const res = await fetch(target, {
      redirect: "follow",
      headers: {
        "User-Agent": "studyom-bot/1.0 (+https://studyom.net)",
        "Accept-Language": "tr,en;q=0.8",
      },
    });
    const finalUrl = res.url || target;
    const coords = parseCoords(finalUrl);
    if (!coords) {
      return NextResponse.json({ error: "Koordinat bulunamadı", finalUrl }, { status: 404 });
    }
    return NextResponse.json(coords);
  } catch (e) {
    console.error("Map resolve failed", e);
    return NextResponse.json({ error: "Çözülemedi" }, { status: 500 });
  }
}
