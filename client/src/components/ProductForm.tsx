import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Copy,
  Edit2,
  Search,
  LayoutGrid,
  List,
  Package,
  CircleDollarSign,
  ChevronDown,
  ChevronUp,
  Coins,
  Palette,
  AlertTriangle,
  Target
} from "lucide-react";
import { toast } from "sonner";

// ===== TIPOS ATUALIZADOS =====
export interface ProductVariation {
  id: string;
  sku: string;
  color: string;
  size: string;
  quantity: number;
  cost: number;
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

// Formatação de Moeda PROTEGIDA
const formatBRL = (value: any) => {
  const num = Number(value) || 0;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

// Função para calcular o range de custos PROTEGIDA
const getCostRange = (variations: ProductVariation[]) => {
  if (!variations || variations.length === 0) return "R$ 0,00";
  const costs = variations.map(v => Number(v.cost) || 0);
  const min = Math.min(...costs);
  const max = Math.max(...costs);
  
  if (min === max) return formatBRL(min);
  return `${formatBRL(min)} ~ ${formatBRL(max)}`;
};

// Função para agrupar variações por cor para exibição
const getGroupedVariations = (variations: ProductVariation[]) => {
  if (!variations) return [];
  return [...variations].sort((a, b) => {
    const colorA = (a.color || "").toLowerCase();
    const colorB = (b.color || "").toLowerCase();
    if (colorA < colorB) return -1;
    if (colorA > colorB) return 1;
    return (a.sku || "").localeCompare(b.sku || "");
  });
};

// --- COMPONENTE DE CONFIRMAÇÃO DE EXCLUSÃO (UNIFICADO) ---
function ConfirmDeleteDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description,
  count
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: () => void,
  title: string,
  description: string,
  count?: number
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[#0c0c0e] border-white/10 text-white">
        <DialogHeader>
          <div className="flex items-center gap-3 text-red-400 mb-2">
            <AlertTriangle className="w-6 h-6" />
            <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg my-2">
          <p className="text-xs text-red-400 font-medium">
            {count ? `Você está prestes a excluir ${count} ${count === 1 ? 'item' : 'itens'}.` : 'Esta ação não poderá ser desfeita.'}
          </p>
        </div>
        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 border-white/10 hover:bg-white/5">Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm} className="flex-1 bg-red-500 hover:bg-red-600">Confirmar Exclusão</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Sub-componente para o Card (Modo Grid)
function ProductCard({ 
  p, 
  onEdit, 
  onDuplicate,
  isSelected,
  onToggleSelect
}: { 
  p: Product, 
  onEdit: (p: Product) => void, 
  onDuplicate: (p: Product) => void,
  isSelected: boolean,
  onToggleSelect: (id: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const productTotalValue = (p.variations || []).reduce((acc, v) => acc + ((Number(v.cost) || 0) * (Number(v.quantity) || 0)), 0);
  const sortedVariations = useMemo(() => getGroupedVariations(p.variations || []), [p.variations]);

  return (
    <Card className={`bg-card/50 border-primary/20 hover:border-primary/50 transition-all flex flex-col h-full overflow-hidden relative ${isSelected ? "ring-2 ring-primary border-primary bg-primary/5" : ""}`}>
      <div className="absolute top-3 left-3 z-10">
        <Checkbox 
          checked={isSelected} 
          onCheckedChange={() => onToggleSelect(p.id)}
          className="w-5 h-5 border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      </div>

      <CardContent className="p-4 pt-4 space-y-3 flex-1">
        <div className="flex justify-between items-start pl-8">
          <div className="flex-1 min-w-0 pr-2">
            <h4 className="font-bold text-white text-base leading-tight truncate" title={p.name}>{p.name}</h4>
            <p className="text-xs text-muted-foreground font-mono mt-1 uppercase tracking-tighter truncate font-medium">SKU: {p.sku}</p>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => onEdit(p)} className="h-7 w-7 p-0 text-sky-400 hover:bg-sky-400/10"><Edit2 className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="sm" onClick={() => onDuplicate(p)} className="h-7 w-7 p-0 text-emerald-400 hover:bg-emerald-400/10"><Copy className="w-3.5 h-3.5" /></Button>
          </div>
        </div>

        <div className="pt-2 border-t border-white/5">
          <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center justify-between text-[10px] uppercase font-bold text-muted-foreground tracking-wider hover:text-primary transition-colors py-1">
            <span className="flex items-center gap-1.5"><Package className="w-3 h-3" /> Variações ({sortedVariations.length})</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          
          <div className={`mt-2 space-y-1 overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-[500px] opacity-100 overflow-y-auto pr-1" : "max-h-0 opacity-0"}`}>
            {sortedVariations.map((v, i) => {
              const showColorHeader = i === 0 || sortedVariations[i-1].color?.toLowerCase() !== v.color?.toLowerCase();
              return (
                <div key={i}>
                  {showColorHeader && v.color && (
                    <div className="flex items-center gap-1.5 px-1 py-1 mt-1 mb-0.5">
                      <div className="h-px flex-1 bg-white/5"></div>
                      <span className="text-[8px] uppercase font-bold text-primary/70 tracking-widest">{v.color}</span>
                      <div className="h-px flex-1 bg-white/5"></div>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-[11px] bg-black/20 p-1.5 rounded border border-white/5">
                    <div className="flex flex-col min-w-0 mr-2">
                      <span className="text-white font-medium truncate">{v.sku}</span>
                      <span className="text-[9px] text-muted-foreground truncate">{v.color || "S/ Cor"} / {v.size || "S/ Tam"} • {formatBRL(v.cost)}</span>
                    </div>
                    <span className={`font-bold shrink-0 ${v.quantity > 5 ? "text-emerald-400" : v.quantity > 0 ? "text-yellow-400" : "text-red-400"}`}>{v.quantity} un</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
      <div className="px-4 py-3 bg-primary/5 border-t border-white/5 rounded-b-xl">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[11px] text-muted-foreground italic">Custo Unitário:</span>
          <span className="text-sm text-white font-semibold">{getCostRange(p.variations)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-white uppercase tracking-wide">Valor Total:</span>
          <p className="text-base font-bold text-emerald-400 leading-none">{formatBRL(productTotalValue)}</p>
        </div>
      </div>
    </Card>
  );
}

// Sub-componente para a Linha (Modo Lista)
function ProductListItem({ 
  p, 
  onEdit, 
  onDuplicate,
  isSelected,
  onToggleSelect
}: { 
  p: Product, 
  onEdit: (p: Product) => void, 
  onDuplicate: (p: Product) => void,
  isSelected: boolean,
  onToggleSelect: (id: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const productTotalQty = (p.variations || []).reduce((acc, v) => acc + (Number(v.quantity) || 0), 0);
  const productTotalValue = (p.variations || []).reduce((acc, v) => acc + ((Number(v.cost) || 0) * (Number(v.quantity) || 0)), 0);
  const sortedVariations = useMemo(() => getGroupedVariations(p.variations || []), [p.variations]);

  return (
    <div className={`bg-card/40 border border-primary/10 rounded-lg overflow-hidden transition-all hover:border-primary/30 flex items-center ${isSelected ? "ring-1 ring-primary border-primary bg-primary/5" : ""}`}>
      <div className="pl-4">
        <Checkbox 
          checked={isSelected} 
          onCheckedChange={() => onToggleSelect(p.id)}
          className="w-5 h-5 border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      </div>
      <div className="flex-1">
        <div className="p-3 flex items-center gap-4">
          <button onClick={() => setIsExpanded(!isExpanded)} className="text-muted-foreground hover:text-primary p-1">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <div className="flex-1 grid grid-cols-12 items-center gap-2">
            <div className="col-span-3 min-w-0"><h4 className="font-bold text-white text-sm truncate">{p.name}</h4><p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter truncate font-medium">SKU: {p.sku}</p></div>
            <div className="col-span-2 text-center"><p className="text-[9px] text-muted-foreground uppercase tracking-widest">Qtd Total</p><p className="text-sm font-bold text-sky-400">{productTotalQty} un</p></div>
            <div className="col-span-2 text-center"><p className="text-[9px] text-muted-foreground uppercase tracking-widest">Custo Unit.</p><p className="text-sm font-bold text-white">{getCostRange(p.variations)}</p></div>
            <div className="col-span-2 text-right"><p className="text-[9px] text-muted-foreground uppercase tracking-widest">Valor Total</p><p className="text-sm font-bold text-emerald-400">{formatBRL(productTotalValue)}</p></div>
            <div className="col-span-3 flex justify-end gap-1">
              <Button variant="ghost" size="sm" onClick={() => onEdit(p)} className="h-7 w-7 p-0 text-sky-400 hover:bg-sky-400/10"><Edit2 className="w-3.5 h-3.5" /></Button>
              <Button variant="ghost" size="sm" onClick={() => onDuplicate(p)} className="h-7 w-7 p-0 text-emerald-400 hover:bg-emerald-400/10"><Copy className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        </div>
        {isExpanded && (
          <div className="px-12 pb-3 pt-1 border-t border-white/5 bg-black/10">
            <p className="text-[9px] uppercase font-bold text-muted-foreground mb-2 tracking-widest">SKUs Filhos / Variações</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {sortedVariations.map((v, i) => (
                <div key={i} className="flex justify-between items-center text-[10px] bg-black/30 p-1.5 rounded border border-white/5">
                  <div className="flex flex-col min-w-0 mr-2">
                    <span className="text-white font-medium truncate">{v.sku}</span>
                    <span className="text-[9px] text-muted-foreground truncate">{v.color || "S/ Cor"} / {v.size || "S/ Tam"} • {formatBRL(v.cost)}</span>
                  </div>
                  <span className={`font-bold shrink-0 ${v.quantity > 5 ? "text-emerald-400" : v.quantity > 0 ? "text-yellow-400" : "text-red-400"}`}>{v.quantity} un</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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
  const [searchTerm, setSearchTerm] = useState("");
  const [bulkCost, setBulkCost] = useState<string>("");
  
  // PERSISTÊNCIA DE VISUALIZAÇÃO
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ntoh_inventory_view_mode");
      return (saved === "grid" || saved === "list") ? saved : "grid";
    }
    return "grid";
  });

  useEffect(() => {
    localStorage.setItem("ntoh_inventory_view_mode", viewMode);
  }, [viewMode]);

  // ESTADOS DE SELEÇÃO E CONFIRMAÇÃO
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [variationToDeleteIndex, setVariationToDeleteIndex] = useState<number | null>(null);

  // ESTADOS DE DUPLICIDADE E UX INTELIGENTE
  const [duplicateSkuInfo, setDuplicateSkuInfo] = useState<{ sku: string, index: number, originalIndex: number } | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const variationRefs = useRef<(HTMLDivElement | null)[]>([]);
  const variationInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [formData, setFormData] = useState<Omit<Product, "id">>({
    name: "",
    sku: "",
    cost: 0,
    variations: [{ id: "", sku: "", color: "", size: "", quantity: 0, cost: 0 }],
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) setSelectedIds([]);
    else setSelectedIds(filteredProducts.map(p => p.id));
  };

  const handleBulkDelete = async () => {
    try {
      const promises = selectedIds.map(id => onDeleteProduct(id));
      await Promise.all(promises);
      toast.success(`${selectedIds.length} produtos excluídos`);
      setSelectedIds([]);
      setIsBulkDeleteOpen(false);
    } catch (error) {
      toast.error("Erro ao excluir produtos");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) { 
      toast.error("Nome e SKU Principal são obrigatórios"); 
      return; 
    }
    
    const validVariations = getGroupedVariations(formData.variations.filter(v => v.sku.trim()));
    
    // ✅ CORREÇÃO: Calcular o custo principal com base na média das variações se o custo principal for 0
    let finalCost = Number(formData.cost) || 0;
    if (finalCost === 0 && validVariations.length > 0) {
      const totalCost = validVariations.reduce((sum, v) => sum + (Number(v.cost) || 0), 0);
      finalCost = totalCost / validVariations.length;
    }

    const finalProductData = { 
      ...formData, 
      cost: finalCost,
      variations: validVariations 
    };

    if (editingId) { 
      await onEditProduct({ ...finalProductData, id: editingId } as Product); 
    } else { 
      await onAddProduct(finalProductData as Product); 
    }
    
    setFormData({ name: "", sku: "", cost: 0, variations: [{ id: "", sku: "", color: "", size: "", quantity: 0, cost: 0 }] });
    setEditingId(null);
    setOpen(false);
    setBulkCost("");
  };

  const handleEdit = (product: Product) => {
    const sortedVariations = getGroupedVariations(product.variations || []);
    setFormData({ 
      name: product.name, 
      sku: product.sku || "", 
      cost: product.cost, 
      variations: sortedVariations.length > 0 
        ? sortedVariations.map(v => ({ ...v, cost: v.cost || product.cost })) 
        : [{ id: "", sku: "", color: "", size: "", quantity: 0, cost: product.cost }] 
    });
    setEditingId(product.id);
    setOpen(true);
  };

  // ADICIONAR VARIAÇÃO COM AUTO-FOCO E GLOW
  const handleAddVariation = () => { 
    const lastCost = formData.variations.length > 0 ? formData.variations[formData.variations.length - 1].cost : 0;
    const newIndex = formData.variations.length;
    
    setFormData({ 
      ...formData, 
      variations: [...formData.variations, { id: "", sku: "", color: "", size: "", quantity: 0, cost: lastCost }] 
    }); 

    // Efeito de Glow e Scroll após a renderização
    setTimeout(() => {
      setHighlightedIndex(newIndex);
      const element = variationRefs.current[newIndex];
      const input = variationInputRefs.current[newIndex];
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (input) {
        input.focus();
      }

      // Remove o brilho após 3 segundos
      setTimeout(() => setHighlightedIndex(null), 3000);
    }, 50);
  };
  
  const handleRemoveVariation = () => { 
    if (variationToDeleteIndex === null) return;
    if (formData.variations.length === 1) { toast.error("Mantenha uma variação"); setVariationToDeleteIndex(null); return; } 
    const newVariations = formData.variations.filter((_, i) => i !== variationToDeleteIndex);
    setFormData({ ...formData, variations: newVariations });
    setVariationToDeleteIndex(null);
  };
  
  // LÓGICA DE DETECÇÃO DE DUPLICIDADE EM TEMPO REAL
  const handleVariationChange = (index: number, field: keyof ProductVariation, value: string | number) => { 
    const newVariations = [...formData.variations]; 
    
    if (field === "sku" && typeof value === "string" && value.trim() !== "") {
      const existingIndex = newVariations.findIndex((v, i) => i !== index && v.sku.toLowerCase() === value.toLowerCase().trim());
      if (existingIndex !== -1) {
        setDuplicateSkuInfo({ sku: value.trim(), index: index, originalIndex: existingIndex });
        return; 
      }
    }

    newVariations[index] = { ...newVariations[index], [field]: value }; 
    setFormData({ ...formData, variations: newVariations }); 
  };

  // AÇÃO: IR ATÉ O SKU DUPLICADO
  const handleGoToDuplicate = () => {
    if (!duplicateSkuInfo) return;
    const targetIndex = duplicateSkuInfo.originalIndex;
    setDuplicateSkuInfo(null);
    setHighlightedIndex(targetIndex);
    const element = variationRefs.current[targetIndex];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => setHighlightedIndex(null), 3000);
  };

  const applyBulkCost = () => {
    const cost = parseFloat(bulkCost);
    if (isNaN(cost)) { toast.error("Valor inválido"); return; }
    const newVariations = formData.variations.map(v => ({ ...v, cost }));
    setFormData({ ...formData, variations: newVariations, cost: cost }); // ✅ Também atualiza o custo principal
    toast.success("Custo aplicado");
  };

  const totalInventoryValue = products.reduce((sum, p) => sum + (p.variations || []).reduce((vSum, v) => vSum + ((Number(v.cost) || 0) * (Number(v.quantity) || 0)), 0), 0);
  const totalUnits = products.reduce((sum, p) => sum + (p.variations || []).reduce((vSum, v) => vSum + (Number(v.quantity) || 0), 0), 0);
  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-4">
      {/* HEADER STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-primary/20"><CardContent className="p-4"><p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5"><CircleDollarSign className="w-3 h-3 text-emerald-400" /> Valor em Estoque</p><p className="text-2xl font-bold text-emerald-400">{formatBRL(totalInventoryValue)}</p></CardContent></Card>
        <Card className="bg-card/50 border-primary/20"><CardContent className="p-4"><p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5"><Package className="w-3 h-3 text-sky-400" /> Total de Unidades</p><p className="text-2xl font-bold text-sky-400">{totalUnits}</p></CardContent></Card>
        <Card className="bg-card/50 border-primary/20"><CardContent className="p-4"><p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Total de Modelos</p><p className="text-2xl font-bold text-white">{products.length}</p></CardContent></Card>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/30 p-4 rounded-xl border border-white/5">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 pl-1 border-r border-white/10 pr-4">
            <Checkbox checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0} onCheckedChange={toggleSelectAll} className="w-5 h-5 border-white/30 data-[state=checked]:bg-primary" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Todos</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-lg"><Package className="w-5 h-5 text-primary" /></div>
            <h3 className="text-lg font-bold text-white">Gestão de Estoque</h3>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou SKU..." className="pl-9 h-10 bg-black/20 border-white/10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex bg-black/20 p-1 rounded-lg border border-white/10">
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode("grid")} className="h-8 w-8"><LayoutGrid className="h-4 w-4" /></Button>
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode("list")} className="h-8 w-8"><List className="h-4 w-4" /></Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => selectedIds.length > 0 && setIsBulkDeleteOpen(true)} className={`h-10 w-10 p-0 transition-all ${selectedIds.length > 0 ? "bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white" : "bg-white/5 text-white/20 cursor-not-allowed opacity-50"}`} disabled={selectedIds.length === 0}><Trash2 className="w-5 h-5" /></Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button className="bg-primary hover:bg-primary/90 text-white font-bold px-6 h-10 shadow-lg shadow-primary/20" onClick={() => { setEditingId(null); setFormData({ name: "", sku: "", cost: 0, variations: [{ id: "", sku: "", color: "", size: "", quantity: 0, cost: 0 }] }); }}><Plus className="w-4 h-4 mr-2" /> Novo Produto</Button></DialogTrigger>
              <DialogContent className="bg-[#0c0c0e] border-white/10 text-white p-5 sm:p-6 overflow-x-hidden flex flex-col" style={{ width: '66vw', maxWidth: '1200px', maxHeight: '85vh' }}>
                <DialogHeader className="mb-4 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-xl"><Package className="w-6 h-6 text-primary" /></div>
                    <div>
                      <DialogTitle className="text-2xl font-bold text-white">{editingId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
                      <DialogDescription className="text-muted-foreground text-xs">Preencha as informações principais e adicione as variações de SKU.</DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nome do Produto</Label>
                      <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-black/40 border-white/10 h-11" placeholder="Ex: Camiseta Oversized" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">SKU Principal (Pai)</Label>
                      <Input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className="bg-black/40 border-white/10 h-11 font-mono uppercase" placeholder="Ex: CAM-OV-001" />
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col min-h-0 bg-black/20 rounded-2xl border border-white/5 p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="bg-emerald-500/20 p-1.5 rounded-lg"><Coins className="w-4 h-4 text-emerald-400" /></div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-widest">Variações e Custos</h4>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="flex items-center bg-black/40 rounded-lg border border-white/10 px-2 h-9 flex-1 sm:flex-none">
                          <CircleDollarSign className="w-4 h-4 text-muted-foreground mr-2" />
                          <Input type="number" step="0.01" placeholder="Custo em massa" className="border-none bg-transparent h-full text-xs w-24 focus-visible:ring-0 p-0" value={bulkCost} onChange={(e) => setBulkCost(e.target.value)} />
                          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold text-emerald-400 hover:bg-emerald-400/10 ml-1" onClick={applyBulkCost}>APLICAR</Button>
                        </div>
                        <Button type="button" onClick={handleAddVariation} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 h-9 px-3 text-xs font-bold flex items-center gap-2"><Plus className="w-3.5 h-3.5" /> ADD SKU</Button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 min-h-0">
                      {formData.variations.map((v, index) => {
                        const showColorDivider = index > 0 && formData.variations[index-1].color?.toLowerCase() !== v.color?.toLowerCase() && v.color;
                        const isHighlighted = highlightedIndex === index;
                        
                        return (
                          <div key={index} className="space-y-1" ref={(el) => { variationRefs.current[index] = el; }}>
                            {showColorDivider && (
                              <div className="flex items-center gap-2 pt-1 pb-1">
                                <Palette className="w-3 h-3 text-primary/60" />
                                <span className="text-[9px] font-bold text-primary/60 uppercase tracking-widest">Grupo: {v.color}</span>
                                <div className="h-px flex-1 bg-white/5"></div>
                              </div>
                            )}
                            <div className={`grid grid-cols-12 gap-2.5 items-end p-2.5 rounded-lg border transition-all duration-500 ${
                              isHighlighted 
                              ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(59,130,246,0.5)] ring-1 ring-primary" 
                              : "bg-black/20 border-white/5 group hover:border-white/10"
                            }`}>
                              <div className="col-span-3 space-y-1">
                                <Label className="text-[9px] uppercase text-muted-foreground font-bold tracking-tighter">SKU Filho</Label>
                                <Input 
                                  ref={(el) => { variationInputRefs.current[index] = el; }}
                                  value={v.sku} 
                                  onChange={(e) => handleVariationChange(index, "sku", e.target.value)} 
                                  className={`bg-black/40 border-white/10 h-8 text-xs ${isHighlighted ? "border-primary" : ""}`} 
                                  placeholder="SKU" 
                                />
                              </div>
                              <div className="col-span-2 space-y-1"><Label className="text-[9px] uppercase text-muted-foreground font-bold tracking-tighter">Cor</Label><Input value={v.color} onChange={(e) => handleVariationChange(index, "color", e.target.value)} className="bg-black/40 border-white/10 h-8 text-xs" placeholder="Ex: Azul" /></div>
                              <div className="col-span-2 space-y-1"><Label className="text-[9px] uppercase text-muted-foreground font-bold tracking-tighter">Tamanho</Label><Input value={v.size} onChange={(e) => handleVariationChange(index, "size", e.target.value)} className="bg-black/40 border-white/10 h-8 text-xs" placeholder="Ex: P" /></div>
                              <div className="col-span-2 space-y-1"><Label className="text-[9px] uppercase text-muted-foreground font-bold tracking-tighter">Custo (R$)</Label><Input type="number" step="0.01" value={v.cost} onChange={(e) => handleVariationChange(index, "cost", parseFloat(e.target.value) || 0)} className="bg-black/40 border-white/10 h-8 text-xs font-bold text-emerald-400" /></div>
                              <div className="col-span-2 space-y-1"><Label className="text-[9px] uppercase text-muted-foreground font-bold tracking-tighter">Qtd</Label><Input type="number" value={v.quantity} onChange={(e) => handleVariationChange(index, "quantity", parseInt(e.target.value) || 0)} className="bg-black/40 border-white/10 h-8 text-xs font-bold text-sky-400" /></div>
                              <div className="col-span-1 flex justify-end pb-0.5"><Button type="button" variant="ghost" size="icon" onClick={() => setVariationToDeleteIndex(index)} className="h-8 w-8 text-red-400/30 hover:text-red-400 hover:bg-red-400/10"><Trash2 className="w-3.5 h-3.5" /></Button></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 mt-2 border-t border-white/5 shrink-0">
                    <Button type="button" variant="outline" className="flex-1 h-10 border-white/10 hover:bg-white/5 font-bold" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button type="submit" className="flex-[2] h-10 bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/10">Salvar Produto e Variações</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* GRID/LIST VIEW */}
      <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4" : "space-y-3"}>
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-card/20 border border-dashed border-white/10 rounded-2xl"><Package className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" /><p className="text-muted-foreground">Nenhum produto encontrado</p></div>
        ) : (
          filteredProducts.map((p) => (
            viewMode === "grid" 
              ? <ProductCard key={p.id} p={p} onEdit={handleEdit} onDuplicate={onDuplicateProduct} isSelected={selectedIds.includes(p.id)} onToggleSelect={toggleSelect} />
              : <ProductListItem key={p.id} p={p} onEdit={handleEdit} onDuplicate={onDuplicateProduct} isSelected={selectedIds.includes(p.id)} onToggleSelect={toggleSelect} />
          ))
        )}
      </div>

      {/* MODAL DE DUPLICIDADE INTELIGENTE */}
      <Dialog open={duplicateSkuInfo !== null} onOpenChange={() => setDuplicateSkuInfo(null)}>
        <DialogContent className="max-w-md bg-[#0c0c0e] border-white/10 text-white">
          <DialogHeader>
            <div className="flex items-center gap-3 text-yellow-400 mb-2">
              <AlertTriangle className="w-6 h-6" />
              <DialogTitle className="text-xl font-bold">SKU Duplicado Detectado</DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground">
              O SKU <span className="text-white font-bold">"{duplicateSkuInfo?.sku}"</span> já está sendo usado em outra variação deste produto.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg my-2">
            <p className="text-sm text-yellow-200/80 leading-relaxed">
              Deseja limpar este campo para digitar um novo SKU ou quer que eu te mostre onde está o SKU original?
            </p>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setDuplicateSkuInfo(null)} className="flex-1 border-white/10 hover:bg-white/5">Substituir (Limpar)</Button>
            <Button variant="secondary" onClick={handleGoToDuplicate} className="flex-1 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 font-bold flex items-center gap-2">
              <Target className="w-4 h-4" /> Ir até ele
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRMAÇÕES DE EXCLUSÃO */}
      <ConfirmDeleteDialog isOpen={isBulkDeleteOpen} onClose={() => setIsBulkDeleteOpen(false)} onConfirm={handleBulkDelete} title="Confirmar Exclusão em Massa" description={`Você selecionou ${selectedIds.length} itens para exclusão.`} count={selectedIds.length} />
      <ConfirmDeleteDialog isOpen={variationToDeleteIndex !== null} onClose={() => setVariationToDeleteIndex(null)} onConfirm={handleRemoveVariation} title="Excluir Variação" description="Tem certeza que deseja remover esta variação de SKU?" />
    </div>
  );
}