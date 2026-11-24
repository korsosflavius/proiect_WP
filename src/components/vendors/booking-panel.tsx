"use client";
// Persoana 1 — 1.4 panou "Cere rezervare" pe profilul furnizorului (doar pentru Miri)
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarCheck, CalendarX, Check, Send } from "lucide-react";
import { Button, Card, Textarea } from "@/components/ui";
import { BookingStatusBadge } from "@/components/vendors/status-badge";
import { api } from "@/lib/fetcher";
import { cn, formatDate, formatMoney } from "@/lib/utils";

type Props = {
  vendor: { id: string; businessName: string; basePrice: number; packages: { id: string; name: string; price: number }[] };
  context: {
    weddingDate: string;
    available: boolean;
    existing: { id: string; status: string; agreedPrice: number } | null;
  } | null;
  role: "COUPLE" | "VENDOR" | null;
};

export function BookingPanel({ vendor, context, role }: Props) {
  const router = useRouter();
  const [packageId, setPackageId] = useState<string | null>(vendor.packages[0]?.id ?? null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const options = [
    { id: null as string | null, name: "Preț de bază", price: vendor.basePrice },
    ...vendor.packages.map((p) => ({ id: p.id as string | null, name: p.name, price: p.price })),
  ];
  const selected = options.find((o) => o.id === packageId) ?? options[0]!;
  const active = context?.existing && ["PENDING", "CONFIRMED"].includes(context.existing.status);

  async function submit() {
    setLoading(true);
    try {
      await api("/api/bookings", { method: "POST", json: { vendorId: vendor.id, packageId, notes } });
      toast.success("Cererea a fost trimisă! Furnizorul va răspunde în curând.");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (role !== "COUPLE" || !context) {
    return (
      <Card className="p-6 text-center">
        <p className="font-display text-xl font-semibold">Vrei să rezervi {vendor.businessName}?</p>
        <p className="mt-2 text-sm text-slate-500">
          {role === "VENDOR" ? "Rezervările pot fi făcute doar de conturile de miri." : "Autentifică-te cu un cont de miri pentru a trimite o cerere."}
        </p>
        {!role && (
          <Link href="/login" className="mt-4 inline-flex h-10 items-center rounded-xl bg-ink px-5 text-sm font-medium text-white">
            Autentificare
          </Link>
        )}
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className={cn("flex items-center gap-3 px-5 py-4 text-sm font-medium", context.available ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800")}>
        {context.available ? <CalendarCheck className="size-5" /> : <CalendarX className="size-5" />}
        <div>
          <p>{context.available ? "Disponibil" : "Indisponibil"} pe {formatDate(context.weddingDate)}</p>
          <p className="text-xs font-normal opacity-80">data nunții voastre</p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {active ? (
          <div className="space-y-3 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-brand-50 text-brand-600">
              <Check className="size-6" />
            </div>
            <p className="font-semibold">Ai deja o cerere la acest furnizor</p>
            <div className="flex items-center justify-center gap-2">
              <BookingStatusBadge status={context.existing!.status} />
              <span className="text-sm text-slate-500">{formatMoney(context.existing!.agreedPrice)}</span>
            </div>
            <Link href="/couple/bookings" className="inline-block text-sm font-medium text-brand-600 hover:underline">
              Vezi rezervările mele →
            </Link>
          </div>
        ) : (
          <>
            <div>
              <p className="mb-2 text-sm font-medium">Alege oferta</p>
              <div className="space-y-2">
                {options.map((o) => (
                  <button
                    key={o.id ?? "base"}
                    type="button"
                    onClick={() => setPackageId(o.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm ring-1 transition",
                      packageId === o.id ? "bg-brand-50 ring-2 ring-brand-500" : "ring-sand-200 hover:ring-brand-200",
                    )}
                  >
                    <span className="font-medium">{o.name}</span>
                    <span className="font-semibold text-brand-600">{formatMoney(o.price)}</span>
                  </button>
                ))}
              </div>
            </div>
            <Textarea placeholder="Mesaj pentru furnizor (opțional)..." value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
            {context.existing && (
              <p className="text-xs text-slate-500">
                Cererea anterioară: <BookingStatusBadge status={context.existing.status} />
              </p>
            )}
            <div className="flex items-center justify-between border-t border-sand-100 pt-4">
              <span className="text-sm text-slate-500">Total estimat</span>
              <span className="text-xl font-semibold">{formatMoney(selected.price)}</span>
            </div>
            <Button className="w-full" size="lg" onClick={submit} loading={loading} disabled={!context.available}>
              <Send className="size-4" /> Trimite cererea de rezervare
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
