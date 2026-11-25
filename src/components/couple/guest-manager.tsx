"use client";
// Persoana 2 — 2.2 CRUD invitati + Live Search instant + filtre (asezat/neasezat, meniu, alergii, RSVP)
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Armchair, ListPlus, Pencil, Plus, Search, Trash2, UserPlus, Users, X } from "lucide-react";
import { Badge, Button, Card, Chip, EmptyState, Input, Modal, PageHeader, Select, Textarea } from "@/components/ui";
import { GuestForm, emptyGuest, type GuestFormValue } from "@/components/couple/guest-form";
import { ALLERGIES, MENU_META, MENU_TYPES, RSVP_META, type MenuType, type RsvpStatus } from "@/lib/constants";
import type { GuestDTO } from "@/lib/services/guests";
import { api } from "@/lib/fetcher";
import { cn, initials } from "@/lib/utils";
import { MenuIcon } from "@/components/icons";

type Seated = "all" | "yes" | "no";

export function GuestManager({ initialGuests }: { initialGuests: GuestDTO[] }) {
  const [guests, setGuests] = useState(initialGuests);
  const [q, setQ] = useState("");
  const [seated, setSeated] = useState<Seated>("all");
  const [menu, setMenu] = useState<string | null>(null);
  const [allergy, setAllergy] = useState("");
  const [rsvp, setRsvp] = useState("");

  const [editing, setEditing] = useState<{ id?: string; value: GuestFormValue } | null>(null);
  const [deleting, setDeleting] = useState<GuestDTO | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [saving, setSaving] = useState(false);

  const groups = useMemo(() => [...new Set(guests.map((g) => g.group).filter(Boolean) as string[])].sort(), [guests]);

  // LIVE SEARCH: filtrare instantanee pe client (fara round-trip la server)
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
    return guests.filter((g) => {
      if (needle) {
        const hay = `${g.fullName} ${g.group ?? ""} ${g.phone ?? ""} ${g.tableLabel ?? ""}`
          .toLowerCase()
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "");
        if (!hay.includes(needle)) return false;
      }
      if (seated === "yes" && !g.tableId) return false;
      if (seated === "no" && g.tableId) return false;
      if (menu && g.menuType !== menu) return false;
      if (allergy === "__any" && g.allergies.length === 0) return false;
      if (allergy && allergy !== "__any" && !g.allergies.includes(allergy)) return false;
      if (rsvp && g.rsvpStatus !== rsvp) return false;
      return true;
    });
  }, [guests, q, seated, menu, allergy, rsvp]);

  const counts = {
    total: guests.length,
    seated: guests.filter((g) => g.tableId).length,
    confirmed: guests.filter((g) => g.rsvpStatus === "CONFIRMED").length,
    allergic: guests.filter((g) => g.allergies.length > 0).length,
  };
  const anyFilter = q || seated !== "all" || menu || allergy || rsvp;

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      const body = {
        ...editing.value,
        phone: editing.value.phone || null,
        group: editing.value.group || null,
        notes: editing.value.notes || null,
      };
      if (editing.id) {
        const { guest } = await api<{ guest: GuestDTO }>(`/api/guests/${editing.id}`, { method: "PATCH", json: body });
        setGuests((gs) => gs.map((g) => (g.id === guest.id ? guest : g)));
        toast.success("Invitat actualizat");
      } else {
        const { guest } = await api<{ guest: GuestDTO }>("/api/guests", { method: "POST", json: body });
        setGuests((gs) => [...gs, guest].sort((a, b) => a.fullName.localeCompare(b.fullName)));
        toast.success(`${guest.fullName} a fost adăugat`);
      }
      setEditing(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!deleting) return;
    setSaving(true);
    try {
      await api(`/api/guests/${deleting.id}`, { method: "DELETE" });
      setGuests((gs) => gs.filter((g) => g.id !== deleting.id));
      toast.success("Invitat șters");
      setDeleting(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function bulkAdd() {
    const names = bulkText.split("\n").map((s) => s.trim()).filter((s) => s.length >= 2);
    if (names.length === 0) return;
    setSaving(true);
    try {
      const created: GuestDTO[] = [];
      for (const fullName of names) {
        const { guest } = await api<{ guest: GuestDTO }>("/api/guests", { method: "POST", json: { fullName } });
        created.push(guest);
      }
      setGuests((gs) => [...gs, ...created].sort((a, b) => a.fullName.localeCompare(b.fullName)));
      toast.success(`${created.length} invitați adăugați`);
      setBulkText("");
      setBulkOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function openEdit(g: GuestDTO) {
    setEditing({
      id: g.id,
      value: {
        fullName: g.fullName,
        phone: g.phone ?? "",
        group: g.group ?? "",
        rsvpStatus: g.rsvpStatus,
        menuType: g.menuType,
        allergies: g.allergies,
        notes: g.notes ?? "",
      },
    });
  }

  return (
    <div>
      <PageHeader
        title="Lista de invitați"
        crumbs={[{ label: "Planificare", href: "/couple/dashboard" }, { label: "Invitați" }]}
        description={`${counts.total} invitați · ${counts.confirmed} confirmați · ${counts.seated} așezați la mese · ${counts.allergic} cu alergii`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setBulkOpen(true)}>
              <ListPlus className="size-4" /> Adăugare rapidă
            </Button>
            <Button onClick={() => setEditing({ value: { ...emptyGuest } })}>
              <UserPlus className="size-4" /> Invitat nou
            </Button>
          </>
        }
      />

      <Card className="mb-4 space-y-3 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="h-12 pl-10 text-base"
            placeholder="Caută instant după nume, grup, telefon sau masă..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-black/5">
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["all", "Toți"],
              ["yes", "Așezați la masă"],
              ["no", "Neașezați"],
            ] as const
          ).map(([k, label]) => (
            <Chip key={k} active={seated === k} onClick={() => setSeated(k)}>
              {k === "yes" && <Armchair className="size-3.5" />}
              {label}
            </Chip>
          ))}
          <span className="mx-1 h-6 w-px bg-black/10" />
          {MENU_TYPES.map((m) => (
            <Chip key={m} active={menu === m} onClick={() => setMenu(menu === m ? null : m)}>
              <MenuIcon menu={m} /> {MENU_META[m].label}
            </Chip>
          ))}
          <span className="mx-1 h-6 w-px bg-black/10" />
          <Select className="h-9 w-auto py-1.5" value={allergy} onChange={(e) => setAllergy(e.target.value)}>
            <option value="">Orice alergie</option>
            <option value="__any">Doar cu alergii</option>
            {ALLERGIES.filter((a) => a !== "Altele").map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
          <Select className="h-9 w-auto py-1.5" value={rsvp} onChange={(e) => setRsvp(e.target.value)}>
            <option value="">Orice RSVP</option>
            {Object.entries(RSVP_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
          {anyFilter && (
            <button
              className="ml-auto text-sm font-medium text-brand-600 hover:underline"
              onClick={() => { setQ(""); setSeated("all"); setMenu(null); setAllergy(""); setRsvp(""); }}
            >
              Resetează
            </button>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="size-6" />}
            title={guests.length === 0 ? "Niciun invitat încă" : "Niciun rezultat"}
            description={guests.length === 0 ? "Adaugă primul invitat pentru a începe." : "Încearcă alte filtre."}
            action={guests.length === 0 ? <Button onClick={() => setEditing({ value: { ...emptyGuest } })}><Plus className="size-4" /> Adaugă invitat</Button> : undefined}
          />
        ) : (
          <div className="thin-scroll overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-sand-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Invitat</th>
                  <th className="px-4 py-3 font-medium">Grup</th>
                  <th className="px-4 py-3 font-medium">Meniu</th>
                  <th className="px-4 py-3 font-medium">Alergii</th>
                  <th className="px-4 py-3 font-medium">Masă</th>
                  <th className="px-4 py-3 font-medium">RSVP</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {filtered.map((g) => {
                  const menuMeta = MENU_META[g.menuType as MenuType];
                  return (
                    <tr key={g.id} className="group transition hover:bg-sand-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-white" style={{ background: menuMeta?.color }}>
                            {initials(g.fullName)}
                          </span>
                          <div>
                            <p className="font-medium text-ink">{g.fullName}</p>
                            {g.phone && <p className="text-xs text-slate-400">{g.phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{g.group ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Badge className={menuMeta?.className}><MenuIcon menu={g.menuType} className="size-3" /> {menuMeta?.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {g.allergies.length === 0 ? (
                            <span className="text-slate-300">—</span>
                          ) : (
                            g.allergies.map((a) => (
                              <Badge key={a} className="bg-rose-50 text-rose-700">
                                <AlertTriangle className="size-3" /> {a}
                              </Badge>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {g.tableLabel ? (
                          <Badge className="bg-sky-50 text-sky-700">
                            <Armchair className="size-3" /> {g.tableLabel} · loc {(g.seatIndex ?? 0) + 1}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">Neașezat</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={RSVP_META[g.rsvpStatus as RsvpStatus]?.className}>{RSVP_META[g.rsvpStatus as RsvpStatus]?.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1 opacity-60 transition group-hover:opacity-100">
                          <button className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-ink" onClick={() => openEdit(g)} aria-label="Editează">
                            <Pencil className="size-4" />
                          </button>
                          <button className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600" onClick={() => setDeleting(g)} aria-label="Șterge">
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className={cn("border-t border-sand-100 px-4 py-2.5 text-xs text-slate-500", filtered.length === 0 && "hidden")}>
          Afișați {filtered.length} din {guests.length}
        </div>
      </Card>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Editează invitatul" : "Invitat nou"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>Renunță</Button>
            <Button loading={saving} disabled={(editing?.value.fullName.trim().length ?? 0) < 2} onClick={save}>Salvează</Button>
          </>
        }
      >
        {editing && (
          <GuestForm key={editing.id ?? "new"} value={editing.value} groups={groups} onChange={(value) => setEditing({ ...editing, value })} />
        )}
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Ștergi invitatul?"
        description={deleting?.fullName}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>Renunță</Button>
            <Button variant="danger" loading={saving} onClick={remove}>Șterge</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Invitatul va fi eliminat și de la masa la care era așezat.</p>
      </Modal>

      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Adăugare rapidă"
        description="Un nume pe fiecare rând. Meniul și alergiile le poți completa ulterior."
        footer={
          <>
            <Button variant="secondary" onClick={() => setBulkOpen(false)}>Renunță</Button>
            <Button loading={saving} onClick={bulkAdd}>Adaugă</Button>
          </>
        }
      >
        <Textarea rows={8} value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder={"Ion Popescu\nMaria Ionescu\n..."} />
      </Modal>
    </div>
  );
}
