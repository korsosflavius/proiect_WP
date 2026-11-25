// Persoana 3 — 3.1 GET/POST /api/tables (obiectele din planul 2D: mese, prezidiu, ring de dans)
import { handle, requireWeddingId } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { tableSchema } from "@/lib/validators";

export async function GET() {
  return handle(async () => {
    const weddingId = await requireWeddingId();
    return { tables: await prisma.venueTable.findMany({ where: { weddingId }, orderBy: { label: "asc" } }) };
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const weddingId = await requireWeddingId();
    const data = tableSchema.parse(await req.json());
    const table = await prisma.venueTable.create({
      data: { ...data, capacity: data.shape === "DANCE_FLOOR" ? 0 : data.capacity, weddingId },
    });
    return { table };
  });
}
