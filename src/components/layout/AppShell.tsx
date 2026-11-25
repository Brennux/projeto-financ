"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  LayoutGrid,
  LogOut,
  MessageCircle,
  Menu,
  PiggyBank,
  Receipt,
  Repeat,
  Tags,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import { BuscaGlobal } from "@/components/layout/BuscaGlobal";
import { WhatsAppStatusIndicator } from "@/components/layout/WhatsAppStatusIndicator";
import { PaletaPicker } from "@/components/layout/PaletaPicker";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/transactions", label: "Transações", icon: Receipt },
  { href: "/cards", label: "Cartões", icon: CreditCard },
  { href: "/settings/budgets", label: "Orçamentos", icon: PiggyBank },
  { href: "/settings/categories", label: "Categorias", icon: Tags },
  { href: "/settings/recurring", label: "Recorrentes", icon: Repeat },
  { href: "/settings/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { href: "/settings/household", label: "Household", icon: Users },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

interface NavLinkProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  showLabel?: boolean;
  expandable?: boolean;
  /** Na barra desktop o fundo do item ativo e a pilula que desliza (fora do link). */
  deslizante?: boolean;
  onNavigate?: () => void;
}

function NavLink({ href, label, icon: Icon, active, showLabel, expandable, deslizante, onNavigate }: NavLinkProps) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "group/link relative z-10 flex items-center gap-3 rounded-2xl p-3 transition-[background-color,color,box-shadow,transform] duration-300 ease-out active:scale-95",
        showLabel && "w-full text-sm font-medium",
        deslizante && "h-11",
        active
          ? deslizante
            ? "text-sidebar-primary-foreground"
            : "bg-linear-to-br from-sidebar-primary to-primary-2 text-sidebar-primary-foreground shadow-[inset_0_1px_0_0_oklch(1_0_0/0.2),0_8px_20px_-8px_color-mix(in_oklch,var(--primary)_70%,transparent)]"
          : "text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="size-[1.15rem] shrink-0 transition-transform duration-200 ease-out group-hover/link:scale-110" />
      {showLabel && <span>{label}</span>}
      {expandable && (
        <span className="max-w-0 -translate-x-2 overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity,translate] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/sidebar:max-w-40 group-hover/sidebar:translate-x-0 group-hover/sidebar:opacity-100 group-hover/sidebar:delay-75">
          {label}
        </span>
      )}
    </Link>
  );
}

interface Props {
  userName: string;
  userEmail: string;
  householdName: string;
  children: React.ReactNode;
}

export function AppShell({ userName, userEmail, householdName, children }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const indiceAtivo = NAV_ITEMS.findIndex((item) => isActive(pathname, item.href));

  return (
    // Sem fundo proprio: o fundo vivo (FundoAmbiente, no layout raiz) aparece por tras.
    <div className="flex min-h-screen">
      <Suspense>
        <NavigationProgress />
      </Suspense>
      <div className="hidden w-26 shrink-0 md:block" aria-hidden />
      <aside className="group/sidebar fixed top-3 bottom-3 left-3 z-40 hidden w-20 flex-col gap-5 overflow-hidden rounded-[28px] border border-sidebar-border bg-sidebar/75 py-5 shadow-card backdrop-blur-xl backdrop-saturate-150 transition-[width,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:w-64 hover:shadow-pop md:flex">
        <Link
          href="/"
          aria-label="Ir para o dashboard"
          className="flex size-11 shrink-0 items-center justify-center self-center rounded-2xl bg-linear-to-br from-primary to-primary-2 text-primary-foreground shadow-[inset_0_1px_0_0_oklch(1_0_0/0.25),0_10px_24px_-10px_color-mix(in_oklch,var(--primary)_75%,transparent)] transition-transform duration-300 ease-out hover:scale-105 hover:-rotate-3"
        >
          <Wallet className="size-5" />
        </Link>

        <nav className="relative flex flex-1 flex-col gap-2 px-2.5">
          {/* Pilula do item ativo: desliza de um item pro outro ao navegar (44px de item + 8px de gap). */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-2.5 top-0 h-11 rounded-2xl bg-linear-to-br from-sidebar-primary to-primary-2 shadow-[inset_0_1px_0_0_oklch(1_0_0/0.22),0_10px_24px_-10px_color-mix(in_oklch,var(--primary)_75%,transparent)] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ transform: `translateY(${Math.max(indiceAtivo, 0) * 52}px)`, opacity: indiceAtivo >= 0 ? 1 : 0 }}
          />
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(pathname, item.href)} expandable deslizante />
          ))}
        </nav>

        <form action={logout} className="self-center">
          <button
            type="submit"
            title="Sair"
            aria-label="Sair"
            className="flex size-11 items-center justify-center rounded-2xl text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent hover:text-destructive"
          >
            <LogOut className="size-[1.15rem]" />
          </button>
        </form>
      </aside>

      <div
        className={cn("fixed inset-0 z-50 md:hidden", !mobileOpen && "pointer-events-none")}
        inert={!mobileOpen}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          aria-label="Fechar menu"
          tabIndex={-1}
          className={cn(
            "absolute inset-0 bg-black/60 transition-opacity duration-300 ease-out",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={cn(
            "relative flex h-full w-64 flex-col gap-6 bg-sidebar p-4 shadow-xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 font-semibold text-sidebar-foreground"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Wallet className="size-4.5" />
              </span>
              {householdName}
            </Link>
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setMobileOpen(false)}
              className="flex size-8 items-center justify-center rounded-lg text-sidebar-foreground/65 hover:bg-sidebar-accent"
            >
              <X className="size-4" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                {...item}
                active={isActive(pathname, item.href)}
                showLabel
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
          </nav>

          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-destructive"
            >
              <LogOut className="size-[1.15rem]" />
              Sair
            </button>
          </form>
        </aside>
      </div>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl backdrop-saturate-150 md:px-6">
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setMobileOpen(true)}
            className="flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted md:hidden"
          >
            <Menu className="size-5" />
          </button>

          {/* Busca, status do bot, paleta, tema e avatar: um grupo so, alinhado a direita (como na previa). */}
          <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2">
            <BuscaGlobal />

            <WhatsAppStatusIndicator />
            <PaletaPicker />
            <ThemeToggle />
            <div className="ml-1 flex shrink-0 items-center gap-2.5" title={userEmail}>
              <div
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary-2 text-xs font-semibold text-primary-foreground shadow-[0_0_0_3px_var(--background),0_0_0_4px_var(--border),0_6px_16px_-6px_color-mix(in_oklch,var(--primary)_70%,transparent)]"
              >
                {getIniciais(userName)}
              </div>
              <div className="hidden flex-col leading-tight sm:flex">
                <span className="text-sm font-semibold">{userName}</span>
                <span className="text-xs text-muted-foreground">{householdName}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
