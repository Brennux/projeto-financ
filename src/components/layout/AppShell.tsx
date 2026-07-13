"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  LogOut,
  MessageCircle,
  Menu,
  PiggyBank,
  Receipt,
  Search,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/transactions", label: "Transações", icon: Receipt },
  { href: "/settings/budgets", label: "Orçamentos", icon: PiggyBank },
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
  onNavigate?: () => void;
}

function NavLink({ href, label, icon: Icon, active, showLabel, expandable, onNavigate }: NavLinkProps) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-2xl p-3 transition-colors",
        showLabel && "w-full text-sm font-medium",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/30"
          : cn(
              "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              expandable && "bg-sidebar-accent/50",
            ),
      )}
    >
      <Icon className="size-[1.15rem] shrink-0" />
      {showLabel && <span>{label}</span>}
      {expandable && (
        <span className="max-w-0 overflow-hidden opacity-0 whitespace-nowrap transition-[max-width,opacity] duration-300 group-hover/sidebar:max-w-40 group-hover/sidebar:opacity-100">
          {label}
        </span>
      )}
    </Link>
  );
}

interface Props {
  userName: string;
  householdName: string;
  children: React.ReactNode;
}

export function AppShell({ userName, householdName, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [busca, setBusca] = useState("");

  function buscarTransacoes(e: React.FormEvent) {
    e.preventDefault();
    const termo = busca.trim();
    router.push(termo ? `/transactions?q=${encodeURIComponent(termo)}` : "/transactions");
    setMobileOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden w-20 shrink-0 md:block" aria-hidden />
      <aside className="group/sidebar fixed inset-y-0 left-0 z-40 hidden w-20 flex-col gap-6 overflow-hidden border-r border-sidebar-border bg-sidebar py-6 transition-[width,box-shadow] duration-300 ease-in-out hover:w-64 hover:shadow-2xl md:flex">
        <Link
          href="/"
          aria-label="Ir para o dashboard"
          className="flex size-11 shrink-0 items-center justify-center self-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30"
        >
          <Wallet className="size-5" />
        </Link>

        <nav className="flex flex-1 flex-col gap-2 px-2.5">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(pathname, item.href)} expandable />
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

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-64 flex-col gap-6 bg-sidebar p-4 shadow-xl">
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
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-4 md:px-6">
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setMobileOpen(true)}
            className="flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted md:hidden"
          >
            <Menu className="size-5" />
          </button>

          <form onSubmit={buscarTransacoes} className="relative min-w-0 max-w-xs flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar transações..."
              aria-label="Buscar transações"
              className="h-9 w-full rounded-full border border-transparent bg-muted/70 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <Link
              href="/settings/whatsapp"
              title="WhatsApp"
              aria-label="Configurar WhatsApp"
              className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <MessageCircle className="size-[1.1rem]" />
            </Link>
            <ThemeToggle />
            <div className="ml-1 flex items-center gap-2 border-l border-border pl-3">
              <div
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
              >
                {getIniciais(userName)}
              </div>
              <div className="hidden flex-col leading-tight sm:flex">
                <span className="text-sm font-medium">{userName}</span>
                <span className="text-xs font-medium text-primary">{householdName}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
