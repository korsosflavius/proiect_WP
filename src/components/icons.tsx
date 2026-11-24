// Comun — set unitar de iconite (Lucide) pentru categorii de furnizori si tipuri de meniu.
// Inlocuiesc emoji-urile (care arata diferit pe fiecare sistem de operare).
import {
  Baby,
  CakeSlice,
  Camera,
  Flower2,
  Guitar,
  Headphones,
  Landmark,
  Leaf,
  Receipt,
  Salad,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { CATEGORY_META, MENU_META, type MenuType, type VendorCategory } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const CATEGORY_ICONS: Record<VendorCategory | "EXTRA", LucideIcon> = {
  VENUE: Landmark,
  DJ: Headphones,
  BAND: Guitar,
  PASTRY: CakeSlice,
  PHOTOGRAPHER: Camera,
  DECORATOR: Flower2,
  EXTRA: Receipt,
};

export const MENU_ICONS: Record<MenuType, LucideIcon> = {
  STANDARD: UtensilsCrossed,
  VEGETARIAN: Salad,
  VEGAN: Leaf,
  KIDS: Baby,
};

export function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const Icon = CATEGORY_ICONS[category as VendorCategory] ?? Landmark;
  return <Icon className={cn("size-4", className)} />;
}

/** Iconita categoriei intr-un cerc colorat discret (culoarea categoriei la ~12%) */
export function CategoryMark({
  category,
  size = "md",
  className,
}: {
  category: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const color = category === "EXTRA" ? "#6250d6" : (CATEGORY_META[category as VendorCategory]?.color ?? "#64748b");
  const Icon = CATEGORY_ICONS[category as VendorCategory] ?? Landmark;
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-xl",
        { sm: "size-7", md: "size-9", lg: "size-12 rounded-2xl" }[size],
        className,
      )}
      style={{ background: `${color}1f`, color }}
    >
      <Icon className={{ sm: "size-3.5", md: "size-[18px]", lg: "size-6" }[size]} />
    </span>
  );
}

export function MenuIcon({ menu, className }: { menu: string; className?: string }) {
  const Icon = MENU_ICONS[menu as MenuType] ?? UtensilsCrossed;
  return <Icon className={cn("size-3.5", className)} />;
}

/** Iconita meniului colorata (frunza verde pentru vegetarian/vegan, cum cere specificatia) */
export function MenuMark({ menu, className }: { menu: string; className?: string }) {
  const tone =
    menu === "VEGETARIAN" || menu === "VEGAN" ? "text-green-600" : menu === "KIDS" ? "text-orange-500" : "text-indigo-500";
  return <MenuIcon menu={menu} className={cn(tone, className)} />;
}

export function menuLabel(menu: string) {
  return MENU_META[menu as MenuType]?.label ?? menu;
}
