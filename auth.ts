import type { NextAuthOptions, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { prisma } from "./lib/prisma";

const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
const googleId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
const googleSecret =
  process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;

type ProfileUser = User & {
  role?: string;
  city?: string | null;
  intent?: string[];
  fullName?: string | null;
  emailVerified?: Date | string | null;
  image?: string | null;
  id?: string;
  teacherStatus?: "approved" | "pending" | "none";
  producerStatus?: "approved" | "pending" | "none";
  studioStatus?: "approved" | "pending" | "none";
};

type ProfileToken = JWT & {
  role?: string;
  city?: string | null;
  intent?: string[];
  fullName?: string | null;
  emailVerified?: Date | string | null;
  image?: string | null;
  profileComplete?: boolean;
  teacherStatus?: "approved" | "pending" | "none";
  teacherStatusUpdatedAt?: number;
  producerStatus?: "approved" | "pending" | "none";
  producerStatusUpdatedAt?: number;
  studioStatus?: "approved" | "pending" | "none";
  studioStatusUpdatedAt?: number;
};

type DevUser = Omit<ProfileUser, "email"> & { email: string; password: string };

const devUsers: DevUser[] = [
  {
    id: "dev-user",
    email: "user@dev.local",
    password: "user1234",
    name: "Demo Kullanıcı",
    role: "USER",
  },
  {
    id: "dev-studio",
    email: "studio@dev.local",
    password: "studio1234",
    name: "Demo Stüdyo Sahibi",
    role: "STUDIO",
  },
];

if (!authSecret) {
  console.warn("Missing AUTH_SECRET (or NEXTAUTH_SECRET) env.");
}

if (!googleId || !googleSecret) {
  console.warn("Missing Google OAuth env (AUTH_GOOGLE_ID/SECRET).");
}

const isProfileComplete = (u?: { city?: string | null; intent?: string[] }) =>
  Boolean(u?.city && (u.intent?.length ?? 0) > 0);
const mapTeacherStatus = (status?: string | null) => {
  if (status === "approved") return "approved" as const;
  if (status === "pending") return "pending" as const;
  return "none" as const;
};
const mapProducerStatus = (status?: string | null) => {
  if (status === "approved") return "approved" as const;
  if (status === "pending") return "pending" as const;
  return "none" as const;
};
const teacherStatusTtlMs = 60 * 1000;
const producerStatusTtlMs = 60 * 1000;
const studioStatusTtlMs = 60 * 1000;

const resendApiKey = process.env.RESEND_API_KEY;
const leadFrom = process.env.LEAD_FROM || "Studyom <noreply@studyom.net>";
const baseUrl =
  process.env.AUTH_URL ||
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL?.startsWith("http") ? process.env.VERCEL_URL : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: googleId || "",
      clientSecret: googleSecret || "",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().toLowerCase().trim() ?? "";
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

        // 1) DB kullanıcı kontrolü
        try {
          const dbUser = await prisma.user.findUnique({ where: { email } });
          if (dbUser?.passwordHash) {
            const ok = await bcrypt.compare(password, dbUser.passwordHash);
            if (ok) {
              if (dbUser.isDisabled) {
                throw new Error("ACCOUNT_DISABLED");
              }
              if (!dbUser.emailVerified) {
                throw new Error("EMAIL_NOT_VERIFIED");
              }
              const user: ProfileUser = {
                id: dbUser.id,
                email: dbUser.email,
                name: dbUser.fullName || dbUser.name || undefined,
                fullName: dbUser.fullName || dbUser.name || undefined,
                role: dbUser.role ?? "USER",
                city: dbUser.city,
                intent: dbUser.intent ?? [],
                emailVerified: dbUser.emailVerified,
              };
              return user;
            }
          }
        } catch (err) {
          console.error("DB auth lookup error", err);
        }

        // 2) Dev user fallback
        const match = devUsers.find(
          (u) => u.email.toLowerCase() === email && u.password === password,
        );
        if (!match) return null;
        const user: ProfileUser = {
          id: match.id,
          email: match.email,
          name: match.name,
          role: match.role,
        };
        return user;
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return false;
      try {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { isDisabled: true },
        });
        if (dbUser?.isDisabled) {
          return "/login?error=disabled";
        }
      } catch (err) {
        console.error("signIn check failed", err);
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
    async jwt({ token, user, account }) {
      const profileToken = token as ProfileToken;
      const now = Date.now();
      if (user) {
        const profileUser = user as ProfileUser;
        profileToken.role = profileUser.role ?? profileToken.role ?? "USER";
        profileToken.name = profileUser.name ?? profileUser.fullName ?? profileToken.name;
        profileToken.sub = profileUser.id ?? profileToken.sub;
        profileToken.city = profileUser.city ?? profileToken.city ?? null;
        profileToken.intent = profileUser.intent ?? profileToken.intent ?? [];
        profileToken.fullName =
          profileUser.fullName ?? profileUser.name ?? profileToken.fullName ?? null;
        profileToken.emailVerified =
          profileUser.emailVerified ??
          profileToken.emailVerified ??
          (account?.provider === "google" ? new Date().toISOString() : null);
        profileToken.image = profileUser.image ?? profileToken.image ?? null;
        profileToken.profileComplete = isProfileComplete({
          city: profileToken.city ?? undefined,
          intent: profileToken.intent,
        });
      } else if (!profileToken.city && profileToken.email) {
        // lazily fetch profile fields if missing
        const dbUser = await prisma.user.findUnique({
          where: { email: profileToken.email as string },
        });
        if (dbUser) {
          profileToken.city = dbUser.city;
          profileToken.intent = dbUser.intent ?? [];
          profileToken.fullName = dbUser.fullName || dbUser.name || profileToken.fullName || null;
          profileToken.emailVerified = dbUser.emailVerified ?? null;
          profileToken.image = dbUser.image ?? profileToken.image ?? null;
          profileToken.name = dbUser.fullName || dbUser.name || profileToken.name;
          profileToken.profileComplete = isProfileComplete(dbUser);
        }
      } else if (!profileToken.profileComplete && profileToken.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: profileToken.email as string },
        });
        if (dbUser) {
          profileToken.city = dbUser.city;
          profileToken.intent = dbUser.intent ?? [];
          profileToken.fullName = dbUser.fullName || dbUser.name || profileToken.fullName || null;
          profileToken.emailVerified = dbUser.emailVerified ?? null;
          profileToken.image = dbUser.image ?? profileToken.image ?? null;
          profileToken.name = dbUser.fullName || dbUser.name || profileToken.name;
          profileToken.profileComplete = isProfileComplete(dbUser);
        }
      }
      const shouldRefreshTeacherStatus =
        !profileToken.teacherStatusUpdatedAt ||
        now - profileToken.teacherStatusUpdatedAt > teacherStatusTtlMs;
      if (shouldRefreshTeacherStatus && profileToken.sub) {
        try {
          const latest = await prisma.teacherApplication.findFirst({
            where: { userId: profileToken.sub },
            orderBy: { createdAt: "desc" },
            select: { status: true },
          });
          profileToken.teacherStatus = mapTeacherStatus(latest?.status);
          profileToken.teacherStatusUpdatedAt = now;
        } catch (err) {
          console.error("teacher status lookup failed", err);
        }
      }
      const shouldRefreshProducerStatus =
        !profileToken.producerStatusUpdatedAt ||
        now - profileToken.producerStatusUpdatedAt > producerStatusTtlMs;
      if (shouldRefreshProducerStatus && profileToken.sub) {
        try {
          const rows = await prisma.$queryRaw<{ status: string }[]>`
            SELECT status FROM "ProducerApplication"
            WHERE "userId" = ${profileToken.sub}
            ORDER BY "createdAt" DESC
            LIMIT 1
          `;
          profileToken.producerStatus = mapProducerStatus(rows[0]?.status);
          profileToken.producerStatusUpdatedAt = now;
        } catch (err) {
          console.error("producer status lookup failed", err);
        }
      }
      const shouldRefreshStudioStatus =
        !profileToken.studioStatusUpdatedAt ||
        now - profileToken.studioStatusUpdatedAt > studioStatusTtlMs;
      if (shouldRefreshStudioStatus && profileToken.email) {
        try {
          const ownerEmail = profileToken.email.toString().toLowerCase();
          const activeCount = await prisma.studio.count({
            where: { ownerEmail, isActive: true },
          });
          if (activeCount > 0) {
            profileToken.studioStatus = "approved";
          } else {
            const anyCount = await prisma.studio.count({ where: { ownerEmail } });
            profileToken.studioStatus = anyCount > 0 ? "pending" : "none";
          }
          profileToken.studioStatusUpdatedAt = now;
        } catch (err) {
          console.error("studio status lookup failed", err);
        }
      }
      return profileToken;
    },
    async session({ session, token }) {
      if (session.user) {
        const profileToken = token as ProfileToken;
        const profileUser = session.user as ProfileUser;
        profileUser.role = profileToken.role ?? "USER";
        profileUser.name = (profileToken.name as string | undefined) ?? profileUser.name;
        profileUser.id = profileToken.sub ?? profileUser.id;
        profileUser.city = profileToken.city ?? null;
        profileUser.intent = profileToken.intent ?? [];
        profileUser.fullName = profileToken.fullName ?? profileUser.name ?? null;
        profileUser.emailVerified = profileToken.emailVerified ?? null;
        profileUser.image = profileToken.image ?? profileUser.image ?? null;
        (profileUser as { profileComplete?: boolean }).profileComplete =
          profileToken.profileComplete ?? false;
        profileUser.teacherStatus = profileToken.teacherStatus ?? "none";
        profileUser.producerStatus = profileToken.producerStatus ?? "none";
        profileUser.studioStatus = profileToken.studioStatus ?? "none";
        session.user = profileUser;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      if (!isNewUser) return;
      if (!resendApiKey || !user.email) return;
      try {
        const resend = new Resend(resendApiKey);
        const verifyLink = `${baseUrl}/profile`;
        await resend.emails.send({
          from: leadFrom,
          to: [user.email],
          subject: "Studyom'a hoşgeldin!",
          html: `<p>Merhaba ${user.name || user.email},</p>
<p>Studyom'a hoşgeldin! Şimdi profilini düzenleyebilirsin: <a href="${verifyLink}">${verifyLink}</a></p>
<p>İyi müzikler,<br/>Studyom Ekibi</p>`,
        });
      } catch (err) {
        console.error("welcome email error", err);
      }
    },
  },
};
