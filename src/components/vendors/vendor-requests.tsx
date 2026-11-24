"use client";
// Persoana 1 — 1.4 lista cererilor pentru furnizor: accepta (cu pret agreat ajustabil) / respinge
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Building2, Check, Inbox, Mail, Phone, Users, X } from "lucide-react";
import { Button, Card, Chip, EmptyState, Field, Input, Modal } from "@/components/ui";
import { BookingStatusBadge } from "@/components/vendors/status-badge";
import { api } from "@/lib/fetcher";
import { formatDate, formatMoney } from "@/lib/utils";

type Row = {
  id: string;
  status: string;
  agreedPrice: number;
  eventDate: string;
  notes: string | null;
  packageName: string | null;
  coupleNames: string;
  venueName: string | null;
  expectedGuests: number;
  email: string;
  phone: string | null;
};

const TABS = [
  { key: "PENDING", label: "În așteptare" },
  { key: "CONFIRMED", label: "Confirmate" },
  { key: "OTHER", label: "Respinse / anulate" },
] as const;

export function VendorRequests({ bookings }: { bookings: Row[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("PENDING");
  const [accepting, setAccepting] = useState<Row | null>(null);
  const [price, setPrice] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);

  const list = bookings.filter((b) =>
    tab === "OTHER" ? ["REJECTED", "CANCELLED"].includes(b.status) : b.status === tab,
  );

  async function setStatus(id: string, status: "CONFIRMED" | "REJECTED", agreedPrice?: number) {
    setBusy(id);
    try {
      await api(`/api/bookings/${id}`, { method: "PATCH", json: { status, agreedPrice } });
      toast.success(status === "CONFIRMED" ? "Rezervare confirmată — data e acum ocupată în calendar" : "Cererea a fost respinsă");
      setAccepting(null);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap gap-2 border-b border-sand-100 p-4">
        {TABS.map((t) => {
          const count = bookings.filter((b) =>
            t.key === "OTHER" ? ["REJECTED", "CANCELLED"].includes(b.status) : b.status === t.key,
          ).length;
          return (
            <Chip key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
              {t.label} <span className="opacity-60">({count})</span>
            </Chip>
          );
        })}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<Inbox className="size-6" />} title="Nimic aici" description="Cererile noi de la miri vor apărea în această listă." />
      ) : (
        <div className="divide-y divide-sand-100">
          {list.map((b) => (
            <div key={b.id} className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center animate-fade-in">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-lg font-semibold">{b.coupleNames}</p>
                  <BookingStatusBadge status={b.status} />
                </div>
                <p className="text-sm font-medium text-brand-600">{formatDate(b.eventDate, { weekday: "long" })}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1"><Building2 className="size-4" /> {b.venueName ?? "Sală nerezervată încă"}</span>
                  <span className="inline-flex items-center gap-1"><Users className="size-4" /> {b.expectedGuests} invitați</span>
                  <span className="inline-flex items-center gap-1"><Mail className="size-4" /> {b.email}</span>
                  {b.phone && <span className="inline-flex items-center gap-1"><Phone className="size-4" /> {b.phone}</span>}
                </div>
                {b.notes && <p className="mt-2 rounded-xl bg-sand-50 px-3 py-2 text-sm italic text-slate-600">„{b.notes}”</p>}
              </div>
              <div className="flex items-center gap-3 md:flex-col md:items-end">
                <div className="text-right">
                  <p className="text-xl font-semibold">{formatMoney(b.agreedPrice)}</p>
                  {b.packageName && <p className="text-xs text-slate-500">{b.packageName}</p>}
                </div>
                {b.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" loading={busy === b.id} onClick={() => setStatus(b.id, "REJECTED")}>
                      <X className="size-4" /> Respinge
                    </Button>
                    <Button variant="success" size="sm" onClick={() => { setAccepting(b); setPrice(b.agreedPrice); }}>
                      <Check className="size-4" /> Acceptă
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!accepting}
        onClose={() => setAccepting(null)}
        title="Confirmi rezervarea?"
        description={accepting ? `${accepting.coupleNames} · ${formatDate(accepting.eventDate)}` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAccepting(null)}>Renunță</Button>
            <Button variant="success" loading={busy === accepting?.id} onClick={() => accepting && setStatus(accepting.id, "CONFIRMED", price)}>
              Confirmă
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Preț agreat (€)" hint="Poți ajusta prețul final negociat cu mirii.">
            <Input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </Field>
          <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
            Data va deveni ocupată, iar celelalte cereri pentru aceeași zi vor fi respinse automat.
          </p>
        </div>
      </Modal>
    </Card>
  );
}
