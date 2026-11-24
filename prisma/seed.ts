// ============================================================================
// WedCraft — date demo (rulare: npm run db:seed)
// 2 cupluri, 12 furnizori (2 din fiecare din cele 6 categorii), rezervari
// (confirmate / in asteptare / respinse), zile blocate, cheltuieli, invitati
// cu meniuri & alergii si un plan 2D de sala partial aranjat.
// Parola pentru TOATE conturile demo: parola123
// ============================================================================
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const d = (s: string) => new Date(`${s}T00:00:00.000Z`);
const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`;

const VENDORS = [
  {
    email: "sala@wedcraft.ro", name: "Elena Popescu", businessName: "Palatul Florilor", category: "VENUE",
    city: "Cluj-Napoca", basePrice: 9000, capacity: 250, phone: "0740 111 222",
    description: "Salon de evenimente elegant cu grădină proprie, terasă pentru cocktail și ring de dans luminat LED. Capacitate până la 250 de invitați.",
    imageUrl: img("photo-1519167758481-83f550bb49b3"),
    gallery: [img("photo-1464366400600-7168b8af9bc3"), img("photo-1511795409834-ef04bbd61622"), img("photo-1519225421980-715cb0215aed")],
    packages: [
      { name: "Pachet Clasic", price: 9000, description: "Închiriere sală + aranjament mese standard" },
      { name: "Pachet Premium", price: 13500, description: "Sală + terasă + cocktail de bun venit + lumini ambientale" },
    ],
  },
  {
    email: "sala2@wedcraft.ro", name: "Radu Ionescu", businessName: "Domeniul Vinea", category: "VENUE",
    city: "Alba Iulia", basePrice: 7500, capacity: 180, phone: "0740 333 444",
    description: "Domeniu viticol cu sală rustic-chic, vedere spre podgorii și ceremonie în aer liber.",
    imageUrl: img("photo-1469371670807-013ccf25f16a"),
    gallery: [img("photo-1505236858219-8359eb29e329"), img("photo-1478146896981-b80fe463b330")],
    packages: [{ name: "Pachet Rustic", price: 7500, description: "Sală + ceremonie în aer liber" }],
  },
  {
    email: "dj@wedcraft.ro", name: "Alex Marin", businessName: "DJ Alex Beat", category: "DJ",
    city: "Cluj-Napoca", basePrice: 1200, phone: "0751 555 666",
    description: "DJ cu peste 300 de nunți la activ. Muzică pentru toate generațiile, sistem de sunet profesional și lumini incluse.",
    imageUrl: img("photo-1470225620780-dba8ba36b745"),
    gallery: [img("photo-1571266028243-e4733b0f0bb0"), img("photo-1516450360452-9312f5e86fc7")],
    packages: [
      { name: "Standard 6 ore", price: 1200, description: "Sonorizare + lumini" },
      { name: "Gold 10 ore", price: 1800, description: "Sonorizare + lumini + fum greu la primul dans" },
    ],
  },
  {
    email: "dj2@wedcraft.ro", name: "Vlad Sima", businessName: "DJ Sonic Waves", category: "DJ",
    city: "Brașov", basePrice: 950, phone: "0751 777 888",
    description: "Seturi moderne, mash-up-uri și muzică de petrecere până dimineața.",
    imageUrl: img("photo-1493225457124-a3eb161ffa5f"),
    gallery: [], packages: [],
  },
  {
    email: "trupa@wedcraft.ro", name: "Mihai Dobre", businessName: "Trupa Elegance", category: "BAND",
    city: "Cluj-Napoca", basePrice: 3500, phone: "0722 123 456",
    description: "Formație live cu 6 membri: muzică populară, ușoară și internațională. Solistă și saxofon.",
    imageUrl: img("photo-1501386761578-eac5c94b800a"),
    gallery: [img("photo-1514525253161-7a46d19cd819")],
    packages: [{ name: "Program complet", price: 3500, description: "Toată noaptea, 6 membri" }],
  },
  {
    email: "trupa2@wedcraft.ro", name: "Cristi Lungu", businessName: "Live Vibes Band", category: "BAND",
    city: "Sibiu", basePrice: 2800, phone: "0722 654 321",
    description: "Trupă tânără, repertoriu pop-rock și cover-uri acustice pentru ceremonie.",
    imageUrl: img("photo-1459749411175-04bf5292ceea"),
    gallery: [], packages: [],
  },
  {
    email: "cofetarie@wedcraft.ro", name: "Ana Mureșan", businessName: "Cofetăria Dulce Vis", category: "PASTRY",
    city: "Cluj-Napoca", basePrice: 900, phone: "0733 222 111",
    description: "Torturi de nuntă personalizate și candy bar. Opțiuni fără gluten și vegane la cerere.",
    imageUrl: img("photo-1535254973040-607b474cb50d"),
    gallery: [img("photo-1464349095431-e9a21285b5f3"), img("photo-1557925923-cd4648e211a0")],
    packages: [
      { name: "Tort 3 etaje", price: 900, description: "Până la 120 de porții" },
      { name: "Tort + Candy Bar", price: 1600, description: "Tort + 400 prăjituri asortate" },
    ],
  },
  {
    email: "cofetarie2@wedcraft.ro", name: "Ioana Pop", businessName: "Sweet Moments", category: "PASTRY",
    city: "Oradea", basePrice: 750, phone: "0733 999 888",
    description: "Prăjituri de casă și torturi naked-cake cu fructe proaspete.",
    imageUrl: img("photo-1621303837174-89787a7d4729"),
    gallery: [], packages: [],
  },
  {
    email: "foto@wedcraft.ro", name: "Paul Crișan", businessName: "Studio Lumière", category: "PHOTOGRAPHER",
    city: "Cluj-Napoca", basePrice: 1500, phone: "0744 321 987",
    description: "Fotografie de nuntă în stil documentar și fine-art. Album premium și sesiune foto Save the Date.",
    imageUrl: img("photo-1606216794074-735e91aa2c92"),
    gallery: [img("photo-1519741497674-611481863552"), img("photo-1520854221256-17451cc331bf")],
    packages: [
      { name: "Foto", price: 1500, description: "Fotograf principal, toată ziua" },
      { name: "Foto + Video", price: 2600, description: "Fotograf + videograf + dronă" },
    ],
  },
  {
    email: "foto2@wedcraft.ro", name: "Diana Rusu", businessName: "Moment Photo", category: "PHOTOGRAPHER",
    city: "Timișoara", basePrice: 1100, phone: "0744 111 000",
    description: "Fotografii naturale, luminoase, livrate în 30 de zile.",
    imageUrl: img("photo-1537633552985-df8429e8048b"),
    gallery: [], packages: [],
  },
  {
    email: "decor@wedcraft.ro", name: "Larisa Moldovan", businessName: "Floral Dreams", category: "DECORATOR",
    city: "Cluj-Napoca", basePrice: 2000, phone: "0755 444 333",
    description: "Aranjamente florale, arcade pentru ceremonie, decor mese și lumini.",
    imageUrl: img("photo-1478146896981-b80fe463b330"),
    gallery: [img("photo-1523438885200-e635ba2c371e")],
    packages: [{ name: "Decor complet", price: 2000, description: "Flori mese + prezidiu + arcadă" }],
  },
  {
    email: "decor2@wedcraft.ro", name: "Sorin Matei", businessName: "Decor Artistic", category: "DECORATOR",
    city: "Iași", basePrice: 1400, phone: "0755 000 111",
    description: "Decor minimalist, baloane, panouri foto și litere luminoase LOVE.",
    imageUrl: img("photo-1530103862676-de8c9debad1d"),
    gallery: [], packages: [],
  },
] as const;

// [nume, meniu, alergii, grup, rsvp]
const GUESTS_1: [string, string, string, string, string][] = [
  ["Ion Popescu", "STANDARD", "", "Familia mirelui", "CONFIRMED"],
  ["Maria Popescu", "VEGETARIAN", "Lactoză", "Familia mirelui", "CONFIRMED"],
  ["Gheorghe Ionescu", "STANDARD", "", "Familia mirelui", "CONFIRMED"],
  ["Elena Ionescu", "STANDARD", "Nuci", "Familia mirelui", "CONFIRMED"],
  ["Tudor Popescu", "KIDS", "", "Familia mirelui", "CONFIRMED"],
  ["Ilinca Popescu", "KIDS", "Gluten", "Familia mirelui", "CONFIRMED"],
  ["Vasile Dumitru", "STANDARD", "", "Familia miresei", "CONFIRMED"],
  ["Ana Dumitru", "VEGAN", "Gluten,Nuci", "Familia miresei", "CONFIRMED"],
  ["Cristina Dumitru", "STANDARD", "", "Familia miresei", "CONFIRMED"],
  ["Florin Stan", "STANDARD", "Fructe de mare", "Familia miresei", "CONFIRMED"],
  ["Roxana Stan", "VEGETARIAN", "", "Familia miresei", "CONFIRMED"],
  ["Bogdan Nistor", "STANDARD", "", "Prieteni", "CONFIRMED"],
  ["Alina Nistor", "VEGETARIAN", "Ouă", "Prieteni", "CONFIRMED"],
  ["Sergiu Pavel", "STANDARD", "", "Prieteni", "CONFIRMED"],
  ["Ioana Pavel", "STANDARD", "Nuci", "Prieteni", "PENDING"],
  ["Darius Rus", "STANDARD", "", "Prieteni", "CONFIRMED"],
  ["Bianca Toma", "VEGAN", "", "Prieteni", "CONFIRMED"],
  ["Cosmin Toma", "STANDARD", "Lactoză", "Prieteni", "CONFIRMED"],
  ["Andreea Lazăr", "STANDARD", "", "Colegi", "CONFIRMED"],
  ["Mihnea Lazăr", "STANDARD", "", "Colegi", "PENDING"],
  ["Teodora Ene", "VEGETARIAN", "Gluten", "Colegi", "CONFIRMED"],
  ["Paul Ene", "STANDARD", "", "Colegi", "CONFIRMED"],
  ["Raluca Dinu", "STANDARD", "", "Colegi", "DECLINED"],
  ["Victor Dinu", "STANDARD", "Nuci,Fructe de mare", "Colegi", "CONFIRMED"],
];

const GUESTS_2: [string, string, string, string, string][] = [
  ["Adrian Mihai", "STANDARD", "", "Familie", "CONFIRMED"],
  ["Carmen Mihai", "VEGETARIAN", "", "Familie", "CONFIRMED"],
  ["Luca Mihai", "KIDS", "Lactoză", "Familie", "CONFIRMED"],
  ["Simona Vlad", "STANDARD", "Gluten", "Familie", "CONFIRMED"],
  ["Petru Vlad", "STANDARD", "", "Familie", "CONFIRMED"],
  ["Irina Barbu", "VEGAN", "Nuci", "Prieteni", "CONFIRMED"],
  ["Marius Barbu", "STANDARD", "", "Prieteni", "PENDING"],
  ["Oana Cristea", "STANDARD", "", "Prieteni", "CONFIRMED"],
  ["Dan Cristea", "STANDARD", "Fructe de mare", "Prieteni", "CONFIRMED"],
  ["Laura Neagu", "VEGETARIAN", "", "Colegi", "CONFIRMED"],
];

async function main() {
  console.log("🧹 Curat baza de date...");
  // ordinea conteaza (relatii NoAction)
  await prisma.guest.deleteMany();
  await prisma.venueTable.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.budgetItem.deleteMany();
  await prisma.blockedDate.deleteMany();
  await prisma.vendorImage.deleteMany();
  await prisma.vendorPackage.deleteMany();
  await prisma.wedding.deleteMany();
  await prisma.vendorProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("parola123", 10);

  console.log("🏪 Creez furnizorii...");
  const vendors: Record<string, { id: string; businessName: string; basePrice: number; packages: { id: string; price: number }[] }> = {};
  for (const v of VENDORS) {
    const user = await prisma.user.create({
      data: {
        email: v.email,
        name: v.name,
        passwordHash,
        role: "VENDOR",
        vendorProfile: {
          create: {
            businessName: v.businessName,
            category: v.category,
            city: v.city,
            basePrice: v.basePrice,
            description: v.description,
            phone: v.phone,
            capacity: "capacity" in v ? v.capacity : null,
            imageUrl: v.imageUrl,
            gallery: { create: v.gallery.map((url) => ({ url })) },
            packages: { create: v.packages.map((p) => ({ ...p })) },
          },
        },
      },
      include: { vendorProfile: { include: { packages: true } } },
    });
    const p = user.vendorProfile!;
    vendors[v.email] = { id: p.id, businessName: p.businessName, basePrice: p.basePrice, packages: p.packages };
  }

  console.log("💍 Creez cuplurile...");
  const couple1 = await prisma.user.create({
    data: {
      email: "andrei.maria@wedcraft.ro",
      name: "Andrei Pop",
      passwordHash,
      role: "COUPLE",
      wedding: {
        create: {
          coupleNames: "Andrei & Maria",
          weddingDate: d("2027-06-12"),
          totalBudget: 25000,
          expectedGuests: 120,
          phone: "0712 345 678",
          venueName: VENDORS[0].businessName,
        },
      },
    },
    include: { wedding: true },
  });
  const couple2 = await prisma.user.create({
    data: {
      email: "ioana.mihai@wedcraft.ro",
      name: "Ioana Vlad",
      passwordHash,
      role: "COUPLE",
      wedding: {
        create: {
          coupleNames: "Ioana & Mihai",
          weddingDate: d("2027-08-21"),
          totalBudget: 18000,
          expectedGuests: 90,
          phone: "0798 765 432",
          venueName: VENDORS[1].businessName,
        },
      },
    },
    include: { wedding: true },
  });
  const w1 = couple1.wedding!;
  const w2 = couple2.wedding!;

  console.log("📅 Creez rezervarile...");
  const book = (weddingId: string, email: string, date: Date, status: string, pkg = 0, notes?: string) => {
    const v = vendors[email]!;
    const p = v.packages[pkg];
    return prisma.booking.create({
      data: {
        weddingId,
        vendorId: v.id,
        packageId: p?.id ?? null,
        eventDate: date,
        agreedPrice: p?.price ?? v.basePrice,
        status,
        notes,
      },
    });
  };
  await book(w1.id, "sala@wedcraft.ro", w1.weddingDate, "CONFIRMED", 1, "Dorim și terasa pentru cocktail.");
  await book(w1.id, "dj@wedcraft.ro", w1.weddingDate, "CONFIRMED", 1);
  await book(w1.id, "cofetarie@wedcraft.ro", w1.weddingDate, "CONFIRMED", 0, "Tort fără nuci, vă rog.");
  await book(w1.id, "foto@wedcraft.ro", w1.weddingDate, "PENDING", 1, "Ne interesează și sesiunea Save the Date.");
  await book(w1.id, "trupa2@wedcraft.ro", w1.weddingDate, "REJECTED");
  await book(w2.id, "sala2@wedcraft.ro", w2.weddingDate, "CONFIRMED", 0);
  await book(w2.id, "dj@wedcraft.ro", w2.weddingDate, "CONFIRMED", 0);
  await book(w2.id, "trupa@wedcraft.ro", w2.weddingDate, "PENDING", 0);
  await book(w2.id, "decor@wedcraft.ro", w2.weddingDate, "PENDING", 0);

  console.log("🚫 Zile blocate...");
  await prisma.blockedDate.createMany({
    data: [
      { vendorId: vendors["dj@wedcraft.ro"]!.id, date: d("2027-07-03"), reason: "Concediu" },
      { vendorId: vendors["dj@wedcraft.ro"]!.id, date: d("2027-07-04"), reason: "Concediu" },
      { vendorId: vendors["dj@wedcraft.ro"]!.id, date: d("2027-06-19"), reason: "Eveniment privat" },
      { vendorId: vendors["sala@wedcraft.ro"]!.id, date: d("2027-06-26"), reason: "Renovare" },
      { vendorId: vendors["foto@wedcraft.ro"]!.id, date: d("2027-06-05"), reason: "Indisponibil" },
    ],
  });

  console.log("💸 Cheltuieli extra...");
  await prisma.budgetItem.createMany({
    data: [
      { weddingId: w1.id, label: "Rochie de mireasă", amount: 1800, category: "Ținută" },
      { weddingId: w1.id, label: "Costum mire", amount: 700, category: "Ținută" },
      { weddingId: w1.id, label: "Verighete", amount: 950, category: "Verighete" },
      { weddingId: w1.id, label: "Invitații tipărite", amount: 320, category: "Invitații" },
      { weddingId: w2.id, label: "Rochie", amount: 1500, category: "Ținută" },
    ],
  });

  console.log("🪑 Planul salii (Andrei & Maria)...");
  const mkTable = (label: string, shape: string, capacity: number, posX: number, posY: number, rotation = 0) =>
    prisma.venueTable.create({ data: { weddingId: w1.id, label, shape, capacity, posX, posY, rotation } });
  await mkTable("Prezidiu", "STAGE", 6, 600, 110);
  await mkTable("Ring Dans", "DANCE_FLOOR", 0, 600, 330);
  const m1 = await mkTable("Masa 1", "ROUND", 8, 260, 300);
  const m2 = await mkTable("Masa 2", "ROUND", 8, 940, 300);
  const m3 = await mkTable("Masa 3", "ROUND", 10, 300, 560);
  await mkTable("Masa 4", "ROUND", 10, 900, 560);
  await mkTable("Masa 5", "RECTANGLE", 12, 600, 620);

  console.log("👥 Invitatii...");
  // primii invitati asezati, restul "neasezati" -> de tras pe plan
  const seating: Record<number, [string, number]> = {
    0: [m1.id, 0], 1: [m1.id, 1], 2: [m1.id, 2], 3: [m1.id, 3], 4: [m1.id, 4], 5: [m1.id, 5],
    6: [m2.id, 0], 7: [m2.id, 1], 8: [m2.id, 2], 9: [m2.id, 3], 10: [m2.id, 4],
    11: [m3.id, 0], 12: [m3.id, 1],
  };
  for (const [i, [fullName, menuType, allergies, group, rsvpStatus]] of GUESTS_1.entries()) {
    const seat = seating[i];
    await prisma.guest.create({
      data: {
        weddingId: w1.id, fullName, menuType, allergies, group, rsvpStatus,
        phone: `07${String(20000000 + i * 137911).slice(0, 8)}`,
        tableId: seat?.[0] ?? null,
        seatIndex: seat?.[1] ?? null,
      },
    });
  }
  for (const [fullName, menuType, allergies, group, rsvpStatus] of GUESTS_2) {
    await prisma.guest.create({ data: { weddingId: w2.id, fullName, menuType, allergies, group, rsvpStatus } });
  }

  console.log("\n✅ Gata! Conturi demo (parola: parola123):");
  console.log("   Miri:      andrei.maria@wedcraft.ro, ioana.mihai@wedcraft.ro");
  console.log("   Furnizori: sala@, dj@, trupa@, cofetarie@, foto@, decor@wedcraft.ro (+ variantele ...2@)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
