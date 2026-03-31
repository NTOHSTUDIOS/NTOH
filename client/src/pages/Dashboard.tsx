// client/src/pages/Dashboard.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from "../components/Sidebar";
import { CostForm, type CostItem } from "../components/CostForm";
import { ProductForm, type Product } from "../components/ProductForm";
import { ReturnForm, type Return } from "../components/ReturnForm";
import Billing from "./Billing";
import SalesCentral from "./SalesCentral";
import { toast } from "sonner";

import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { LayoutGrid, List, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { supabase } from "../lib/supabase";

// Estendendo os tipos importados para garantir que os campos necessários existam no Dashboard
interface ExtendedCostItem extends CostItem {
  category: string;
}

interface ExtendedProduct extends Product {
  created_at?: string;
  user_id?: string;
}

// Usando 'any' para o ExtendedReturn para evitar conflitos com a interface original do ReturnForm
type ExtendedReturn = any;

type CostCategory = "fixed" | "variable" | "tax" | "supplier";

type NewCostFormState = {
  category: CostCategory;
  name: string;
  amount: number;
  description: string;
};

type CostHistoryPoint = { date: string; total: number };
type CostHistoryPointByCategory = { date: string; total: number };

// ===== Helpers de data (sem libs) =====
function toISODateKey(d: Date) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function daysBetweenISO(a: string, b: string) {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  const diff = db.getTime() - da.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function isWithinLastNDays(isoDateKey: string, nDays: number) {
  const todayKey = toISODateKey(new Date());
  const delta = daysBetweenISO(isoDateKey, todayKey);
  return delta >= 0 && delta < nDays;
}

function avgFromHistoryLastNDays(history: CostHistoryPointByCategory[], nDays: number) {
  const points = history.filter((p) => isWithinLastNDays(p.date, nDays));
  if (points.length === 0) return 0;
  const sum = points.reduce((acc, p) => acc + (typeof p.total === "number" ? p.total : 0), 0);
  return sum / points.length;
}

export default function Dashboard() {
  console.log("Dashboard vFinal: Carregado com sucesso!");

  const [session, setSession] = useState<any>(null);
  const [activeModule, setActiveModule] = useState("sales");

  const [fixedCosts, setFixedCosts] = useState<ExtendedCostItem[]>([]);
  const [variableCosts, setVariableCosts] = useState<ExtendedCostItem[]>([]);
  const [taxes, setTaxes] = useState<ExtendedCostItem[]>([]);
  const [suppliers, setSuppliers] = useState<ExtendedCostItem[]>([]);

  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [returns, setReturns] = useState<ExtendedReturn[]>([]);
  const [costsViewMode, setCostsViewMode] = useState<"grid" | "list">("list");

  const [isCostDialogOpen, setIsCostDialogOpen] = useState(false);
  const [newCost, setNewCost] = useState<NewCostFormState>({
    category: "fixed",
    name: "",
    amount: 0,
    description: "",
  });
  
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [newReturn, setNewReturn] = useState<Partial<ExtendedReturn>>({
  product_id: '',
  quantity: 0,
  reason: '',
  date: new Date().toISOString().split('T')[0] as string
  });

  const [costHistory, setCostHistory] = useState<CostHistoryPoint[]>([]);
  const [fixedCostHistory, setFixedCostHistory] = useState<CostHistoryPointByCategory[]>([]);
  const [variableCostHistory, setVariableCostHistory] = useState<CostHistoryPointByCategory[]>([]);

  const [loading, setLoading] = useState(true);

  const refetchProducts = useCallback(async (currentSession: any) => {
    if (!currentSession?.user) return;
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', currentSession.user.id)
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Erro ao recarregar produtos: ' + error.message);
    } else {
      setProducts(data || []);
    }
  }, []);

  const refetchCosts = useCallback(async (currentSession: any) => {
    if (!currentSession?.user) return;
    const { data, error } = await supabase
      .from('costs')
      .select('*')
      .eq('user_id', currentSession.user.id);
    if (error) {
      toast.error('Erro ao recarregar custos: ' + error.message);
    } else {
      const costs = (data as ExtendedCostItem[]) || [];
      setFixedCosts(costs.filter((c) => c.category === "fixed"));
      setVariableCosts(costs.filter((c) => c.category === "variable"));
      setTaxes(costs.filter((c) => c.category === "tax"));
      setSuppliers(costs.filter((c) => c.category === "supplier"));
    }
  }, []);

  const refetchReturns = useCallback(async (currentSession: any) => {
  if (!currentSession?.user) return;
  const { data, error } = await supabase
    .from('returns')
    .select('*')
    .eq('user_id', currentSession.user.id);
  if (error) {
    toast.error('Erro ao recarregar devoluções: ' + error.message);
  } else {
    setReturns((data as any[]) || []);
  }
}, []);
  

  const refetchCostHistory = useCallback(async (currentSession: any) => {
    if (!currentSession?.user) return;
    const { data: historyData, error: historyError } = await supabase
      .from("cost_history")
      .select("*")
      .eq('user_id', currentSession.user.id)
      .order("date", { ascending: true });
    if (historyError) {
      toast.error('Erro ao recarregar histórico de custos: ' + historyError.message);
    } else if (historyData) {
      setCostHistory(historyData.map((h: any) => ({ date: h.date, total: h.total })));
      setFixedCostHistory(historyData.map((h: any) => ({ date: h.date, total: h.fixed_total })));
      setVariableCostHistory(historyData.map((h: any) => ({ date: h.date, total: h.variable_total })));
    }
  }, []);

  useEffect(() => {
    const getSessionAndSetupListener = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setLoading(false);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, currentSession) => {
          setSession(currentSession);
          if (currentSession?.user) {
            setLoading(true);
            await Promise.all([
              refetchProducts(currentSession),
              refetchCosts(currentSession),
              refetchReturns(currentSession),
              refetchCostHistory(currentSession),
            ]);
            setLoading(false);
          } else {
            setFixedCosts([]);
            setVariableCosts([]);
            setTaxes([]);
            setSuppliers([]);
            setProducts([]);
            setReturns([]);
            setCostHistory([]);
            setFixedCostHistory([]);
            setVariableCostHistory([]);
            setLoading(false);
          }
        }
      );
      return () => subscription.unsubscribe();
    };

    getSessionAndSetupListener();
  }, [refetchProducts, refetchCosts, refetchReturns, refetchCostHistory]);

  useEffect(() => {
    async function fetchData() {
      if (session?.user) {
        setLoading(true);
        await Promise.all([
          refetchProducts(session),
          refetchCosts(session),
          refetchReturns(session),
          refetchCostHistory(session),
        ]);
        setLoading(false);
      } else if (session === null) {
        setLoading(false);
      }
    }
    fetchData();
  }, [session, refetchProducts, refetchCosts, refetchReturns, refetchCostHistory]);

  const handleEditCost = async (item: CostItem, category: CostCategory) => {
    const { error } = await supabase.from("costs").update({
      name: item.name,
      amount: item.amount,
      description: item.description
    }).eq("id", item.id);

    if (error) {
      toast.error("Erro ao atualizar custo");
      return;
    }

    const updatedItem = { ...item, category } as ExtendedCostItem;
    if (category === "fixed") setFixedCosts(prev => prev.map(c => c.id === item.id ? updatedItem : c));
    if (category === "variable") setVariableCosts(prev => prev.map(c => c.id === item.id ? updatedItem : c));
    if (category === "tax") setTaxes(prev => prev.map(c => c.id === item.id ? updatedItem : c));
    if (category === "supplier") setSuppliers(prev => prev.map(c => c.id === item.id ? updatedItem : c));
    toast.success("Custo atualizado");
  };

  const handleDeleteCost = async (id: string, category: CostCategory) => {
    const { error } = await supabase.from("costs").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir custo");
      return;
    }

    if (category === "fixed") setFixedCosts(prev => prev.filter(c => c.id !== id));
    if (category === "variable") setVariableCosts(prev => prev.filter(c => c.id !== id));
    if (category === "tax") setTaxes(prev => prev.filter(c => c.id !== id));
    if (category === "supplier") setSuppliers(prev => prev.filter(c => c.id !== id));
    toast.success("Custo excluído");
  };

  const handleDuplicateCost = async (item: CostItem, category: CostCategory) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...newItemWithoutId } = item;
    const { data, error } = await supabase.from("costs").insert([{ ...newItemWithoutId, category, user_id: session?.user?.id }]).select().single();
    
    if (error) {
      toast.error("Erro ao duplicar custo");
      return;
    }

    if (data) {
      const extendedData = data as ExtendedCostItem;
      if (category === "fixed") setFixedCosts(prev => [...prev, extendedData]);
      if (category === "variable") setVariableCosts(prev => [...prev, extendedData]);
      if (category === "tax") setTaxes(prev => [...prev, extendedData]);
      if (category === "supplier") setSuppliers(prev => [...prev, extendedData]);
      toast.success("Custo duplicado");
    }
  };

  const handleSubmitNewCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      toast.error("Usuário não autenticado.");
      return;
    }

    const { data, error } = await supabase
      .from("costs")
      .insert([{ ...newCost, user_id: session.user.id }])
      .select()
      .single();

    if (error) {
      toast.error("Erro ao adicionar custo");
      return;
    }

    if (data) {
      const extendedData = data as ExtendedCostItem;
      if (newCost.category === "fixed") setFixedCosts((prev) => [...prev, extendedData]);
      if (newCost.category === "variable") setVariableCosts((prev) => [...prev, extendedData]);
      if (newCost.category === "tax") setTaxes((prev) => [...prev, extendedData]);
      if (newCost.category === "supplier") setSuppliers((prev) => [...prev, extendedData]);
      toast.success("Custo adicionado");
      setIsCostDialogOpen(false);
      setNewCost({
        category: "fixed",
        name: "",
        amount: 0,
        description: "",
      });
    }
  };

  const handleAddProduct = async (newProduct: Omit<Product, 'id'>) => {
    if (!session?.user) {
      toast.error("Usuário não autenticado.");
      return;
    }
    const { data, error } = await supabase
      .from("products")
      .insert([{ ...newProduct, user_id: session.user.id }])
      .select()
      .single();

    if (error) {
      toast.error("Erro ao adicionar produto");
      return;
    }
    if (data) {
      setProducts((prev) => [...prev, data as ExtendedProduct]);
      toast.success("Produto adicionado");
    }
  };

  const handleEditProduct = async (updatedProduct: Product) => {
    const { error } = await supabase
      .from("products")
      .update(updatedProduct)
      .eq("id", updatedProduct.id);

    if (error) {
      toast.error("Erro ao atualizar produto");
      return;
    }
    setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct as ExtendedProduct : p)));
    toast.success("Produto atualizado");
  };

  const handleDeleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir produto");
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Produto excluído");
  };

  const handleDuplicateProduct = async (product: Product) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...newProductWithoutId } = product;
    if (!session?.user) {
      toast.error("Usuário não autenticado.");
      return;
    }
    const { data, error } = await supabase
      .from("products")
      .insert([{ ...newProductWithoutId, user_id: session.user.id }])
      .select()
      .single();

    if (error) {
      toast.error("Erro ao duplicar produto");
      return;
    }
    if (data) {
      setProducts((prev) => [...prev, data as ExtendedProduct]);
      toast.success("Produto duplicado");
    }
  };

  const handleAddReturn = async (newReturn: Omit<Return, 'id'>) => {
    if (!session?.user) {
      toast.error("Usuário não autenticado.");
      return;
    }
    const { data, error } = await supabase
      .from("returns")
      .insert([{ ...newReturn, user_id: session.user.id }])
      .select()
      .single();

    if (error) {
      toast.error("Erro ao adicionar devolução");
      return;
    }
    if (data) {
      setReturns((prev) => [...prev, data as ExtendedReturn]);
      toast.success("Devolução adicionada");
    }
  };

  const handleEditReturn = async (updatedReturn: Return) => {
    const { error } = await supabase
      .from("returns")
      .update(updatedReturn)
      .eq("id", updatedReturn.id);

    if (error) {
      toast.error("Erro ao atualizar devolução");
      return;
    }
    setReturns((prev) => prev.map((r) => (r.id === updatedReturn.id ? updatedReturn as ExtendedReturn : r)));
    toast.success("Devolução atualizada");
  };

  const handleDeleteReturn = async (id: string) => {
    const { error } = await supabase.from("returns").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir devolução");
      return;
    }
    setReturns((prev) => prev.filter((r) => r.id !== id));
    toast.success("Devolução excluída");
  };

  const handleDuplicateReturn = async (item: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...newItemWithoutId } = item;
    if (!session?.user) {
      toast.error("Usuário não autenticado.");
      return;
    }
    const { data, error } = await supabase
      .from("returns")
      .insert([{ ...newItemWithoutId, user_id: session.user.id }])
      .select()
      .single();

    if (error) {
      toast.error("Erro ao duplicar devolução");
      return;
    }
    if (data) {
      setReturns((prev) => [...prev, data as ExtendedReturn]);
      toast.success("Devolução duplicada");
    }
  };

  const handleMoveToProcessing = async (id: string) => {
    const { error } = await supabase
      .from("returns")
      .update({ status: "processing" })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao mover para processamento");
      return;
    }
    setReturns((prev) => prev.map((r) => (r.id === id ? { ...r, status: "processing" } : r)));
    toast.success("Devolução movida para processamento");
  };

  const handleMoveToCompleted = async (id: string) => {
    const { error } = await supabase
      .from("returns")
      .update({ status: "completed" })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao mover para concluído");
      return;
    }
    setReturns((prev) => prev.map((r) => (r.id === id ? { ...r, status: "completed" } : r)));
    toast.success("Devolução movida para concluído");
  };

  const handleAddReturnToStock = async (returnItem: any) => {
    if (!returnItem.id) return;

    const { data: productItem, error: productFetchError } = await supabase
      .from("products")
      .select("*")
      .eq("name", returnItem.product_name)
      .single();

    if (productFetchError || !productItem) {
      toast.error("Produto não encontrado para adicionar ao estoque");
      return;
    }

    const newQuantity = productItem.quantity + returnItem.quantity;
    const { error: updateError } = await supabase
      .from("products")
      .update({ quantity: newQuantity })
      .eq("id", productItem.id);

    if (updateError) {
      toast.error("Erro ao atualizar estoque");
      return;
    }

    await handleDeleteReturn(returnItem.id);
    toast.success("Devolução adicionada ao estoque e processada");
  };

  const totalFixedCosts = useMemo(() => {
    return fixedCosts.reduce((sum: number, item: ExtendedCostItem) => sum + item.amount, 0);
  }, [fixedCosts]);

  const totalVariableCosts = useMemo(() => {
    return variableCosts.reduce((sum: number, item: ExtendedCostItem) => sum + item.amount, 0);
  }, [variableCosts]);

  const totalTaxes = useMemo(() => {
    return taxes.reduce((sum: number, item: ExtendedCostItem) => sum + item.amount, 0);
  }, [taxes]);

  const totalSuppliers = useMemo(() => {
    return suppliers.reduce((sum: number, item: ExtendedCostItem) => sum + item.amount, 0);
  }, [suppliers]);

  const totalProducts = useMemo(() => {
    return products.reduce((sum: number, p: ExtendedProduct) => sum + p.quantity, 0);
  }, [products]);

  const totalReturns = useMemo(() => {
    return returns.reduce((sum: number, r: ExtendedReturn) => sum + (r.quantity || 0), 0);
  }, [returns]);

  const costHistoryChartData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return toISODateKey(d);
    });

    const dataMap = new Map<string, number>();
    costHistory.forEach(point => {
      dataMap.set(point.date, point.total);
    });

    return last30Days.map(date => ({
      label: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      custos: dataMap.get(date) || 0,
    }));
  }, [costHistory]);

  const avgFixedLast7Days = useMemo(() => avgFromHistoryLastNDays(fixedCostHistory, 7), [fixedCostHistory]);
  const avgVariableLast7Days = useMemo(() => avgFromHistoryLastNDays(variableCostHistory, 7), [variableCostHistory]);

  const isFixedAboveAvgBy5 = totalFixedCosts > avgFixedLast7Days * 1.05;
  const isVariableAboveAvgBy5 = totalVariableCosts > avgVariableLast7Days * 1.05;

  const ZERO_VALUE_CLASS = "text-muted-foreground";
  const LIGHT_BLUE_VALUE_CLASS = "text-blue-400";

  const fixedValueClass =
    totalFixedCosts === 0 ? ZERO_VALUE_CLASS : isFixedAboveAvgBy5 ? "text-red-400" : LIGHT_BLUE_VALUE_CLASS;

  const variableValueClass =
    totalVariableCosts === 0 ? ZERO_VALUE_CLASS : isVariableAboveAvgBy5 ? "text-red-400" : LIGHT_BLUE_VALUE_CLASS;

  const taxValueClass = totalTaxes === 0 ? ZERO_VALUE_CLASS : LIGHT_BLUE_VALUE_CLASS;
  const supplierValueClass = "text-red-400";

  const renderBilling = () => (
    <div className="space-y-6">
      <Billing fixedCosts={fixedCosts} variableCosts={variableCosts} products={products} />
    </div>
  );

  const renderSales = () => (
    <div className="space-y-6">
      <SalesCentral />
    </div>
  );

  const renderStock = () => (
    <div className="space-y-4 lg:space-y-6">
      <ProductForm
        products={products}
        onAddProduct={handleAddProduct}
        onEditProduct={handleEditProduct}
        onDeleteProduct={handleDeleteProduct}
        onDuplicateProduct={handleDuplicateProduct}
      />
    </div>
  );

  const renderCosts = () => {
    const kpiClass =
      "rounded-xl border border-primary/20 bg-card/50 px-5 py-4 transition-all duration-200 hover:border-primary/70 glow-blue-hover";

    const titleWhite = "text-base sm:text-lg font-semibold text-white";
    const valueBase = "mt-2 text-3xl sm:text-4xl font-bold";

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={kpiClass}>
            <p className={titleWhite}>Custos Fixos</p>
            <p className={`${valueBase} ${fixedValueClass}`}>R$ {totalFixedCosts.toFixed(2)}</p>
          </div>

          <div className={kpiClass}>
            <p className={titleWhite}>Custos Variáveis</p>
            <p className={`${valueBase} ${variableValueClass}`}>R$ {totalVariableCosts.toFixed(2)}</p>
          </div>

          <div className={kpiClass}>
            <p className={titleWhite}>Impostos</p>
            <p className={`${valueBase} ${taxValueClass}`}>R$ {totalTaxes.toFixed(2)}</p>
          </div>

          <div className={kpiClass}>
            <p className={titleWhite}>Fornecedores</p>
            <p className={`${valueBase} ${supplierValueClass}`}>R$ {totalSuppliers.toFixed(2)}</p>
          </div>
        </div>

        <Card className="bg-card/50 border border-primary/20 transition-all duration-200 hover:border-primary/70 hover:bg-primary/5 glow-blue-hover">
          <CardHeader>
            <CardTitle className="text-white">Evolução dos Custos (últimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={costHistoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `R$ ${Number(v).toFixed(0)}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }}
                    itemStyle={{ color: "#f8fafc" }}
                    formatter={(value: any) =>
                      Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="custos"
                    stroke="#2150af"
                    strokeWidth={3}
                    dot={{ fill: "#2150af", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "#2150af", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-2">
          <Dialog open={isCostDialogOpen} onOpenChange={setIsCostDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Custo
              </Button>
            </DialogTrigger>

            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-white">Novo Custo</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmitNewCost} className="space-y-4">
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={newCost.category}
                    onValueChange={(value) => setNewCost((p) => ({ ...p, category: value as CostCategory }))}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Custo Fixo</SelectItem>
                      <SelectItem value="variable">Custo Variável</SelectItem>
                      <SelectItem value="tax">Impostos</SelectItem>
                      <SelectItem value="supplier">Fornecedores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={newCost.name}
                    onChange={(e) => setNewCost((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Ex: Aluguel, Salário..."
                  />
                </div>

                <div>
                  <Label htmlFor="amount">Valor (R$)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={newCost.amount}
                    onChange={(e) => setNewCost((p) => ({ ...p, amount: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={newCost.description}
                    onChange={(e) => setNewCost((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Descrição opcional..."
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                    Adicionar
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsCostDialogOpen(false)} className="flex-1">
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={costsViewMode === "grid" ? "default" : "outline"}
              onClick={() => setCostsViewMode("grid")}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={costsViewMode === "list" ? "default" : "outline"}
              onClick={() => setCostsViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <CostForm
          title="Custos Fixos"
          costs={fixedCosts}
          onEditCost={(item) => handleEditCost(item, "fixed")}
          onDeleteCost={(id) => handleDeleteCost(id, "fixed")}
          onDuplicateCost={(item) => handleDuplicateCost(item, "fixed")}
          viewMode={costsViewMode}
        />

        <CostForm
          title="Custos Variáveis"
          costs={variableCosts}
          onEditCost={(item) => handleEditCost(item, "variable")}
          onDeleteCost={(id) => handleDeleteCost(id, "variable")}
          onDuplicateCost={(item) => handleDuplicateCost(item, "variable")}
          viewMode={costsViewMode}
        />

        <CostForm
          title="Impostos"
          costs={taxes}
          onEditCost={(item) => handleEditCost(item, "tax")}
          onDeleteCost={(id) => handleDeleteCost(id, "tax")}
          onDuplicateCost={(item) => handleDuplicateCost(item, "tax")}
          viewMode={costsViewMode}
        />

        <CostForm
          title="Fornecedores"
          costs={suppliers}
          onEditCost={(item) => handleEditCost(item, "supplier")}
          onDeleteCost={(id) => handleDeleteCost(id, "supplier")}
          onDuplicateCost={(item) => handleDuplicateCost(item, "supplier")}
          viewMode={costsViewMode}
        />
      </div>
    );
  };

    const renderDevolutions = () => (
      <ReturnForm
        returns={returns}
        onAddReturn={handleAddReturn}
        onEditReturn={handleEditReturn}
        onDeleteReturn={(item: any) => handleDeleteReturn(item.id)}
        onDuplicateReturn={handleDuplicateReturn}
        onMoveToProcessing={(item: any) => handleMoveToProcessing(item.id)}
        onMoveToCompleted={(item: any) => handleMoveToCompleted(item.id)}
        onAddToStock={handleAddReturnToStock}
      />
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p>Conectando ao Supabase...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />
      <div aria-hidden="true" className="shrink-0" style={{ width: "var(--ntoh-sidebar-width, 80px)" }} />
      <main className="flex-1 min-h-screen overflow-y-auto py-6 px-4 sm:px-6 lg:px-8 min-w-0">
        <div className="w-full max-w-[1440px] 2xl:max-w-[1600px] mx-auto">
          {activeModule === "billing" && renderBilling()}
          {activeModule === "sales" && renderSales()}
          {activeModule === "stock" && renderStock()}
          {activeModule === "costs" && renderCosts()}
          {activeModule === "devolutions" && renderDevolutions()}
          {!["billing", "sales", "stock", "costs", "devolutions"].includes(activeModule) && (
            <div className="text-sm text-muted-foreground">Módulo não encontrado: {activeModule}</div>
          )}
        </div>
      </main>
    </div>
  );
}