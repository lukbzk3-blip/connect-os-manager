import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Smartphone,
  Users,
  UserCog,
  Wallet,
  Wrench,
} from "lucide-react";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AppLayout,
});

type NavItem = { to: string; label: string; icon: typeof Users; adminOnly?: boolean };

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/aparelhos", label: "Aparelhos", icon: Smartphone },
  { to: "/os", label: "Ordens de Serviço", icon: ClipboardList },
  { to: "/orcamentos", label: "Orçamentos", icon: FileText },
  { to: "/estoque", label: "Estoque", icon: Boxes },
  { to: "/financeiro", label: "Financeiro", icon: Wallet, adminOnly: true },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3, adminOnly: true },
  { to: "/usuarios", label: "Usuários", icon: UserCog, adminOnly: true },
  { to: "/configuracoes", label: "Configurações", icon: Settings, adminOnly: true },
];

const BOTTOM_NAV = NAV.slice(0, 5);

function AppLayout() {
  const { perfil, email, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items = NAV.filter((i) => !i.adminOnly || isAdmin);

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);

  return (
    <div className="flex min-h-screen w-full bg-secondary">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Wrench className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">CONNECT SISTEMAS</p>
            <p className="truncate text-xs text-sidebar-foreground/60">Assistência Técnica</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(item.to)
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="size-4.5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="px-2 pb-2">
            <p className="truncate text-sm font-medium">{perfil?.nome || email}</p>
            <p className="text-xs text-sidebar-foreground/60">{isAdmin ? "Administrador" : "Funcionário"}</p>
          </div>
          <button
            onClick={sair}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent"
          >
            <LogOut className="size-4.5" /> Sair
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header mobile */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card px-3 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Wrench className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">CONNECT SISTEMAS</p>
                  <p className="truncate text-xs text-sidebar-foreground/60">
                    {isAdmin ? "Administrador" : "Funcionário"}
                  </p>
                </div>
              </div>
              <nav className="space-y-1 p-3">
                {items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium",
                      isActive(item.to)
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/80",
                    )}
                  >
                    <item.icon className="size-4.5 shrink-0" />
                    {item.label}
                  </Link>
                ))}
                <button
                  onClick={sair}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-sidebar-foreground/80"
                >
                  <LogOut className="size-4.5" /> Sair
                </button>
              </nav>
            </SheetContent>
          </Sheet>
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-bold tracking-tight">CONNECT SISTEMAS</span>
          </div>
        </header>

        <main className="min-w-0 flex-1 pb-24 lg:pb-8">
          <div className="app-container py-4 lg:py-8">
            <Outlet />
          </div>
        </main>

        {/* Bottom nav mobile */}
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card shadow-float lg:hidden">
          {BOTTOM_NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium",
                isActive(item.to) ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-5" />
              <span className="truncate">{item.label.split(" ")[0]}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
