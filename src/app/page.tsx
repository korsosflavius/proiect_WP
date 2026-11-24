// Comun — pagina de prezentare (landing)
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileDown,
  Grid3x3,
  PiggyBank,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { Logo } from "@/components/app-shell";
import { CategoryMark } from "@/components/icons";
import { CalendarVisual, HeroVisual } from "@/components/landing/visuals";
import { BackgroundSpotlight } from "@/components/landing/background-spotlight";
import { buttonClasses } from "@/components/ui/button-classes";
import { getSession, homeForRole } from "@/lib/auth";
import { CATEGORY_META, VENDOR_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: Grid3x3, title: "Plan 2D al sălii", text: "Aranjează mesele, prezidiul și ringul de dans. Trage invitații direct pe scaune, ca într-un joc.", wide: true },
  { icon: PiggyBank, title: "Tracker de buget", text: "Prețurile furnizorilor confirmați se scad automat. Adaugi cheltuielile extra și primești alerte." },
  { icon: Users, title: "Invitați & RSVP", text: "Listă completă cu căutare instantă, grupuri, statusuri și filtre pe loc la masă." },
  { icon: UtensilsCrossed, title: "Meniuri & alergii", text: "Standard, vegetarian, vegan sau copii — plus alergii multiple pentru fiecare invitat." },
  { icon: FileDown, title: "Export PDF / CSV", text: "Centralizatorul pentru catering și lista pe mese, gata de trimis sălii." },
];

const STEPS = [
  { icon: Search, title: "Alegeți furnizorii", text: "Filtrați după categorie, preț și data nunții. Vedeți doar cine e liber." },
  { icon: ShieldCheck, title: "Rezervați în siguranță", text: "Trimiteți cererea; furnizorul acceptă și data devine ocupată — fără rezervări duble." },
  { icon: Sparkles, title: "Organizați totul", text: "Buget, invitați, meniuri și planul sălii — sincronizate între ele, într-un singur loc." },
];

