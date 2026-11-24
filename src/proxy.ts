// Persoana 1 — 1.1 Rute protejate (Next.js 16 "proxy", fostul middleware)
// Verificare optimista pe baza JWT-ului NextAuth; verificarea definitiva se face
// si in fiecare pagina/API (requirePageRole / requireRole).
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  const needsCouple = pathname.startsWith("/couple");
  const needsVendor = pathname.startsWith("/vendor");
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if ((needsCouple || needsVendor) && !token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const home = token?.role === "VENDOR" ? "/vendor/dashboard" : "/couple/dashboard";
  if (token && ((needsCouple && token.role !== "COUPLE") || (needsVendor && token.role !== "VENDOR"))) {
    return NextResponse.redirect(new URL(home, req.url));
  }
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL(home, req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/couple/:path*", "/vendor/:path*", "/login", "/register"],
};
