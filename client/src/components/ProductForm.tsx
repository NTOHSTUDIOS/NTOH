import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  sku: string;
  name: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
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

// Formatação de Moeda
const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Sub-componente para o Card (Modo Grid)
function ProductCard({ p, onEdit, onDelete, onDuplicate }: { 
  p: Product, 
  onEdit: (p: Product) => void, 
  onDelete: (id: string) => void, 
  onDuplicate: (p: Product) => void 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const productTotalQty = (p.variations || []).reduce((acc, v) => acc + (Number(v.quantity) || 0), 0);
  const productTotalValue = p.cost * productTotalQty;

  return (
    <Card className="bg-card/50 border-primary/20 hover:border-primary/50 transition-all flex flex-col h-full overflow-hidden">
      <CardContent className="p-4 space-y-3 flex-1">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0 pr-2">
            <h4 className="font-bold text-white text-base leading-tight truncate" title={p.name}>{p.name}</h4>
            {/* SKU PRINCIPAL EM CINZA COM FONTE AUMENTADA (text-xs = 12px) */}
            <p className="text-xs text-muted-foreground font-mono mt-1 uppercase tracking-tighter truncate font-medium">SKU PRINCIPAL: {p.sku}</p>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => onEdit(p)} className="h-7 w-7 p-0 text-sky-400 hover:bg-sky-400/10"><Edit2 className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="sm" onClick={() => onDuplicate(p)} className="h-7 w-7 p-0 text-emerald-400 hover:bg-emerald-400/10"><Copy className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(p.id)} className="h-7 w-7 p-0 text-red-400 hover:bg-red-400/10"><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        </div>

        <div className="pt-2 border-t border-white/5">
          <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center justify-between text-[10px] uppercase font-bold text-muted-foreground tracking-wider hover:text-primary transition-colors py-1">
            <span className="flex items-center gap-1.5"><Package className="w-3 h-3" /> Variações ({(p.variations || []).length})</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          
          <div className={`mt-2 space-y-1 overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
            {(p.variations || []).map((v, i) => (
              <div key={i} className="flex justify-between items-center text-[11px] bg-black/20 p-1.5 rounded border border-white/5">
                <span className="text-muted-foreground truncate mr-2"><span className="text-white font-medium">{v.sku}</span> {v.name && `(${v.name})`}</span>
                <span className={`font-bold shrink-0 ${v.quantity > 5 ? "text-emerald-400" : v.quantity > 0 ? "text-yellow-400" : "text-red-400"}`}>{v.quantity} un</span>
              </div>
            ))}
          </div>
          {!isExpanded && productTotalQty > 0 && (
            <div className="mt-1 flex items-center gap-1"><span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{productTotalQty} un totais</span></div>
          )}
        </div>
      </CardContent>
      <div className="px-4 py-3 bg-primary/5 border-t border-white/5 rounded-b-xl">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[11px] text-muted-foreground italic">Custo Unitário:</span>
          {/* CUSTO UNITÁRIO COM FONTE LEVEMENTE AUMENTADA (text-sm = 14px) */}
          <span className="text-sm text-white font-semibold">{formatBRL(p.cost)}</span>
        </div>
        <div className="flex justify-between items-center">
          {/* VALOR TOTAL EM BRANCO */}
          <span className="text-xs font-bold text-white uppercase tracking-wide">Valor Total:</span>
          <p className="text-base font-bold text-emerald-400 leading-none">{formatBRL(productTotalValue)}</p>
        </div>
      </div>
    </Card>
  );
}

// Sub-componente para a Linha (Modo Lista)
function ProductListItem({ p, onEdit, onDelete, onDuplicate }: { 
  p: Product, 
  onEdit: (p: Product) => void, 
  onDelete: (id: string) => void, 
  onDuplicate: (p: Product) => void 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const productTotalQty = (p.variations || []).reduce((acc, v) => acc + (Number(v.quantity) || 0), 0);
  const productTotalValue = p.cost * productTotalQty;

  return (
    <div className="bg-card/40 border border-primary/10 rounded-lg overflow-hidden transition-all hover:border-primary/30">
      <div className="p-3 flex items-center gap-4">
        <button onClick={() => setIsExpanded(!isExpanded)} className="text-muted-foreground hover:text-primary p-1">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <div className="flex-1 grid grid-cols-12 items-center gap-2">
          <div className="col-span-3 min-w-0"><h4 className="font-bold text-white text-sm truncate">{p.name}</h4><p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter truncate font-medium">SKU PRINCIPAL: {p.sku}</p></div>
          <div className="col-span-2 text-center"><p className="text-[9px] text-muted-foreground uppercase tracking-widest">Custo Unit.</p><p className="text-sm font-semibold text-white/90">{formatBRL(p.cost)}</p></div>
          <div className="col-span-2 text-center"><p className="text-[9px] text-muted-foreground uppercase tracking-widest">Qtd Total</p><p className="text-sm font-bold text-white">{productTotalQty} un</p></div>
          <div className="col-span-2 text-right"><p className="text-[9px] text-muted-foreground uppercase tracking-widest">Valor Total</p><p className="text-sm font-bold text-emerald-400">{formatBRL(productTotalValue)}</p></div>
          <div className="col-span-3 flex justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(p)} className="h-7 w-7 p-0 text-sky-400 hover:bg-sky-400/10"><Edit2 className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="sm" onClick={() => onDuplicate(p)} className="h-7 w-7 p-0 text-emerald-400 hover:bg-emerald-400/10"><Copy className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(p.id)} className="h-7 w-7 p-0 text-red-400 hover:bg-red-400/10"><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className="px-12 pb-3 pt-1 border-t border-white/5 bg-black/10">
          <p className="text-[9px] uppercase font-bold text-muted-foreground mb-2 tracking-widest">SKUs Filhos / Variações</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {(p.variations || []).map((v, i) => (
              <div key={i} className="flex justify-between items-center text-[10px] bg-black/30 p-1.5 rounded border border-white/5">
                <span className="text-muted-foreground truncate mr-2"><span className="text-white font-medium">{v.sku}</span> {v.name && `(${v.name})`}</span>
                <span className={`font-bold shrink-0 ${v.quantity > 5 ? "text-emerald-400" : v.quantity > 0 ? "text-yellow-400" : "text-red-400"}`}>{v.quantity} un</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
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
    if (!formData.name.trim() || !formData.sku.trim()) { toast.error("Nome e SKU Principal são obrigatórios"); return; }
    const validVariations = formData.variations.filter(v => v.sku.trim());
    if (editingId) { await onEditProduct({ ...formData, id: editingId, variations: validVariations }); }
    else { await onAddProduct({ ...formData, variations: validVariations } as Product); }
    setFormData({ name: "", sku: "", cost: 0, variations: [{ id: "", sku: "", name: "", quantity: 0 }] });
    setEditingId(null);
    setOpen(false);
  };

  const handleEdit = (product: Product) => {
    setFormData({ name: product.name, sku: product.sku || "", cost: product.cost, variations: product.variations && product.variations.length > 0 ? product.variations : [{ id: "", sku: "", name: "", quantity: 0 }] });
    setEditingId(product.id);
    setOpen(true);
  };

  const handleAddVariation = () => { setFormData({ ...formData, variations: [...formData.variations, { id: "", sku: "", name: "", quantity: 0 }] }); };
  const handleRemoveVariation = (index: number) => { if (formData.variations.length === 1) { toast.error("Mantenha pelo menos uma variação"); return; } setFormData({ ...formData, variations: formData.variations.filter((_, i) => i !== index) }); };
  const handleVariationChange = (index: number, field: keyof ProductVariation, value: string | number) => { const newVariations = [...formData.variations]; newVariations[index] = { ...newVariations[index], [field]: value }; setFormData({ ...formData, variations: newVariations }); };

  // CÁLCULOS GLOBAIS
  const totalInventoryValue = products.reduce((sum, p) => {
    const totalQty = (p.variations || []).reduce((vSum, v) => vSum + (Number(v.quantity) || 0), 0);
    return sum + (p.cost * totalQty);
  }, 0);
  const totalUnits = products.reduce((sum, p) => sum + (p.variations || []).reduce((vSum, v) => vSum + (Number(v.quantity) || 0), 0), 0);

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-4">
      {/* KPIs GLOBAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-primary/20"><CardContent className="p-4"><p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5"><CircleDollarSign className="w-3 h-3 text-emerald-400" /> Valor em Estoque</p><p className="text-2xl font-bold text-emerald-400">{formatBRL(totalInventoryValue)}</p></CardContent></Card>
        <Card className="bg-card/50 border-primary/20"><CardContent className="p-4"><p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5"><Package className="w-3 h-3 text-sky-400" /> Total de Unidades</p><p className="text-2xl font-bold text-sky-400">{totalUnits}</p></CardContent></Card>
        <Card className="bg-card/50 border-primary/20"><CardContent className="p-4"><p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Total de Modelos</p><p className="text-2xl font-bold text-white">{products.length}</p></CardContent></Card>
      </div>

      {/* Header & Busca */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center pt-2">
        {/* TÍTULO EM BRANCO COM ÍCONE EM AZUL */}
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" /> Gestão de Estoque
        </h3>
        <div className="flex gap-2 w-full sm:w-auto">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none" onClick={() => { setEditingId(null); setFormData({ name: "", sku: "", cost: 0, variations: [{ id: "", sku: "", name: "", quantity: 0 }] }); }}><Plus className="w-4 h-4 mr-2" /> Novo Produto</Button></DialogTrigger>
            <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="text-primary">{editingId ? "Editar" : "Novo"} Produto</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-primary/10 rounded-xl bg-primary/5">
                  <div className="space-y-2"><Label>Nome do Produto</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                  <div className="space-y-2"><Label>SKU Principal</Label><Input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} /></div>
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
                <div className="flex gap-3 pt-4 border-t border-border"><Button type="submit" className="flex-1 bg-primary">Salvar</Button><Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-2 items-center bg-card/30 p-2 rounded-lg border border-border">
        <Search className="w-4 h-4 text-muted-foreground ml-2" />
        <Input placeholder="Buscar por nome ou SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border-none bg-transparent focus-visible:ring-0 h-8 flex-1" />
        <div className="flex border-l border-border pl-2 gap-1">
          <Button size="sm" variant={viewMode === "grid" ? "default" : "outline"} onClick={() => setViewMode("grid")} className="h-8 w-8 p-0"><LayoutGrid className="w-4 h-4" /></Button>
          <Button size="sm" variant={viewMode === "list" ? "default" : "outline"} onClick={() => setViewMode("list")} className="h-8 w-8 p-0"><List className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Renderização Alternada Grid/Lista */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} p={p} onEdit={handleEdit} onDelete={onDeleteProduct} onDuplicate={onDuplicateProduct} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((p) => (
            <ProductListItem key={p.id} p={p} onEdit={handleEdit} onDelete={onDeleteProduct} onDuplicate={onDuplicateProduct} />
          ))}
        </div>
      )}
    </div>
  );
}