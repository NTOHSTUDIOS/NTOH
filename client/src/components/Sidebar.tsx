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

// expanded: 14rem = 224px (w-56)
// collapsed: 4rem  = 64px  (w-16)
const WIDTH_EXPANDED_PX = 224;
const WIDTH_COLLAPSED_PX = 64;

// ✅ seu logo atual está em: client/public/logo-v3.png
const LOGO_SRC = "/logo-v3.png";

/**
 * Glow "LED" mais forte:
 * - Mantém o botão no azul do branding (#2150af = 33,80,175)
 * - Usa um azul mais claro só no brilho (neon)
 */
const BRAND_BLUE_RGB = "33,80,175"; // #2150af
const GLOW_RGB = "80,160,255"; // azul neon mais claro

const GLOW_ACTIVE = `0 0 30px rgba(${GLOW_RGB}, 0.26), 0 0 14px rgba(${BRAND_BLUE_RGB}, 0.15)`;
const GLOW_HOVER = `0 0 22px rgba(${GLOW_RGB}, 0.15), 0 0 10px rgba(${BRAND_BLUE_RGB}, 0.08)`;

export function Sidebar({ activeModule, onModuleChange, onLogout }: SidebarProps) {
  const [, setLocation] = useLocation();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });

  // controla glow no hover sem depender de Tailwind class arbitrária
  const [hoveredId, setHoveredId] = useState<ModuleId | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [collapsed]);

  useEffect(() => {
    const width = collapsed ? WIDTH_COLLAPSED_PX : WIDTH_EXPANDED_PX;
    document.documentElement.style.setProperty(SIDEBAR_VAR, `${width}px`);
  }, [collapsed]);

  const modules: SidebarModule[] = useMemo(
    () => [
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

  const activeClasses = "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg";
  const idleClasses = "text-sidebar-foreground hover:bg-sidebar-accent/10";

  const renderCollapsedItem = (module: SidebarModule) => {
    const Icon = module.icon;
    const isActive = activeModule === module.id;

    return (
      <Tooltip key={module.id}>
        <TooltipTrigger asChild>
          <button
            onClick={() => onModuleChange(module.id)}
            onMouseEnter={() => setHoveredId(module.id)}
            onMouseLeave={() => setHoveredId(null)}
            aria-current={isActive ? "page" : undefined}
            style={{
              boxShadow: isActive ? GLOW_ACTIVE : hoveredId === module.id ? GLOW_HOVER : undefined,
            }}
            className={[
              "flex items-center justify-center",
              "w-8 h-8 rounded-lg shrink-0",
              "transition-colors duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              isActive ? activeClasses : idleClasses,
            ].join(" ")}
          >
            <Icon className="w-4 h-4 text-current" />
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
        onMouseEnter={() => setHoveredId(module.id)}
        onMouseLeave={() => setHoveredId(null)}
        aria-current={isActive ? "page" : undefined}
        style={{
          boxShadow: isActive ? GLOW_ACTIVE : hoveredId === module.id ? GLOW_HOVER : undefined,
        }}
        className={[
          "w-full text-left px-3 py-1.5 rounded-lg transition-all duration-150",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          isActive ? activeClasses : idleClasses,
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          <Icon className="w-4 h-4 mt-0.5 shrink-0 text-current" />
          <div className="min-w-0">
            <p className="text-sm font-medium leading-snug">{module.label}</p>
            <p className="text-xs text-sidebar-foreground/60 line-clamp-2 leading-snug">{module.description}</p>
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
          "overflow-hidden",
          collapsed ? "w-16" : "w-56",
        ].join(" ")}
      >
        {/* Header */}
        <div
          className={[
            "p-3 sm:p-4 border-b border-sidebar-border flex flex-col",
            collapsed ? "items-center" : "",
          ].join(" ")}
        >
          <div className={["flex items-center w-full", collapsed ? "justify-center" : "justify-between"].join(" ")}>
            {/* Logo PNG */}
            <div className={["flex items-center min-w-0", collapsed ? "justify-center" : ""].join(" ")}>
              <img
                src={LOGO_SRC}
                alt="Logo NTOH"
                className={collapsed ? "h-8 w-8 object-contain" : "h-8 w-auto max-w-[140px] object-contain"}
              />
            </div>

            {!collapsed && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="border-sidebar-border hover:bg-sidebar-accent/20 shrink-0 ml-2 h-9 w-9"
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
              className="mt-3 border-sidebar-border hover:bg-sidebar-accent/20 h-9 w-9"
              onClick={() => setCollapsed(false)}
              title="Expandir"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className={["flex-1 p-3 space-y-1.5 flex flex-col", collapsed ? "items-center" : ""].join(" ")}>
          {collapsed ? sortedModules.map(renderCollapsedItem) : sortedModules.map(renderExpandedItem)}
        </nav>

        {/* Footer */}
        <div className={["p-3 border-t border-sidebar-border flex flex-col", collapsed ? "items-center" : ""].join(" ")}>
          {!collapsed ? (
            <div className="mb-3 p-3 bg-sidebar-accent/10 rounded-lg w-full">
              <p className="text-xs text-sidebar-foreground/60">Usuário</p>
              <p className="text-sm font-medium text-sidebar-foreground mt-1 truncate">{userName || "—"}</p>
              <p className="text-xs text-sidebar-foreground/60 mt-0.5 truncate">{userEmail || "—"}</p>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mb-3 flex justify-center cursor-default">
                  <div className="w-9 h-9 rounded-full bg-sidebar-accent/10 border border-sidebar-border flex items-center justify-center text-sidebar-foreground text-xs font-semibold shrink-0">
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
            className={["border-sidebar-border hover:bg-sidebar-accent/20", collapsed ? "w-9 h-9" : "w-full h-9"].join(
              " "
            )}
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