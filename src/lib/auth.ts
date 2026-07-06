import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

// The platform owner's login email. Overridable via the OWNER_EMAIL env var so
// owner identity is configuration, not code; defaults to Brandon's account.
// Kept lowercase because role checks compare against `email.toLowerCase()`.
export const OWNER_EMAIL = (process.env.OWNER_EMAIL || "bbrumbaugh13@gmail.com").toLowerCase();

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((email) => email.trim().toLowerCase());
        const staffEmails = (process.env.STAFF_EMAILS || "").split(",").map((email) => email.trim().toLowerCase());
        const normalizedEmail = user.email.toLowerCase();
        const configuredRole = normalizedEmail === OWNER_EMAIL || adminEmails.includes(normalizedEmail)
          ? "ADMIN"
          : staffEmails.includes(normalizedEmail)
            ? "STAFF"
            : user.role;
        if (configuredRole !== user.role) {
          await prisma.user.update({ where: { id: user.id }, data: { role: configuredRole } });
        }

        return { id: user.id, email: user.email, name: user.name, image: user.image, role: configuredRole };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "MEMBER" | "STAFF" | "ADMIN";
      }
      return session;
    },
  },
});
