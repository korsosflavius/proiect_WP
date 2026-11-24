// Persoana 1 — 1.4 GET /api/bookings (ale mele) & POST /api/bookings (cerere de rezervare)
import { handle, requireUser, requireWeddingId } from "@/lib/api";
import { createBooking, listBookingsForVendor, listBookingsForWedding } from "@/lib/services/bookings";
import { createBookingSchema } from "@/lib/validators";

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    if (user.role === "VENDOR" && user.vendorId) return { bookings: await listBookingsForVendor(user.vendorId) };
    if (user.weddingId) return { bookings: await listBookingsForWedding(user.weddingId) };
    return { bookings: [] };
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const weddingId = await requireWeddingId();
    const data = createBookingSchema.parse(await req.json());
    return { booking: await createBooking(weddingId, data) };
  });
}
