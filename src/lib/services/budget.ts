// Persoana 2 — 2.1 Tracker de buget: buget maxim - (preturi furnizori CONFIRMATI + cheltuieli extra)
import { prisma } from "@/lib/prisma";
import { CATEGORY_META, VENDOR_CATEGORIES, type VendorCategory } from "@/lib/constants";

export async function getBudgetSummary(weddingId: string) {
  const wedding = await prisma.wedding.findUniqueOrThrow({
    where: { id: weddingId },
    include: {
      bookings: { where: { status: { in: ["CONFIRMED", "PENDING"] } }, include: { vendor: true } },
      extraExpenses: { orderBy: { createdAt: "desc" } },
    },
  });

  const confirmed = wedding.bookings.filter((b) => b.status === "CONFIRMED");
  const pending = wedding.bookings.filter((b) => b.status === "PENDING");

  const vendorsSpent = confirmed.reduce((s, b) => s + b.agreedPrice, 0);
  const extrasSpent = wedding.extraExpenses.reduce((s, e) => s + e.amount, 0);
  const pendingTotal = pending.reduce((s, b) => s + b.agreedPrice, 0);
  const spent = vendorsSpent + extrasSpent;
  const remaining = wedding.totalBudget - spent;
  const percent = wedding.totalBudget > 0 ? (spent / wedding.totalBudget) * 100 : 0;

  // defalcare pe categorii (furnizori + cheltuieli extra grupate)
  const byCategory = [
    ...VENDOR_CATEGORIES.map((c) => ({
      key: c,
      label: CATEGORY_META[c].label,
      color: CATEGORY_META[c].color,
      amount: confirmed.filter((b) => b.vendor.category === c).reduce((s, b) => s + b.agreedPrice, 0),
    })),
    {
      key: "EXTRA",
      label: "Cheltuieli extra",
      color: "#6250d6",
      amount: extrasSpent,
    },
  ].filter((c) => c.amount > 0);

  const alerts: { level: "danger" | "warning" | "info"; message: string }[] = [];
  if (remaining < 0) {
    alerts.push({ level: "danger", message: `Ai depășit bugetul cu ${Math.abs(remaining).toLocaleString("ro-RO")} €!` });
  } else if (percent >= 85) {
    alerts.push({ level: "warning", message: `Ai consumat ${percent.toFixed(0)}% din buget. Mai ai ${remaining.toLocaleString("ro-RO")} €.` });
  }
  if (pendingTotal > 0 && spent + pendingTotal > wedding.totalBudget) {
    alerts.push({
      level: "warning",
      message: `Dacă toate cererile în așteptare sunt acceptate (+${pendingTotal.toLocaleString("ro-RO")} €), vei depăși bugetul.`,
    });
  }
  const missing = VENDOR_CATEGORIES.filter(
    (c) => !wedding.bookings.some((b) => b.vendor.category === c),
  );
  if (missing.length > 0) {
    alerts.push({
      level: "info",
      message: `Nu ai încă: ${missing.map((c) => CATEGORY_META[c as VendorCategory].label).join(", ")}.`,
    });
  }

  return {
    totalBudget: wedding.totalBudget,
    spent,
    vendorsSpent,
    extrasSpent,
    pendingTotal,
    remaining,
    percent,
    byCategory,
    alerts,
    confirmedBookings: confirmed.map((b) => ({
      id: b.id,
      vendorName: b.vendor.businessName,
      category: b.vendor.category,
      amount: b.agreedPrice,
    })),
    pendingBookings: pending.map((b) => ({
      id: b.id,
      vendorName: b.vendor.businessName,
      category: b.vendor.category,
      amount: b.agreedPrice,
    })),
    expenses: wedding.extraExpenses.map((e) => ({
      id: e.id,
      label: e.label,
      amount: e.amount,
      category: e.category,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}

export type BudgetSummary = Awaited<ReturnType<typeof getBudgetSummary>>;
