// client/src/components/Sidebar.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Package,
  BarChart3,
  DollarSign,
  ShoppingCart,
  LogOut,
  TrendingUp,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "./ui/button";
import { logout, getUserEmail, getUserName } from "../lib/auth";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
  onLogout?: () => void;
}

type ModuleId = "billing" | "stock" | "costs" | "devolutions" | "sales";

type SidebarModule = {
  id: ModuleId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  order: number;
};

const COLLAPSE_KEY = "ntoh_sidebar_collapsed";
const SIDEBAR_VAR = "--ntoh-sidebar-width";

// Tailwind reference:
// w-64 => 16rem => 256px
// w-20 => 5rem  => 80px
const WIDTH_EXPANDED_PX = 256;
const WIDTH_COLLAPSED_PX = 80;

export function Sidebar({ activeModule, onModuleChange, onLogout }: SidebarProps) {
  const [, setLocation] = useLocation();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [collapsed]);

  // ✅ Garante que a CSS var SEMPRE reflita o estado atual
  useEffect(() => {
    const width = collapsed ? WIDTH_COLLAPSED_PX : WIDTH_EXPANDED_PX;
    document.documentElement.style.setProperty(SIDEBAR_VAR, `${width}px`);
  }, [collapsed]);

  const modules: SidebarModule[] = useMemo(
    () => [
      // ✅ Central de Vendas como primeiro item
      { id: "sales", label: "Central de Vendas", icon: TrendingUp, description: "Acompanhe pedidos e status", order: 10 },

      { id: "billing", label: "Faturamento", icon: BarChart3, description: "Integração Shopee e análise de vendas", order: 20 },
      { id: "stock", label: "Estoque", icon: Package, description: "Gerenciar inventário", order: 30 },
      { id: "costs", label: "Custos", icon: DollarSign, description: "Controlar custos fixos e variáveis", order: 40 },
      { id: "devolutions", label: "Devoluções", icon: ShoppingCart, description: "Rastrear devoluções de clientes", order: 50 },
    ],
    []
  );

  const sortedModules = modules;

  const userName = getUserName();
  const userEmail = getUserEmail();

  const handleLogout = () => {
    const confirmed = window.confirm("Tem certeza que deseja sair?");
    if (!confirmed) return;

    onLogout?.();
    logout();
    toast.success("Você saiu da sua conta!");
    setLocation("/");
  };

  const activeClasses = "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-purple-500/20";
  const idleClasses = "text-sidebar-foreground hover:bg-sidebar-accent/10";

  const renderCollapsedItem = (module: SidebarModule) => {
    const Icon = module.icon;
    const isActive = activeModule === module.id;

    return (
      <Tooltip key={module.id}>
        <TooltipTrigger asChild>
          <button
            onClick={() => onModuleChange(module.id)}
            aria-current={isActive ? "page" : undefined}
            className={[
              "flex items-center justify-center",
              "w-12 h-12 rounded-xl shrink-0",
              "transition-colors duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40",
              isActive ? activeClasses : idleClasses,
            ].join(" ")}
          >
            <Icon className="w-5 h-5 text-current" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <div className="text-sm font-medium">{module.label}</div>
          <div className="text-xs opacity-80">{module.description}</div>
        </TooltipContent>
      </Tooltip>
    );
  };

  const renderExpandedItem = (module: SidebarModule) => {
    const Icon = module.icon;
    const isActive = activeModule === module.id;

    return (
      <button
        key={module.id}
        onClick={() => onModuleChange(module.id)}
        aria-current={isActive ? "page" : undefined}
        className={[
          "w-full text-left p-3 rounded-lg transition-all duration-150",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40",
          isActive ? activeClasses : idleClasses,
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          <Icon className="w-5 h-5 mt-0.5 shrink-0 text-current" />
          <div className="min-w-0">
            <p className="text-sm font-medium">{module.label}</p>
            <p className="text-xs text-sidebar-foreground/60 line-clamp-2">{module.description}</p>
          </div>
        </div>
      </button>
    );
  };

  return (
    <TooltipProvider delayDuration={100}>
      <aside
        className={[
          "fixed left-0 top-0 h-screen z-40",
          "bg-sidebar border-r border-sidebar-border",
          "flex flex-col transition-[width] duration-200 ease-in-out",
          collapsed ? "w-20" : "w-64",
        ].join(" ")}
      >
        {/* Header */}
        <div className={["p-4 sm:p-6 border-b border-sidebar-border flex flex-col", collapsed ? "items-center" : ""].join(" ")}>
          <div className={["flex items-center w-full", collapsed ? "justify-center" : "justify-between"].join(" ")}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded flex items-center justify-center text-white font-bold text-sm shrink-0">
                N
              </div>

              {!collapsed && (
                <div className="min-w-0">
                  <h1 className="text-sm font-bold text-sidebar-foreground truncate">NTOH BUSINESS</h1>
                  <p className="text-xs text-sidebar-foreground/60 truncate">Automação</p>
                </div>
              )}
            </div>

            {!collapsed && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="border-sidebar-border hover:bg-sidebar-accent/20 shrink-0 ml-2"
                onClick={() => setCollapsed(true)}
                title="Minimizar"
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
            )}
          </div>

          {collapsed && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="mt-4 border-sidebar-border hover:bg-sidebar-accent/20"
              onClick={() => setCollapsed(false)}
              title="Expandir"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className={["flex-1 p-4 space-y-4 flex flex-col", collapsed ? "items-center" : "overflow-y-auto"].join(" ")}>
          {collapsed ? sortedModules.map(renderCollapsedItem) : sortedModules.map(renderExpandedItem)}
        </nav>

        {/* Footer */}
        <div className={["p-4 border-t border-sidebar-border flex flex-col", collapsed ? "items-center" : ""].join(" ")}>
          {!collapsed ? (
            <div className="mb-4 p-3 bg-sidebar-accent/10 rounded-lg w-full">
              <p className="text-xs text-sidebar-foreground/60">Usuário</p>
              <p className="text-sm font-medium text-sidebar-foreground mt-1 truncate">{userName || "—"}</p>
              <p className="text-xs text-sidebar-foreground/60 mt-0.5 truncate">{userEmail || "—"}</p>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mb-4 flex justify-center cursor-default">
                  <div className="w-10 h-10 rounded-full bg-sidebar-accent/10 border border-sidebar-border flex items-center justify-center text-sidebar-foreground text-xs font-semibold shrink-0">
                    {(userName || "U").slice(0, 1).toUpperCase()}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className="text-sm font-medium">{userName || "Usuário"}</div>
                <div className="text-xs opacity-80">{userEmail || ""}</div>
              </TooltipContent>
            </Tooltip>
          )}

          <Button
            variant="outline"
            size={collapsed ? "icon" : "sm"}
            className={["border-sidebar-border hover:bg-sidebar-accent/20", collapsed ? "w-12 h-12" : "w-full"].join(" ")}
            onClick={handleLogout}
            title="Sair"
          >
            <LogOut className={collapsed ? "w-4 h-4" : "w-4 h-4 mr-2"} />
            {!collapsed && "Sair"}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}