"use client";
// Persoana 2 — 2.3 formular invitat: date + selectie tip meniu + selectie multipla alergii
import { useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { ALLERGIES, MENU_META, MENU_TYPES, RSVP_META, RSVP_STATUSES, type MenuType } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { MenuIcon } from "@/components/icons";

export type GuestFormValue = {
  fullName: string;
  phone: string;
  group: string;
  rsvpStatus: string;
  menuType: string;
  allergies: string[];
  notes: string;
};

export const emptyGuest: GuestFormValue = {
  fullName: "",
  phone: "",
  group: "",
  rsvpStatus: "CONFIRMED",
  menuType: "STANDARD",
  allergies: [],
  notes: "",
};

const STANDARD_ALLERGIES = ALLERGIES.filter((a) => a !== "Altele");

export function GuestForm({
  value,
  onChange,
  groups,
}: {
  value: GuestFormValue;
  onChange: (v: GuestFormValue) => void;
  groups: string[];
}) {
  const custom = value.allergies.filter((a) => !(STANDARD_ALLERGIES as readonly string[]).includes(a));
  const [otherOn, setOtherOn] = useState(custom.length > 0);
  const [otherText, setOtherText] = useState(custom.join(", "));

  const set = <K extends keyof GuestFormValue>(k: K, v: GuestFormValue[K]) => onChange({ ...value, [k]: v });

  function toggleAllergy(a: string) {
    const has = value.allergies.includes(a);
    set("allergies", has ? value.allergies.filter((x) => x !== a) : [...value.allergies, a]);
  }

  function applyOther(text: string, on: boolean) {
    const standard = value.allergies.filter((a) => (STANDARD_ALLERGIES as readonly string[]).includes(a));
    const extra = on ? text.split(",").map((s) => s.trim()).filter(Boolean) : [];
    set("allergies", [...standard, ...extra]);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nume complet" className="sm:col-span-2">
          <Input autoFocus required value={value.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Ex: Ion Popescu" />
        </Field>
        <Field label="Telefon">
          <Input value={value.phone} onChange={(e) => set("phone", e.target.value)} placeholder="07xx xxx xxx" />
        </Field>
        <Field label="Grup / familie">
          <Input list="guest-groups" value={value.group} onChange={(e) => set("group", e.target.value)} placeholder="Ex: Familia miresei" />
          <datalist id="guest-groups">
            {groups.map((g) => <option key={g} value={g} />)}
          </datalist>
        </Field>
        <Field label="RSVP">
          <Select value={value.rsvpStatus} onChange={(e) => set("rsvpStatus", e.target.value)}>
            {RSVP_STATUSES.map((r) => <option key={r} value={r}>{RSVP_META[r].label}</option>)}
          </Select>
        </Field>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Tip meniu</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MENU_TYPES.map((m) => {
            const meta = MENU_META[m as MenuType];
            const active = value.menuType === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => set("menuType", m)}
                className={cn(
                  "relative rounded-xl px-3 py-3 text-center text-sm font-medium ring-1 transition",
                  active ? "bg-white shadow-md ring-2" : "bg-sand-50 ring-sand-200/80 hover:bg-white",
                )}
                style={active ? { boxShadow: `0 0 0 2px ${meta.color}` } : undefined}
              >
                {active && <Check className="absolute right-1.5 top-1.5 size-3.5" style={{ color: meta.color }} />}
                <span className="mx-auto mb-1.5 grid size-9 place-items-center rounded-xl" style={{ background: `${meta.color}1f`, color: meta.color }}><MenuIcon menu={m} className="size-[18px]" /></span>
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">
          <AlertTriangle className="size-4 text-rose-500" /> Alergii (selecție multiplă)
        </p>
        <div className="flex flex-wrap gap-2">
          {STANDARD_ALLERGIES.map((a) => {
            const on = value.allergies.includes(a);
            return (
              <button
                key={a}
                type="button"
                onClick={() => toggleAllergy(a)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition",
                  on ? "bg-rose-600 text-white ring-rose-600" : "bg-white text-slate-600 ring-sand-200 hover:ring-rose-300",
                )}
              >
                {on && "✓ "}
                {a}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              const next = !otherOn;
              setOtherOn(next);
              applyOther(otherText, next);
            }}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition",
              otherOn ? "bg-rose-600 text-white ring-rose-600" : "bg-white text-slate-600 ring-sand-200 hover:ring-rose-300",
            )}
          >
            {otherOn && "✓ "}Altele
          </button>
        </div>
        {otherOn && (
          <Input
            className="mt-2"
            placeholder="Ex: Căpșuni, Soia (separate prin virgulă)"
            value={otherText}
            onChange={(e) => {
              setOtherText(e.target.value);
              applyOther(e.target.value, true);
            }}
          />
        )}
      </div>

      <Field label="Observații">
        <Textarea rows={2} value={value.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Ex: scaun cu rotile, vine cu bebeluș..." />
      </Field>
    </div>
  );
}
