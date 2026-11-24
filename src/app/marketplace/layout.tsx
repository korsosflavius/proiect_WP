// Persoana 1 — layout Marketplace: in aplicatie pentru utilizatori logati, public altfel
import Link from "next/link";
import { AppShell, Logo } from "@/components/app-shell";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buttonClasses } from "@/components/ui/button-classes";

export default async function MarketplaceLayout({ children }: LayoutProps<"/marketplace">) {
  const session = await getSession();
  const user = session?.user;
  if (user) {
    let name: string | null | undefined = null;
    if (user.role === "COUPLE" && user.weddingId) {
      name = (await prisma.wedding.findUnique({ where: { id: user.weddingId } }))?.coupleNames;
    } else if (user.vendorId) {
      name = (await prisma.vendorProfile.findUnique({ where: { id: user.vendorId } }))?.businessName;
    }
    return (
      <AppShell role={user.role} userName={name ?? user.name ?? ""} subtitle={user.email ?? ""}>
        {children}
      </AppShell>
    );
  }
  return (
    <div className="min-h-screen bg-sand-50">
      <header className="sticky top-0 z-30 border-b border-sand-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo />
          <div className="flex gap-2 text-sm">
            <Link href="/login" className={buttonClasses("ghost", "sm")}>
              Autentificare
            </Link>
            <Link href="/register" className={buttonClasses("dark", "sm")}>
              Creează cont
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
