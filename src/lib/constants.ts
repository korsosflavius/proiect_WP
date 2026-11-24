// Comun — valorile permise pentru campurile "enum" (SQL Server nu are enum in Prisma)

export const ROLES = ["COUPLE", "VENDOR"] as const;
export type Role = (typeof ROLES)[number];

// Persoana 1 — cele 6 categorii de furnizori
// Culorile urmeaza o paleta categoriala validata pentru daltonism (ordine fixa, sloturile 1-6;
// slotul 7 #6250d6 = "Cheltuieli extra" in graficul de buget).
export const VENDOR_CATEGORIES = [
  "VENUE",
  "DJ",
  "BAND",
  "PASTRY",
  "PHOTOGRAPHER",
  "DECORATOR",
] as const;
export type VendorCategory = (typeof VENDOR_CATEGORIES)[number];

export const CATEGORY_META: Record<
  VendorCategory,
  { label: string; plural: string; color: string }
> = {
  VENUE: { label: "Sală de Evenimente", plural: "Săli", color: "#2a78d6" },
  DJ: { label: "DJ", plural: "DJ", color: "#eb6834" },
  BAND: { label: "Trupă de Muzică", plural: "Trupe", color: "#1baf7a" },
  PASTRY: { label: "Cofetărie", plural: "Cofetării", color: "#eda100" },
  PHOTOGRAPHER: { label: "Fotograf", plural: "Foto", color: "#e87ba4" },
  DECORATOR: { label: "Decor Sală", plural: "Decor", color: "#008300" },
};

// Persoana 1 — statusurile unei rezervari
export const BOOKING_STATUSES = ["PENDING", "CONFIRMED", "REJECTED", "CANCELLED"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS_META: Record<BookingStatus, { label: string; className: string }> = {
  PENDING: { label: "În așteptare", className: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  CONFIRMED: { label: "Confirmată", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  REJECTED: { label: "Respinsă", className: "bg-rose-50 text-rose-700 ring-rose-600/20" },
  CANCELLED: { label: "Anulată", className: "bg-slate-50 text-slate-600 ring-slate-500/20" },
};

// Persoana 2 — meniuri si alergii
export const MENU_TYPES = ["STANDARD", "VEGETARIAN", "VEGAN", "KIDS"] as const;
export type MenuType = (typeof MENU_TYPES)[number];

export const MENU_META: Record<MenuType, { label: string; color: string; className: string }> = {
  STANDARD: { label: "Standard", color: "#2a78d6", className: "bg-indigo-50 text-indigo-700 ring-indigo-600/20" },
  VEGETARIAN: { label: "Vegetarian", color: "#eb6834", className: "bg-green-50 text-green-700 ring-green-600/20" },
  VEGAN: { label: "Vegan", color: "#1baf7a", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  KIDS: { label: "Copii", color: "#eda100", className: "bg-orange-50 text-orange-700 ring-orange-600/20" },
};

export const ALLERGIES = ["Gluten", "Lactoză", "Nuci", "Fructe de mare", "Ouă", "Altele"] as const;

export const RSVP_STATUSES = ["CONFIRMED", "PENDING", "DECLINED"] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];
export const RSVP_META: Record<RsvpStatus, { label: string; className: string }> = {
  CONFIRMED: { label: "Confirmat", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  PENDING: { label: "Neconfirmat", className: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  DECLINED: { label: "Refuzat", className: "bg-slate-50 text-slate-500 ring-slate-500/20" },
};

export const EXPENSE_CATEGORIES = ["Ținută", "Verighete", "Invitații", "Transport", "Cazare", "Altele"] as const;

// Persoana 3 — tipuri de obiecte in planul salii
export const TABLE_SHAPES = ["ROUND", "RECTANGLE", "STAGE", "DANCE_FLOOR"] as const;
export type TableShape = (typeof TABLE_SHAPES)[number];
export const TABLE_SHAPE_META: Record<TableShape, { label: string; defaultCapacity: number }> = {
  ROUND: { label: "Masă rotundă", defaultCapacity: 10 },
  RECTANGLE: { label: "Masă dreptunghiulară", defaultCapacity: 12 },
  STAGE: { label: "Prezidiu (Masa Mirilor)", defaultCapacity: 6 },
  DANCE_FLOOR: { label: "Ring de dans", defaultCapacity: 0 },
};
