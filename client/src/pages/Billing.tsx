// client/src/pages/Billing.tsx
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Zap, Target, Rocket } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";

interface BillingProps {
  fixedCosts: Array<{ id: string; name: string; amount: number }>;
  variableCosts: Array<{ id: string; name: string; amount: number }>;
  products: Array<{ id: string; name: string; cost: number; quantity: number }>;
}

type PeriodPreset = "24H" | "7D" | "30D" | "3M" | "6M" | "12M" | "CUSTOM";

type MockSale = {
  id: string;
  createdAt: string;
  items: Array<{ productId: string; quantity: number; unitPrice: number }>;
};

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatRangeLabel(range?: DateRange) {
  const from = range?.from;
  const to = range?.to;
  if (!from && !to) return "Selecione um período";
  if (from && !to) return `${format(from, "dd/MM/yyyy", { locale: ptBR })} → ...`;
  if (!from && to) return `... → ${format(to, "dd/MM/yyyy", { locale: ptBR })}`;
  return `${format(from!, "dd/MM/yyyy", { locale: ptBR })} → ${format(to!, "dd/MM/yyyy", { locale: ptBR })}`;
}

const FILTER_BTN_SELECTED = "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg glow-blue-active";
const FILTER_BTN_DEFAULT = "bg-muted/50 text-foreground hover:bg-muted border border-transparent";

const cardClass =
  "bg-card/50 border border-primary/20 transition-all duration-200 hover:border-primary/70 hover:bg-primary/5 glow-blue-hover";

