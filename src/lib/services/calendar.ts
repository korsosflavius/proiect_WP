// Persoana 3 — 3.3 / 3.4 date pentru calendarul furnizorului
// Rezervarile (confirmate + in asteptare) cu detaliile relationale ale nuntii si zilele blocate.
import { prisma } from "@/lib/prisma";
import { toDateOnly } from "@/lib/utils";

export async function getVendorCalendar(vendorId: string) {
  const vendor = await prisma.vendorProfile.findUniqueOrThrow({ where: { id: vendorId } });
  const [bookings, blocked] = await Promise.all([
    prisma.booking.findMany({
      where: { vendorId, status: { in: ["CONFIRMED", "PENDING"] } },
      include: {
        package: { select: { name: true } },
        wedding: {
          include: {
            user: { select: { email: true, name: true } },
            _count: { select: { guests: { where: { rsvpStatus: { not: "DECLINED" } } } } },
            // Sala de evenimente: rezervarea VENUE confirmata a mirilor
            bookings: {
              where: { status: "CONFIRMED", vendor: { category: "VENUE" } },
              include: { vendor: { select: { businessName: true, city: true } } },
              take: 1,
            },
          },
        },
      },
      orderBy: { eventDate: "asc" },
    }),
    prisma.blockedDate.findMany({ where: { vendorId }, orderBy: { date: "asc" } }),
  ]);

  return {
    vendor: { businessName: vendor.businessName, category: vendor.category },
    bookings: bookings.map((b) => {
      const venueBooking = b.wedding.bookings[0];
      const venueName =
        vendor.category === "VENUE"
          ? vendor.businessName
          : (venueBooking?.vendor.businessName ?? b.wedding.venueName ?? null);
      return {
        id: b.id,
        date: toDateOnly(b.eventDate),
        status: b.status,
        agreedPrice: b.agreedPrice,
        notes: b.notes,
        packageName: b.package?.name ?? null,
        coupleNames: b.wedding.coupleNames,
        venueName,
        venueCity: venueBooking?.vendor.city ?? null,
        expectedGuests: b.wedding.expectedGuests,
        guestCount: b.wedding._count.guests,
        contactName: b.wedding.user.name,
        email: b.wedding.user.email,
        phone: b.wedding.phone,
      };
    }),
    blocked: blocked.map((d) => ({ id: d.id, date: toDateOnly(d.date), reason: d.reason })),
  };
}

export type VendorCalendar = Awaited<ReturnType<typeof getVendorCalendar>>;
export type CalendarBooking = VendorCalendar["bookings"][number];
