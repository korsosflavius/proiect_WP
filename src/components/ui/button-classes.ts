// Comun — clasele butoanelor (fisier fara "use client", ca sa poata fi folosit si in Server Components)
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "dark";
export type ButtonSize = "sm" | "md" | "lg";

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-all duration-150",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100",
    "disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
    {
      primary:
        "bg-brand-600 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_1px_2px_rgb(185_18_74/0.35)] hover:bg-brand-700",
      dark: "bg-ink text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_1px_2px_rgb(0_0_0/0.3)] hover:bg-ink/90",
      secondary: "bg-white text-ink shadow-[var(--shadow-xs)] ring-1 ring-inset ring-sand-200 hover:bg-sand-50 hover:ring-sand-300",
      ghost: "text-slate-600 hover:bg-sand-100 hover:text-ink",
      danger: "bg-rose-600 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.15)] hover:bg-rose-700",
      success: "bg-emerald-600 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.15)] hover:bg-emerald-700",
    }[variant],
    { sm: "h-8 px-3 text-[13px]", md: "h-10 px-4 text-sm", lg: "h-12 px-6 text-[15px]" }[size],
  );
}

