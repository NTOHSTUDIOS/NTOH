// client/src/pages/SalesCentral.tsx
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";

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
  processing: "text-purple-300",
  shipped: "text-cyan-300",
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

  // Série por hora
  const hourlySeries = useMemo(() => {
    const hours = Array.from({ length: 13 }, (_, i) => 8 + i);
    const base = hours.map((h) => ({
      hour: `${String(h).padStart(2, "0")}:00`,
      vendas: 0,
      lucro: 0,
    }));

    const todayOrders = orders.filter((o) => toDayKey(o.createdAt) === todayKey && o.status !== "returned");

    for (const o of todayOrders) {
      const d = new Date(o.createdAt);
      const h = d.getHours();
      const idx = hours.indexOf(h);
      if (idx >= 0) {
        base[idx].vendas += o.total;
        base[idx].lucro += o.total - o.cost;
      }
    }

    let accSales = 0;
    let accProfit = 0;
    return base.map((p) => {
      accSales += p.vendas;
      accProfit += p.lucro;
      return { ...p, vendas: Number(accSales.toFixed(2)), lucro: Number(accProfit.toFixed(2)) };
    });
  }, [orders, todayKey]);

  const statusBarData = useMemo(() => {
    return [
      { name: "Pendentes", value: stats.pending },
      { name: "Em andamento", value: stats.processing },
      { name: "Enviados", value: stats.shipped },
      { name: "Devoluções", value: stats.returned },
    ];
  }, [stats]);

  const pendingOrders = useMemo(() => orders.filter((o) => o.status === "pending"), [orders]);
  const processingOrders = useMemo(() => orders.filter((o) => o.status === "processing"), [orders]);
  const shippedOrders = useMemo(() => orders.filter((o) => o.status === "shipped"), [orders]);

  return (
    <div className="space-y-5 overflow-x-hidden min-w-0">
      {/* KPIs (menores) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <Card className="bg-card/50 border-purple-500/20 min-w-0">
          <CardHeader className="py-3">
            <CardTitle className="text-xs text-muted-foreground">Pendentes</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <p className="text-2xl font-bold leading-none text-cyan-300">{stats.pending}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-purple-500/20 min-w-0">
          <CardHeader className="py-3">
            <CardTitle className="text-xs text-muted-foreground">Em andamento</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <p className="text-2xl font-bold leading-none text-cyan-300">{stats.processing}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-purple-500/20 min-w-0">
          <CardHeader className="py-3">
            <CardTitle className="text-xs text-muted-foreground">Enviados</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <p className="text-2xl font-bold leading-none text-cyan-300">{stats.shipped}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-purple-500/20 min-w-0">
          <CardHeader className="py-3">
            <CardTitle className="text-xs text-muted-foreground">Devoluções</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <p className="text-2xl font-bold leading-none text-cyan-300">{stats.returned}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-purple-500/20 min-w-0">
          <CardHeader className="py-3">
            <CardTitle className="text-xs text-muted-foreground">Total vendido hoje</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <p className="text-2xl font-bold leading-none text-cyan-300 truncate">{formatBRL(stats.soldToday)}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-purple-500/20 min-w-0">
          <CardHeader className="py-3">
            <CardTitle className="text-xs text-muted-foreground">Lucro líquido hoje</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <p className="text-2xl font-bold leading-none text-cyan-300 truncate">{formatBRL(stats.netProfitToday)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card/50 border-purple-500/20 min-w-0">
          <CardHeader className="py-4">
            <CardTitle className="text-cyan-300">Desempenho do dia (acumulado)</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={hourlySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="hour" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333" }}
                  formatter={(value: any, name: any) =>
                    name === "vendas" || name === "lucro" ? formatBRL(Number(value)) : value
                  }
                />
                <Legend />
                <Line type="monotone" dataKey="vendas" stroke="#06b6d4" strokeWidth={2} dot={false} name="Vendas" />
                <Line type="monotone" dataKey="lucro" stroke="#a855f7" strokeWidth={2} dot={false} name="Lucro" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-purple-500/20 min-w-0">
          <CardHeader className="py-4">
            <CardTitle className="text-cyan-300">Pedidos por status</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={statusBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#999" interval={0} tick={{ fontSize: 12 }} />
                <YAxis stroke="#999" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333" }}
                  formatter={(value: any) => `${Number(value)} pedidos`}
                />
                <Legend />
                <Bar dataKey="value" fill="#06b6d4" name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filas / Kanban */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-purple-500/20 min-w-0">
          <CardHeader className="py-4">
            <CardTitle className="text-cyan-300">Pendentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 min-w-0">
            {pendingOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem pendências</p>
            ) : (
              pendingOrders.map((o) => (
                <div
                  key={o.id}
                  className="rounded-lg border border-cyan-500/10 bg-card/30 p-3 hover:border-cyan-400/40 transition-all hover:shadow-[0_0_18px_rgba(34,211,238,0.20)] min-w-0"
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

        <Card className="bg-card/50 border-purple-500/20 min-w-0">
          <CardHeader className="py-4">
            <CardTitle className="text-cyan-300">Em andamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 min-w-0">
            {processingOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nada em andamento</p>
            ) : (
              processingOrders.map((o) => (
                <div
                  key={o.id}
                  className="rounded-lg border border-cyan-500/10 bg-card/30 p-3 hover:border-cyan-400/40 transition-all hover:shadow-[0_0_18px_rgba(34,211,238,0.20)] min-w-0"
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

        <Card className="bg-card/50 border-purple-500/20 min-w-0">
          <CardHeader className="py-4">
            <CardTitle className="text-cyan-300">Enviados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 min-w-0">
            {shippedOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum envio ainda</p>
            ) : (
              shippedOrders.map((o) => (
                <div
                  key={o.id}
                  className="rounded-lg border border-cyan-500/10 bg-card/30 p-3 hover:border-cyan-400/40 transition-all hover:shadow-[0_0_18px_rgba(34,211,238,0.20)] min-w-0"
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