// Persoana 2 — 2.2 / 2.3 Gestiune invitati (CRUD, live search, filtre, meniu & alergii)
import type { Metadata } from "next";
import { requirePageRole } from "@/lib/auth";
import { listGuests } from "@/lib/services/guests";
import { GuestManager } from "@/components/couple/guest-manager";

export const metadata: Metadata = { title: "Invitați" };

export default async function GuestsPage() {
  const user = await requirePageRole("COUPLE");
  const guests = await listGuests(user.weddingId!);
  return <GuestManager initialGuests={guests} />;
}
