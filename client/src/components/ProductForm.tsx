import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Copy,
  Edit2,
  Search,
  LayoutGrid,
  List,
} from "lucide-react";
import { toast } from "sonner";

export interface Product {
  id: string;
  name: string;
  sku: string;
  color?: string;
  size?: string;
  cost: number;
  quantity: number;
}

interface ProductFormProps {
  onAddProduct: (product: Product) => Promise<void>; // Alterado para Promise<void>
  onEditProduct: (product: Product) => Promise<void>; // Alterado para Promise<void>
  onDeleteProduct: (id: string) => Promise<void>; // Alterado para Promise<void>
  onDuplicateProduct: (product: Product) => Promise<void>; // Alterado para Promise<void>
  products: Product[];
}

export function ProductForm({
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onDuplicateProduct,
  products,
}: ProductFormProps) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState<Omit<Product, "id">>({
    name: "",
    sku: "",
    color: "",
    size: "",
    cost: 0,
    quantity: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => { // Adicionado 'async'
    e.preventDefault();

    if (!formData.name.trim() || !formData.sku.trim()) {
      toast.error("Nome e SKU são obrigatórios");
      return;
    }

    if (editingId) {
      await onEditProduct({ ...formData, id: editingId }); // Adicionado 'await'

    } else {
      // É importante que o ID seja gerado pelo Supabase ou retornado por ele
      // Para simplificar, vamos passar um ID temporário e esperar que o Supabase retorne o ID real
      // ou que o dashboard.tsx lide com a atualização do estado com o ID correto.
      // No entanto, para o problema atual, o principal é aguardar a operação.
      await onAddProduct(formData as Product); // Remove a geração de ID aqui, o Supabase irá gerar. O 'as Product' é para satisfazer o tipo, já que o ID será gerado.
    }

    setFormData({
      name: "",
      sku: "",
      color: "",
      size: "",
      cost: 0,
      quantity: 0,
    });

    setEditingId(null);
    setOpen(false);
  };

  const handleEdit = (product: Product) => {
    setFormData(product);
    setEditingId(product.id);
    setOpen(true);
  };

  const totalInventoryValue = products.reduce((sum, p) => sum + p.cost * p.quantity, 0);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- KPIs ---
  const totalCostValue = products.reduce((sum, p) => sum + p.cost * p.quantity, 0);
  const totalUnits = products.reduce((sum, p) => sum + p.quantity, 0);

  // Placeholder até existir campo real de danificados
  const damagedUnits = 0;
  const damagedLossValue = 0;

  const formatBRL = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // ✅ Regras de cor (KPI numbers)
  const getUnitsColorClass = (units: number) => {
    if (units === 0) return "text-primary";
    if (units > 20) return "text-emerald-400";
    return "text-yellow-400";
  };

  const getTotalCostColorClass = (value: number) => {
    if (value === 0) return "text-primary";
    if (value >= 1) return "text-emerald-400";
    return "text-primary";
  };

  const getDamagedLossColorClass = (value: number) => {
    if (value < 0) return "text-red-400";
    return "text-primary"; // <= 0 fica azul (inclui 0)
  };

  const kpiCardClass =
    "bg-card/50 border border-primary/20 transition-all duration-200 hover:border-primary/70 glow-blue-hover";

  const productCardClass =
    "bg-card/50 border border-primary/20 transition-all duration-200 hover:border-primary/70 hover:bg-primary/5 glow-blue-hover";

  return (
    <div className="space-y-4">
      {/* CARDS NO TOPO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {/* 1) Custo total em estoque */}
        <Card className={kpiCardClass}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white">Custo total em estoque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className={`text-3xl font-bold ${getTotalCostColorClass(totalCostValue)}`}>
              {formatBRL(totalCostValue)}
            </p>
            <p className="text-xs text-muted-foreground">
              Soma de (custo × quantidade) de todos os produtos
            </p>
          </CardContent>
        </Card>

        {/* 2) Unidades em estoque */}
        <Card className={kpiCardClass}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white">Unidades em estoque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className={`text-3xl font-bold ${getUnitsColorClass(totalUnits)}`}>{totalUnits}</p>
            <p className="text-xs text-muted-foreground">Total de itens (somando quantidades)</p>
          </CardContent>
        </Card>

        {/* 3) Prejuízo / peças danificadas */}
        <Card className={kpiCardClass}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white">Prejuízo (danificados)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className={`text-3xl font-bold ${getDamagedLossColorClass(damagedLossValue)}`}>
              {formatBRL(damagedLossValue)}
            </p>
            <p className="text-xs text-muted-foreground">{damagedUnits} peça(s) danificada(s)</p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div>
          <h3 className="text-lg font-semibold text-primary">Produtos em Estoque</h3>
          <p className="text-sm text-muted-foreground">
            Total: {products.length} itens | Valor: R$ {totalInventoryValue.toFixed(2)}
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => {
                setEditingId(null);
                setFormData({
                  name: "",
                  sku: "",
                  color: "",
                  size: "",
                  cost: 0,
                  quantity: 0,
                });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>

          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-primary">
                {editingId ? "Editar" : "Novo"} Produto
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <Label>SKU</Label>
                  <Input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cor</Label>
                  <Input
                    value={formData.color || ""}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Tamanho</Label>
                  <Input
                    value={formData.size || ""}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Custo (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                  {editingId ? "Atualizar" : "Adicionar"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant={viewMode === "grid" ? "default" : "outline"} onClick={() => setViewMode("grid")}>
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button size="sm" variant={viewMode === "list" ? "default" : "outline"} onClick={() => setViewMode("list")}>
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Visualização */}
      {filteredProducts.length === 0 ? (
        <Card className="bg-card/50 border-border">
          <CardContent className="pt-6 text-center text-muted-foreground">Nenhum produto encontrado</CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className={productCardClass}>
              <CardContent className="pt-4 space-y-2">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Custo: <span className="font-medium text-white">{formatBRL(product.cost)}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Qtd: <span className="font-medium text-white">{product.quantity}</span>
                  </p>
                </div>

                {product.color && (
                  <p className="text-sm text-muted-foreground">
                    Cor: <span className="font-medium text-white">{product.color}</span>
                  </p>
                )}
                {product.size && (
                  <p className="text-sm text-muted-foreground">
                    Tamanho: <span className="font-medium text-white">{product.size}</span>
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(product)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" /> Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onDeleteProduct(product.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Excluir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onDuplicateProduct(product)}
                  >
                    <Copy className="w-4 h-4 mr-2" /> Duplicar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className={productCardClass}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteProduct(product.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDuplicateProduct(product)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-1">
                  <p className="text-sm text-muted-foreground">
                    Custo: <span className="font-medium text-white">{formatBRL(product.cost)}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Qtd: <span className="font-medium text-white">{product.quantity}</span>
                  </p>
                  {product.color && (
                    <p className="text-sm text-muted-foreground">
                      Cor: <span className="font-medium text-white">{product.color}</span>
                    </p>
                  )}
                  {product.size && (
                    <p className="text-sm text-muted-foreground">
                      Tamanho: <span className="font-medium text-white">{product.size}</span>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}