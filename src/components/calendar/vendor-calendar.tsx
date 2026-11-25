"use client";
// ============================================================================
// Persoana 3 — 3.3 Calendar Disponibilitate Furnizor (FullCalendar) + 3.4 Panou Detalii Nunta
//  * Cod de culori: Verde = liber, Gri (hasurat) = blocat manual, Rosu = nunta confirmata,
//    Galben = cerere in asteptare
//  * Click pe zi libera => blocare (concediu / indisponibil); click pe zi blocata => deblocare
//  * Click pe o zi ocupata => modal cu: Numele Mirilor, Sala de Evenimente, Pretul agreat,
//    Nr. invitati, Status, date de contact
//  * Double-booking blocat: zilele ocupate nu pot fi blocate, iar pe zilele blocate nu se pot
//    accepta rezervari (verificare si in API)
// ============================================================================
import { useCallback, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin, { type DateClickArg } from "@fullcalendar/interaction";
import roLocale from "@fullcalendar/core/locales/ro";
import type { EventClickArg, EventInput, DayCellContentArg } from "@fullcalendar/core";
import { toast } from "sonner";
import {
  Building2,
  CalendarCheck,
  CalendarX,
  Check,
  Clock,
  Euro,
  Heart,
  Lock,
  Mail,
  MapPin,
  Package,
  Phone,
  Unlock,
  User,
  Users,
  X,
} from "lucide-react";
import { Badge, Button, Card, Field, Input, Modal, StatCard } from "@/components/ui";
import { BookingStatusBadge } from "@/components/vendors/status-badge";
import type { CalendarBooking, VendorCalendar as CalendarData } from "@/lib/services/calendar";
import { api } from "@/lib/fetcher";
import { daysUntil, formatDate, formatMoney } from "@/lib/utils";

const COLORS = {
  CONFIRMED: { bg: "#dc1d58", text: "#ffffff" },
  PENDING: { bg: "#fbbf24", text: "#451a03" },
  BLOCKED: { bg: "#94a3b8", text: "#ffffff" },
};

export function VendorCalendar({ initial }: { initial: CalendarData }) {
  const [data, setData] = useState(initial);
  const [details, setDetails] = useState<CalendarBooking[] | null>(null);
  const [blockDay, setBlockDay] = useState<string | null>(null);
  const [unblockDay, setUnblockDay] = useState<{ date: string; reason: string | null } | null>(null);
  const [reason, setReason] = useState("Indisponibil");
  const [busy, setBusy] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const reload = useCallback(async () => {
    const { calendar } = await api<{ calendar: CalendarData }>("/api/vendors/me/calendar");
    setData(calendar);
  }, []);

  const byDate = useMemo(() => {
    const m = new Map<string, CalendarBooking[]>();
    for (const b of data.bookings) m.set(b.date, [...(m.get(b.date) ?? []), b]);
    return m;
  }, [data.bookings]);
  const blockedByDate = useMemo(() => new Map(data.blocked.map((b) => [b.date, b])), [data.blocked]);

  const events: EventInput[] = useMemo(
    () => [
      ...data.bookings.map((b) => ({
        id: b.id,
        title: b.coupleNames,
        start: b.date,
        allDay: true,
        backgroundColor: COLORS[b.status as "CONFIRMED" | "PENDING"].bg,
        textColor: COLORS[b.status as "CONFIRMED" | "PENDING"].text,
        extendedProps: { kind: "booking", date: b.date, status: b.status },
      })),
      ...data.blocked.map((d) => ({
        id: `blocked-${d.id}`,
        title: d.reason ?? "Blocat",
        start: d.date,
        allDay: true,
        backgroundColor: COLORS.BLOCKED.bg,
        textColor: COLORS.BLOCKED.text,
        extendedProps: { kind: "blocked", date: d.date },
      })),
    ],
    [data],
  );

  function openDay(date: string) {
    const bookings = byDate.get(date);
    if (bookings?.length) {
      // confirmate primele
      setDetails([...bookings].sort((a, b) => (a.status === "CONFIRMED" ? -1 : 1) - (b.status === "CONFIRMED" ? -1 : 1)));
      return;
    }
    const blocked = blockedByDate.get(date);
    if (blocked) {
      setUnblockDay({ date, reason: blocked.reason });
      return;
    }
    if (date < today) {
      toast.info("Nu poți modifica zilele din trecut");
      return;
    }
    setReason("Indisponibil");
    setBlockDay(date);
  }

  function dayClass(arg: DayCellContentArg) {
    const d = arg.date;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (key < today) return ["wc-past"];
    const bookings = byDate.get(key);
    if (bookings?.some((b) => b.status === "CONFIRMED")) return ["wc-booked"];
    if (blockedByDate.has(key)) return ["wc-blocked"];
    if (bookings?.length) return ["wc-pending"];
    return ["wc-free"];
  }

  async function block() {
    if (!blockDay) return;
    setBusy(true);
    try {
      await api("/api/vendors/me/blocked-dates", { method: "POST", json: { date: blockDay, reason } });
      toast.success(`${formatDate(blockDay)} a fost blocată`);
      setBlockDay(null);
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function unblock() {
    if (!unblockDay) return;
    setBusy(true);
    try {
      await api(`/api/vendors/me/blocked-dates?date=${unblockDay.date}`, { method: "DELETE" });
      toast.success("Ziua este din nou liberă");
      setUnblockDay(null);
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function respond(b: CalendarBooking, status: "CONFIRMED" | "REJECTED") {
    setBusy(true);
    try {
      await api(`/api/bookings/${b.id}`, { method: "PATCH", json: { status } });
      toast.success(status === "CONFIRMED" ? "Nuntă confirmată — ziua e acum ocupată" : "Cererea a fost respinsă");
      setDetails(null);
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const confirmed = data.bookings.filter((b) => b.status === "CONFIRMED");
  const upcoming = confirmed.filter((b) => b.date >= today);
  const pending = data.bookings.filter((b) => b.status === "PENDING" && b.date >= today);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Nunți viitoare" value={upcoming.length} icon={<CalendarCheck className="size-4" />} accent="bg-rose-50 text-rose-600 ring-rose-100" />
        <StatCard label="Cereri în așteptare" value={pending.length} icon={<Clock className="size-4" />} accent="bg-amber-50 text-amber-600 ring-amber-100" />
        <StatCard label="Zile blocate" value={data.blocked.filter((d) => d.date >= today).length} icon={<Lock className="size-4" />} accent="bg-sand-100 text-slate-600 ring-sand-200" />
        <StatCard label="Venit viitor confirmat" value={formatMoney(upcoming.reduce((s, b) => s + b.agreedPrice, 0))} icon={<Euro className="size-4" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-emerald-100 ring-1 ring-emerald-300" /> Liber (click pentru a bloca)</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded ring-1 ring-slate-300" style={{ background: "repeating-linear-gradient(45deg,#f1f5f9 0 3px,#cbd5e1 3px 5px)" }} /> Blocat manual</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded" style={{ background: COLORS.CONFIRMED.bg }} /> Nuntă confirmată</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded" style={{ background: COLORS.PENDING.bg }} /> Cerere în așteptare</span>
          </div>
          <FullCalendar
            plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={roLocale}
            firstDay={1}
            height="auto"
            headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,listYear" }}
            buttonText={{ today: "Azi", month: "Lună", list: "Listă" }}
            events={events}
            dayCellClassNames={dayClass}
            dateClick={(arg: DateClickArg) => openDay(arg.dateStr)}
            eventClick={(arg: EventClickArg) => openDay(arg.event.extendedProps.date as string)}
            dayMaxEvents={2}
            eventContent={(arg) => {
              const kind = arg.event.extendedProps.kind as string;
              const status = arg.event.extendedProps.status as string | undefined;
              const Icon = kind === "blocked" ? Lock : status === "CONFIRMED" ? Heart : Clock;
              return (
                <span className="flex min-w-0 items-center gap-1.5 overflow-hidden">
                  <Icon className="size-3 shrink-0" strokeWidth={2.5} />
                  <span className="truncate">{arg.event.title}</span>
                </span>
              );
            }}
            fixedWeekCount={false}
            noEventsText="Nicio nuntă sau zi blocată în această perioadă"
          />
        </Card>

        <Card>
          <div className="border-b border-sand-100 px-5 py-4">
            <h3 className="font-semibold">Următoarele nunți</h3>
          </div>
          <div className="thin-scroll max-h-[640px] divide-y divide-sand-100 overflow-y-auto">
            {upcoming.length === 0 && <p className="p-5 text-sm text-slate-500">Nicio nuntă confirmată în viitor.</p>}
            {upcoming.map((b) => (
              <button key={b.id} onClick={() => openDay(b.date)} className="block w-full px-5 py-3 text-left transition hover:bg-sand-50">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{b.coupleNames}</p>
                  <span className="text-xs text-slate-400">în {daysUntil(b.date)} zile</span>
                </div>
                <p className="text-sm text-brand-600">{formatDate(b.date, { weekday: "short" })}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                  <Building2 className="size-3.5" /> {b.venueName ?? "Sală nestabilită"} · <Users className="size-3.5" /> {b.expectedGuests}
                </p>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* 3.4 MODAL DETALII NUNTA */}
      <Modal
        open={!!details}
        onClose={() => setDetails(null)}
        title="Detalii nuntă"
        description={details?.[0] ? formatDate(details[0].date, { weekday: "long" }) : undefined}
        size="lg"
      >
        <div className="space-y-4">
          {details?.map((b) => (
            <div key={b.id} className="overflow-hidden rounded-2xl ring-1 ring-sand-200/80">
              <div className={b.status === "CONFIRMED" ? "bg-gradient-to-r from-rose-600 to-brand-500 px-5 py-4 text-white" : "bg-amber-50 px-5 py-4"}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className={b.status === "CONFIRMED" ? "text-xs text-white/80" : "text-xs text-amber-700"}>Numele mirilor</p>
                    <p className="font-display text-2xl font-semibold">{b.coupleNames}</p>
                  </div>
                  <BookingStatusBadge status={b.status} />
                </div>
              </div>
              <div className="grid gap-3 p-5 sm:grid-cols-2">
                <DetailRow icon={<Building2 className="size-4" />} label="Sala de evenimente" value={b.venueName ?? "Încă nerezervată"} sub={b.venueCity ?? undefined} />
                <DetailRow icon={<Euro className="size-4" />} label="Prețul agreat" value={formatMoney(b.agreedPrice)} sub={b.packageName ? `Pachet: ${b.packageName}` : "Preț de bază"} />
                <DetailRow icon={<Users className="size-4" />} label="Nr. invitați" value={`${b.expectedGuests} estimați`} sub={`${b.guestCount} pe lista mirilor`} />
                <DetailRow icon={<User className="size-4" />} label="Persoană de contact" value={b.contactName} />
                <DetailRow icon={<Mail className="size-4" />} label="Email" value={b.email} />
                <DetailRow icon={<Phone className="size-4" />} label="Telefon" value={b.phone ?? "—"} />
              </div>
              {b.notes && (
                <div className="mx-5 mb-5 flex gap-2 rounded-xl bg-sand-50 p-3 text-sm italic text-slate-600">
                  <Package className="mt-0.5 size-4 shrink-0 not-italic text-slate-400" /> „{b.notes}”
                </div>
              )}
              {b.status === "PENDING" && (
                <div className="flex justify-end gap-2 border-t border-sand-100 bg-sand-50/70 px-5 py-3">
                  <Button variant="secondary" size="sm" loading={busy} onClick={() => respond(b, "REJECTED")}><X className="size-4" /> Respinge</Button>
                  <Button variant="success" size="sm" loading={busy} onClick={() => respond(b, "CONFIRMED")}><Check className="size-4" /> Acceptă</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Modal>

      {/* blocare zi libera */}
      <Modal
        open={!!blockDay}
        onClose={() => setBlockDay(null)}
        title="Blochezi această zi?"
        description={blockDay ? formatDate(blockDay, { weekday: "long" }) : undefined}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setBlockDay(null)}>Renunță</Button>
            <Button loading={busy} onClick={block}><CalendarX className="size-4" /> Blochează</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {["Indisponibil", "Concediu", "Eveniment privat"].map((r) => (
              <button key={r} onClick={() => setReason(r)}>
                <Badge className={reason === r ? "bg-ink text-white" : "bg-sand-100 text-slate-600"}>{r}</Badge>
              </button>
            ))}
          </div>
          <Field label="Motiv (opțional)">
            <Input value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="size-3.5" /> Mirii nu te vor mai găsi disponibil în marketplace pentru această dată.
          </p>
        </div>
      </Modal>

      {/* deblocare */}
      <Modal
        open={!!unblockDay}
        onClose={() => setUnblockDay(null)}
        title="Zi blocată"
        description={unblockDay ? `${formatDate(unblockDay.date, { weekday: "long" })} · ${unblockDay.reason ?? "Indisponibil"}` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setUnblockDay(null)}>Închide</Button>
            <Button variant="success" loading={busy} onClick={unblock}><Unlock className="size-4" /> Deblochează</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Deblochezi ziua pentru a putea primi din nou cereri de rezervare?</p>
      </Modal>
    </div>
  );
}

function DetailRow({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="flex gap-3 rounded-xl bg-sand-50/70 p-3">
      <div className="mt-0.5 text-brand-500">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="truncate font-medium text-ink">{value}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}
