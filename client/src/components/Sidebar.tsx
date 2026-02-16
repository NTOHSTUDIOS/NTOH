import { Package, BarChart3, DollarSign, ShoppingCart, LogOut, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export function Sidebar({ activeModule, onModuleChange, onLogout }: SidebarProps) {
  const modules: SidebarModule[] = [
    {
      id: "billing",
      label: "Faturamento",
      icon: BarChart3,
      description: "Integração Shopee e análise de vendas",
      order: 10,
    },
    {
      id: "sales",
      label: "Central de Vendas",
      icon: TrendingUp,
      description: "Acompanhe pedidos e status",
      order: 15,
    },
    {
      id: "stock",
      label: "Estoque",
      icon: Package,
      description: "Gerenciar inventário",
      order: 20,
    },
    {
      id: "costs",
      label: "Custos",
      icon: DollarSign,
      description: "Controlar custos fixos e variáveis",
      order: 30,
    },
    {
      id: "devolutions",
      label: "Devoluções",
      icon: ShoppingCart,
      description: "Rastrear devoluções de clientes",
      order: 40,
    },
  ];

  const sortedModules = [...modules].sort((a, b) => a.order - b.order);

  return (
    <div className="w-full sm:w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded flex items-center justify-center text-white font-bold text-sm">
            N
          </div>
          <div>
            <h1 className="text-sm font-bold text-sidebar-foreground">NTOH</h1>
            <p className="text-xs text-sidebar-foreground/60">Automação</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 sm:p-6 space-y-2">
        {sortedModules.map((module) => {
          const Icon = module.icon;
          const isActive = activeModule === module.id;

          return (
            <button
              key={module.id}
              onClick={() => onModuleChange(module.id)}
              className={`w-full text-left p-3 rounded-lg transition-all ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-purple-500/20"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/10"
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{module.label}</p>
                  <p className="text-xs text-sidebar-foreground/60 line-clamp-2">{module.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 sm:p-6 border-t border-sidebar-border">
        <div className="mb-4 p-3 bg-sidebar-accent/10 rounded-lg">
          <p className="text-xs text-sidebar-foreground/60">Usuário</p>
          <p className="text-sm font-medium text-sidebar-foreground mt-1">admin@ntoh.com</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-sidebar-border hover:bg-sidebar-accent/20"
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );
}