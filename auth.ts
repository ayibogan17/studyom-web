import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
const googleId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
const googleSecret =
  process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;

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
  ],
  pages: {
    signIn: "/login",
  },
};
