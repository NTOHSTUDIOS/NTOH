// client/src/components/ReturnForm.tsx
import { useMemo, useState } from "react";
import { format, isWithinInterval, startOfDay, endOfDay, subDays, subMonths, subYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

import { toast } from "sonner";
import { CalendarDays, CheckCircle2, Copy, Package, Plus, Search, Trash2, ArrowRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// ===== Tipos =====
export type Return = {
  id: string;
  name: string;
  sku: string;
  color: string;
  size: string;
  cost: number;
  quantity: number;
  status: "pending" | "processing" | "completed";
  reason?: string;
  createdAt: string;
};

type PeriodPreset = "24H" | "7D" | "30D" | "3M" | "6M" | "12M" | "CUSTOM";
type KpiFilter = "ALL" | "PENDING" | "PROCESSING" | "COMPLETED";

interface ReturnFormProps {
  returns: Return[];
  onAddReturn: (item: Return) => void;
  onEditReturn: (item: Return) => void;
  onDeleteReturn: (id: string) => void;
  onDuplicateReturn: (item: Return) => void;
  onMoveToProcessing: (id: string) => void;
  onMoveToCompleted: (id: string) => void;
  onAddToStock: (item: Return) => void;
}

// ===== Helpers (copiados/adaptados do Billing) =====
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

// ===== Componente =====
export function ReturnForm({
  returns,
  onAddReturn,
  onEditReturn,
  onDeleteReturn,
  onDuplicateReturn,
  onMoveToProcessing,
  onMoveToCompleted,
  onAddToStock,
}: ReturnFormProps) {
  // Filtro de período (igual Billing)
  const [preset, setPreset] = useState<PeriodPreset>("30D");
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(undefined);
  const [appliedRange, setAppliedRange] = useState<DateRange | undefined>(undefined);

  // Busca
  const [searchTerm, setSearchTerm] = useState("");

  // KPI filter (todos clicáveis)
  const [kpiFilter, setKpiFilter] = useState<KpiFilter>("ALL");

  const toggleKpiFilter = (next: KpiFilter) => {
    setKpiFilter((prev) => (prev === next ? "ALL" : next));
  };

  // Apenas para UI
  const hasFullDraftRange = Boolean(draftRange?.from && draftRange?.to);

  // Lista filtrada: data + busca + KPI
  const filteredReturns = useMemo(() => {
    const now = new Date();

    return returns.filter((item) => {
      // 1) filtro data
      const itemDate = new Date(item.createdAt);
      let inDateRange = true;

      if (preset === "24H") inDateRange = itemDate >= subDays(now, 1);
      if (preset === "7D") inDateRange = itemDate >= subDays(now, 7);
      if (preset === "30D") inDateRange = itemDate >= subDays(now, 30);
      if (preset === "3M") inDateRange = itemDate >= subMonths(now, 3);
      if (preset === "6M") inDateRange = itemDate >= subMonths(now, 6);
      if (preset === "12M") inDateRange = itemDate >= subYears(now, 1);

      if (preset === "CUSTOM") {
        const from = appliedRange?.from;
        const to = appliedRange?.to;
        if (!from || !to) inDateRange = true;
        else {
          inDateRange = isWithinInterval(itemDate, {
            start: startOfDay(from),
            end: endOfDay(to),
          });
        }
      }

      // 2) filtro busca
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        q.length === 0 ||
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q);

      // 3) filtro KPI (status)
      let matchesKpi = true;
      if (kpiFilter === "PENDING") matchesKpi = item.status === "pending";
      if (kpiFilter === "PROCESSING") matchesKpi = item.status === "processing";
      if (kpiFilter === "COMPLETED") matchesKpi = item.status === "completed";

      return inDateRange && matchesSearch && matchesKpi;
    });
  }, [returns, preset, appliedRange, searchTerm, kpiFilter]);

  // KPIs (baseados na lista filtrada por data + busca; sem depender do filtro KPI)
  const kpis = useMemo(() => {
    const base = returns.filter((item) => {
      // aplica somente data + busca para os KPIs, pra não “sumirem” quando clicar
      const now = new Date();
      const itemDate = new Date(item.createdAt);

      let inDateRange = true;

      if (preset === "24H") inDateRange = itemDate >= subDays(now, 1);
      if (preset === "7D") inDateRange = itemDate >= subDays(now, 7);
      if (preset === "30D") inDateRange = itemDate >= subDays(now, 30);
      if (preset === "3M") inDateRange = itemDate >= subMonths(now, 3);
      if (preset === "6M") inDateRange = itemDate >= subMonths(now, 6);
      if (preset === "12M") inDateRange = itemDate >= subYears(now, 1);

      if (preset === "CUSTOM") {
        const from = appliedRange?.from;
        const to = appliedRange?.to;
        if (!from || !to) inDateRange = true;
        else {
          inDateRange = isWithinInterval(itemDate, {
            start: startOfDay(from),
            end: endOfDay(to),
          });
        }
      }

      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        q.length === 0 ||
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q);

      return inDateRange && matchesSearch;
    });

    const pendingCount = base.filter((r) => r.status === "pending").length;
    const processingCount = base.filter((r) => r.status === "processing").length;
    const completedCount = base.filter((r) => r.status === "completed").length;

    const totalQty = base.reduce((sum, r) => sum + r.quantity, 0);
    const totalValue = base.reduce((sum, r) => sum + r.cost * r.quantity, 0);

    return { pendingCount, processingCount, completedCount, totalQty, totalValue };
  }, [returns, preset, appliedRange, searchTerm]);

  const activeKpiLabel =
    kpiFilter === "ALL"
      ? ""
      : kpiFilter === "PENDING"
        ? "Itens devolvidos (pacote chegou)"
        : kpiFilter === "PROCESSING"
          ? "Em processamento"
          : "Concluídas (prontas p/ estoque)";

  return (
    <div className="space-y-6">
      {/* Barra de filtros (mesmo padrão do Billing) */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">Devoluções</h2>
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

            <DialogContent className="sm:max-w-xl bg-card/95 border-primary/30 backdrop-blur">
              <DialogHeader>
                <DialogTitle className="text-primary">Selecionar período</DialogTitle>
              </DialogHeader>

              <div className="rounded-xl border border-primary/20 bg-card/50 p-3">
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

          <Button
            type="button"
            size="sm"
            className={`${FILTER_BTN_SELECTED} px-3`}
            onClick={() => toast.info("Abrir modal de nova devolução (ligar no seu formulário)")}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* KPIs (3 cards, todos clicáveis) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Itens devolvidos (pending) */}
        <button type="button" onClick={() => toggleKpiFilter("PENDING")} className="text-left cursor-pointer">
          <Card className={`${cardClass} ${kpiFilter === "PENDING" ? "ring-2 ring-primary/50" : ""}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Itens Devolvidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{kpis.pendingCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">Clique para ver itens no pacote</p>
            </CardContent>
          </Card>
        </button>

        {/* Em processamento */}
        <button type="button" onClick={() => toggleKpiFilter("PROCESSING")} className="text-left cursor-pointer">
          <Card className={`${cardClass} ${kpiFilter === "PROCESSING" ? "ring-2 ring-primary/50" : ""}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Em processamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{kpis.processingCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">Clique para verificar</p>
            </CardContent>
          </Card>
        </button>

        {/* Processadas */}
        <button type="button" onClick={() => toggleKpiFilter("COMPLETED")} className="text-left cursor-pointer">
          <Card className={`${cardClass} ${kpiFilter === "COMPLETED" ? "ring-2 ring-primary/50" : ""}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Processadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-400">{kpis.completedCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">Clique para ver prontas</p>
            </CardContent>
          </Card>
        </button>
      </div>

      {/* Filtro KPI ativo */}
      {kpiFilter !== "ALL" && (
        <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-card/50 px-3 py-2">
          <p className="text-sm text-muted-foreground">
            Filtro ativo: <span className="text-primary font-medium">{activeKpiLabel}</span>
          </p>

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-sidebar-border hover:bg-sidebar-accent/20"
            onClick={() => setKpiFilter("ALL")}
          >
            Limpar
          </Button>
        </div>
      )}

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou SKU..."
          className="pl-10 bg-card/50 border-primary/20"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Lista */}
      <div className="grid grid-cols-1 gap-4">
        {filteredReturns.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-muted rounded-xl">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-20" />
            <p className="text-muted-foreground">Nenhuma devolução encontrada no período.</p>
          </div>
        ) : (
          filteredReturns.map((item) => (
            <Card key={item.id} className="bg-card/30 border-border/50 hover:border-primary/40 transition-colors">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{item.name}</h3>

                      <Badge
                        variant="outline"
                        className={
                          item.status === "completed"
                            ? "border-emerald-500/40 text-emerald-400"
                            : item.status === "processing"
                              ? "border-primary/40 text-primary"
                              : "border-amber-500/40 text-amber-400"
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      SKU: <span className="text-foreground">{item.sku}</span> | Cor:{" "}
                      <span className="text-foreground">{item.color}</span> | Tam:{" "}
                      <span className="text-foreground">{item.size}</span>
                    </p>

                    <p className="text-xs text-muted-foreground italic">Motivo: {item.reason || "Não informado"}</p>

                    <p className="text-[10px] text-muted-foreground">
                      Registrado em: {format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>

                  <div className="flex flex-col sm:items-end justify-between gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Valor Unitário</p>
                      <p className="text-xl font-bold text-primary">R$ {item.cost.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-end">
                      {item.status === "pending" && (
                        <Button size="sm" variant="outline" onClick={() => onMoveToProcessing(item.id)} className="text-xs">
                          <ArrowRight className="w-3 h-3 mr-1" /> Processar
                        </Button>
                      )}

                      {item.status === "processing" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onMoveToCompleted(item.id)}
                          className="text-xs border-emerald-500/50 text-emerald-400"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Concluir
                        </Button>
                      )}

                      {item.status === "completed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onAddToStock(item)}
                          className="text-xs border-primary/50 text-primary"
                        >
                          <Plus className="w-3 h-3 mr-1" /> Repor Estoque
                        </Button>
                      )}

                      <Button size="sm" variant="ghost" onClick={() => onDuplicateReturn(item)}>
                        <Copy className="w-4 h-4" />
                      </Button>

                      <Button size="sm" variant="ghost" onClick={() => onDeleteReturn(item.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}