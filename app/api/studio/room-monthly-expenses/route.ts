import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  monthKey: z.string().regex(/^\d{4}-\d{2}$/),
  type: z.enum(["expenses", "extraIncome"]),
  items: z
    .array(
      z.object({
        label: z.string().max(120).optional().default(""),
        amount: z.union([z.number(), z.string(), z.null()]).optional(),
      }),
    )
    .max(100),
});

const querySchema = z.object({
  monthKey: z.string().regex(/^\d{4}-\d{2}$/),
  type: z.enum(["expenses", "extraIncome"]),
});

const parseAmount = (value: number | string | null | undefined) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const normalized = value.replace(/[^\d.,-]/g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getFinanceHolderRoom = async (email: string) => {
  const studio = await prisma.studio.findFirst({
    where: {
      ownerEmail: { equals: email, mode: "insensitive" },
    },
    select: {
      id: true,
      rooms: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        take: 1,
        select: { id: true, extrasJson: true },
      },
    },
  });

  return studio?.rooms[0] ?? null;
};

const getSavedItems = (extrasJson: unknown, type: "expenses" | "extraIncome", monthKey: string) => {
  const extras =
    extrasJson && typeof extrasJson === "object" && !Array.isArray(extrasJson)
      ? (extrasJson as Record<string, unknown>)
      : {};
  const monthlyFinanceSource =
    type === "expenses" &&
    extras.monthlyStudioExpenses &&
    typeof extras.monthlyStudioExpenses === "object" &&
    !Array.isArray(extras.monthlyStudioExpenses)
      ? (extras.monthlyStudioExpenses as Record<string, unknown>)
      : type === "extraIncome" &&
          extras.monthlyStudioExtraIncome &&
          typeof extras.monthlyStudioExtraIncome === "object" &&
          !Array.isArray(extras.monthlyStudioExtraIncome)
        ? (extras.monthlyStudioExtraIncome as Record<string, unknown>)
      : {};

  return Array.isArray(monthlyFinanceSource[monthKey]) ? (monthlyFinanceSource[monthKey] as unknown[]) : [];
};

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    monthKey: url.searchParams.get("monthKey"),
    type: url.searchParams.get("type"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const room = await getFinanceHolderRoom(email);
  if (!room) {
    return NextResponse.json({ error: "Önce en az bir oda eklemelisiniz." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    items: getSavedItems(room.extrasJson, parsed.data.type, parsed.data.monthKey),
  });
}

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

  const room = await getFinanceHolderRoom(email);
  if (!room) {
    return NextResponse.json({ error: "Önce en az bir oda eklemelisiniz." }, { status: 404 });
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
    parsed.data.type === "expenses" &&
    currentExtras.monthlyStudioExpenses &&
    typeof currentExtras.monthlyStudioExpenses === "object" &&
    !Array.isArray(currentExtras.monthlyStudioExpenses)
      ? ({ ...(currentExtras.monthlyStudioExpenses as Record<string, unknown>) } as Record<string, unknown>)
      : parsed.data.type === "extraIncome" &&
          currentExtras.monthlyStudioExtraIncome &&
          typeof currentExtras.monthlyStudioExtraIncome === "object" &&
          !Array.isArray(currentExtras.monthlyStudioExtraIncome)
        ? ({ ...(currentExtras.monthlyStudioExtraIncome as Record<string, unknown>) } as Record<string, unknown>)
      : {};

  if (items.length === 0) {
    delete currentMonthlyExpenses[parsed.data.monthKey];
  } else {
    currentMonthlyExpenses[parsed.data.monthKey] = items;
  }

  const nextExtras = {
    ...currentExtras,
    ...(parsed.data.type === "expenses"
      ? { monthlyStudioExpenses: currentMonthlyExpenses }
      : { monthlyStudioExtraIncome: currentMonthlyExpenses }),
  } as Prisma.InputJsonValue;

  const saved = await prisma.room.update({
    where: { id: room.id },
    data: {
      extrasJson: nextExtras,
    },
    select: {
      extrasJson: true,
    },
  });

  return NextResponse.json({
    ok: true,
    items: getSavedItems(saved.extrasJson, parsed.data.type, parsed.data.monthKey),
  });
}
