// Persoana 2 — 2.2 GET/POST /api/guests (listare cu cautare & filtre, adaugare invitat)
// GET ?q=&seated=yes|no&menuType=&allergy=&rsvp=
import { z } from "zod";
import { handle, requireWeddingId } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { listGuests, toGuestDTO } from "@/lib/services/guests";
import { guestSchema } from "@/lib/validators";
import { serializeAllergies } from "@/lib/utils";
import { MENU_TYPES, RSVP_STATUSES } from "@/lib/constants";

const filterSchema = z.object({
  q: z.string().trim().max(100).optional(),
  seated: z.enum(["yes", "no"]).optional(),
  menuType: z.enum(MENU_TYPES).optional(),
  allergy: z.string().trim().max(40).optional(),
  rsvp: z.enum(RSVP_STATUSES).optional(),
});

export async function GET(req: Request) {
  return handle(async () => {
    const weddingId = await requireWeddingId();
    const params = Object.fromEntries([...new URL(req.url).searchParams.entries()].filter(([, v]) => v !== ""));
    return { guests: await listGuests(weddingId, filterSchema.parse(params)) };
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const weddingId = await requireWeddingId();
    const { allergies, ...data } = guestSchema.parse(await req.json());
    const guest = await prisma.guest.create({
      data: { ...data, allergies: serializeAllergies(allergies), weddingId },
    });
    return { guest: toGuestDTO(guest) };
  });
}
