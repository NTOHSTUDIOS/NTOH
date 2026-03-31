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
  X,
  Package,
  CircleDollarSign,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

// ===== TIPOS =====
export interface ProductVariation {
  id: string;
  sku: string; // SKU da Variação (Filho)
  name: string; // Nome da Variação (ex: "P / Azul")
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string; // SKU Principal (Pai)
  cost: number;
  variations: ProductVariation[];
}

interface ProductFormProps {
  onAddProduct: (product: Product) => Promise<void>;
  onEditProduct: (product: Product) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onDuplicateProduct: (product: Product) => Promise<void>;
  products: Product[];
}

// Sub-componente para gerenciar o estado de cada card individualmente
function ProductCard({ p, onEdit, onDelete, onDuplicate }: { 
  p: Product, 
  onEdit: (p: Product) => void, 
  onDelete: (id: string) => void, 
  onDuplicate: (p: Product) => void 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const productTotalQty = (p.variations || []).reduce((acc, v) => acc + (Number(v.quantity) || 0), 0);
  const productTotalValue = p.cost * productTotalQty;

  const formatBRL = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Card className="bg-card/50 border-primary/20 hover:border-primary/50 transition-all flex flex-col h-full overflow-hidden">
      <CardContent className="p-4 space-y-3 flex-1">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0 pr-2">
            <h4 className="font-bold text-white leading-tight truncate" title={p.name}>{p.name}</h4>
            <p className="text-[10px] text-primary font-mono mt-1 uppercase tracking-tighter truncate">Pai: {p.sku}</p>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => onEdit(p)} className="h-7 w-7 p-0 text-sky-400 hover:bg-sky-400/10"><Edit2 className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="sm" onClick={() => onDuplicate(p)} className="h-7 w-7 p-0 text-emerald-400 hover:bg-emerald-400/10"><Copy className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(p.id)} className="h-7 w-7 p-0 text-red-400 hover:bg-red-400/10"><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        </div>

        {/* Botão de Expandir/Recolher Variações */}
        <div className="pt-2 border-t border-white/5">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-[10px] uppercase font-bold text-muted-foreground tracking-wider hover:text-primary transition-colors py-1"
          >
            <span className="flex items-center gap-1.5">
              <Package className="w-3 h-3" /> Variações ({(p.variations || []).length})
            </span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          
          {/* Lista de Variações (Visível apenas se expandido) */}
          <div className={`mt-2 space-y-1 overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
            {(p.variations || []).length > 0 ? (
              (p.variations || []).map((v, i) => (
                <div key={i} className="flex justify-between items-center text-[11px] bg-black/20 p-1.5 rounded border border-white/5">
                  <span className="text-muted-foreground truncate mr-2">
                    <span className="text-white font-medium">{v.sku}</span> {v.name && `(${v.name})`}
                  </span>
                  <span className={`font-bold shrink-0 ${v.quantity > 5 ? "text-emerald-400" : v.quantity > 0 ? "text-yellow-400" : "text-red-400"}`}>
                    {v.quantity} un
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-muted-foreground italic py-1">Nenhuma variação cadastrada</p>
            )}
          </div>
          
          {/* Preview Rápido (Visível apenas se recolhido) */}
          {!isExpanded && productTotalQty > 0 && (
            <div className="mt-1 flex items-center gap-1">
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {productTotalQty} un totais em estoque
              </span>
            </div>
          )}
        </div>
      </CardContent>

      {/* Rodapé Financeiro do Card */}
      <div className="px-4 py-3 bg-primary/5 border-t border-white/5 rounded-b-xl">
        <div className="flex justify-between items-center text-[10px] mb-1">
          <span className="text-muted-foreground italic">Custo Unitário:</span>
          <span className="text-white font-medium">{formatBRL(p.cost)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-primary">VALOR TOTAL:</span>
          <div className="text-right">
            <p className="text-sm font-bold text-emerald-400 leading-none">{formatBRL(productTotalValue)}</p>
            <p className="text-[9px] text-muted-foreground uppercase mt-1 tracking-tighter">{productTotalQty} unidades no modelo</p>
          </div>
        </div>
      </div>
    </Card>
  );
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
    cost: 0,
    variations: [{ id: "", sku: "", name: "", quantity: 0 }],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) {
      toast.error("Nome e SKU Principal são obrigatórios");
      return;
    }
    const validVariations = formData.variations.filter(v => v.sku.trim());
    if (editingId) {
      await onEditProduct({ ...formData, id: editingId, variations: validVariations });
    } else {
      await onAddProduct({ ...formData, variations: validVariations } as Product);
    }
    setFormData({ name: "", sku: "", cost: 0, variations: [{ id: "", sku: "", name: "", quantity: 0 }] });
    setEditingId(null);
    setOpen(false);
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      sku: product.sku || "",
      cost: product.cost,
      variations: product.variations && product.variations.length > 0 
        ? product.variations 
        : [{ id: "", sku: "", name: "", quantity: 0 }],
    });
    setEditingId(product.id);
    setOpen(true);
  };

  const handleAddVariation = () => {
    setFormData({ ...formData, variations: [...formData.variations, { id: "", sku: "", name: "", quantity: 0 }] });
  };

  const handleRemoveVariation = (index: number) => {
    if (formData.variations.length === 1) {
      toast.error("Mantenha pelo menos uma variação ou deixe o SKU em branco");
      return;
    }
    setFormData({ ...formData, variations: formData.variations.filter((_, i) => i !== index) });
  };

  const handleVariationChange = (index: number, field: keyof ProductVariation, value: string | number) => {
    const newVariations = [...formData.variations];
    newVariations[index] = { ...newVariations[index], [field]: value };
    setFormData({ ...formData, variations: newVariations });
  };

  // --- CÁLCULOS GLOBAIS ---
  const totalInventoryValue = products.reduce((sum, p) => {
    const totalQty = (p.variations || []).reduce((vSum, v) => vSum + (Number(v.quantity) || 0), 0);
    return sum + (p.cost * totalQty);
  }, 0);

  const totalUnits = products.reduce((sum, p) => {
    return sum + (p.variations || []).reduce((vSum, v) => vSum + (Number(v.quantity) || 0), 0);
  }, 0);

  const formatBRL = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* KPIs GLOBAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-primary/20 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
              <CircleDollarSign className="w-3.5 h-3.5 text-emerald-400" /> Valor em Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-400">{formatBRL(totalInventoryValue)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-primary/20 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
              <Package className="w-3.5 h-3.5 text-sky-400" /> Total de Unidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-sky-400">{totalUnits}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-primary/20 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-widest">Total de Modelos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{products.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Header & Ações */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center pt-2">
        <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
          <Package className="w-5 h-5" /> Gestão de Estoque
        </h3>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => { setEditingId(null); setFormData({ name: "", sku: "", cost: 0, variations: [{ id: "", sku: "", name: "", quantity: 0 }] }); }}>
              <Plus className="w-4 h-4 mr-2" /> Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="text-primary">{editingId ? "Editar" : "Novo"} Produto</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-primary/10 rounded-xl bg-primary/5">
                <div className="space-y-2"><Label>Nome do Produto</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Camiseta" /></div>
                <div className="space-y-2"><Label>SKU Principal</Label><Input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="Ex: SKU-001" /></div>
                <div className="space-y-2"><Label>Custo Unitário (R$)</Label><Input type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })} /></div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between"><Label className="text-base font-semibold text-white">Variações</Label><Button type="button" size="sm" variant="outline" onClick={handleAddVariation}><Plus className="w-4 h-4 mr-1" /> Add Variação</Button></div>
                <div className="space-y-3">
                  {formData.variations.map((v, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end p-3 border border-border rounded-lg bg-background/40">
                      <div className="col-span-4 space-y-1"><Label className="text-xs">SKU Filho</Label><Input value={v.sku} onChange={(e) => handleVariationChange(idx, "sku", e.target.value)} className="h-8 text-xs" /></div>
                      <div className="col-span-4 space-y-1"><Label className="text-xs">Nome</Label><Input value={v.name} onChange={(e) => handleVariationChange(idx, "name", e.target.value)} className="h-8 text-xs" /></div>
                      <div className="col-span-3 space-y-1"><Label className="text-xs">Qtd</Label><Input type="number" value={v.quantity} onChange={(e) => handleVariationChange(idx, "quantity", parseInt(e.target.value) || 0)} className="h-8 text-xs" /></div>
                      <div className="col-span-1"><Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveVariation(idx)} className="h-8 w-8 p-0 text-red-400"><X className="w-4 h-4" /></Button></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-border"><Button type="submit" className="flex-1 bg-primary">{editingId ? "Salvar" : "Cadastrar"}</Button><Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Busca */}
      <div className="flex gap-2 items-center bg-card/30 p-2 rounded-lg border border-border">
        <Search className="w-4 h-4 text-muted-foreground ml-2" />
        <Input placeholder="Buscar por nome ou SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border-none bg-transparent focus-visible:ring-0 h-8" />
      </div>

      {/* Grid de Cards Dinâmicos */}
      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
        {filteredProducts.map((p) => (
          <ProductCard 
            key={p.id} 
            p={p} 
            onEdit={handleEdit} 
            onDelete={onDeleteProduct} 
            onDuplicate={onDuplicateProduct} 
          />
        ))}
      </div>
    </div>
  );
}