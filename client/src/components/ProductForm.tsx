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
  onAddProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onDuplicateProduct: (product: Product) => void;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.sku.trim()) {
      toast.error("Nome e SKU são obrigatórios");
      return;
    }

    if (editingId) {
      onEditProduct({ ...formData, id: editingId });
      toast.success("Produto atualizado");
    } else {
      onAddProduct({ ...formData, id: Date.now().toString() });
      toast.success("Produto adicionado");
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

  // --- CÁLCULOS DOS KPIs DOS CARDS ---
  const totalCostValue = products.reduce((sum, p) => sum + p.cost * p.quantity, 0);
  const totalUnits = products.reduce((sum, p) => sum + p.quantity, 0);

  // Placeholder até existir campo real de danificados
  const damagedUnits = 0;
  const damagedLossValue = 0;

  const formatBRL = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Efeito "LED" (cyan) para os KPIs do topo
  const kpiCardClass =
    "bg-card/50 border border-purple-500/20 transition-all duration-200 hover:border-cyan-400/70 hover:shadow-[0_0_24px_rgba(34,211,238,0.35)]";

  // Efeito hover roxo “brilhoso” para os cards dos produtos
  const productCardClass =
    "bg-card/50 border border-purple-500/20 transition-all duration-200 hover:border-purple-400/70 hover:bg-purple-500/5 hover:shadow-[0_0_22px_rgba(168,85,247,0.25)]";

  return (
    <div className="space-y-4">
      {/* CARDS NO TOPO (com efeito LED no hover) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {/* 1) Valor total de custo em estoque */}
        <Card className={kpiCardClass}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Custo total em estoque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-3xl font-bold text-cyan-300">{formatBRL(totalCostValue)}</p>
            <p className="text-xs text-muted-foreground">
              Soma de (custo × quantidade) de todos os produtos
            </p>
          </CardContent>
        </Card>

        {/* 2) Quantidade total de unidades em estoque */}
        <Card className={kpiCardClass}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Unidades em estoque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-3xl font-bold text-cyan-300">{totalUnits}</p>
            <p className="text-xs text-muted-foreground">Total de itens (somando quantidades)</p>
          </CardContent>
        </Card>

        {/* 3) Prejuízo / peças danificadas */}
        <Card className={kpiCardClass}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Prejuízo (danificados)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-3xl font-bold text-cyan-300">{formatBRL(damagedLossValue)}</p>
            <p className="text-xs text-muted-foreground">{damagedUnits} peça(s) danificada(s)</p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div>
          <h3 className="text-lg font-semibold text-cyan-300">Produtos em Estoque</h3>
          <p className="text-sm text-muted-foreground">
            Total: {products.length} itens | Valor: R$ {totalInventoryValue.toFixed(2)}
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
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
              <DialogTitle className="text-cyan-300">{editingId ? "Editar" : "Novo"} Produto</DialogTitle>
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
                <Button type="submit" className="flex-1 bg-purple-600">
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

                <div className="flex justify-between items-center pt-2 border-t">
                  <div>
                    <p className="text-white font-medium">Qtd: {product.quantity}</p>
                    <p className="text-sm font-semibold text-cyan-300">
                      R$ {(product.cost * product.quantity).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(product)}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDuplicateProduct(product)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        onDeleteProduct(product.id);
                        toast.success("Produto removido");
                      }}
                      className="text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProducts.map((product) => (
            <Card key={product.id} className={productCardClass}>
              <CardContent className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">{product.name}</p>

                  <div className="flex flex-wrap gap-6 mt-1">
                    <span className="text-sm text-muted-foreground">SKU: {product.sku}</span>

                    <span className="text-sm font-medium text-white">Qtd: {product.quantity}</span>

                    <span className="text-sm font-semibold text-cyan-300">
                      R$ {(product.cost * product.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(product)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onDuplicateProduct(product)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      onDeleteProduct(product.id);
                      toast.success("Produto removido");
                    }}
                    className="text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}