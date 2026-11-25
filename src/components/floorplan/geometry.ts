// Persoana 3 — 3.1 / 3.2 geometria planului 2D: dimensiunile meselor si pozitiile scaunelor
export type PlanTable = {
  id: string;
  label: string;
  shape: string; // ROUND | RECTANGLE | STAGE | DANCE_FLOOR
  capacity: number;
  posX: number;
  posY: number;
  rotation: number;
};

export const SEAT_R = 13;
const SEAT_GAP = 18;
export const ROOM = { width: 1200, height: 800 };
export const GRID = 40;

export function tableSize(t: Pick<PlanTable, "shape" | "capacity">) {
  switch (t.shape) {
    case "ROUND": {
      const r = 30 + t.capacity * 2.6;
      return { kind: "circle" as const, r, width: r * 2, height: r * 2 };
    }
    case "RECTANGLE": {
      const perSide = Math.max(Math.ceil(t.capacity / 2), 1);
      return { kind: "rect" as const, width: perSide * 40 + 24, height: 64 };
    }
    case "STAGE":
      return { kind: "rect" as const, width: Math.max(t.capacity, 2) * 44 + 40, height: 54 };
    default: // DANCE_FLOOR
      return { kind: "rect" as const, width: 240, height: 170 };
  }
}

/** Pozitiile scaunelor in coordonate LOCALE (centrul mesei = 0,0, fara rotatie) */
export function seatPositions(t: Pick<PlanTable, "shape" | "capacity">): { x: number; y: number }[] {
  const size = tableSize(t);
  if (t.shape === "DANCE_FLOOR" || t.capacity <= 0) return [];
  if (size.kind === "circle") {
    const d = size.r + SEAT_GAP;
    return Array.from({ length: t.capacity }, (_, i) => {
      const a = (i / t.capacity) * Math.PI * 2 - Math.PI / 2;
      return { x: Math.cos(a) * d, y: Math.sin(a) * d };
    });
  }
  if (t.shape === "STAGE") {
    // prezidiu: scaunele pe o singura latura (cu fata spre sala)
    const step = size.width / t.capacity;
    return Array.from({ length: t.capacity }, (_, i) => ({
      x: -size.width / 2 + step * (i + 0.5),
      y: -size.height / 2 - SEAT_GAP,
    }));
  }
  // dreptunghiulara: jumatate sus, jumatate jos
  const top = Math.ceil(t.capacity / 2);
  const bottom = t.capacity - top;
  const seats: { x: number; y: number }[] = [];
  const stepTop = size.width / top;
  for (let i = 0; i < top; i++) seats.push({ x: -size.width / 2 + stepTop * (i + 0.5), y: -size.height / 2 - SEAT_GAP });
  const stepBottom = bottom ? size.width / bottom : 0;
  for (let i = 0; i < bottom; i++) seats.push({ x: -size.width / 2 + stepBottom * (i + 0.5), y: size.height / 2 + SEAT_GAP });
  return seats;
}

/** Local -> coordonate "lume" (aplica rotatia si pozitia mesei) */
export function toWorld(t: PlanTable, p: { x: number; y: number }) {
  const a = (t.rotation * Math.PI) / 180;
  return {
    x: t.posX + p.x * Math.cos(a) - p.y * Math.sin(a),
    y: t.posY + p.x * Math.sin(a) + p.y * Math.cos(a),
  };
}

/** Lume -> local (inversa) — pentru a verifica daca un punct e "peste" masa */
export function toLocal(t: PlanTable, p: { x: number; y: number }) {
  const a = (-t.rotation * Math.PI) / 180;
  const dx = p.x - t.posX;
  const dy = p.y - t.posY;
  return { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) };
}

/** Cel mai apropiat scaun de un punct (pentru drop) */
export function findSeatAt(tables: PlanTable[], p: { x: number; y: number }, radius = SEAT_R + 10) {
  let best: { tableId: string; seatIndex: number; dist: number } | null = null;
  for (const t of tables) {
    seatPositions(t).forEach((s, i) => {
      const w = toWorld(t, s);
      const dist = Math.hypot(w.x - p.x, w.y - p.y);
      if (dist <= radius && (!best || dist < best.dist)) best = { tableId: t.id, seatIndex: i, dist };
    });
  }
  return best as { tableId: string; seatIndex: number; dist: number } | null;
}

/** Masa aflata sub punct (corpul mesei, nu scaunele) */
export function findTableAt(tables: PlanTable[], p: { x: number; y: number }) {
  for (const t of [...tables].reverse()) {
    if (t.shape === "DANCE_FLOOR") continue;
    const l = toLocal(t, p);
    const s = tableSize(t);
    if (s.kind === "circle" ? Math.hypot(l.x, l.y) <= s.r + 6 : Math.abs(l.x) <= s.width / 2 + 6 && Math.abs(l.y) <= s.height / 2 + 6) {
      return t;
    }
  }
  return null;
}
