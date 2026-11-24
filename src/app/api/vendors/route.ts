// Persoana 1 — 1.3 GET /api/vendors?category=&maxPrice=&date=&q=&city=&sort=
import { handle } from "@/lib/api";
import { listVendors } from "@/lib/services/vendors";
import { vendorFilterSchema } from "@/lib/validators";

export async function GET(req: Request) {
  return handle(async () => {
    const params = Object.fromEntries(
      [...new URL(req.url).searchParams.entries()].filter(([, v]) => v !== ""),
    );
    const filter = vendorFilterSchema.parse(params);
    return { vendors: await listVendors(filter) };
  });
}