export default function Billing({ fixedCosts, variableCosts, products }: BillingProps) {
  const [preset, setPreset] = useState<PeriodPreset>("24H");
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(undefined);
  const [appliedRange, setAppliedRange] = useState<DateRange | undefined>(undefined);
  const [includeOperationalCosts, setIncludeOperationalCosts] = useState(true);

  const mockSales: MockSale[] = useMemo(() => {
    const now = new Date();
    const daysAgo = (n: number) => {
      const d = new Date(now);
      d.setDate(now.getDate() - n);
      return d.toISOString();
    };
    const p0 = products[0]?.id;
    const p1 = products[1]?.id;
    const p2 = products[2]?.id;
    if (!p0) return [];
    return [
      {
        id: "s1",
        createdAt: daysAgo(1),
        items: [
          { productId: p0, quantity: 2, unitPrice: 129.9 },
          ...(p1 ? [{ productId: p1, quantity: 1, unitPrice: 89.9 }] : []),
        ],
      },
      { id: "s2", createdAt: daysAgo(5), items: [{ productId: p0, quantity: 1, unitPrice: 129.9 }] },
      { id: "s3", createdAt: daysAgo(15), items: [...(p2 ? [{ productId: p2, quantity: 3, unitPrice: 59.9 }] : [])] },
      { id: "s4", createdAt: daysAgo(40), items: [{ productId: p0, quantity: 1, unitPrice: 129.9 }] },
    ];
  }, [products]);

  function isInSelectedPeriod(date: Date) {
    const now = new Date();
    if (preset === "24H") return date.getTime() >= now.getTime() - 24 * 60 * 60 * 1000;
    if (preset === "7D") return date.getTime() >= now.getTime() - 7 * 24 * 60 * 60 * 1000;
    if (preset === "30D") return date.getTime() >= now.getTime() - 30 * 24 * 60 * 60 * 1000;
    if (preset === "3M") {
      const d = new Date(now);
      d.setMonth(now.getMonth() - 3);
      return date >= d;
    }
    if (preset === "6M") {
      const d = new Date(now);
      d.setMonth(now.getMonth() - 6);
      return date >= d;
    }
    if (preset === "12M") {
      const d = new Date(now);
      d.setFullYear(now.getFullYear() - 1);
      return date >= d;
    }
    const from = appliedRange?.from;
    const to = appliedRange?.to;
    if (!from || !to) return true;
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    return date >= start && date <= end;
  }

  const productCostById = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) map.set(p.id, p.cost);
    return map;
  }, [products]);

  const periodSales = useMemo(
    () => mockSales.filter((s) => isInSelectedPeriod(new Date(s.createdAt))),
    [mockSales, preset, appliedRange]
  );

  const totalRevenue = useMemo(
    () => periodSales.reduce((sum, sale) => sum + sale.items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0), 0),
    [periodSales]
  );

  const cogsProducts = useMemo(
    () =>
      periodSales.reduce(
        (sum, sale) =>
          sum + sale.items.reduce((acc, it) => acc + it.quantity * (productCostById.get(it.productId) ?? 0), 0),
        0
      ),
    [periodSales, productCostById]
  );

  const totalFixedCosts = fixedCosts.reduce((sum, item) => sum + item.amount, 0);
  const totalVariableCosts = variableCosts.reduce((sum, item) => sum + item.amount, 0);
  const operationalCosts = totalFixedCosts + totalVariableCosts;

  const totalCosts = includeOperationalCosts ? cogsProducts + operationalCosts : cogsProducts;
  const totalProfit = totalRevenue - totalCosts;

  // ✅ Agora é número (não string) para facilitar regras
  const profitPercentageNum = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const profitPercentage = profitPercentageNum.toFixed(1);

  const averageProductCost =
    products.length > 0 ? products.reduce((sum, p) => sum + p.cost * p.quantity, 0) / products.length : 0;

  const financialData = [
    { name: "Faturamento", value: totalRevenue },
    { name: "Lucro", value: totalProfit },
    { name: "Despesas", value: totalCosts },
  ];

  // ✅ Regra de cor do card Margem
  const getMarginValueClass = (pct: number) => {
    if (pct === 0) return "text-white";
    if (pct < 0) return "text-red-400";
    if (pct >= 1 && pct <= 12) return "text-yellow-400";
    if (pct >= 13) return "text-emerald-400";
    // pega casos como 0.1% a 0.9% (não caiu no range 1..12)
    return "text-yellow-400";
  };

  const marginValueClass = getMarginValueClass(profitPercentageNum);

  const generateRevenueData = (preset: PeriodPreset) => {
    const baseRevenue = 5000;
    const now = new Date();
    if (preset === "24H")
      return Array.from({ length: 24 }, (_, i) => ({
        label: `${(now.getHours() - 23 + i + 24) % 24}h`,
        receita: Math.round(baseRevenue * 0.1 * (0.5 + Math.random())),
      }));
    if (preset === "7D")
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(now.getDate() - 6 + i);
        return {
          label: format(date, "dd/MM", { locale: ptBR }),
          receita: Math.round(baseRevenue * (0.7 + Math.random() * 0.6)),
        };
      });
    return [];
  };

  const revenueData = useMemo(() => generateRevenueData(preset), [preset, appliedRange]);

  return (
    <div className="space-y-6">
      {/* Barra de filtros */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">Faturamento</h2>
          <span className="text-xs text-muted-foreground">Atualizado agora</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["24H", "7D", "30D", "3M", "6M", "12M"] as const).map((p) => (
            <Button
              key={p}
              variant="secondary"
              onClick={() => setPreset(p)}
              className={preset === p ? FILTER_BTN_SELECTED : FILTER_BTN_DEFAULT}
              size="sm"
            >
              {p}
            </Button>
          ))}
          <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className={preset === "CUSTOM" ? FILTER_BTN_SELECTED : FILTER_BTN_DEFAULT}
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                Personalizar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl bg-card/95 border-primary/30 backdrop-blur">
              <DialogHeader>
                <DialogTitle className="text-primary">Período</DialogTitle>
              </DialogHeader>
              <div className="rounded-xl border border-primary/20 bg-card/50 p-3">
                <Calendar mode="range" selected={draftRange} onSelect={setDraftRange} numberOfMonths={2} locale={ptBR} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setCustomDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  className="bg-emerald-600"
                  onClick={() => {
                    setAppliedRange(draftRange);
                    setPreset("CUSTOM");
                    setCustomDialogOpen(false);
                  }}
                >
                  Filtrar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Barra interativa */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-primary/20 to-cyan-900/10 border border-primary/20 hover:border-primary/40 transition-all group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <Rocket className="w-24 h-24 text-primary" />
        </div>

        <div className="flex items-center gap-4 z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 border border-primary/30 shadow-[0_0_15px_rgba(33,80,175,0.2)]">
            {includeOperationalCosts ? <Target className="h-6 w-6 text-primary" /> : <Rocket className="h-6 w-6 text-cyan-300" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground tracking-tight">
              {includeOperationalCosts ? "Visão de Lucro Real" : "Visão de Operação Pura"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-[280px]">
              {includeOperationalCosts
                ? "Subtraindo gastos operacionais (aluguel, luz, etc) do seu lucro líquido."
                : "Focando apenas no custo do produto vs preço de venda."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 z-10 bg-black/20 p-2 px-4 rounded-2xl border border-white/5">
          <div className="flex flex-col items-end">
            <Label htmlFor="profit-mode" className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">
              {includeOperationalCosts ? "Modo Full" : "Modo Lite"}
            </Label>
            <Switch
              id="profit-mode"
              checked={includeOperationalCosts}
              onCheckedChange={setIncludeOperationalCosts}
              className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-cyan-600 shadow-inner"
            />
          </div>
          <div className="h-8 w-[1px] bg-white/10 mx-1" />
          <div className="flex items-center gap-2">
            {includeOperationalCosts ? (
              <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20">
                <Zap className="h-3.5 w-3.5 text-primary animate-pulse" />
                <span className="text-[11px] font-bold text-primary uppercase">Real</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/20">
                <Rocket className="h-3.5 w-3.5 text-cyan-400" />
                <span className="text-[11px] font-bold text-cyan-300 uppercase">Vendas</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className={cardClass}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white">Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-400">{formatBRL(totalRevenue)}</p>
          </CardContent>
        </Card>

        <Card className={cardClass}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white">Lucro Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-400">{formatBRL(totalProfit)}</p>
          </CardContent>
        </Card>

        <Card className={cardClass}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-100">{formatBRL(averageProductCost)}</p>
          </CardContent>
        </Card>

        <Card className={cardClass}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white">Despesas Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-400">{formatBRL(totalCosts)}</p>
          </CardContent>
        </Card>

        <Card className={cardClass}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white">Margem</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${marginValueClass}`}>{profitPercentage}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className={cardClass}>
          <CardHeader>
            <CardTitle className="text-primary">Performance de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} />
                <Line type="monotone" dataKey="receita" stroke="#06b6d4" strokeWidth={3} dot={{ fill: "#06b6d4" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className={cardClass}>
          <CardHeader>
            <CardTitle className="text-primary">Mix Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={financialData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                  <Cell fill="#06b6d4" />
                  <Cell fill="#2150af" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}