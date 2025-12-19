import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

type AdminInfo = {
  id: string;
  email: string;
  role: string;
};

const adminSeedEmails = (process.env.ADMIN_SEED_EMAIL || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

async function promoteSeedAdmin(email: string) {
  if (adminSeedEmails.length === 0) return null;
  if (!adminSeedEmails.includes(email.toLowerCase())) return null;
  try {
    const updated = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
      select: { id: true, email: true, role: true, isDisabled: true },
    });
    return updated;
  } catch (err) {
    console.error("Admin seed promote failed", err);
    return null;
  }
}

export async function requireAdmin(): Promise<AdminInfo> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    redirect("/login?error=unauthorized");
  }

  let user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, isDisabled: true },
  });

  if ((!user || user.role !== "ADMIN") && adminSeedEmails.length > 0) {
    // Try bootstrap
    user = (await promoteSeedAdmin(email)) ?? user;
  }

  if (!user || user.role !== "ADMIN") {
    redirect("/login?error=unauthorized");
  }

  if (user.isDisabled) {
    redirect("/login?error=disabled");
  }

  return { id: user.id, email: user.email, role: user.role };
}
