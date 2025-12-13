import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SlotStatus } from "@prisma/client";

type Body = {
  roomId: string;
  date: string; // yyyy-mm-dd
  timeLabel: string;
  status?: "empty" | "confirmed";
  name?: string;
};

const statusToDb = (s?: "empty" | "confirmed") =>
  s === "confirmed" ? SlotStatus.CONFIRMED : SlotStatus.EMPTY;

const normalizeDateKey = (key: string) => new Date(`${key}T00:00:00.000Z`);

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { roomId, date, timeLabel, status, name } = body;
  if (!roomId || !date || !timeLabel) {
    return NextResponse.json(
      { error: "roomId, date and timeLabel are required" },
      { status: 400 },
    );
  }

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { id: true, studio: { select: { ownerEmail: true } } },
  });

  if (!room || room.studio.ownerEmail !== session.user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dateObj = normalizeDateKey(date);

  const existing = await prisma.slot.findFirst({
    where: { roomId, date: dateObj, timeLabel },
  });

  const slot =
    existing &&
    (await prisma.slot.update({
      where: { id: existing.id },
      data: {
        status: statusToDb(status),
        customerName: name ?? null,
      },
    }));

  const created =
    !existing &&
    (await prisma.slot.create({
      data: {
        roomId,
        date: dateObj,
        timeLabel,
        status: statusToDb(status),
        customerName: name ?? null,
      },
    }));

  const finalSlot = slot || created;

  return NextResponse.json({
    ok: true,
    slot: finalSlot && {
      id: finalSlot.id,
      timeLabel: finalSlot.timeLabel,
      status: finalSlot.status === "CONFIRMED" ? "confirmed" : "empty",
      name: finalSlot.customerName ?? undefined,
      date,
    },
  });
}
