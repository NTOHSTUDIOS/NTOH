// client/src/pages/SalesCentral.tsx
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type OrderStatus = "pending" | "processing" | "shipped" | "returned";

type MarketplaceOrder = {
  id: string;
  customerName: string;
  channel: "Shopee" | "Mercado Livre" | "Shein" | "Loja";
  status: OrderStatus;
  total: number;
  cost: number; // custo total do pedido (para lucro)
  createdAt: string; // ISO
};

function toDayKey(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pendente",
  processing: "Em andamento",
  shipped: "Enviado",
  returned: "Devolução",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: "text-yellow-400",
  processing: "text-primary",
  shipped: "text-primary",
  returned: "text-red-400",
};

const CHANNEL_DOT: Record<MarketplaceOrder["channel"], string> = {
  Shopee: "bg-orange-500",
  "Mercado Livre": "bg-yellow-400",
  Shein: "bg-pink-500",
  Loja: "bg-cyan-400",
};

export default function SalesCentral() {
  const now = new Date();
  const today = now.toISOString();
  const todayKey = toDayKey(today);

  // Mock (MVP). Depois você troca por API.
  const [orders] = useState<MarketplaceOrder[]>([
    {
      id: "ML-12001",
      customerName: "Ana Souza",
      channel: "Mercado Livre",
      status: "pending",
      total: 189.9,
      cost: 92.0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "SHP-88211",
      customerName: "Bruno Lima",
      channel: "Shopee",
      status: "processing",
      total: 79.9,
      cost: 31.0,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: "SHE-33210",
      customerName: "Carla Ribeiro",
      channel: "Shein",
      status: "shipped",
      total: 249.0,
      cost: 121.0,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
    {
      id: "LOJ-10090",
      customerName: "Diego Santos",
      channel: "Loja",
      status: "returned",
      total: 129.9,
      cost: 60.0,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    },
    {
      id: "SHP-88212",
      customerName: "Evelyn Martins",
      channel: "Shopee",
      status: "pending",
      total: 159.9,
      cost: 78.0,
      createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    },
    {
      id: "ML-12002",
      customerName: "Felipe Rocha",
      channel: "Mercado Livre",
      status: "processing",
      total: 299.9,
      cost: 160.0,
      createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    },
  ]);

  const stats = useMemo(() => {
    const todayOrders = orders.filter((o) => toDayKey(o.createdAt) === todayKey);

    const pending = orders.filter((o) => o.status === "pending").length;
    const processing = orders.filter((o) => o.status === "processing").length;
    const shipped = orders.filter((o) => o.status === "shipped").length;
    const returned = orders.filter((o) => o.status === "returned").length;

    const soldToday = todayOrders
      .filter((o) => o.status !== "returned")
      .reduce((sum, o) => sum + o.total, 0);

    const costToday = todayOrders
      .filter((o) => o.status !== "returned")
      .reduce((sum, o) => sum + o.cost, 0);

    const netProfitToday = soldToday - costToday;

    return {
      pending,
      processing,
      shipped,
      returned,
      soldToday,
      netProfitToday,
      todayOrders,
    };
  }, [orders, todayKey]);

  const pendingOrders = useMemo(() => orders.filter((o) => o.status === "pending"), [orders]);
  const processingOrders = useMemo(() => orders.filter((o) => o.status === "processing"), [orders]);
  const shippedOrders = useMemo(() => orders.filter((o) => o.status === "shipped"), [orders]);

  // Estilo KPI igual ao Estoque
  const kpiCardClass =
    "bg-card/50 border border-primary/20 transition-all duration-200 hover:border-primary/70 glow-blue-hover min-w-0";
  const kpiTitleClass = "text-sm text-white";
  const kpiValueBase = "text-3xl font-bold leading-none";

  // Regras de cor
  const pendingValueClass = "text-yellow-400";
  const processingValueClass = "text-white";
  const shippedValueClass = "text-emerald-400";

  const netProfitTodayClass = stats.netProfitToday < 0 ? "text-red-400" : "text-emerald-400";

  // devoluções = branco quando 0, vermelho quando > 0
  const returnedValueClass = stats.returned === 0 ? "text-white" : "text-red-400";

  return (
    <div className="space-y-5 overflow-x-hidden min-w-0">
      {/* KPIs (3 em cima + 3 embaixo) */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Card className={kpiCardClass}>
            <CardHeader className="pb-3">
              <CardTitle className={kpiTitleClass}>Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`${kpiValueBase} ${pendingValueClass}`}>{stats.pending}</p>
            </CardContent>
          </Card>

          <Card className={kpiCardClass}>
            <CardHeader className="pb-3">
              <CardTitle className={kpiTitleClass}>Em andamento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`${kpiValueBase} ${processingValueClass}`}>{stats.processing}</p>
            </CardContent>
          </Card>

          <Card className={kpiCardClass}>
            <CardHeader className="pb-3">
              <CardTitle className={kpiTitleClass}>Enviados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`${kpiValueBase} ${shippedValueClass}`}>{stats.shipped}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Card className={kpiCardClass}>
            <CardHeader className="pb-3">
              <CardTitle className={kpiTitleClass}>Devoluções</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`${kpiValueBase} ${returnedValueClass}`}>{stats.returned}</p>
            </CardContent>
          </Card>

          <Card className={kpiCardClass}>
            <CardHeader className="pb-3">
              <CardTitle className={kpiTitleClass}>Total vendido hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`${kpiValueBase} text-emerald-400 truncate`}>{formatBRL(stats.soldToday)}</p>
            </CardContent>
          </Card>

          <Card className={kpiCardClass}>
            <CardHeader className="pb-3">
              <CardTitle className={kpiTitleClass}>Lucro líquido hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`${kpiValueBase} ${netProfitTodayClass} truncate`}>{formatBRL(stats.netProfitToday)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filas / Kanban */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-primary/20 glow-blue-hover min-w-0">
          <CardHeader className="py-4">
            <CardTitle className="text-primary">Pendentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 min-w-0">
            {pendingOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem pendências</p>
            ) : (
              pendingOrders.map((o) => (
                <div
                  key={o.id}
                  className="rounded-lg border border-primary/10 bg-card/30 p-3 hover:border-primary/40 transition-all min-w-0"
                  style={{
                    boxShadow: "0 0 18px rgba(80, 160, 255, 0.18), 0 0 10px rgba(33, 80, 175, 0.12)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">#{o.id}</p>
                      <p className="text-xs text-muted-foreground truncate">{o.customerName}</p>
                      <p className="text-xs text-muted-foreground">{formatBRL(o.total)}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`w-2.5 h-2.5 rounded-full ${CHANNEL_DOT[o.channel]}`} />
                      <span className={`text-xs font-semibold ${STATUS_COLOR[o.status]} whitespace-nowrap`}>
                        {STATUS_LABEL[o.status]}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 min-w-[110px] border-sidebar-border hover:bg-sidebar-accent/20"
                      onClick={() => toast.info("Ação: mover para andamento (MVP)")}
                    >
                      Iniciar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 min-w-[110px] border-sidebar-border hover:bg-sidebar-accent/20"
                      onClick={() => toast.info("Detalhes do pedido (MVP)")}
                    >
                      Ver
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-primary/20 glow-blue-hover min-w-0">
          <CardHeader className="py-4">
            <CardTitle className="text-primary">Em andamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 min-w-0">
            {processingOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nada em andamento</p>
            ) : (
              processingOrders.map((o) => (
                <div
                  key={o.id}
                  className="rounded-lg border border-primary/10 bg-card/30 p-3 hover:border-primary/40 transition-all min-w-0"
                  style={{
                    boxShadow: "0 0 18px rgba(80, 160, 255, 0.18), 0 0 10px rgba(33, 80, 175, 0.12)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">#{o.id}</p>
                      <p className="text-xs text-muted-foreground truncate">{o.customerName}</p>
                      <p className="text-xs text-muted-foreground">{formatBRL(o.total)}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`w-2.5 h-2.5 rounded-full ${CHANNEL_DOT[o.channel]}`} />
                      <span className={`text-xs font-semibold ${STATUS_COLOR[o.status]} whitespace-nowrap`}>
                        {STATUS_LABEL[o.status]}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 min-w-[110px] border-sidebar-border hover:bg-sidebar-accent/20"
                      onClick={() => toast.info("Ação: marcar como enviado (MVP)")}
                    >
                      Enviar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 min-w-[110px] border-sidebar-border hover:bg-sidebar-accent/20"
                      onClick={() => toast.info("Detalhes do pedido (MVP)")}
                    >
                      Ver
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-primary/20 glow-blue-hover min-w-0">
          <CardHeader className="py-4">
            <CardTitle className="text-primary">Enviados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 min-w-0">
            {shippedOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum envio ainda</p>
            ) : (
              shippedOrders.map((o) => (
                <div
                  key={o.id}
                  className="rounded-lg border border-primary/10 bg-card/30 p-3 hover:border-primary/40 transition-all min-w-0"
                  style={{
                    boxShadow: "0 0 18px rgba(80, 160, 255, 0.18), 0 0 10px rgba(33, 80, 175, 0.12)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">#{o.id}</p>
                      <p className="text-xs text-muted-foreground truncate">{o.customerName}</p>
                      <p className="text-xs text-muted-foreground">{formatBRL(o.total)}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`w-2.5 h-2.5 rounded-full ${CHANNEL_DOT[o.channel]}`} />
                      <span className={`text-xs font-semibold ${STATUS_COLOR[o.status]} whitespace-nowrap`}>
                        {STATUS_LABEL[o.status]}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 min-w-[110px] border-sidebar-border hover:bg-sidebar-accent/20"
                      onClick={() => toast.info("Ação: abrir comprovante/etiqueta (MVP)")}
                    >
                      Etiqueta
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 min-w-[110px] border-sidebar-border hover:bg-sidebar-accent/20"
                      onClick={() => toast.info("Detalhes do pedido (MVP)")}
                    >
                      Ver
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}