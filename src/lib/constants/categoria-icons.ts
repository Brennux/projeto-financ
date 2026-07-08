import {
  Car,
  GraduationCap,
  HeartPulse,
  Home,
  MoreHorizontal,
  Popcorn,
  ShoppingCart,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Categoria } from "./categorias";

export const CATEGORIA_ICONS: Record<Categoria, LucideIcon> = {
  Mercado: ShoppingCart,
  Transporte: Car,
  Moradia: Home,
  "Saúde": HeartPulse,
  "Salário": Wallet,
  Lazer: Popcorn,
  "Educação": GraduationCap,
  Outros: MoreHorizontal,
};

export function getCategoriaIcon(categoria: string): LucideIcon {
  return CATEGORIA_ICONS[categoria as Categoria] ?? MoreHorizontal;
}
