// Persoana 1 — 1.4 PATCH /api/bookings/:id — furnizorul accepta/respinge, mirii anuleaza
import { handle, requireUser } from "@/lib/api";
import { updateBookingStatus } from "@/lib/services/bookings";
import { updateBookingSchema } from "@/lib/validators";

export async function PATCH(req: Request, ctx: RouteContext<"/api/bookings/[id]">) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const { status, agreedPrice } = updateBookingSchema.parse(await req.json());
    return { booking: await updateBookingStatus(user, id, status, agreedPrice) };
  });
}
