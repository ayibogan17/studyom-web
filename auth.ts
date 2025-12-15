import type { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
const googleId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
const googleSecret =
  process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;

const devUsers = [
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

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  providers: [
    GoogleProvider({
      clientId: googleId || "",
      clientSecret: googleSecret || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().toLowerCase() ?? "";
        const password = credentials?.password ?? "";
        const match = devUsers.find(
          (u) => u.email.toLowerCase() === email && u.password === password,
        );
        if (!match) return null;
        const user: User & { role?: string } = {
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
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? token.role ?? "USER";
        token.name = user.name ?? token.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = (token as { role?: string }).role ?? "USER";
        session.user.name = (token as { name?: string }).name ?? session.user.name;
      }
      return session;
    },
  },
};
