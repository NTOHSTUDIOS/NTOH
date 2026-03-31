// client/src/pages/Dashboard.tsx
import { useState, useEffect, useMemo } from "react";
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

type CostCategory = "fixed" | "variable" | "tax" | "supplier";

type NewCostFormState = {
  category: CostCategory;
  name: string;
  amount: number;
  description: string;
};

type CostHistoryPoint = { date: string; total: number };
type CostHistoryPointByCategory = { date: string; total: number };

// ===== Helpers de data =====
function toISODateKey(d: Date) {
  return d.toISOString().slice(0, 10);
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

  const [activeModule, setActiveModule] = useState("sales");

  const [fixedCosts, setFixedCosts] = useState<CostItem[]>([]);
  const [variableCosts, setVariableCosts] = useState<CostItem[]>([]);
  const [taxes, setTaxes] = useState<CostItem[]>([]);
  const [suppliers, setSuppliers] = useState<CostItem[]>([]);

  const [products, setProducts] = useState<Product[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [costsViewMode, setCostsViewMode] = useState<"grid" | "list">("list");

  const [isCostDialogOpen, setIsCostDialogOpen] = useState(false);
  const [newCost, setNewCost] = useState<NewCostFormState>({
    category: "fixed",
    name: "",
    amount: 0,
    description: "",
  });

  const [costHistory, setCostHistory] = useState<CostHistoryPoint[]>([]);
  const [fixedCostHistory, setFixedCostHistory] = useState<CostHistoryPointByCategory[]>([]);
  const [variableCostHistory, setVariableCostHistory] = useState<CostHistoryPointByCategory[]>([]);

  const [loading, setLoading] = useState(true);

  // --- BUSCAR DADOS DO SUPABASE ---
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        console.log("Iniciando busca de dados no Supabase...");

        // Buscar Custos
        const { data: costsData, error: costsError } = await supabase.from("costs").select("*");
        if (costsError) throw costsError;

        if (costsData) {
          setFixedCosts(costsData.filter((c) => c.category === "fixed"));
          setVariableCosts(costsData.filter((c) => c.category === "variable"));
          setTaxes(costsData.filter((c) => c.category === "tax"));
          setSuppliers(costsData.filter((c) => c.category === "supplier"));
        }

        // Buscar Produtos (agora com SKU e Variations)
        const { data: productsData, error: productsError } = await supabase.from("products").select("*");
        if (productsError) throw productsError;
        if (productsData) setProducts(productsData);
        

        // Buscar Devoluções
        const { data: returnsData, error: returnsError } = await supabase.from("returns").select("*");
        if (returnsError) throw returnsError;
        if (returnsData) setReturns(returnsData);

        // Buscar Histórico de Custos
        const { data: historyData, error: historyError } = await supabase.from("cost_history").select("*").order("date", { ascending: true });
        if (historyError) throw historyError;
        if (historyData) {
          setCostHistory(historyData.map(h => ({ date: h.date, total: h.total })));
          setFixedCostHistory(historyData.map(h => ({ date: h.date, total: h.fixed_total })));
          setVariableCostHistory(historyData.map(h => ({ date: h.date, total: h.variable_total })));
        }

        console.log("Dados carregados com sucesso!");
      } catch (error: any) {
        console.error("Erro ao carregar dados do Supabase:", error.message);
        toast.error("Erro ao conectar com o banco de dados.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // --- HANDLERS DE CUSTOS ---
  const handleEditCost = async (item: CostItem, category: CostCategory) => {
    const { error } = await supabase.from("costs").update({
      name: item.name,
      amount: item.amount,
      description: item.description
    }).eq("id", item.id);

    if (error) { toast.error("Erro ao atualizar custo"); return; }

    if (category === "fixed") setFixedCosts(prev => prev.map(c => c.id === item.id ? item : c));
    if (category === "variable") setVariableCosts(prev => prev.map(c => c.id === item.id ? item : c));
    if (category === "tax") setTaxes(prev => prev.map(c => c.id === item.id ? item : c));
    if (category === "supplier") setSuppliers(prev => prev.map(c => c.id === item.id ? item : c));
    toast.success("Custo atualizado");
  };

  const handleDeleteCost = async (id: string, category: CostCategory) => {
    const { error } = await supabase.from("costs").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir custo"); return; }

    if (category === "fixed") setFixedCosts(prev => prev.filter(c => c.id !== id));
    if (category === "variable") setVariableCosts(prev => prev.filter(c => c.id !== id));
    if (category === "tax") setTaxes(prev => prev.filter(c => c.id !== id));
    if (category === "supplier") setSuppliers(prev => prev.filter(c => c.id !== id));
    toast.success("Custo excluído");
  };

  const handleDuplicateCost = async (item: CostItem, category: CostCategory) => {
    const { id, ...newItemWithoutId } = item;
    const { data, error } = await supabase.from("costs").insert([{ ...newItemWithoutId, category }]).select().single();
    if (error) { toast.error("Erro ao duplicar custo"); return; }

    if (category === "fixed") setFixedCosts(prev => [...prev, data]);
    if (category === "variable") setVariableCosts(prev => [...prev, data]);
    if (category === "tax") setTaxes(prev => [...prev, data]);
    if (category === "supplier") setSuppliers(prev => [...prev, data]);
    toast.success("Custo duplicado");
  };

  const handleSubmitNewCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCost.name.trim()) { toast.error("Nome do custo é obrigatório"); return; }

    const { data, error } = await supabase.from("costs").insert([{
      name: newCost.name,
      amount: newCost.amount,
      description: newCost.description,
      category: newCost.category,
    }]).select().single();

    if (error) { toast.error(`Erro ao salvar: ${error.message}`); return; }

    if (newCost.category === "fixed") setFixedCosts((prev) => [...prev, data]);
    if (newCost.category === "variable") setVariableCosts((prev) => [...prev, data]);
    if (newCost.category === "tax") setTaxes((prev) => [...prev, data]);
    if (newCost.category === "supplier") setSuppliers((prev) => [...prev, data]);

    toast.success("Custo adicionado com sucesso");
    setIsCostDialogOpen(false);
    setNewCost({ category: "fixed", name: "", amount: 0, description: "" });
  };

  // --- HANDLERS DE PRODUTOS (NOVO MODELO) ---
  const handleAddProduct = async (product: Product) => {
    const { id, ...productWithoutId } = product;
    const { data, error } = await supabase.from("products").insert([productWithoutId]).select().single();
    if (error) { console.error(error); toast.error("Erro ao adicionar produto"); return; }
    setProducts([...products, data]);
    toast.success("Produto adicionado");
  };

  const handleEditProduct = async (product: Product) => {
    const { error } = await supabase.from("products").update(product).eq("id", product.id);
    if (error) { console.error(error); toast.error("Erro ao atualizar produto"); return; }
    setProducts(products.map((p) => (p.id === product.id ? product : p)));
    toast.success("Produto atualizado");
  };

  const handleDeleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { console.error(error); toast.error("Erro ao excluir produto"); return; }
    setProducts(products.filter((p) => p.id !== id));
    toast.success("Produto excluído");
  };

  const handleDuplicateProduct = async (product: Product) => {
    const { id, ...newItemWithoutId } = product;
    const { data, error } = await supabase.from("products").insert([newItemWithoutId]).select().single();
    if (error) { console.error(error); toast.error("Erro ao duplicar produto"); return; }
    setProducts([...products, data]);
    toast.success("Produto duplicado");
  };

  // --- HANDLERS DE DEVOLUÇÕES ---
  const handleAddReturn = async (returnItem: Return) => {
    const { data, error } = await supabase.from("returns").insert([returnItem]).select().single();
    if (error) { toast.error("Erro ao adicionar devolução"); return; }
    setReturns([...returns, data]);
    toast.success("Devolução registrada");
  };

  const handleEditReturn = async (returnItem: Return) => {
    const { error } = await supabase.from("returns").update(returnItem).eq("id", returnItem.id);
    if (error) { toast.error("Erro ao atualizar devolução"); return; }
    setReturns(returns.map((r) => (r.id === returnItem.id ? returnItem : r)));
  };

  const handleDeleteReturn = async (id: string) => {
    const { error } = await supabase.from("returns").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir devolução"); return; }
    setReturns(returns.filter((r) => r.id !== id));
  };

  const handleDuplicateReturn = async (returnItem: Return) => {
    const { id, ...newItemWithoutId } = returnItem;
    const newItem = { ...newItemWithoutId, status: "pending", createdAt: new Date().toISOString() };
    const { data, error } = await supabase.from("returns").insert([newItem]).select().single();
    if (error) { toast.error("Erro ao duplicar devolução"); return; }
    setReturns([...returns, data]);
  };

  const handleMoveToProcessing = async (id: string) => {
    const { error } = await supabase.from("returns").update({ status: "processing" }).eq("id", id);
    if (error) return;
    setReturns(returns.map((r) => (r.id === id ? { ...r, status: "processing" } : r)));
  };

  const handleMoveToCompleted = async (id: string) => {
    const { error } = await supabase.from("returns").update({ status: "completed" }).eq("id", id);
    if (error) return;
    setReturns(returns.map((r) => (r.id === id ? { ...r, status: "completed" } : r)));
  };

  const handleAddReturnToStock = async (returnItem: Return) => {
    const newProduct: Product = {
      id: "",
      name: returnItem.name,
      sku: returnItem.sku || "RETORNO",
      cost: returnItem.cost,
      variations: [
        {
          id: "",
          sku: returnItem.sku,
          name: returnItem.color && returnItem.size 
            ? `${returnItem.color} - ${returnItem.size}`
            : returnItem.color || returnItem.size || "Padrão",
          quantity: returnItem.quantity,
        }
      ]
    };
    
    const { id, ...productWithoutId } = newProduct;
    const { data, error } = await supabase.from("products").insert([productWithoutId]).select().single();
    if (error) { toast.error("Erro ao adicionar ao estoque"); return; }
    setProducts([...products, data]);
    toast.success("Produto retornado ao estoque");
  };

  // --- CÁLCULOS ---
  const totalFixedCosts = useMemo(() => fixedCosts.reduce((sum, item) => sum + item.amount, 0), [fixedCosts]);
  const totalVariableCosts = useMemo(() => variableCosts.reduce((sum, item) => sum + item.amount, 0), [variableCosts]);
  const totalTaxes = useMemo(() => taxes.reduce((sum, item) => sum + item.amount, 0), [taxes]);
  const totalSuppliers = useMemo(() => suppliers.reduce((sum, item) => sum + item.amount, 0), [suppliers]);
  const totalOperationalCosts = totalFixedCosts + totalVariableCosts + totalTaxes + totalSuppliers;

  useEffect(() => {
    if (loading) return;
    const syncHistory = async () => {
      const today = toISODateKey(new Date());
      await supabase.from("cost_history").upsert({
        date: today,
        total: totalOperationalCosts,
        fixed_total: totalFixedCosts,
        variable_total: totalVariableCosts
      }, { onConflict: 'date' });
    };
    const timeoutId = setTimeout(syncHistory, 2000);
    return () => clearTimeout(timeoutId);
  }, [totalOperationalCosts, totalFixedCosts, totalVariableCosts, loading]);

  const costHistoryChartData = useMemo(() => {
    return costHistory.map((p) => ({
      label: p.date.slice(5).split("-").reverse().join("/"),
      custos: p.total,
    }));
  }, [costHistory]);

  const avgFixed3m = useMemo(() => avgFromHistoryLastNDays(fixedCostHistory, 90), [fixedCostHistory]);
  const avgVariable3m = useMemo(() => avgFromHistoryLastNDays(variableCostHistory, 90), [variableCostHistory]);

  // --- RENDERIZAÇÃO ---
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
    const kpiClass = "rounded-xl border border-primary/20 bg-card/50 px-5 py-4 transition-all duration-200 hover:border-primary/70 glow-blue-hover";
    const titleWhite = "text-base sm:text-lg font-semibold text-white";
    const valueBase = "mt-2 text-3xl sm:text-4xl font-bold";

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <Card className={kpiClass}><CardHeader className="pb-3"><CardTitle className={titleWhite}>Custos Fixos</CardTitle></CardHeader><CardContent><p className={`${valueBase} text-sky-300`}>R$ {totalFixedCosts.toFixed(2)}</p></CardContent></Card>
          <Card className={kpiClass}><CardHeader className="pb-3"><CardTitle className={titleWhite}>Custos Variáveis</CardTitle></CardHeader><CardContent><p className={`${valueBase} text-sky-300`}>R$ {totalVariableCosts.toFixed(2)}</p></CardContent></Card>
          <Card className={kpiClass}><CardHeader className="pb-3"><CardTitle className={titleWhite}>Impostos</CardTitle></CardHeader><CardContent><p className={`${valueBase} text-sky-300`}>R$ {totalTaxes.toFixed(2)}</p></CardContent></Card>
          <Card className={kpiClass}><CardHeader className="pb-3"><CardTitle className={titleWhite}>Fornecedores</CardTitle></CardHeader><CardContent><p className={`${valueBase} text-red-400`}>R$ {totalSuppliers.toFixed(2)}</p></CardContent></Card>
        </div>

        {costHistoryChartData.length > 0 && (
          <Card className="bg-card/50 border border-primary/20">
            <CardHeader><CardTitle className="text-white">Histórico de Custos</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={costHistoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="label" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
                  <Line type="monotone" dataKey="custos" stroke="#0ea5e9" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary">Gerenciar Custos</h3>
          <Dialog open={isCostDialogOpen} onOpenChange={setIsCostDialogOpen}>
            <DialogTrigger asChild><Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />Novo Custo</Button></DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle className="text-primary">Adicionar Novo Custo</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmitNewCost} className="space-y-4">
                <div><Label>Categoria</Label><Select value={newCost.category} onValueChange={(v) => setNewCost(p => ({ ...p, category: v as CostCategory }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="fixed">Custo Fixo</SelectItem><SelectItem value="variable">Custo Variável</SelectItem><SelectItem value="tax">Imposto</SelectItem><SelectItem value="supplier">Fornecedor</SelectItem></SelectContent></Select></div>
                <div><Label>Nome</Label><Input value={newCost.name} onChange={e => setNewCost(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Aluguel..." /></div>
                <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={newCost.amount} onChange={e => setNewCost(p => ({ ...p, amount: Number(e.target.value) }))} /></div>
                <div className="flex gap-2 pt-2"><Button type="submit" className="flex-1 bg-primary">Adicionar</Button><Button type="button" variant="outline" onClick={() => setIsCostDialogOpen(false)} className="flex-1">Cancelar</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <CostForm title="Custos Fixos" costs={fixedCosts} onEditCost={i => handleEditCost(i, "fixed")} onDeleteCost={id => handleDeleteCost(id, "fixed")} onDuplicateCost={i => handleDuplicateCost(i, "fixed")} viewMode={costsViewMode} />
        <CostForm title="Custos Variáveis" costs={variableCosts} onEditCost={i => handleEditCost(i, "variable")} onDeleteCost={id => handleDeleteCost(id, "variable")} onDuplicateCost={i => handleDuplicateCost(i, "variable")} viewMode={costsViewMode} />
      </div>
    );
  };

  const renderDevolutions = () => (
    <ReturnForm returns={returns} onAddReturn={handleAddReturn} onEditReturn={handleEditReturn} onDeleteReturn={handleDeleteReturn} onDuplicateReturn={handleDuplicateReturn} onMoveToProcessing={handleMoveToProcessing} onMoveToCompleted={handleMoveToCompleted} onAddToStock={handleAddReturnToStock} />
  );

  if (loading) return <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div><p>Conectando ao Supabase...</p></div>;

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
        </div>
      </main>
    </div>
  );
}