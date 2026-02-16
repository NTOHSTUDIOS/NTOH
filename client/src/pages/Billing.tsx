// client/src/pages/Billing.tsx
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

interface BillingProps {
  fixedCosts: Array<{ id: string; name: string; amount: number }>;
  variableCosts: Array<{ id: string; name: string; amount: number }>;
  products: Array<{ id: string; name: string; cost: number; quantity: number }>;
}

type PeriodPreset = "24H" | "7D" | "30D" | "3M" | "6M" | "12M" | "CUSTOM";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function formatRangeLabel(range?: DateRange) {
  const from = range?.from;
  const to = range?.to;

  if (!from && !to) return "Selecione um período";
  if (from && !to) return `${format(from, "dd/MM/yyyy", { locale: ptBR })} → ...`;
  if (!from && to) return `... → ${format(to, "dd/MM/yyyy", { locale: ptBR })}`;
  return `${format(from!, "dd/MM/yyyy", { locale: ptBR })} → ${format(to!, "dd/MM/yyyy", { locale: ptBR })}`;
}

const FILTER_BTN_SELECTED = "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-purple-500/20";
const FILTER_BTN_DEFAULT = "bg-muted/50 text-foreground hover:bg-muted border border-transparent";

export default function Billing({ fixedCosts, variableCosts, products }: BillingProps) {
  const [preset, setPreset] = useState<PeriodPreset>("24H");
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(undefined);
  const [appliedRange, setAppliedRange] = useState<DateRange | undefined>(undefined);

  const totalFixedCosts = fixedCosts.reduce((sum, item) => sum + item.amount, 0);
  const totalVariableCosts = variableCosts.reduce((sum, item) => sum + item.amount, 0);
  const totalCosts = totalFixedCosts + totalVariableCosts;

  const totalInventoryValue = products.reduce((sum, p) => sum + p.cost * p.quantity, 0);
  const averageProductCost = products.length > 0 ? totalInventoryValue / products.length : 0;

  const costData = [
    { name: "Fixos", value: totalFixedCosts },
    { name: "Variáveis", value: totalVariableCosts },
  ];

  const COLORS = ["#a855f7", "#06b6d4"];

  // Função para gerar dados de receita baseados no preset (para o gráfico de linhas)
  const generateRevenueData = (preset: PeriodPreset) => {
    const baseRevenue = 5000; // Receita base por período
    const now = new Date();

    if (preset === "24H") {
      // Últimas 24 horas (por hora)
      return Array.from({ length: 24 }, (_, i) => {
        const hour = (now.getHours() - 23 + i + 24) % 24;
        return {
          label: `${hour}h`,
          receita: Math.round(baseRevenue * 0.1 * (0.5 + Math.random())), // Receita por hora
        };
      });
    } else if (preset === "7D") {
      // Últimos 7 dias (por dia)
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(now.getDate() - 6 + i);
        return {
          label: format(date, "dd/MM", { locale: ptBR }),
          receita: Math.round(baseRevenue * (0.7 + Math.random() * 0.6)), // Receita por dia
        };
      });
    } else if (preset === "30D") {
      // Últimos 30 dias (por dia, resumido em semanas)
      return Array.from({ length: 4 }, (_, i) => ({
        label: `Sem ${i + 1}`,
        receita: Math.round(baseRevenue * 7 * (0.8 + Math.random() * 0.4)), // Receita por semana
      }));
    } else if (preset === "3M") {
      // Últimos 3 meses (por mês)
      return Array.from({ length: 3 }, (_, i) => {
        const date = new Date(now);
        date.setMonth(now.getMonth() - 2 + i);
        return {
          label: format(date, "MMM", { locale: ptBR }),
          receita: Math.round(baseRevenue * (0.9 + Math.random() * 0.2)), // Receita por mês
        };
      });
    } else if (preset === "6M") {
      // Últimos 6 meses (por mês)
      return Array.from({ length: 6 }, (_, i) => {
        const date = new Date(now);
        date.setMonth(now.getMonth() - 5 + i);
        return {
          label: format(date, "MMM", { locale: ptBR }),
          receita: Math.round(baseRevenue * (0.9 + Math.random() * 0.2)),
        };
      });
    } else if (preset === "12M") {
      // Últimos 12 meses (por mês)
      return Array.from({ length: 12 }, (_, i) => {
        const date = new Date(now);
        date.setMonth(now.getMonth() - 11 + i);
        return {
          label: format(date, "MMM", { locale: ptBR }),
          receita: Math.round(baseRevenue * (0.9 + Math.random() * 0.2)),
        };
      });
    } else if (preset === "CUSTOM") {
      // Para CUSTOM, use o range aplicado
      const from = appliedRange?.from;
      const to = appliedRange?.to;
      if (!from || !to) return [];
      const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
      return Array.from({ length: Math.min(daysDiff, 30) }, (_, i) => {
        const date = new Date(from);
        date.setDate(from.getDate() + i);
        return {
          label: format(date, "dd/MM", { locale: ptBR }),
          receita: Math.round(baseRevenue * 0.1 * (0.8 + Math.random() * 0.4)),
        };
      });
    }
    return [];
  };

  const baseMonthlyData = useMemo(
    () => [
      { month: "Jan", receita: 5000, custos: totalCosts },
      { month: "Fev", receita: 6000, custos: totalCosts },
      { month: "Mar", receita: 5500, custos: totalCosts },
      { month: "Abr", receita: 7000, custos: totalCosts },
      { month: "Mai", receita: 8000, custos: totalCosts },
      { month: "Jun", receita: 7500, custos: totalCosts },
      { month: "Jul", receita: 7200, custos: totalCosts },
      { month: "Ago", receita: 6800, custos: totalCosts },
      { month: "Set", receita: 7900, custos: totalCosts },
      { month: "Out", receita: 6100, custos: totalCosts },
      { month: "Nov", receita: 8300, custos: totalCosts },
      { month: "Dez", receita: 9100, custos: totalCosts },
    ],
    [totalCosts]
  );

  const monthlyData = useMemo(() => {
    const monthsByPreset: Record<Exclude<PeriodPreset, "CUSTOM">, number> = {
      "24H": 1, "7D": 1, "30D": 1, "3M": 3, "6M": 6, "12M": 12,
    };
    if (preset !== "CUSTOM") {
      const n = monthsByPreset[preset];
      return baseMonthlyData.slice(-n);
    }
    const from = appliedRange?.from;
    const to = appliedRange?.to;
    if (!from || !to || from > to) return baseMonthlyData.slice(-3);
    const monthsDiff = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1;
    const safeMonths = clamp(monthsDiff, 1, 12);
    return baseMonthlyData.slice(-safeMonths);
  }, [preset, appliedRange, baseMonthlyData]);

  // Dados para o gráfico de linhas (faturamento)
  const revenueData = useMemo(() => generateRevenueData(preset), [preset, appliedRange]);

  const totalRevenue = monthlyData.reduce((sum, m) => sum + m.receita, 0);
  const totalCostsPeriod = monthlyData.reduce((sum, m) => sum + m.custos, 0);
  const totalProfit = totalRevenue - totalCostsPeriod;

  // Percentual de lucro
  const profitPercentage = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Dados para o gráfico circular (Faturamento vs Lucro vs Despesas)
  const financialData = [
    { name: "Faturamento", value: totalRevenue },
    { name: "Lucro", value: totalProfit },
    { name: "Despesas", value: totalCostsPeriod },
  ];

  const hasFullDraftRange = Boolean(draftRange?.from && draftRange?.to);

  const cardClass =
    "bg-card/50 border border-purple-500/20 transition-all duration-200 hover:border-purple-400/70 hover:bg-purple-500/5 hover:shadow-[0_0_22px_rgba(168,85,247,0.25)]";

  return (
    <div className="space-y-6">
      {/* Barra de filtros */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">Faturamento</h2>
          <span className="text-xs text-muted-foreground">
            Atualizado em: {new Date().toLocaleDateString("pt-BR")} às{" "}
            {new Date().toLocaleTimeString("pt-BR").slice(0, 5)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(["24H", "7D", "30D", "3M", "6M", "12M"] as const).map((p) => (
            <Button
              key={p}
              type="button"
              variant="secondary"
              onClick={() => setPreset(p)}
              className={preset === p ? FILTER_BTN_SELECTED : FILTER_BTN_DEFAULT}
              size="sm"
            >
              {p}
            </Button>
          ))}

          <Dialog
            open={customDialogOpen}
            onOpenChange={(open) => {
              setCustomDialogOpen(open);
              if (open) {
                setPreset("CUSTOM");
                setDraftRange(appliedRange);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className={preset === "CUSTOM" ? FILTER_BTN_SELECTED : FILTER_BTN_DEFAULT}
                onClick={() => setPreset("CUSTOM")}
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                Personalizar
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-xl bg-card/95 border-purple-500/30 backdrop-blur">
              <DialogHeader>
                <DialogTitle className="text-cyan-300">Selecionar período</DialogTitle>
              </DialogHeader>

              <div className="rounded-xl border border-purple-500/20 bg-card/50 p-3">
                <p className="text-sm text-muted-foreground mb-2">{formatRangeLabel(draftRange)}</p>
                <Calendar
                  mode="range"
                  selected={draftRange}
                  onSelect={setDraftRange}
                  numberOfMonths={2}
                  locale={ptBR}
                  initialFocus
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-sidebar-border hover:bg-sidebar-accent/20"
                  onClick={() => setDraftRange(undefined)}
                >
                  Limpar
                </Button>
                <div className="flex gap-2 sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-sidebar-border hover:bg-sidebar-accent/20"
                    onClick={() => setCustomDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    className="bg-emerald-600 hover:bg-emerald-600/90"
                    disabled={!hasFullDraftRange}
                    onClick={() => {
                      setAppliedRange(draftRange);
                      setPreset("CUSTOM");
                      setCustomDialogOpen(false);
                    }}
                  >
                    Filtrar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button type="button" size="sm" className={`${FILTER_BTN_SELECTED} px-3`}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
        <Card className={cardClass}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-cyan-300">{formatBRL(totalRevenue)}</p>
          </CardContent>
        </Card>

        <Card className={cardClass}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Lucro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-cyan-300">{formatBRL(totalProfit)}</p>
          </CardContent>
        </Card>

        <Card className={cardClass}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-cyan-300">{formatBRL(averageProductCost)}</p>
          </CardContent>
        </Card>

        <Card className={cardClass}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Custos Operacionais</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-cyan-300">{formatBRL(totalCosts)}</p>
          </CardContent>
        </Card>

        <Card className={cardClass}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Margem de Lucro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-cyan-300">{profitPercentage}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Desempenho de Faturamento (Gráfico de Linhas) */}
        <Card className={cardClass}>
          <CardHeader>
            <CardTitle className="text-cyan-300">Desempenho de Faturamento ({preset === "CUSTOM" ? "período" : preset})</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }}
                  itemStyle={{ color: "#f8fafc" }}
                  formatter={(value: any) => formatBRL(Number(value))}
                />
                <Line
                  type="monotone"
                  dataKey="receita"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={{ fill: "#06b6d4", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#06b6d4", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Faturamento vs Lucro vs Despesas (Gráfico Circular) */}
        <Card className={cardClass}>
          <CardHeader>
            <CardTitle className="text-cyan-300">Faturamento vs Lucro vs Despesas ({preset === "CUSTOM" ? "período" : preset})</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={financialData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${formatBRL(Number(value))} (${(percent * 100).toFixed(1)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#06b6d4" /> {/* Faturamento */}
                  <Cell fill="#10b981" /> {/* Lucro */}
                  <Cell fill="#a855f7" /> {/* Despesas */}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }}
                  itemStyle={{ color: "#f8fafc" }}
                  formatter={(value: any) => formatBRL(Number(value))}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}