import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { mergeRoles, normalizeRoles, type RoleKey } from "@/lib/roles";

type AdminInfo = {
  id: string;
  email: string;
  roles: RoleKey[];
};

const adminSeedEmails = (process.env.ADMIN_SEED_EMAIL || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

async function promoteSeedAdmin(email: string) {
  if (adminSeedEmails.length === 0) return null;
  if (!adminSeedEmails.includes(email.toLowerCase())) return null;
  try {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        roles: true,
        isTeacher: true,
        isProducer: true,
        isStudioOwner: true,
        isDisabled: true,
        isSuspended: true,
        isBanned: true,
      },
    });
    if (!existing) return null;
    const nextRoles = mergeRoles(normalizeRoles(existing), ["admin"]);
    const updated = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN", roles: { set: nextRoles } },
      select: {
        id: true,
        email: true,
        role: true,
        roles: true,
        isTeacher: true,
        isProducer: true,
        isStudioOwner: true,
        isDisabled: true,
        isSuspended: true,
        isBanned: true,
      },
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
    select: {
      id: true,
      email: true,
      role: true,
      roles: true,
      isTeacher: true,
      isProducer: true,
      isStudioOwner: true,
      isDisabled: true,
      isSuspended: true,
      isBanned: true,
    },
  });

  const roles = normalizeRoles(user);
  const hasAdminRole = roles.includes("admin");

  if ((!user || !hasAdminRole) && adminSeedEmails.length > 0) {
    // Try bootstrap
    user = (await promoteSeedAdmin(email)) ?? user;
  }

  const nextRoles = normalizeRoles(user);
  if (!user || !nextRoles.includes("admin")) {
    redirect("/login?error=unauthorized");
  }

  if (user.isDisabled || user.isSuspended || user.isBanned) {
    redirect("/login?error=disabled");
  }

  return { id: user.id, email: user.email, roles: nextRoles };
}
