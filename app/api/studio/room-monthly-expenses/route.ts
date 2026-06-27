import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  roomId: z.string().min(1),
  monthKey: z.string().regex(/^\d{4}-\d{2}$/),
  items: z
    .array(
      z.object({
        label: z.string().max(120).optional().default(""),
        amount: z.union([z.number(), z.string(), z.null()]).optional(),
      }),
    )
    .max(100),
});

const parseAmount = (value: number | string | null | undefined) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const normalized = value.replace(/[^\d.,-]/g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const room = await prisma.room.findFirst({
    where: {
      id: parsed.data.roomId,
      studio: {
        ownerEmail: { equals: email, mode: "insensitive" },
      },
    },
    select: { id: true, extrasJson: true },
  });

  if (!room) {
    return NextResponse.json({ error: "Oda bulunamadı" }, { status: 404 });
  }

  const items = parsed.data.items
    .map((item) => ({
      label: item.label.trim(),
      amount: parseAmount(item.amount),
    }))
    .filter((item) => item.label.length > 0 || item.amount > 0);

  const currentExtras =
    room.extrasJson && typeof room.extrasJson === "object" && !Array.isArray(room.extrasJson)
      ? (room.extrasJson as Record<string, unknown>)
      : {};
  const currentMonthlyExpenses =
    currentExtras.monthlyExpenses &&
    typeof currentExtras.monthlyExpenses === "object" &&
    !Array.isArray(currentExtras.monthlyExpenses)
      ? ({ ...(currentExtras.monthlyExpenses as Record<string, unknown>) } as Record<string, unknown>)
      : {};

  if (items.length === 0) {
    delete currentMonthlyExpenses[parsed.data.monthKey];
  } else {
    currentMonthlyExpenses[parsed.data.monthKey] = items;
  }

  const nextExtras = {
    ...currentExtras,
    monthlyExpenses: currentMonthlyExpenses,
  };

  const saved = await prisma.room.update({
    where: { id: parsed.data.roomId },
    data: {
      extrasJson: nextExtras,
    },
    select: {
      extrasJson: true,
    },
  });

  const savedExtras =
    saved.extrasJson && typeof saved.extrasJson === "object" && !Array.isArray(saved.extrasJson)
      ? (saved.extrasJson as Record<string, unknown>)
      : {};
  const savedMonthlyExpenses =
    savedExtras.monthlyExpenses &&
    typeof savedExtras.monthlyExpenses === "object" &&
    !Array.isArray(savedExtras.monthlyExpenses)
      ? (savedExtras.monthlyExpenses as Record<string, unknown>)
      : {};

  return NextResponse.json({
    ok: true,
    items: Array.isArray(savedMonthlyExpenses[parsed.data.monthKey])
      ? (savedMonthlyExpenses[parsed.data.monthKey] as unknown[])
      : [],
  });
}
