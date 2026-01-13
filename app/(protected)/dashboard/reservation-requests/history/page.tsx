import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import ReservationHistoryClient from "./history-client";

export const metadata = {
  title: "Rezervasyon Geçmişi | Studyom",
  description: "Onaylanan ve reddedilen rezervasyon istekleri.",
  robots: { index: false, follow: false },
};

type HistoryItem = {
  id: string;
  roomName: string;
  requesterName: string;
  requesterPhone: string;
  requesterEmail: string | null;
  requesterImage: string | null;
  requesterIsAnon: boolean;
  note: string | null;
  status: string;
  createdAt: string;
  startAt: string;
  hours: number;
  totalPrice: number | null;
};

export default async function ReservationHistoryPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) redirect("/login");

  const studio = await prisma.studio.findFirst({
    where: { ownerEmail: email },
    select: { id: true, name: true },
  });
  if (!studio) redirect("/studio/new");

  const history = await prisma.studioReservationRequest.findMany({
    where: {
      studioId: studio.id,
      status: { in: ["approved", "rejected"] },
    },
    include: {
      room: { select: { name: true } },
      studentUser: { select: { image: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });

  const items: HistoryItem[] = history.map((req) => ({
    id: req.id,
    roomName: req.room.name || "Oda",
    requesterName: req.requesterName,
    requesterPhone: req.requesterPhone,
    requesterEmail: req.requesterEmail ?? null,
    requesterImage: req.studentUser?.image ?? null,
    requesterIsAnon: !req.studentUserId,
    note: req.note ?? null,
    status: req.status,
    createdAt: req.createdAt.toISOString(),
    startAt: req.startAt.toISOString(),
    hours: req.hours,
    totalPrice: req.totalPrice ?? null,
  }));

  return <ReservationHistoryClient items={items} studioName={studio.name || "Stüdyo"} />;
}
