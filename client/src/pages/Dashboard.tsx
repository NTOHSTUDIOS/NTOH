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

type CostCategory = "fixed" | "variable" | "tax" | "supplier";

type NewCostFormState = {
  category: CostCategory;
  name: string;
  amount: number;
  description: string;
};

type CostHistoryPoint = { date: string; total: number };

export default function Dashboard() {
  const [activeModule, setActiveModule] = useState("billing"); // Módulo de faturamento no topo

  // Custos
  const [fixedCosts, setFixedCosts] = useState<CostItem[]>([]);
  const [variableCosts, setVariableCosts] = useState<CostItem[]>([]);
  const [taxes, setTaxes] = useState<CostItem[]>([]);
  const [suppliers, setSuppliers] = useState<CostItem[]>([]);

  // Estoque
  const [products, setProducts] = useState<Product[]>([]);

  // Devoluções
  const [returns, setReturns] = useState<Return[]>([]);

  // Custos: modo de visualização único
  const [costsViewMode, setCostsViewMode] = useState<"grid" | "list">("list");

  // Modal único de "Adicionar Custo"
  const [isCostDialogOpen, setIsCostDialogOpen] = useState(false);
  const [newCost, setNewCost] = useState<NewCostFormState>({
    category: "fixed",
    name: "",
    amount: 0,
    description: "",
  });

  // Histórico de custos para o gráfico
  const [costHistory, setCostHistory] = useState<CostHistoryPoint[]>([]);

  // Carregar dados do LocalStorage (com migração para createdAt em devoluções antigas)
  useEffect(() => {
    const savedFixedCosts = localStorage.getItem("ntoh_fixed_costs");
    const savedVariableCosts = localStorage.getItem("ntoh_variable_costs");
    const savedTaxes = localStorage.getItem("ntoh_taxes");
    const savedSuppliers = localStorage.getItem("ntoh_suppliers");

    const savedProducts = localStorage.getItem("ntoh_products");
    const savedReturns = localStorage.getItem("ntoh_returns");
    const savedCostHistory = localStorage.getItem("ntoh_cost_history");

    if (savedFixedCosts) setFixedCosts(JSON.parse(savedFixedCosts));
    if (savedVariableCosts) setVariableCosts(JSON.parse(savedVariableCosts));
    if (savedTaxes) setTaxes(JSON.parse(savedTaxes));
    if (savedSuppliers) setSuppliers(JSON.parse(savedSuppliers));

    if (savedProducts) setProducts(JSON.parse(savedProducts));

    if (savedReturns) {
      const parsed = JSON.parse(savedReturns) as any[];

      const migrated: Return[] = parsed
        .filter((r) => typeof r?.id === "string" && r.id.length > 0)
        .map((r) => ({
          id: String(r.id),
          name: typeof r.name === "string" ? r.name : "",
          sku: typeof r.sku === "string" ? r.sku : "",
          color: typeof r.color === "string" ? r.color : "",
          size: typeof r.size === "string" ? r.size : "",
          cost: typeof r.cost === "number" ? r.cost : 0,
          quantity: typeof r.quantity === "number" ? r.quantity : 0,
          status:
            r.status === "pending" || r.status === "processing" || r.status === "completed"
              ? r.status
              : "pending",
          reason: typeof r.reason === "string" ? r.reason : "",
          createdAt:
            typeof r.createdAt === "string" && r.createdAt.length > 0 ? r.createdAt : new Date().toISOString(),
        }));

      setReturns(migrated);
    }

    if (savedCostHistory) setCostHistory(JSON.parse(savedCostHistory));
  }, []);

  // Persistência
  useEffect(() => localStorage.setItem("ntoh_fixed_costs", JSON.stringify(fixedCosts)), [fixedCosts]);
  useEffect(() => localStorage.setItem("ntoh_variable_costs", JSON.stringify(variableCosts)), [variableCosts]);
  useEffect(() => localStorage.setItem("ntoh_taxes", JSON.stringify(taxes)), [taxes]);
  useEffect(() => localStorage.setItem("ntoh_suppliers", JSON.stringify(suppliers)), [suppliers]);

  useEffect(() => localStorage.setItem("ntoh_products", JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem("ntoh_returns", JSON.stringify(returns)), [returns]);
  useEffect(() => localStorage.setItem("ntoh_cost_history", JSON.stringify(costHistory)), [costHistory]);

  // --- Handlers Custos (editar/deletar/duplicar) ---
  const handleEditFixedCost = (item: CostItem) => setFixedCosts(fixedCosts.map((c) => (c.id === item.id ? item : c)));
  const handleDeleteFixedCost = (id: string) => setFixedCosts(fixedCosts.filter((c) => c.id !== id));
  const handleDuplicateFixedCost = (item: CostItem) =>
    setFixedCosts([...fixedCosts, { ...item, id: Date.now().toString() }]);

  const handleEditVariableCost = (item: CostItem) =>
    setVariableCosts(variableCosts.map((c) => (c.id === item.id ? item : c)));
  const handleDeleteVariableCost = (id: string) => setVariableCosts(variableCosts.filter((c) => c.id !== id));
  const handleDuplicateVariableCost = (item: CostItem) =>
    setVariableCosts([...variableCosts, { ...item, id: Date.now().toString() }]);

  const handleEditTax = (item: CostItem) => setTaxes(taxes.map((c) => (c.id === item.id ? item : c)));
  const handleDeleteTax = (id: string) => setTaxes(taxes.filter((c) => c.id !== id));
  const handleDuplicateTax = (item: CostItem) => setTaxes([...taxes, { ...item, id: Date.now().toString() }]);

  const handleEditSupplier = (item: CostItem) => setSuppliers(suppliers.map((c) => (c.id === item.id ? item : c)));
  const handleDeleteSupplier = (id: string) => setSuppliers(suppliers.filter((c) => c.id !== id));
  const handleDuplicateSupplier = (item: CostItem) =>
    setSuppliers([...suppliers, { ...item, id: Date.now().toString() }]);

  // Adicionar custo (modal único)
  const handleSubmitNewCost = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCost.name.trim()) {
      toast.error("Nome do custo é obrigatório");
      return;
    }

    const item: CostItem = {
      id: Date.now().toString(),
      name: newCost.name,
      amount: newCost.amount,
      description: newCost.description,
    };

    if (newCost.category === "fixed") setFixedCosts((prev) => [...prev, item]);
    if (newCost.category === "variable") setVariableCosts((prev) => [...prev, item]);
    if (newCost.category === "tax") setTaxes((prev) => [...prev, item]);
    if (newCost.category === "supplier") setSuppliers((prev) => [...prev, item]);

    toast.success("Custo adicionado com sucesso");
    setIsCostDialogOpen(false);
    setNewCost({ category: "fixed", name: "", amount: 0, description: "" });
  };

  // --- Handlers Produtos ---
  const handleAddProduct = (product: Product) => setProducts([...products, product]);
  const handleEditProduct = (product: Product) => setProducts(products.map((p) => (p.id === product.id ? product : p)));
  const handleDeleteProduct = (id: string) => setProducts(products.filter((p) => p.id !== id));
  const handleDuplicateProduct = (product: Product) =>
    setProducts([...products, { ...product, id: Date.now().toString() }]);

  // --- Handlers Devoluções ---
  const handleAddReturn = (returnItem: Return) => setReturns([...returns, returnItem]);

  const handleEditReturn = (returnItem: Return) =>
    setReturns(returns.map((r) => (r.id === returnItem.id ? returnItem : r)));

  const handleDeleteReturn = (id: string) => setReturns(returns.filter((r) => r.id !== id));

  const handleDuplicateReturn = (returnItem: Return) =>
    setReturns([
      ...returns,
      {
        ...returnItem,
        id: Date.now().toString(),
        status: "pending",
        createdAt: new Date().toISOString(),
      },
    ]);

  const handleMoveToProcessing = (id: string) =>
    setReturns(returns.map((r) => (r.id === id ? { ...r, status: "processing" } : r)));

  const handleMoveToCompleted = (id: string) =>
    setReturns(returns.map((r) => (r.id === id ? { ...r, status: "completed" } : r)));

  const handleAddReturnToStock = (returnItem: Return) => {
    const newProduct: Product = {
      id: Date.now().toString(),
      name: returnItem.name,
      sku: returnItem.sku,
      color: returnItem.color,
      size: returnItem.size,
      cost: returnItem.cost,
      quantity: returnItem.quantity,
    };
    setProducts([...products, newProduct]);
  };

  // Totais de custos
  const totalFixedCosts = useMemo(() => fixedCosts.reduce((sum, item) => sum + item.amount, 0), [fixedCosts]);
  const totalVariableCosts = useMemo(() => variableCosts.reduce((sum, item) => sum + item.amount, 0), [variableCosts]);
  const totalTaxes = useMemo(() => taxes.reduce((sum, item) => sum + item.amount, 0), [taxes]);
  const totalSuppliers = useMemo(() => suppliers.reduce((sum, item) => sum + item.amount, 0), [suppliers]);

  const totalOperationalCosts = totalFixedCosts + totalVariableCosts + totalTaxes + totalSuppliers;

  // Registrar histórico diário dos custos
  const recordTodayCostTotal = (total: number) => {
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

    setCostHistory((prev) => {
      const next = [...prev];
      const idx = next.findIndex((p) => p.date === today);

      if (idx >= 0) next[idx] = { date: today, total };
      else next.push({ date: today, total });

      // mantém só os últimos 30 pontos
      next.sort((a, b) => a.date.localeCompare(b.date));
      return next.slice(-30);
    });
  };

  // Atualizar histórico sempre que o total mudar
  useEffect(() => {
    recordTodayCostTotal(totalOperationalCosts);
  }, [totalOperationalCosts]);

  // Preparar dados do gráfico
  const costHistoryChartData = useMemo(() => {
    return costHistory.map((p) => ({
      label: p.date.slice(5).split("-").reverse().join("/"), // "YYYY-MM-DD" -> "DD/MM"
      custos: p.total,
    }));
  }, [costHistory]);

  // --- Renderizações ---
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

  const renderCosts = () => (
    <div className="space-y-6">
      {/* KPIs no topo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-cyan-500/20 bg-card/50 px-5 py-4 transition-all duration-200 hover:border-cyan-400/70 hover:shadow-[0_0_24px_rgba(34,211,238,0.35)]">
          <p className="text-base sm:text-lg font-semibold text-cyan-300">Custos Fixos</p>
          <p className="mt-2 text-3xl sm:text-4xl font-bold text-cyan-300">R$ {totalFixedCosts.toFixed(2)}</p>
        </div>

        <div className="rounded-xl border border-cyan-500/20 bg-card/50 px-5 py-4 transition-all duration-200 hover:border-cyan-400/70 hover:shadow-[0_0_24px_rgba(34,211,238,0.35)]">
          <p className="text-base sm:text-lg font-semibold text-cyan-300">Custos Variáveis</p>
          <p className="mt-2 text-3xl sm:text-4xl font-bold text-cyan-300">R$ {totalVariableCosts.toFixed(2)}</p>
        </div>

        <div className="rounded-xl border border-cyan-500/20 bg-card/50 px-5 py-4 transition-all duration-200 hover:border-cyan-400/70 hover:shadow-[0_0_24px_rgba(34,211,238,0.35)]">
          <p className="text-base sm:text-lg font-semibold text-cyan-300">Impostos</p>
          <p className="mt-2 text-3xl sm:text-4xl font-bold text-cyan-300">R$ {totalTaxes.toFixed(2)}</p>
        </div>

        <div className="rounded-xl border border-cyan-500/20 bg-card/50 px-5 py-4 transition-all duration-200 hover:border-cyan-400/70 hover:shadow-[0_0_24px_rgba(34,211,238,0.35)]">
          <p className="text-base sm:text-lg font-semibold text-cyan-300">Fornecedores</p>
          <p className="mt-2 text-3xl sm:text-4xl font-bold text-cyan-300">R$ {totalSuppliers.toFixed(2)}</p>
        </div>
      </div>

      {/* Card grande com gráfico de linha */}
      <Card className="bg-card/50 border border-purple-500/20 transition-all duration-200 hover:border-purple-400/70 hover:bg-purple-500/5 hover:shadow-[0_0_22px_rgba(168,85,247,0.25)]">
        <CardHeader>
          <CardTitle className="text-cyan-300">Evolução dos Custos (últimos 30 dias)</CardTitle>
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
                  stroke="#a855f7"
                  strokeWidth={3}
                  dot={{ fill: "#a855f7", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#a855f7", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Header: botão à esquerda + toggle à direita */}
      <div className="flex items-center justify-between gap-2">
        <Dialog open={isCostDialogOpen} onOpenChange={setIsCostDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Custo
            </Button>
          </DialogTrigger>

          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-cyan-300">Novo Custo</DialogTitle>
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
                  onChange={(e) => setNewCost((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
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
                <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
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

      {/* Seções */}
      <CostForm
        title="Custos Fixos"
        costs={fixedCosts}
        onEditCost={handleEditFixedCost}
        onDeleteCost={handleDeleteFixedCost}
        onDuplicateCost={handleDuplicateFixedCost}
        viewMode={costsViewMode}
      />

      <CostForm
        title="Custos Variáveis"
        costs={variableCosts}
        onEditCost={handleEditVariableCost}
        onDeleteCost={handleDeleteVariableCost}
        onDuplicateCost={handleDuplicateVariableCost}
        viewMode={costsViewMode}
      />

      <CostForm
        title="Impostos"
        costs={taxes}
        onEditCost={handleEditTax}
        onDeleteCost={handleDeleteTax}
        onDuplicateCost={handleDuplicateTax}
        viewMode={costsViewMode}
      />

      <CostForm
        title="Fornecedores"
        costs={suppliers}
        onEditCost={handleEditSupplier}
        onDeleteCost={handleDeleteSupplier}
        onDuplicateCost={handleDuplicateSupplier}
        viewMode={costsViewMode}
      />
    </div>
  );

  const renderDevolutions = () => (
    <ReturnForm
      returns={returns}
      onAddReturn={handleAddReturn}
      onEditReturn={handleEditReturn}
      onDeleteReturn={handleDeleteReturn}
      onDuplicateReturn={handleDuplicateReturn}
      onMoveToProcessing={handleMoveToProcessing}
      onMoveToCompleted={handleMoveToCompleted}
      onAddToStock={handleAddReturnToStock}
    />
  );

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />

      <div aria-hidden="true" className="shrink-0" style={{ width: "var(--ntoh-sidebar-width, 80px)" }} />

      <main className="flex-1 h-screen overflow-y-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6 xl:px-8 2xl:px-10">
        <div className="w-full max-w-[1200px] 2xl:max-w-[1320px]">
          {activeModule === "billing" && renderBilling()}
          {activeModule === "sales" && renderSales()}
          {activeModule === "stock" && renderStock()}
          {activeModule === "costs" && renderCosts()}
          {activeModule === "devolutions" && renderDevolutions()}

          {/* Fallback: se módulo não reconhecido, mostra mensagem */}
          {!["billing", "sales", "stock", "costs", "devolutions"].includes(activeModule) && (
            <div className="text-sm text-muted-foreground">
              Módulo não encontrado: {activeModule}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}