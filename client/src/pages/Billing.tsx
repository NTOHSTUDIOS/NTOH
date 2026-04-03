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

// ✅ Interface atualizada para bater com o Dashboard.tsx e ProductForm.tsx
interface ProductVariation {
  id: string;
  sku: string;
  color: string;
  size: string;
  quantity: number;
  cost: number; // Agora usamos 'cost' em vez de 'price'
}

interface Product {
  id: string;
  name: string;
  sku: string;
  cost: number; // Agora usamos 'cost' em vez de 'base_price'
  variations: ProductVariation[];
}

interface BillingProps {
  fixedCosts: Array<{ id: string; name: string; amount: number }>;
  variableCosts: Array<{ id: string; name: string; amount: number }>;
  products: Product[];
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
    // ✅ Usando 'cost' em vez de 'base_price'
    for (const p of products) map.set(p.id, p.cost || 0);
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

  const profitPercentageNum = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const profitPercentage = profitPercentageNum.toFixed(1);

  // ✅ Ajustado para somar quantidades de todas as variações usando 'cost'
  const averageProductCost = useMemo(() => {
    if (products.length === 0) return 0;
    const totalInventoryValue = products.reduce((sum, p) => {
      const totalQty = p.variations?.reduce((vSum, v) => vSum + (Number(v.quantity) || 0), 0) || 0;
      return sum + (Number(p.cost) || 0) * totalQty;
    }, 0);
    return totalInventoryValue / products.length;
  }, [products]);

  const financialData = [
    { name: "Faturamento", value: totalRevenue },
    { name: "Lucro", value: totalProfit },
    { name: "Despesas", value: totalCosts },
  ];

  const getMarginValueClass = (pct: number) => {
    if (pct === 0) return "text-white";
    if (pct < 0) return "text-red-400";
    if (pct >= 1 && pct <= 12) return "text-yellow-400";
    if (pct >= 13) return "text-emerald-400";
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
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 border border-primary/30 shadow-[0_0_15px_rgba(33,80,17,0.3)]">
            <Target className="w-6 h-6 text-primary" />
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

        <div className="flex items-center gap-3 z-10 bg-black/20 p-2 rounded-2xl border border-white/5">
          <Label htmlFor="costs-toggle" className="text-xs font-medium text-muted-foreground">
            Incluir Gastos Operacionais
          </Label>
          <Switch id="costs-toggle" checked={includeOperationalCosts} onCheckedChange={setIncludeOperationalCosts} />
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={cardClass}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Bruta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatBRL(totalRevenue)}</div>
            <p className="text-xs text-emerald-400 mt-1">Total de vendas no período</p>
          </CardContent>
        </Card>

        <Card className={cardClass}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {formatBRL(totalProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Após descontar custos</p>
          </CardContent>
        </Card>

        <Card className={cardClass}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Margem de Lucro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${marginValueClass}`}>{profitPercentage}%</div>
            <p className="text-xs text-muted-foreground mt-1">Eficiência da operação</p>
          </CardContent>
        </Card>

        <Card className={cardClass}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Custo Operacional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{formatBRL(totalCosts)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total investido/gasto</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card/50 border-primary/20">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> Desempenho de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `R$${val}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }}
                    itemStyle={{ color: "#0ea5e9" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="receita"
                    stroke="#0ea5e9"
                    strokeWidth={3}
                    dot={{ fill: "#0ea5e9", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-primary/20">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Distribuição Financeira</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={financialData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#0ea5e9" />
                    <Cell fill="#10b981" />
                    <Cell fill="#f43f5e" />
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {financialData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: ["#0ea5e9", "#10b981", "#f43f5e"][i] }}
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium text-white">{formatBRL(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}