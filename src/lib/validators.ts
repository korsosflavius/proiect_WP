// Comun — validari Zod pentru toate endpoint-urile (inlocuiesc enum-urile din DB)
import { z } from "zod";
import {
  ALLERGIES,
  BOOKING_STATUSES,
  EXPENSE_CATEGORIES,
  MENU_TYPES,
  RSVP_STATUSES,
  TABLE_SHAPES,
  VENDOR_CATEGORIES,
} from "@/lib/constants";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "format YYYY-MM-DD");
const url = z.string().trim().max(1000).refine((v) => v === "" || /^(https?:\/\/|\/)/.test(v), "URL invalid");

// ---------------------------------------------------------------- Persoana 1
export const loginSchema = z.object({
  email: z.string().trim().email("Email invalid"),
  password: z.string().min(1, "Parola este obligatorie"),
});

export const registerSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("COUPLE"),
    name: z.string().trim().min(2, "Numele este prea scurt").max(80),
    email: z.string().trim().email("Email invalid"),
    password: z.string().min(6, "Parola trebuie să aibă minim 6 caractere"),
    coupleNames: z.string().trim().min(3, "Ex: Andrei & Maria").max(120),
    weddingDate: dateOnly,
    totalBudget: z.coerce.number().min(0).max(10_000_000),
    expectedGuests: z.coerce.number().int().min(1).max(2000),
  }),
  z.object({
    role: z.literal("VENDOR"),
    name: z.string().trim().min(2, "Numele este prea scurt").max(80),
    email: z.string().trim().email("Email invalid"),
    password: z.string().min(6, "Parola trebuie să aibă minim 6 caractere"),
    businessName: z.string().trim().min(2).max(120),
    category: z.enum(VENDOR_CATEGORIES),
    city: z.string().trim().min(2).max(80),
    basePrice: z.coerce.number().min(0).max(1_000_000),
  }),
]);

export const vendorProfileSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  description: z.string().trim().max(5000),
  city: z.string().trim().min(2).max(80),
  basePrice: z.coerce.number().min(0).max(1_000_000),
  phone: z.string().trim().max(30).optional().nullable(),
  capacity: z.coerce.number().int().min(0).max(5000).optional().nullable(),
  imageUrl: url.optional().nullable(),
});

export const packageSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional().nullable(),
  price: z.coerce.number().min(0).max(1_000_000),
});

export const galleryImageSchema = z.object({
  url: url.refine((v) => v.length > 0, "URL obligatoriu"),
  caption: z.string().trim().max(200).optional().nullable(),
});

export const vendorFilterSchema = z.object({
  category: z.enum(VENDOR_CATEGORIES).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  date: dateOnly.optional(),
  q: z.string().trim().max(100).optional(),
  city: z.string().trim().max(80).optional(),
  sort: z.enum(["price_asc", "price_desc", "name"]).optional(),
});

export const createBookingSchema = z.object({
  vendorId: z.string().min(1),
  packageId: z.string().min(1).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const updateBookingSchema = z.object({
  status: z.enum(BOOKING_STATUSES),
  agreedPrice: z.coerce.number().min(0).optional(),
});

// ---------------------------------------------------------------- Persoana 2
export const weddingSchema = z.object({
  coupleNames: z.string().trim().min(3).max(120).optional(),
  weddingDate: dateOnly.optional(),
  totalBudget: z.coerce.number().min(0).max(10_000_000).optional(),
  expectedGuests: z.coerce.number().int().min(1).max(2000).optional(),
  phone: z.string().trim().max(30).optional().nullable(),
});

export const expenseSchema = z.object({
  label: z.string().trim().min(2).max(120),
  amount: z.coerce.number().min(0).max(10_000_000),
  category: z.enum(EXPENSE_CATEGORIES).default("Altele"),
});

export const guestSchema = z.object({
  fullName: z.string().trim().min(2, "Numele este prea scurt").max(120),
  phone: z.string().trim().max(30).optional().nullable(),
  group: z.string().trim().max(80).optional().nullable(),
  rsvpStatus: z.enum(RSVP_STATUSES).default("CONFIRMED"),
  menuType: z.enum(MENU_TYPES).default("STANDARD"),
  // alergiile standard + "Altele: ..." libere
  allergies: z.array(z.string().trim().min(1).max(40)).max(ALLERGIES.length + 5).default([]),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const guestUpdateSchema = guestSchema.partial();

// ---------------------------------------------------------------- Persoana 3
export const tableSchema = z.object({
  label: z.string().trim().min(1).max(60),
  shape: z.enum(TABLE_SHAPES),
  capacity: z.coerce.number().int().min(0).max(30),
  posX: z.coerce.number().min(-5000).max(10000),
  posY: z.coerce.number().min(-5000).max(10000),
  rotation: z.coerce.number().min(-3600).max(3600).default(0),
});

export const tableUpdateSchema = tableSchema.partial();

export const seatSchema = z.object({
  guestId: z.string().min(1),
  // null = ridica invitatul de la masa
  tableId: z.string().min(1).nullable(),
  seatIndex: z.coerce.number().int().min(0).max(29).nullable(),
});

export const blockDateSchema = z.object({
  date: dateOnly,
  reason: z.string().trim().max(200).optional().nullable(),
});
