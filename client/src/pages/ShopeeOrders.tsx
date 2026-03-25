// client/src/pages/ShopeeOrders.tsx (CRIE este arquivo novo)
import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

interface Order {
  order_sn: string;
  order_status: string;
  total_amount: number;
  create_time: number;
}

export default function ShopeeOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/shopee/orders'); // Ajuste URL se necessário (shop_id/token via query ou env)
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
        toast.success(`${data.orders.length} pedidos carregados`);
      } else {
        toast.warning('Nenhuma ordem encontrada');
      }
    } catch (error) {
      toast.error('Erro Shopee API: ' + (error as Error).message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      'READY_TO_SHIP': 'bg-emerald-100 text-emerald-800',
      'SHIPPED': 'bg-blue-100 text-blue-800',
      'DELIVERED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'default': 'bg-gray-100 text-gray-800',
    };
    return badges[status as keyof typeof badges] || badges.default;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-white text-2xl font-bold mb-1">Ordens Shopee</CardTitle>
          <p className="text-gray-400 text-sm">Últimas ordens sincronizadas automaticamente</p>
        </div>
        <Button onClick={fetchOrders} disabled={loading} className="bg-primary hover:bg-primary/90">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Carregando...' : 'Atualizar'}
        </Button>
      </div>

      <Card className="bg-card/50 border border-primary/20 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex gap-2 text-xs uppercase text-gray-400 tracking-wider font-semibold">
            <span className="flex-1">Pedido</span>
            <span className="w-24 text-center">Status</span>
            <span className="w-28 text-right">Valor Total</span>
            <span className="w-32 text-left">Data Criação</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p>Nenhuma ordem encontrada.</p>
              <p className="text-sm mt-2">Clique em "Atualizar" após configurar API Shopee.</p>
            </div>
          ) : (
            <div className="divide-y divide-primary/20">
              {orders.map((order) => (
                <div key={order.order_sn} className="p-4 hover:bg-primary/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm font-semibold text-white flex-1 min-w-0 truncate">
                      {order.order_sn}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.order_status)}`}>
                      {order.order_status}
                    </span>
                    <span className="w-28 text-right font-semibold text-white">
                      R$ {order.total_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="w-32 text-sm text-gray-300">
                      {new Date(order.create_time * 1000).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}