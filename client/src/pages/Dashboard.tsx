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

  // Histórico total (já existia)
  const [costHistory, setCostHistory] = useState<CostHistoryPoint[]>([]);

  // Histórico por categoria (para média 3 meses)
  const [fixedCostHistory, setFixedCostHistory] = useState<CostHistoryPointByCategory[]>([]);
  const [variableCostHistory, setVariableCostHistory] = useState<CostHistoryPointByCategory[]>([]);

  useEffect(() => {
    const savedFixedCosts = localStorage.getItem("ntoh_fixed_costs");
    const savedVariableCosts = localStorage.getItem("ntoh_variable_costs");
    const savedTaxes = localStorage.getItem("ntoh_taxes");
    const savedSuppliers = localStorage.getItem("ntoh_suppliers");

    const savedProducts = localStorage.getItem("ntoh_products");
    const savedReturns = localStorage.getItem("ntoh_returns");
    const savedCostHistory = localStorage.getItem("ntoh_cost_history");

    const savedFixedHistory = localStorage.getItem("ntoh_cost_history_fixed");
    const savedVariableHistory = localStorage.getItem("ntoh_cost_history_variable");

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
    if (savedFixedHistory) setFixedCostHistory(JSON.parse(savedFixedHistory));
    if (savedVariableHistory) setVariableCostHistory(JSON.parse(savedVariableHistory));
  }, []);

  useEffect(() => localStorage.setItem("ntoh_fixed_costs", JSON.stringify(fixedCosts)), [fixedCosts]);
  useEffect(() => localStorage.setItem("ntoh_variable_costs", JSON.stringify(variableCosts)), [variableCosts]);
  useEffect(() => localStorage.setItem("ntoh_taxes", JSON.stringify(taxes)), [taxes]);
  useEffect(() => localStorage.setItem("ntoh_suppliers", JSON.stringify(suppliers)), [suppliers]);

  useEffect(() => localStorage.setItem("ntoh_products", JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem("ntoh_returns", JSON.stringify(returns)), [returns]);

  useEffect(() => localStorage.setItem("ntoh_cost_history", JSON.stringify(costHistory)), [costHistory]);
  useEffect(() => localStorage.setItem("ntoh_cost_history_fixed", JSON.stringify(fixedCostHistory)), [fixedCostHistory]);
  useEffect(
    () => localStorage.setItem("ntoh_cost_history_variable", JSON.stringify(variableCostHistory)),
    [variableCostHistory]
  );

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

  const handleAddProduct = (product: Product) => setProducts([...products, product]);
  const handleEditProduct = (product: Product) => setProducts(products.map((p) => (p.id === product.id ? product : p)));
  const handleDeleteProduct = (id: string) => setProducts(products.filter((p) => p.id !== id));
  const handleDuplicateProduct = (product: Product) =>
    setProducts([...products, { ...product, id: Date.now().toString() }]);

  const handleAddReturn = (returnItem: Return) => setReturns([...returns, returnItem]);
  const handleEditReturn = (returnItem: Return) =>
    setReturns(returns.map((r) => (r.id === returnItem.id ? returnItem : r)));
  const handleDeleteReturn = (id: string) => setReturns(returns.filter((r) => r.id !== id));
  const handleDuplicateReturn = (returnItem: Return) =>
    setReturns([
      ...returns,
      { ...returnItem, id: Date.now().toString(), status: "pending", createdAt: new Date().toISOString() },
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

  const totalFixedCosts = useMemo(() => fixedCosts.reduce((sum, item) => sum + item.amount, 0), [fixedCosts]);
  const totalVariableCosts = useMemo(() => variableCosts.reduce((sum, item) => sum + item.amount, 0), [variableCosts]);
  const totalTaxes = useMemo(() => taxes.reduce((sum, item) => sum + item.amount, 0), [taxes]);
  const totalSuppliers = useMemo(() => suppliers.reduce((sum, item) => sum + item.amount, 0), [suppliers]);

  const totalOperationalCosts = totalFixedCosts + totalVariableCosts + totalTaxes + totalSuppliers;

  const recordTodayCostTotal = (total: number) => {
    const today = toISODateKey(new Date());

    setCostHistory((prev) => {
      const next = [...prev];
      const idx = next.findIndex((p) => p.date === today);

      if (idx >= 0) next[idx] = { date: today, total };
      else next.push({ date: today, total });

      next.sort((a, b) => a.date.localeCompare(b.date));
      return next.slice(-90);
    });
  };

  const recordTodayCategoryTotals = (fixedTotal: number, variableTotal: number) => {
    const today = toISODateKey(new Date());

    setFixedCostHistory((prev) => {
      const next = [...prev];
      const idx = next.findIndex((p) => p.date === today);

      if (idx >= 0) next[idx] = { date: today, total: fixedTotal };
      else next.push({ date: today, total: fixedTotal });

      next.sort((a, b) => a.date.localeCompare(b.date));
      return next.slice(-90);
    });

    setVariableCostHistory((prev) => {
      const next = [...prev];
      const idx = next.findIndex((p) => p.date === today);

      if (idx >= 0) next[idx] = { date: today, total: variableTotal };
      else next.push({ date: today, total: variableTotal });

      next.sort((a, b) => a.date.localeCompare(b.date));
      return next.slice(-90);
    });
  };

  useEffect(() => {
    recordTodayCostTotal(totalOperationalCosts);
    recordTodayCategoryTotals(totalFixedCosts, totalVariableCosts);
  }, [totalOperationalCosts, totalFixedCosts, totalVariableCosts]);

  const costHistoryChartData = useMemo(() => {
    return costHistory.map((p) => ({
      label: p.date.slice(5).split("-").reverse().join("/"),
      custos: p.total,
    }));
  }, [costHistory]);

  const avgFixed3m = useMemo(() => avgFromHistoryLastNDays(fixedCostHistory, 90), [fixedCostHistory]);
  const avgVariable3m = useMemo(() => avgFromHistoryLastNDays(variableCostHistory, 90), [variableCostHistory]);

  const isFixedAboveAvgBy5 = avgFixed3m > 0 ? totalFixedCosts >= avgFixed3m * 1.05 : false;
  const isVariableAboveAvgBy5 = avgVariable3m > 0 ? totalVariableCosts >= avgVariable3m * 1.05 : false;

  const ZERO_VALUE_CLASS = "text-[#334155]";
  const LIGHT_BLUE_VALUE_CLASS = "text-sky-300";

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
  };

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