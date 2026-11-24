// Persoana 1 — extinderea tipurilor NextAuth cu rolul si id-urile profilului
import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/constants";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
    weddingId: string | null;
    vendorId: string | null;
    category: string | null;
  }
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      weddingId: string | null;
      vendorId: string | null;
      category: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    weddingId: string | null;
    vendorId: string | null;
    category: string | null;
  }
}
