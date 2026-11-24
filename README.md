# 💍 WedCraft — Platformă completă de planificare a nunților

Aplicație web full-stack, multi-rol (**Miri** & **Furnizori**), realizată pentru disciplina **Web Programming** (proiect de echipă — 3 studenți).
Conectează cuplurile care își planifică nunta cu furnizorii de servicii (săli, DJ, trupe, cofetării, fotografi, decoratori) și le oferă unelte interactive: marketplace cu rezervări, tracker de buget, listă de invitați cu meniuri și alergii, un **editor 2D al sălii cu drag & drop** și un **calendar interactiv** pentru furnizori.

---

## Cuprins

1. [Tehnologii](#1-tehnologii)
2. [Pornire rapidă](#2-pornire-rapidă)
3. [Conturi demo](#3-conturi-demo)
4. [Structura proiectului](#4-structura-proiectului)
5. [Arhitectură — cum circulă datele](#5-arhitectură--cum-circulă-datele)
6. [Baza de date](#6-baza-de-date)
7. [Împărțirea pe persoane](#7-împărțirea-pe-persoane)
   - [Persoana 1 — Autentificare, Furnizori & Rezervări](#persoana-1--autentificare-furnizori--rezervări)
   - [Persoana 2 — Miri: Buget, Invitați & Preferințe alimentare](#persoana-2--miri-buget-invitați--preferințe-alimentare)
   - [Persoana 3 — Plan 2D Sală & Calendar Furnizori](#persoana-3--plan-2d-sală--calendar-furnizori)
   - [Părți comune](#părți-comune-toată-echipa)
8. [Scenariu de demonstrație (flux complet)](#8-scenariu-de-demonstrație-flux-complet)
9. [Referință API](#9-referință-api)
10. [Comenzi utile & probleme frecvente](#10-comenzi-utile--probleme-frecvente)

---

## 1. Tehnologii

| Componentă | Tehnologie | Observații |
|---|---|---|
| Limbaj | **TypeScript** (full-stack) | un singur limbaj pe frontend și backend |
| Framework | **Next.js 16** (App Router) | pagini Server Components + Route Handlers (`/api/...`) |
| UI | **React 19**, **Tailwind CSS 4**, **Lucide Icons** | kit propriu de componente în `src/components/ui` |
| Bază de date | **Microsoft SQL Server** (SQLEXPRESS) | autentificare Windows (Integrated Security) |
| ORM | **Prisma 6.19** | schemă tipizată, migrări SQL |
| Autentificare | **NextAuth 4** (Credentials + **bcrypt**) | sesiune JWT cu rolul utilizatorului |
| Validare | **Zod 4** | toate datele primite de API sunt validate |
| Plan 2D sală | **react-konva** (Konva, canvas 2D) | drag & drop mese și invitați |
| Calendar | **FullCalendar 6** (`daygrid`, `list`, `interaction`) | calendarul furnizorilor |
| Export | **jsPDF** + **jspdf-autotable**, CSV nativ | PDF cu font Noto Sans (diacritice corecte) |
| Notificări | **sonner** | toast-uri |

### Abateri față de specificația inițială (și de ce)

| Specificație | Implementare | Motiv |
|---|---|---|
| PostgreSQL | **SQL Server** | cerință a echipei; Prisma suportă ambele |
| `enum` în Prisma | câmpuri `String` + validare **Zod** | SQL Server nu suportă `enum` în Prisma |
| `allergies String[]` | text separat prin virgulă (`"Gluten,Nuci"`) | SQL Server nu suportă liste scalare |
| Prisma (ultima versiune) | **Prisma 6.19** | doar motorul nativ din v6 suportă autentificarea Windows (`integratedSecurity`) fără drivere suplimentare |
| `middleware.ts` | **`proxy.ts`** | în Next.js 16 „Middleware” a fost redenumit „Proxy” |
| FullCalendar 7 | **FullCalendar 6.1** | versiune stabilă, API documentat |

---

## 2. Pornire rapidă

### Cerințe

- **Node.js 20+** (testat pe Node 24) și npm
- **SQL Server** (Express e suficient) cu **TCP/IP activ pe portul 1433**
  - verificare: *SQL Server Configuration Manager → SQL Server Network Configuration → Protocols for SQLEXPRESS → TCP/IP = Enabled*, iar la *IPAll* `TCP Port = 1433`

### Pași

```powershell
# 1. Instalează dependențele (rulează automat și "prisma generate")
npm install

# 2. Creează baza de date (o singură dată)
sqlcmd -S "localhost\SQLEXPRESS" -E -C -Q "CREATE DATABASE wedcraft"

# 3. Configurează variabilele de mediu
copy .env.example .env
#    (implicit folosește autentificarea Windows; vezi .env.example pentru varianta cu user/parolă)
#    Generează un NEXTAUTH_SECRET, de ex.:
#    node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 4. Creează tabelele (aplică migrările)
npm run db:deploy

# 5. Încarcă datele demo
npm run db:seed

# 6. Pornește aplicația
npm run dev
```

Aplicația rulează la **http://localhost:3000** (dacă portul e ocupat, Next.js alege automat 3001).

### Fișierul `.env`

```env
DATABASE_URL="sqlserver://localhost:1433;database=wedcraft;integratedSecurity=true;trustServerCertificate=true"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="un-secret-lung-generat-aleator"
```

> `.env` **nu** se urcă pe Git (e în `.gitignore`). Fiecare membru își creează propriul `.env` din `.env.example`.

---

## 3. Conturi demo

Toate conturile au parola **`parola123`**. Pe pagina de login există butoane pentru autentificare rapidă.

| Rol | Email | Ce conține |
|---|---|---|
| Miri | `andrei.maria@wedcraft.ro` | „Andrei & Maria”, 12 iunie 2027, buget 25.000 €, 24 invitați, plan de sală parțial aranjat, 3 furnizori confirmați + 1 în așteptare |
| Miri | `ioana.mihai@wedcraft.ro` | „Ioana & Mihai”, 21 august 2027, 10 invitați |
| Sală | `sala@wedcraft.ro`, `sala2@wedcraft.ro` | Palatul Florilor (Cluj), Domeniul Vinea (Alba Iulia) |
| DJ | `dj@wedcraft.ro`, `dj2@wedcraft.ro` | **DJ Alex Beat are 2 nunți confirmate**, la săli diferite — ideal pentru demo calendar |
| Trupă | `trupa@wedcraft.ro`, `trupa2@wedcraft.ro` | Trupa Elegance are o cerere în așteptare |
| Cofetărie | `cofetarie@wedcraft.ro`, `cofetarie2@wedcraft.ro` | |
| Fotograf | `foto@wedcraft.ro`, `foto2@wedcraft.ro` | Studio Lumière are o cerere în așteptare |
| Decor | `decor@wedcraft.ro`, `decor2@wedcraft.ro` | |

`npm run db:seed` șterge tot și reface aceste date — util înainte de o prezentare.

---

## 4. Structura proiectului

```
proiect_WP/
├── prisma/
│   ├── schema.prisma          # modelele bazei de date (SQL Server)
│   ├── migrations/            # migrarea inițială + indexurile unice filtrate
│   └── seed.ts                # datele demo
├── public/fonts/              # Noto Sans (pentru export PDF cu diacritice)
├── uploads/                   # imaginile urcate de furnizori (ignorate de Git)
└── src/
    ├── proxy.ts               # protecția rutelor pe roluri (fostul middleware)
    ├── types/next-auth.d.ts   # tipurile sesiunii (rol, weddingId, vendorId)
    ├── lib/
    │   ├── prisma.ts          # clientul Prisma
    │   ├── auth.ts            # configurarea NextAuth + requirePageRole
    │   ├── api.ts             # handle() + requireRole/requireWeddingId/requireVendorId
    │   ├── validators.ts      # schemele Zod
    │   ├── constants.ts       # roluri, categorii, meniuri, alergii, statusuri
    │   ├── utils.ts           # date calendaristice, formatare, alergii
    │   ├── fetcher.ts         # api() — fetch cu erori lizibile (client)
    │   ├── export.ts          # export CSV / PDF
    │   └── services/          # LOGICA DE BUSINESS (folosită de pagini și de API)
    │       ├── vendors.ts     # P1 — marketplace, disponibilitate
    │       ├── bookings.ts    # P1 — rezervări, tranziții de status
    │       ├── budget.ts      # P2 — calculul bugetului
    │       ├── guests.ts      # P2 — invitați, centralizator catering
    │       └── calendar.ts    # P3 — datele calendarului furnizorului
    ├── components/
    │   ├── ui/                # kit UI comun (Button, Card, Modal, Input, ...)
    │   ├── app-shell.tsx      # sidebar + layout aplicație
    │   ├── icons.tsx          # iconițe categorii & meniuri
    │   ├── landing/           # ilustrații + efectul de fundal din landing
    │   ├── vendors/           # P1
    │   ├── couple/            # P2
    │   ├── floorplan/         # P3 — editor 2D
    │   └── calendar/          # P3 — calendar furnizor
    └── app/
        ├── page.tsx           # landing page
        ├── (auth)/            # P1 — login, register
        ├── marketplace/       # P1 — listă + profil furnizor
        ├── couple/            # zona Miri (dashboard, invitați, catering, plan sală, rezervări)
        ├── vendor/            # zona Furnizori (cereri, calendar, profil)
        └── api/               # endpoint-urile REST
```

**Convenție:** fiecare fișier are în antet un comentariu de forma `// Persoana X — X.Y Funcționalitate`, deci se vede imediat cui aparține.

---

## 5. Arhitectură — cum circulă datele

```
Browser ──► proxy.ts (verifică JWT + rol) ──► Pagină (Server Component)
                                                  │  requirePageRole("COUPLE")
                                                  ▼
                                          lib/services/*.ts  ──►  Prisma  ──►  SQL Server
                                                  ▲
Browser (componentă client) ── fetch ──► app/api/*/route.ts
                                          handle(): requireRole() + Zod.parse()
```

- **Paginile** sunt Server Components: își citesc datele direct din `lib/services` și le trimit componentelor client ca props.
- **Componentele interactive** (`"use client"`) fac modificările prin **API** (`fetch` → `/api/...`), apoi apelează `router.refresh()` sau își actualizează starea local (optimist).
- **Securitatea este verificată de 3 ori:**
  1. `proxy.ts`: redirect dacă nu ești logat sau ai alt rol;
  2. fiecare pagină: `requirePageRole`;
  3. fiecare endpoint: `requireRole` / `requireWeddingId` / `requireVendorId` + verificarea că resursa îți aparține.
- **Erori uniforme:** `handle()` din `lib/api.ts` transformă erorile în JSON:
  - `ApiError` → statusul ei;
  - `ZodError` → 400;
  - constrângere unică Prisma → 409;
  - altceva → 500.

---

## 6. Baza de date

| Model | Responsabil | Descriere |
|---|---|---|
| `User` | P1 | cont; `role` = `COUPLE` / `VENDOR` |
| `VendorProfile` | P1 | profil furnizor: nume, categorie, oraș, preț de bază, telefon, capacitate (săli), copertă |
| `VendorImage` | P1 | galeria furnizorului |
| `VendorPackage` | P1 | pachete de servicii cu preț |
| `Booking` | P1 | rezervare: nuntă + furnizor + dată + preț agreat + status (`PENDING`/`CONFIRMED`/`REJECTED`/`CANCELLED`) |
| `Wedding` | P2 | profilul nunții: miri, dată, buget, nr. invitați, `venueName` |
| `BudgetItem` | P2 | cheltuieli extra introduse manual |
| `Guest` | P2 (+P3) | invitat: nume, telefon, grup, RSVP, meniu, alergii; `tableId`/`seatIndex` sunt setate de P3 |
| `VenueTable` | P3 | obiect din planul 2D: formă, capacitate, `posX`, `posY`, `rotation` |
| `BlockedDate` | P3 | zile blocate manual de furnizor |

### Constrângeri importante (în `prisma/migrations/*_init/migration.sql`)

```sql
-- un furnizor NU poate avea 2 rezervări CONFIRMED în aceeași zi (anti double-booking)
CREATE UNIQUE INDEX Booking_vendor_date_confirmed_unique
  ON Booking(vendorId, eventDate) WHERE status = 'CONFIRMED';

-- un scaun poate fi ocupat de un singur invitat
CREATE UNIQUE INDEX Guest_table_seat_unique
  ON Guest(tableId, seatIndex) WHERE tableId IS NOT NULL AND seatIndex IS NOT NULL;
```

Acestea sunt **indexuri unice filtrate** (specifice SQL Server): garanția e la nivelul bazei de date, deci rezistă și la cereri simultane.

---

## 7. Împărțirea pe persoane

Proiectul are **12 funcționalități**, câte **4 pentru fiecare membru**, conform specificației.

---

### Persoana 1 — Autentificare, Furnizori & Rezervări

> Branch recomandat: `feat/auth-vendors`

#### 1.1 Autentificare & Roluri (RBAC)

**Ce face:**
- Înregistrare cu alegerea rolului: **Miri** (cu numele mirilor, data nunții, bugetul și nr. de invitați) sau **Furnizor** (cu una din cele 6 categorii: Sală, DJ, Trupă, Cofetărie, Foto, Decor). Contul și profilul (nuntă / furnizor) se creează împreună, atomic.
- Login cu email și parolă; parolele sunt salvate cu **bcrypt** (hash, niciodată în clar).
- Sesiune **JWT** care conține `role`, `weddingId`, `vendorId`, `category`.
- Rute protejate: `/couple/*` doar pentru miri, `/vendor/*` doar pentru furnizori. Un utilizator logat care intră pe `/login` e trimis la dashboard-ul lui.
- Butoane de login rapid cu conturile demo.

**Fișiere:**
- `src/lib/auth.ts`: configurarea NextAuth, `requirePageRole`, `homeForRole`
- `src/types/next-auth.d.ts`: tipurile sesiunii
- `src/proxy.ts`: protecția rutelor
- `src/app/api/auth/[...nextauth]/route.ts`, `src/app/api/auth/register/route.ts`
- `src/app/(auth)/layout.tsx`, `login/page.tsx`, `login/login-form.tsx`, `register/page.tsx`
- Validări: `loginSchema`, `registerSchema` (union discriminat după `role`) în `src/lib/validators.ts`

**De explicat la prezentare:**
- De ce JWT: nu e nevoie de tabel de sesiuni, iar rolul e disponibil instant în `proxy.ts`.
- Diferența dintre verificarea *optimistă* din `proxy.ts` și cea *definitivă* din pagini/API.
- `registerSchema` validează câmpuri diferite în funcție de rol (`z.discriminatedUnion`).

#### 1.2 Profil Furnizor & Pachete Preț

**Ce face:**
- Furnizorul își editează profilul: nume afacere, oraș, preț de bază, telefon, capacitate (pentru săli), descriere și copertă.
- **Pachete de servicii** (CRUD): nume, preț, ce include.
- **Galerie de imagini:** upload de fișiere (JPG/PNG/WEBP/GIF, max. 5 MB) sau adăugare prin URL, plus ștergere.
- Pagina publică a furnizorului (`/marketplace/[id]`) are copertă, descriere, contact, pachete și galerie cu **lightbox** (navigare cu săgețile tastaturii).

**Fișiere:**
- `src/app/vendor/profile/page.tsx`, `src/components/vendors/vendor-profile-editor.tsx`
- `src/app/marketplace/[id]/page.tsx`, `src/components/vendors/gallery.tsx`, `vendor-image.tsx`
- API:
  - `api/vendors/me` (GET/PATCH)
  - `api/vendors/me/packages` (POST), `.../packages/[id]` (PATCH/DELETE)
  - `api/vendors/me/gallery` (POST), `.../gallery/[id]` (DELETE)
  - `api/upload` (POST), `api/uploads/[file]` (GET)
- `src/lib/services/vendors.ts` → `getVendorPublic`

**De explicat:**
- Upload-ul salvează fișierul în `/uploads` cu nume UUID și îl servește prin `/api/uploads/[file]`. Numele e validat cu regex, ca să nu se poată citi alte fișiere de pe disc (protecție *path traversal*).
- La ștergerea unui pachet, rezervările existente își păstrează prețul agreat; se pierde doar legătura cu pachetul.

#### 1.3 Marketplace & Filtrare Furnizori

**Ce face:**
- Listă cu toți furnizorii, afișați ca carduri.
- Filtre:
  - **categorie** (chips);
  - **preț maxim** (slider);
  - **disponibilitate pe dată**, cu buton rapid „data nunții mele”;
  - **căutare live** cu debounce de 300 ms;
  - **oraș**;
  - **sortare** (preț crescător/descrescător, nume).
- Filtrele sunt ținute în **URL** (`?category=DJ&maxPrice=2000&date=2027-06-12`), deci linkul se poate trimite altcuiva.
- Un furnizor e „disponibil” la o dată dacă **nu are o rezervare confirmată și nici o zi blocată** în acea zi.

**Fișiere:**
- `src/app/marketplace/page.tsx`, `layout.tsx`, `loading.tsx`
- `src/components/vendors/marketplace-filters.tsx`, `vendor-card.tsx`
- `src/lib/services/vendors.ts` → `listVendors`, `vendorAvailability`
- API: `GET /api/vendors?category=&maxPrice=&date=&q=&city=&sort=`, `GET /api/vendors/[id]`

**De explicat:**
- Filtrul de dată în Prisma: `bookings: { none: { status: "CONFIRMED", eventDate } }` și `blockedDates: { none: { date } }`.
- Pagina e randată pe server, iar filtrele modifică URL-ul cu `router.replace` într-un `useTransition` (fără reîncărcarea paginii).

#### 1.4 Sistem de Rezervări (Booking)

**Ce face:**
- Mirii trimit o **cerere de rezervare** pentru data nunții, alegând pachetul și un mesaj. Prețul agreat e prețul pachetului sau prețul de bază.
- Furnizorul vede cererile în **„Cereri rezervare”**, cu tab-urile În așteptare / Confirmate / Respinse. Poate **accepta**, ajustând prețul final negociat, sau **respinge**.
- **La acceptare:**
  - data devine ocupată (apare în calendar și dispare din căutările pe acea dată);
  - celelalte cereri pentru aceeași zi sunt **respinse automat**;
  - dacă furnizorul e o **Sală**, numele ei se salvează automat în nunta mirilor (`venueName`).
- Mirii își văd rezervările și pot **anula**. O sală anulată dispare și din `venueName`.

**Reguli implementate:**

| Cine | Ce poate face | Când |
|---|---|---|
| Miri | trimite cerere | dacă furnizorul e liber și nu există deja o cerere activă la el |
| Miri | anulează | rezervarea e `PENDING` sau `CONFIRMED` |
| Furnizor | acceptă / respinge | doar cererile `PENDING` care îi aparțin |
| Furnizor | — | nu poate accepta o zi deja ocupată sau blocată |

**Fișiere:**
- `src/lib/services/bookings.ts` (logica principală)
- `src/components/vendors/booking-panel.tsx`, `vendor-requests.tsx`, `couple-bookings-list.tsx`, `status-badge.tsx`
- `src/app/couple/bookings/page.tsx`, `src/app/vendor/dashboard/page.tsx`
- API: `GET/POST /api/bookings`, `PATCH /api/bookings/[id]`

**De explicat (punct forte la evaluare):**
- **Protecția anti double-booking** are 3 niveluri:
  1. verificare de disponibilitate în tranzacție;
  2. `updateMany` condiționat de statusul vechi (o cerere deja procesată nu mai poate fi modificată);
  3. **indexul unic filtrat** din SQL Server, ca garanție finală.
- **Testat cu două acceptări simultane** pentru același DJ, în aceeași zi: una reușește, cealaltă primește `409 — Data a fost deja ocupată`.
- De ce nu `Serializable`: pe SQL Server producea deadlock-uri. Indexul unic e soluția mai simplă și mai robustă.

---

### Persoana 2 — Miri: Buget, Invitați & Preferințe alimentare

> Branch recomandat: `feat/couple-guests`

#### 2.1 Dashboard Miri & Tracker de Buget

**Ce face:**
- Antet cu numele mirilor, data nunții, sala rezervată, nr. de invitați și **numărătoare inversă** (zile rămase).
- **Indicatori:**
  - buget total;
  - cheltuit (furnizori + extra);
  - rămas;
  - invitați așezați la mese.
- **Tracker de buget:**
  - bugetul maxim se poate edita direct;
  - prețurile **furnizorilor confirmați se scad automat**;
  - cererile în așteptare apar separat, ca sumă „potențială”;
  - o bară de progres care se colorează galben peste 85% și roșu peste 100%.
- Grafic **„Unde merg banii”**: bară segmentată pe categorii, cu legendă, sume și tooltip la hover. Culorile sunt dintr-o paletă validată pentru daltonism.
- **Cheltuieli extra** (CRUD): descriere, sumă, categorie (Ținută, Verighete, Invitații, Transport, Cazare, Altele).
- **Alerte automate:**
  - depășirea bugetului;
  - consum de peste 85%;
  - „dacă acceptă toți furnizorii în așteptare, depășiți bugetul”;
  - categoriile de furnizori care încă lipsesc.
- **Setările nunții:** numele mirilor, data, telefon, buget, nr. invitați. Data nu se poate schimba cât timp există rezervări active.

**Fișiere:**
- `src/app/couple/dashboard/page.tsx`
- `src/components/couple/couple-dashboard.tsx`, `budget-breakdown.tsx`
- `src/lib/services/budget.ts` → `getBudgetSummary`
- API:
  - `GET/PATCH /api/wedding`
  - `GET/PATCH /api/wedding/budget`
  - `GET/POST /api/wedding/expenses`, `PATCH/DELETE /api/wedding/expenses/[id]`

**De explicat:**
- Bugetul **nu este stocat ca valoare calculată**: se calculează la fiecare cerere din rezervările `CONFIRMED` + `BudgetItem`, deci e mereu corect, oricine ar modifica rezervările.
- Formula: `rămas = totalBudget − (Σ agreedPrice confirmate + Σ cheltuieli extra)`.

#### 2.2 Gestiune Invitați & Live Search

**Ce face:**
- **CRUD complet** pentru invitați: nume, telefon, grup/familie (cu autocompletare din grupurile existente), RSVP (Confirmat / Neconfirmat / Refuzat) și observații.
- **Adăugare rapidă:** un nume pe rând, pentru mai mulți invitați deodată.
- **Căutare instantanee** (live search) după nume, grup, telefon sau masă. Ignoră diacriticele: „ana” găsește și „Ană”.
- **Filtre:**
  - **așezat / neașezat la masă**;
  - tip meniu;
  - alergie (orice / doar cu alergii / o alergie anume);
  - RSVP.
- Tabelul arată avatar colorat după meniu, badge-uri de alergii, masa și locul.
- Un invitat care **refuză** este ridicat automat de la masă.

**Fișiere:**
- `src/app/couple/guests/page.tsx`, `loading.tsx`
- `src/components/couple/guest-manager.tsx`
- `src/lib/services/guests.ts` → `listGuests`, `toGuestDTO`
- API: `GET/POST /api/guests` (filtre `?q=&seated=&menuType=&allergy=&rsvp=`), `PATCH/DELETE /api/guests/[id]`

**De explicat:**
- Căutarea e **pe client** (`useMemo`), deci rezultatul apare instant, fără cereri la server. API-ul suportă aceleași filtre pe server, pentru cine îl folosește direct.
- Normalizarea diacriticelor se face cu `normalize("NFD").replace(/\p{Diacritic}/gu, "")`.

#### 2.3 Preferințe Alimentare & Alergii

**Ce face:**
- Selecția tipului de meniu, cu carduri vizuale: **Standard, Vegetarian, Vegan, Copii**.
- **Selecție multiplă de alergii:** Gluten, Lactoză, Nuci, Fructe de mare, Ouă, plus **„Altele”** cu text liber (ex. „Căpșuni, Soia”).

**Fișiere:**
- `src/components/couple/guest-form.tsx`
- `src/lib/constants.ts` (`MENU_TYPES`, `MENU_META`, `ALLERGIES`)
- `src/lib/utils.ts` (`parseAllergies`, `serializeAllergies`)

**De explicat:**
- SQL Server nu are `String[]`, așa că alergiile sunt salvate ca text: `"Gluten,Nuci"`. Conversia se face într-un singur loc (`parseAllergies` / `serializeAllergies`), iar API-ul primește și trimite mereu un **array**.

#### 2.4 Centralizator Catering & Export

**Ce face:**
- **Statistici automate**, doar pentru invitații care participă. Un rezumat în limbaj natural, pentru datele demo: *„15 Standard, 4 Vegetarian, 2 Vegan, 2 Copii, 4 alergici la nuci, 3 alergici la gluten...”*.
- Grafice cu porții pe meniu și cu invitații alergici.
- **Lista pe mese:** ce primește fiecare masă (meniuri, alergii), plus lista de invitați încă neașezați.
- **Export CSV:**
  - separator `;` și BOM UTF-8, deci se deschide corect în Excel cu setări românești;
  - coloane: Masa, Loc, Nume, Grup, Meniu, Alergii, RSVP, Observații.
- **Export PDF:**
  - antet colorat și sumar;
  - tabele cu meniuri și alergii, apoi lista completă pe mese;
  - număr de pagină;
  - font **Noto Sans**, pentru diacriticele ă, ș, ț.

**Fișiere:**
- `src/app/couple/catering/page.tsx`
- `src/components/couple/catering-view.tsx`
- `src/lib/export.ts` (`exportCSV`, `exportPDF`)
- `src/lib/services/guests.ts` → `getCateringSummary`
- API: `GET /api/catering`
- `public/fonts/NotoSans-*.ttf`

**De explicat:**
- Fonturile implicite din jsPDF nu au ă/ș/ț, de aceea se încarcă un font TTF și se înregistrează cu `addFileToVFS` + `addFont`.
- jsPDF se încarcă **doar la click** (`import()` dinamic), deci nu îngreunează pagina.

---

### Persoana 3 — Plan 2D Sală & Calendar Furnizori

> Branch recomandat: `feat/floorplan-calendar`

#### 3.1 Editor 2D Sală (Top-Down)

**Ce face:**
- Plan interactiv văzut de sus, desenat pe **canvas cu react-konva**:
  - sala, cu o grilă subtilă și marcajul „Intrare”;
  - **zoom** cu rotița mouse-ului (centrat pe cursor) sau cu butoanele +/−;
  - **pan** prin tragerea fundalului;
  - buton „încadrează sala”;
  - **minimapă** cu poziția curentă (click pe ea pentru navigare).
- **Adăugare** de obiecte: masă rotundă, masă dreptunghiulară, **prezidiu** (Masa Mirilor), **ring de dans**.
- **Mutare** prin drag & drop, cu aliniere la 10px.
- **Rotire** cu mânerul Transformer-ului (snap la 45°) sau cu butoanele ±15°.
- **Ștergere**; invitații de la masa ștearsă redevin neașezați.
- Panou de proprietăți pentru masa selectată: nume, nr. de locuri (+/−), rotație.
- **Salvare automată**: fiecare mutare sau rotire trimite `posX`, `posY`, `rotation` la server, cu indicatorul „Se salvează... / Salvat automat”.

**Fișiere:**
- `src/app/couple/floorplan/page.tsx`
- `src/components/floorplan/floor-planner.tsx` (componenta principală)
- `src/components/floorplan/geometry.ts`: dimensiunile meselor, poziția scaunelor, transformări local ↔ lume, hit-testing
- `src/components/floorplan/floor-planner-client.tsx`: încărcare doar în browser (`dynamic`, `ssr: false`)
- API: `GET/POST /api/tables`, `PATCH/DELETE /api/tables/[id]`

**De explicat:**
- Scaunele sunt calculate geometric:
  - **rotundă**: scaune distribuite pe cerc;
  - **dreptunghiulară**: jumătate sus, jumătate jos;
  - **prezidiu**: o singură latură.
- Pentru detectarea scaunului de sub cursor, coordonatele se transformă cu rotația mesei (`toWorld` / `toLocal`).
- La scăderea capacității, invitații de pe scaunele care dispar sunt ridicați automat, atât în interfață, cât și în baza de date.
- În SQL Server relația `Guest → VenueTable` este `NoAction` (evită „multiple cascade paths”), de aceea la ștergerea unei mese invitații sunt ridicați **explicit**, într-o tranzacție.

#### 3.2 Drag & Drop Invitați (stil joc)

**Ce face:**
- Layout **split-screen**: panou stânga (~25%) cu lista căutabilă de invitați, canvas dreapta (~75%).
  - tab-uri **Neașezați / Așezați**;
  - căutare;
  - filtre rapide după meniu și „doar cu alergii”.
- **Tragi un invitat din listă direct pe un scaun.** Scaunul țintă se evidențiază în timpul tragerii. Dacă îl lași pe masă, nu pe un scaun anume, primește primul loc liber.
- **Swap:** tragi un invitat deja așezat pe alt scaun. Dacă scaunul e ocupat, cei doi **schimbă locurile**. Dacă invitatul tras venea din listă, ocupantul devine neașezat.
- Tragi un invitat de pe scaun **înapoi în panoul din stânga** și este ridicat de la masă.
- **Indicatori vizuali pe scaune:**
  - gri = liber;
  - colorat după meniu = ocupat, cu inițialele invitatului;
  - **punct verde** = vegetarian/vegan;
  - **punct roșu** = alergii.
- **Hover** pe scaun: tooltip cu nume, masă/loc, meniu (frunză verde pentru vegetarian/vegan) și alergii (avertizare roșie).
- **Click** pe un scaun ocupat: meniu cu „Ridică de la masă”.
- Buton „+” lângă un invitat, pentru așezare rapidă la masa selectată.

**Fișiere:**
- `src/components/floorplan/floor-planner.tsx` (`seatGuest`, `resolveDrop`, `startSeatDrag`)
- API: `POST /api/seating` `{ guestId, tableId, seatIndex }` (`tableId: null` = ridicare)

**De explicat:**
- Sunt **două mecanisme de drag**:
  - din listă: **HTML5 Drag & Drop** (`dataTransfer`), cu coordonatele convertite în coordonatele canvas-ului cu `stage.setPointersPositions`;
  - de pe scaune: drag propriu pe canvas, cu un „jeton” care urmărește cursorul.
- **Actualizare optimistă:** interfața se schimbă imediat. Dacă serverul răspunde cu eroare, se revine la starea anterioară.
- **Swap-ul pe server** e o tranzacție cu o ordine precisă a pașilor, ca să nu încalce indexul unic „un invitat pe scaun”:
  1. invitatul A devine neașezat;
  2. B ia locul vechi al lui A;
  3. A ia locul țintă.

#### 3.3 Calendar Disponibilitate Furnizor

**Ce face:**
- Calendar lunar **FullCalendar**, cu localizare română și săptămâna începând luni, plus vizualizarea **Listă** (pe tot anul).
- **Cod de culori:**

  | Culoare | Semnificație |
  |---|---|
  | Verde | zi liberă |
  | Gri hașurat | blocată manual de furnizor |
  | Roz închis | nuntă confirmată (cu numele mirilor) |
  | Galben | cerere în așteptare |

- **Click pe o zi liberă:** blocare, cu motiv (Indisponibil / Concediu / Eveniment privat / text liber).
- **Click pe o zi blocată:** deblocare.
- Zilele din trecut nu pot fi modificate.
- Indicatori: nunți viitoare, cereri în așteptare, zile blocate, venit viitor confirmat. Lista „Următoarele nunți” arată câte zile au rămas până la fiecare.
- **Blocarea double-booking-ului:**
  - o zi cu nuntă confirmată nu poate fi blocată;
  - o zi blocată nu mai apare ca disponibilă în marketplace;
  - pe o zi blocată furnizorul nu poate accepta cereri.

**Fișiere:**
- `src/app/vendor/calendar/page.tsx`
- `src/components/calendar/vendor-calendar.tsx`, `vendor-calendar-client.tsx`
- `src/lib/services/calendar.ts` → `getVendorCalendar`
- API: `GET /api/vendors/me/calendar`, `POST/DELETE /api/vendors/me/blocked-dates`
- Stiluri: secțiunea „FullCalendar” din `src/app/globals.css`

#### 3.4 Panou Detalii Nuntă în Calendar

**Ce face:**
- Click pe o zi ocupată (sau pe evenimentul ei) deschide un **modal** cu:
  - **Numele Mirilor**;
  - **Sala de Evenimente**, luată automat din rezervarea de tip VENUE confirmată a mirilor; dacă furnizorul e chiar sala, apare numele lui;
  - **Prețul agreat** pentru acest furnizor (+ pachetul);
  - **Nr. invitați**: estimat + numărul real de pe lista mirilor;
  - **Status**, persoana de contact, email, telefon și mesajul mirilor.
- Pentru cererile în așteptare, furnizorul poate **accepta sau respinge direct din modal**.

**De explicat:**
- Interogarea relațională din `getVendorCalendar` aduce, pentru fiecare rezervare, nunta, contul mirilor, numărul de invitați și **rezervarea VENUE confirmată a acelei nunți**. Astfel DJ-ul vede automat la ce sală cântă.
- Demo bun: **DJ Alex Beat** are două nunți, una la *Palatul Florilor* și una la *Domeniul Vinea*.

---

### Părți comune (toată echipa)

- **Setup:** Next.js, Tailwind, Prisma, SQL Server, `.env`, scripturi npm (săptămâna 1, conform planului).
- **Schema bazei de date** și **seed-ul** (`prisma/`): fiecare a definit modelele zonei sale (vezi tabelul din [secțiunea 6](#6-baza-de-date)).
- **Kit UI** (`src/components/ui`), **iconițe** (`icons.tsx`), **layout aplicație** (`app-shell.tsx`), **skeleton-uri de încărcare**.
- **Utilitare:** `lib/api.ts`, `lib/utils.ts`, `lib/validators.ts`, `lib/constants.ts`, `lib/fetcher.ts`.
- **Landing page** (`src/app/page.tsx` + `components/landing`):
  - ilustrații construite din elementele aplicației;
  - secțiunile „Cum funcționează” și „Pentru furnizori”;
  - efect de fundal cu reflector pe grila de puncte, care apare doar la mișcarea mouse-ului.

---

## 8. Scenariu de demonstrație (flux complet)

Fluxul cerut în specificație (săptămâna 4): *Miri rezervă Sală & DJ → apare în calendarul DJ-ului cu numele sălii → Miri așază invitații la mese.*

1. `npm run db:seed`, ca să ai datele curate.
2. **Login ca miri** (`andrei.maria@wedcraft.ro`), în **Dashboard**:
   - bugetul e deja consumat de sală + DJ + cofetărie;
   - arată alertele și graficul „Unde merg banii”.
3. **Marketplace:**
   - filtrează **Trupe**, apoi apasă butonul „data nunții mele”; apar doar trupele libere;
   - intră pe **Trupa Elegance** → alege pachetul → **Trimite cererea**.
4. **Rezervările mele:** cererea e „În așteptare”.
5. **Login ca trupă** (`trupa@wedcraft.ro`), în **Cereri rezervare**:
   - **Acceptă**, eventual cu alt preț;
   - în **Calendar**, ziua de 12 iunie 2027 e acum ocupată;
   - click pe ea → modalul cu miri, **sala Palatul Florilor**, preț și nr. invitați.
6. **Login ca DJ** (`dj@wedcraft.ro`), în **Calendar**: două nunți la săli diferite. Blochează o zi liberă, apoi arată că DJ-ul dispare din marketplace pe acea dată.
7. **Înapoi la miri:**
   - în **Dashboard**, bugetul a scăzut automat cu prețul trupei;
   - în **Invitați**: caută „ana”, filtrează „Neașezați”, adaugă un invitat vegan cu alergii.
8. **Plan sală:**
   - adaugă o masă, mut-o, rotește-o;
   - trage invitați din listă pe scaune;
   - fă un **swap** între două scaune;
   - arată tooltip-ul cu meniu și alergii.
9. **Catering & export:** arată statisticile, apoi descarcă **PDF** și **CSV**.

---

## 9. Referință API

Toate endpoint-urile răspund în JSON; erorile au forma `{ "error": "mesaj" }`.

| Metodă | Rută | Rol | Persoana | Descriere |
|---|---|---|---|---|
| POST | `/api/auth/register` | public | P1 | creare cont COUPLE / VENDOR |
| GET/POST | `/api/auth/[...nextauth]` | public | P1 | login / logout / sesiune (NextAuth) |
| GET | `/api/vendors` | public | P1 | listă + filtre `category, maxPrice, date, q, city, sort` |
| GET | `/api/vendors/[id]` | public | P1 | profil public |
| GET/PATCH | `/api/vendors/me` | VENDOR | P1 | profilul propriu |
| POST | `/api/vendors/me/packages` | VENDOR | P1 | pachet nou |
| PATCH/DELETE | `/api/vendors/me/packages/[id]` | VENDOR | P1 | editare / ștergere pachet |
| POST | `/api/vendors/me/gallery` | VENDOR | P1 | imagine nouă în galerie (URL) |
| DELETE | `/api/vendors/me/gallery/[id]` | VENDOR | P1 | ștergere imagine |
| POST | `/api/upload` | VENDOR | P1 | upload fișier imagine |
| GET | `/api/uploads/[file]` | public | P1 | servește imaginile urcate |
| GET/POST | `/api/bookings` | autentificat / COUPLE | P1 | rezervările mele / cerere nouă |
| PATCH | `/api/bookings/[id]` | VENDOR / COUPLE | P1 | `CONFIRMED`, `REJECTED` (furnizor) / `CANCELLED` (miri) |
| GET/PATCH | `/api/wedding` | COUPLE | P2 | profilul nunții |
| GET/PATCH | `/api/wedding/budget` | COUPLE | P2 | sumar buget / buget maxim |
| GET/POST | `/api/wedding/expenses` | COUPLE | P2 | cheltuieli extra |
| PATCH/DELETE | `/api/wedding/expenses/[id]` | COUPLE | P2 | editare / ștergere cheltuială |
| GET/POST | `/api/guests` | COUPLE | P2 | listă (filtre `q, seated, menuType, allergy, rsvp`) / invitat nou |
| PATCH/DELETE | `/api/guests/[id]` | COUPLE | P2 | editare / ștergere invitat |
| GET | `/api/catering` | COUPLE | P2 | centralizator statistic |
| GET/POST | `/api/tables` | COUPLE | P3 | mesele din plan / masă nouă |
| PATCH/DELETE | `/api/tables/[id]` | COUPLE | P3 | poziție, rotație, capacitate / ștergere |
| POST | `/api/seating` | COUPLE | P3 | așezare / swap / ridicare invitat |
| GET | `/api/vendors/me/calendar` | VENDOR | P3 | rezervări cu detalii nuntă + zile blocate |
| POST/DELETE | `/api/vendors/me/blocked-dates` | VENDOR | P3 | blocare / deblocare zi (`?date=YYYY-MM-DD` la DELETE) |

**Coduri de răspuns folosite:**

| Cod | Situație |
|---|---|
| `200` | succes |
| `400` | date invalide (Zod) sau regulă încălcată |
| `401` | neautentificat |
| `403` | rol greșit / resursa nu îți aparține |
| `404` | resursă inexistentă |
| `409` | conflict (email existent, dată ocupată, cerere duplicat) |
| `500` | eroare neprevăzută |

---

## 10. Comenzi utile & probleme frecvente

### Scripturi npm

| Comandă | Ce face |
|---|---|
| `npm run dev` | pornește aplicația în modul dezvoltare (reîncărcare automată) |
| `npm run build` / `npm start` | build de producție / rulare build |
| `npm run lint` | ESLint |
| `npm run typecheck` | verificare tipuri TypeScript |
| `npm run db:deploy` | aplică migrările pe baza de date |
| `npm run db:migrate` | creează o migrare nouă după modificarea `schema.prisma` |
| `npm run db:seed` | șterge datele și încarcă datele demo |
| `npm run db:reset` | șterge **tot** (inclusiv tabelele), reaplică migrările și seed-ul |
| `npm run db:studio` | interfață vizuală pentru tabele (Prisma Studio) |

### Probleme frecvente

| Problemă | Soluție |
|---|---|
| `Can't reach database server at localhost:1433` | TCP/IP nu e activ în SQL Server Configuration Manager sau portul nu e 1433; după activare, repornește serviciul `SQL Server (SQLEXPRESS)` |
| `Login failed for user` | folosește varianta cu `user=...;password=...` din `.env.example`, sau verifică faptul că utilizatorul Windows are acces la server |
| `Another next dev server is already running` | există deja un server pornit; folosește-l pe acela (adresa e afișată) sau oprește-l |
| Stilurile din `globals.css` nu se actualizează | oprește `npm run dev`, șterge folderul `.next`, pornește din nou; în browser, **Ctrl + Shift + R** |
| Imaginile demo nu apar | sunt de pe Unsplash și necesită internet; fără internet apare automat un fallback cu iconița categoriei |

### Workflow Git recomandat

- Câte un branch pe persoană: `feat/auth-vendors`, `feat/couple-guests`, `feat/floorplan-calendar`.
- Integrarea finală se face pe `main`.
- **Nu urcați niciodată** `.env` sau folderul `uploads/` (sunt deja în `.gitignore`).
