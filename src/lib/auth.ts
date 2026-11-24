// Persoana 1 — 1.1 Autentificare & Roluri (RBAC)
// NextAuth (Credentials Provider + bcrypt). Rolul si id-urile profilului sunt puse in JWT.
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";
import type { Role } from "@/lib/constants";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Email si parola",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Parola", type: "password" },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          include: { wedding: true, vendorProfile: true },
        });
        if (!user) return null;
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as Role,
          weddingId: user.wedding?.id ?? null,
          vendorId: user.vendorProfile?.id ?? null,
          category: user.vendorProfile?.category ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.weddingId = user.weddingId;
        token.vendorId = user.vendorId;
        token.category = user.category;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id,
        role: token.role,
        weddingId: token.weddingId,
        vendorId: token.vendorId,
        category: token.category,
      };
      return session;
    },
  },
};

export function getSession() {
  return getServerSession(authOptions);
}

/** Pentru pagini (Server Components): redirect daca nu are rolul cerut */
export async function requirePageRole(role: Role) {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  if (session.user.role !== role) redirect(homeForRole(session.user.role));
  return session.user;
}

export function homeForRole(role: Role | undefined) {
  return role === "VENDOR" ? "/vendor/dashboard" : "/couple/dashboard";
}
