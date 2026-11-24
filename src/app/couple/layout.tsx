// Persoana 2 — layout zona Miri (rol COUPLE obligatoriu)
import { AppShell } from "@/components/app-shell";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function CoupleLayout({ children }: LayoutProps<"/couple">) {
  const user = await requirePageRole("COUPLE");
  const wedding = user.weddingId ? await prisma.wedding.findUnique({ where: { id: user.weddingId } }) : null;
  return (
    <AppShell
      role="COUPLE"
      userName={wedding?.coupleNames ?? user.name ?? ""}
      subtitle={wedding ? `Nunta: ${formatDate(wedding.weddingDate)}` : (user.email ?? "")}
    >
      {children}
    </AppShell>
  );
}