export default async function Home() {
  const session = await getSession();
  const appHref = session?.user ? homeForRole(session.user.role) : "/register";

  return (
    <div className="min-h-screen bg-sand-50">
      {/* efect de fundal (grila de puncte + reflector la miscarea mouse-ului) — sta SUB continut */}
      <BackgroundSpotlight />
      <div className="relative z-10">
      {/* ------------------------------------------------------------ HEADER */}
      <header className="sticky top-0 z-40 border-b border-transparent bg-sand-50/80 backdrop-blur-xl supports-[backdrop-filter]:bg-sand-50/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo />
          <nav className="hidden items-center gap-1 text-sm text-slate-600 md:flex">
            <a href="#functionalitati" className="rounded-lg px-3 py-2 transition hover:text-ink">Funcționalități</a>
            <a href="#cum-functioneaza" className="rounded-lg px-3 py-2 transition hover:text-ink">Cum funcționează</a>
            <a href="#furnizori" className="rounded-lg px-3 py-2 transition hover:text-ink">Pentru furnizori</a>
            <Link href="/marketplace" className="rounded-lg px-3 py-2 transition hover:text-ink">Marketplace</Link>
          </nav>
          <div className="flex items-center gap-2">
            {session?.user ? (
              <Link href={appHref} className={buttonClasses("dark", "sm")}>
                Intră în aplicație <ArrowRight className="size-3.5" />
              </Link>
            ) : (
              <>
                <Link href="/login" className={buttonClasses("ghost", "sm")}>Autentificare</Link>
                <Link href="/register" className={buttonClasses("dark", "sm")}>Creează cont</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------- HERO */}
      <section className="relative overflow-hidden">
        {/* tenta calda din colturi — transparenta, ca grila de fundal sa se vada si aici */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(48rem 24rem at 15% -8%, rgb(255 227 234 / 0.6) 0%, transparent 60%), radial-gradient(40rem 22rem at 100% 0%, rgb(237 233 254 / 0.5) 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 pb-24 pt-14 lg:grid-cols-[1fr_1.05fr] lg:pb-32 lg:pt-20">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 text-xs font-medium text-slate-600 shadow-[var(--shadow-xs)] ring-1 ring-sand-200">
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-brand-700">Nou</span>
              Plan 2D al sălii cu drag &amp; drop
            </span>
            <h1 className="mt-6 font-display text-[44px] font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-[68px]">
              Nunta voastră,
              <br />
              <span className="text-gradient">organizată perfect.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              WedCraft reunește mirii și furnizorii pe aceeași platformă: rezervări fără bătăi de cap, buget sub
              control, invitați cu meniuri și alergii, plus un plan al sălii pe care îl aranjați vizual.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={appHref} className={buttonClasses("primary", "lg")}>
                Începe planificarea <ArrowRight className="size-4" />
              </Link>
              <Link href="/marketplace" className={buttonClasses("secondary", "lg")}>
                Explorează furnizorii
              </Link>
            </div>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
              {["Gratuit pentru miri", "6 categorii de furnizori", "Fără rezervări duble"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="animate-fade-in px-4 sm:px-8" style={{ animationDelay: "0.1s" }}>
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- CATEGORII */}
      <section className="border-y border-sand-200 bg-white/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-sand-200/50 sm:grid-cols-3 lg:grid-cols-6">
          {VENDOR_CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/marketplace?category=${c}`}
              className="group flex items-center gap-3 bg-white/55 px-6 py-6 transition hover:bg-white/90"
            >
              <CategoryMark category={c} />
              <div>
                <p className="text-sm font-semibold text-ink">{CATEGORY_META[c].plural}</p>
                <p className="flex items-center gap-1 text-xs text-slate-400 transition group-hover:text-brand-600">
                  Vezi oferte <ArrowRight className="size-3 transition group-hover:translate-x-0.5" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------- FUNCTIONALITATI */}
      <section id="functionalitati" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-24 lg:py-32">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-brand-600">Pentru miri</p>
          <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Tot ce aveți nevoie, într-un singur loc.
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Fiecare modul comunică cu celelalte: rezervați o sală și apare automat în buget și în calendarul
            furnizorilor; așezați un invitat și centralizatorul de catering se actualizează.
          </p>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text, wide }) => (
            <div
              key={title}
              className={cn(
                "group relative overflow-hidden rounded-2xl bg-white p-7 shadow-[var(--shadow-card)] ring-1 ring-sand-200/80 transition hover:shadow-[var(--shadow-lift)]",
                wide && "md:col-span-2",
              )}
            >
              <div className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-ink">{title}</h3>
              <p className="mt-1.5 max-w-md text-[15px] leading-relaxed text-slate-600">{text}</p>
              {wide && (
                <div className="bg-dots pointer-events-none absolute -right-10 -top-10 size-56 rounded-full opacity-70 [mask-image:radial-gradient(circle,black,transparent_70%)]" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------- CUM FUNCTIONEAZA */}
      <section id="cum-functioneaza" className="scroll-mt-20 border-y border-sand-200 bg-white/45">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-brand-600">Cum funcționează</p>
            <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              De la idee la ziua cea mare, în trei pași.
            </h2>
          </div>
          <ol className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
            <div className="absolute left-[16%] right-[16%] top-6 hidden h-px bg-gradient-to-r from-transparent via-sand-300 to-transparent md:block" />
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="relative text-center">
                <div className="relative mx-auto grid size-12 place-items-center rounded-2xl bg-white text-ink shadow-[var(--shadow-lift)] ring-1 ring-sand-200">
                  <Icon className="size-5" />
                  <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white ring-2 ring-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-semibold tracking-tight">{title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-slate-600">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* -------------------------------------------------- PENTRU FURNIZORI */}
      <section id="furnizori" className="mx-auto grid max-w-7xl scroll-mt-20 items-center gap-20 px-6 py-24 lg:grid-cols-2 lg:py-32">
        <div>
          <p className="text-sm font-semibold text-brand-600">Pentru furnizori</p>
          <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Calendarul vostru, mereu la zi.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Săli, DJ, trupe, cofetării, fotografi și decoratori își gestionează cererile și disponibilitatea
            într-un singur calendar. La un click pe o dată ocupată vedeți tot ce contează.
          </p>
          <ul className="mt-8 space-y-3.5">
            {[
              "Acceptați sau respingeți cereri, cu preț final negociat",
              "Blocați zile pentru concediu sau evenimente private",
              "Vedeți numele mirilor, sala aleasă, prețul și nr. de invitați",
              "Profil public cu pachete de prețuri și galerie foto",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-[15px] text-slate-700">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-600" /> {t}
              </li>
            ))}
          </ul>
          <Link href="/register" className={cn(buttonClasses("dark", "lg"), "mt-10")}>
            <CalendarDays className="size-4" /> Înscrie-te ca furnizor
          </Link>
        </div>
        <div className="pb-10 pr-4">
          <CalendarVisual />
        </div>
      </section>

      {/* --------------------------------------------------------------- CTA */}
      <section className="px-6 pb-24">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-ink px-8 py-16 text-center sm:px-16 sm:py-20">
          <div className="absolute -top-32 left-1/2 size-[480px] -translate-x-1/2 rounded-full bg-brand-600/40 blur-[120px]" />
          <div className="bg-dots absolute inset-0 opacity-[0.15] [filter:invert(1)]" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Începeți planificarea astăzi.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
              Creați contul în mai puțin de un minut și aveți totul organizat până la ultimul scaun.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link href={appHref} className={buttonClasses("primary", "lg")}>
                Creează cont gratuit <ArrowRight className="size-4" />
              </Link>
              <Link href="/login" className={cn(buttonClasses("ghost", "lg"), "text-white/80 hover:bg-white/10 hover:text-white")}>
                Am deja cont
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ FOOTER */}
      <footer className="border-t border-sand-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              Platformă completă de planificare a nunților — proiect de echipă pentru disciplina Web Programming.
            </p>
          </div>
          {[
            { title: "Pentru miri", links: [["Creează cont", "/register"], ["Marketplace", "/marketplace"], ["Autentificare", "/login"]] },
            { title: "Furnizori", links: VENDOR_CATEGORIES.slice(0, 3).map((c) => [CATEGORY_META[c].label, `/marketplace?category=${c}`]) },
            { title: "Mai mult", links: VENDOR_CATEGORIES.slice(3).map((c) => [CATEGORY_META[c].label, `/marketplace?category=${c}`]) },
          ].map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-ink">{col.title}</p>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
                {col.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href!} className="transition hover:text-ink">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-sand-100">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-slate-400 sm:flex-row">
            <p>© {new Date().getFullYear()} WedCraft · Proiect universitar</p>
            <p>Next.js · Prisma · SQL Server · react-konva · FullCalendar</p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
