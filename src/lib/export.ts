// Persoana 2 — 2.4 Export CSV / PDF pentru sala de evenimente (lista pe mese + alergii + statistici)
// Ruleaza in browser. PDF-ul foloseste fontul Noto Sans (diacritice romanesti corecte).
import type { CateringSummary } from "@/lib/services/guests";
import type { GuestDTO } from "@/lib/services/guests";
import { MENU_META, MENU_TYPES, RSVP_META, type MenuType, type RsvpStatus } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function slug(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}

/** Randuri: toti invitatii care participa, ordonati pe mese (neasezatii la final) */
function rows(summary: CateringSummary) {
  const out: { table: string; seat: string; g: GuestDTO }[] = [];
  for (const t of summary.byTable) for (const g of t.guests) out.push({ table: t.label, seat: String((g.seatIndex ?? 0) + 1), g });
  for (const g of summary.unseated) out.push({ table: "Neașezat", seat: "", g });
  return out;
}

export function exportCSV(summary: CateringSummary) {
  const esc = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const header = ["Masa", "Loc", "Nume", "Grup", "Meniu", "Alergii", "RSVP", "Observatii"];
  const lines = [header.join(";")];
  for (const { table, seat, g } of rows(summary)) {
    lines.push(
      [
        table,
        seat,
        g.fullName,
        g.group ?? "",
        MENU_META[g.menuType as MenuType]?.label ?? g.menuType,
        g.allergies.join(", "),
        RSVP_META[g.rsvpStatus as RsvpStatus]?.label ?? g.rsvpStatus,
        g.notes ?? "",
      ]
        .map(esc)
        .join(";"),
    );
  }
  // separatorul ";" + BOM UTF-8 => se deschide corect in Excel (setari regionale RO)
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  download(blob, `catering-${slug(summary.coupleNames)}.csv`);
}

async function loadFont(url: string) {
  const buf = await (await fetch(url)).arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

export async function exportPDF(summary: CateringSummary) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const [regular, bold] = await Promise.all([loadFont("/fonts/NotoSans-Regular.ttf"), loadFont("/fonts/NotoSans-Bold.ttf")]);
  doc.addFileToVFS("NotoSans-Regular.ttf", regular);
  doc.addFont("NotoSans-Regular.ttf", "Noto", "normal");
  doc.addFileToVFS("NotoSans-Bold.ttf", bold);
  doc.addFont("NotoSans-Bold.ttf", "Noto", "bold");
  doc.setFont("Noto", "normal");

  const brand: [number, number, number] = [220, 29, 88];
  const W = doc.internal.pageSize.getWidth();

  // antet
  doc.setFillColor(...brand);
  doc.rect(0, 0, W, 78, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("Noto", "bold");
  doc.setFontSize(20);
  doc.text(`Centralizator catering — ${summary.coupleNames}`, 40, 38);
  doc.setFont("Noto", "normal");
  doc.setFontSize(11);
  doc.text(`${formatDate(summary.weddingDate)} · ${summary.venueName ?? "Sală nerezervată"} · generat ${new Date().toLocaleDateString("ro-RO")}`, 40, 58);

  doc.setTextColor(30, 20, 39);
  const t = summary.totals;
  doc.setFontSize(11);
  doc.text(
    `Participanți: ${t.attending}  ·  Confirmați: ${t.confirmed}  ·  Neconfirmați: ${t.pending}  ·  Așezați: ${t.seated}  ·  Cu alergii: ${t.withAllergies}`,
    40,
    104,
  );

  const common = {
    styles: { font: "Noto", fontSize: 9.5, cellPadding: 5 },
    headStyles: { fillColor: brand, textColor: 255, fontStyle: "bold" as const },
    alternateRowStyles: { fillColor: [252, 245, 248] as [number, number, number] },
    margin: { left: 40, right: 40 },
  };

  autoTable(doc, {
    ...common,
    startY: 120,
    tableWidth: (W - 100) / 2,
    head: [["Meniu", "Porții"]],
    body: MENU_TYPES.map((m) => [MENU_META[m].label, String(summary.menus[m] ?? 0)]),
    foot: [["Total", String(t.attending)]],
    footStyles: { fillColor: [241, 230, 236], textColor: 30, fontStyle: "bold" },
  });
  autoTable(doc, {
    ...common,
    startY: 120,
    margin: { left: 40 + (W - 100) / 2 + 20, right: 40 },
    head: [["Alergie", "Invitați"]],
    body: Object.entries(summary.allergyCounts)
      .filter(([, n]) => n > 0)
      .map(([a, n]) => [a, String(n)]),
  });

  type WithLast = { lastAutoTable?: { finalY: number } };
  let y = ((doc as unknown as WithLast).lastAutoTable?.finalY ?? 220) + 30;

  doc.setFont("Noto", "bold");
  doc.setFontSize(13);
  doc.text("Lista pe mese", 40, y);
  doc.setFont("Noto", "normal");
  y += 10;

  autoTable(doc, {
    ...common,
    startY: y,
    head: [["Masa", "Loc", "Nume", "Meniu", "Alergii", "Observații"]],
    body: rows(summary).map(({ table, seat, g }) => [
      table,
      seat,
      g.fullName,
      MENU_META[g.menuType as MenuType]?.label ?? g.menuType,
      g.allergies.join(", ") || "—",
      g.notes ?? "",
    ]),
    columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 32, halign: "center" }, 4: { textColor: [190, 18, 60] } },
  });

  // subsol cu numar pagina
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`WedCraft · pagina ${i} din ${pages}`, W - 40, doc.internal.pageSize.getHeight() - 20, { align: "right" });
  }

  doc.save(`catering-${slug(summary.coupleNames)}.pdf`);
}
