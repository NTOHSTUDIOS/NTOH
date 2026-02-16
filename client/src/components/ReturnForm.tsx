import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Copy, Edit2, ArrowRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export interface Return {
  id: string;
  name: string;
  sku: string;
  color?: string;
  size?: string;
  cost: number;
  quantity: number;
  status: "pending" | "processing" | "completed";
  reason?: string;
  createdAt: string; // ISO string
}

interface ReturnFormProps {
  onAddReturn: (returnItem: Return) => void;
  onEditReturn: (returnItem: Return) => void;
  onDeleteReturn: (id: string) => void;
  onDuplicateReturn: (returnItem: Return) => void;
  onMoveToProcessing: (id: string) => void;
  onMoveToCompleted: (id: string) => void;
  onAddToStock: (returnItem: Return) => void;
  returns: Return[];
}

export function ReturnForm({
  onAddReturn,
  onEditReturn,
  onDeleteReturn,
  onDuplicateReturn,
  onMoveToProcessing,
  onMoveToCompleted,
  onAddToStock,
  returns,
}: ReturnFormProps) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filtro de datas (YYYY-MM-DD)
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [formData, setFormData] = useState<Omit<Return, "id">>({
    name: "",
    sku: "",
    color: "",
    size: "",
    cost: 0,
    quantity: 0,
    status: "pending",
    reason: "",
    createdAt: new Date().toISOString(),
  });

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      color: "",
      size: "",
      cost: 0,
      quantity: 0,
      status: "pending",
      reason: "",
      createdAt: new Date().toISOString(),
    });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.sku.trim()) {
      toast.error("Nome e SKU são obrigatórios");
      return;
    }

    if (editingId) {
      onEditReturn({ ...formData, id: editingId });
      toast.success("Devolução atualizada");
    } else {
      onAddReturn({
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      });
      toast.success("Devolução adicionada");
    }

    resetForm();
    setOpen(false);
  };

  const handleEdit = (returnItem: Return) => {
    const { id, ...rest } = returnItem;
    setFormData(rest);
    setEditingId(id);
    setOpen(true);
  };

  // Helpers: comparar por dia no horário local (evita bug de fuso)
  const toDayKey = (iso: string) => {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const inDateRange = (createdAtIso: string) => {
    const dayKey = toDayKey(createdAtIso);
    if (startDate && dayKey < startDate) return false;
    if (endDate && dayKey > endDate) return false;
    return true;
  };

  const filteredReturns = returns.filter((r) => inDateRange(r.createdAt));

  const pendingReturns = filteredReturns.filter((r) => r.status === "pending");
  const processingReturns = filteredReturns.filter((r) => r.status === "processing");
  const completedReturns = filteredReturns.filter((r) => r.status === "completed");

  const ReturnCard = ({ returnItem }: { returnItem: Return }) => (
    <Card className="bg-card/50 border-purple-500/20 hover:border-purple-500/50 transition-all">
      <CardContent className="pt-4 space-y-2">
        <div>
          <p className="font-medium text-foreground">{returnItem.name}</p>
          <p className="text-xs text-muted-foreground">SKU: {returnItem.sku}</p>
          <p className="text-xs text-muted-foreground">Data: {toDayKey(returnItem.createdAt)}</p>
        </div>

        {(returnItem.color || returnItem.size) && (
          <p className="text-xs text-muted-foreground">
            {returnItem.color && `Cor: ${returnItem.color}`}
            {returnItem.color && returnItem.size && " | "}
            {returnItem.size && `Tam: ${returnItem.size}`}
          </p>
        )}

        {returnItem.reason && <p className="text-xs text-yellow-400">Motivo: {returnItem.reason}</p>}

        <div className="flex justify-between items-center pt-2 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Qtd: {returnItem.quantity}</p>
            <p className="text-sm font-semibold text-cyan-300">
              R$ {(returnItem.cost * returnItem.quantity).toFixed(2)}
            </p>
          </div>

          <div className="flex gap-1 flex-wrap justify-end">
            {returnItem.status === "pending" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  onMoveToProcessing(returnItem.id);
                  toast.success("Movido para processamento");
                }}
                className="text-blue-400 hover:bg-blue-500/20 h-8 px-2"
              >
                <ArrowRight className="w-3 h-3 mr-1" />
                Processar
              </Button>
            )}

            {returnItem.status === "processing" && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    onMoveToCompleted(returnItem.id);
                    toast.success("Devolução concluída");
                  }}
                  className="text-green-400 hover:bg-green-500/20 h-8 px-2"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Concluir
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    onAddToStock(returnItem);
                    toast.success("Produto adicionado ao estoque");
                  }}
                  className="text-purple-400 hover:bg-purple-500/20 h-8 px-2"
                >
                  + Estoque
                </Button>
              </>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEdit(returnItem)}
              className="text-purple-400 hover:bg-purple-500/20 h-8 w-8 p-0"
              title="Editar"
            >
              <Edit2 className="w-3 h-3" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDuplicateReturn(returnItem)}
              className="text-purple-400 hover:bg-purple-500/20 h-8 w-8 p-0"
              title="Duplicar"
            >
              <Copy className="w-3 h-3" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                onDeleteReturn(returnItem.id);
                toast.success("Devolução removida");
              }}
              className="text-red-400 hover:bg-red-500/20 h-8 w-8 p-0"
              title="Excluir"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div>
          <h3 className="text-lg font-semibold text-cyan-300">Devoluções</h3>
          <p className="text-sm text-muted-foreground">Rastreamento de devoluções de clientes</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => {
                resetForm();
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Devolução
            </Button>
          </DialogTrigger>

          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-cyan-300">{editingId ? "Editar" : "Nova"} Devolução</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-foreground">
                    Nome
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome do produto"
                    className="bg-input border-border text-foreground"
                  />
                </div>

                <div>
                  <Label htmlFor="sku" className="text-foreground">
                    SKU
                  </Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="SKU"
                    className="bg-input border-border text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="color" className="text-foreground">
                    Cor
                  </Label>
                  <Input
                    id="color"
                    value={formData.color || ""}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Cor"
                    className="bg-input border-border text-foreground"
                  />
                </div>

                <div>
                  <Label htmlFor="size" className="text-foreground">
                    Tamanho
                  </Label>
                  <Input
                    id="size"
                    value={formData.size || ""}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="Tamanho"
                    className="bg-input border-border text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost" className="text-foreground">
                    Custo (R$)
                  </Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="bg-input border-border text-foreground"
                  />
                </div>

                <div>
                  <Label htmlFor="quantity" className="text-foreground">
                    Quantidade
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="bg-input border-border text-foreground"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reason" className="text-foreground">
                  Motivo da Devolução
                </Label>
                <Input
                  id="reason"
                  value={formData.reason || ""}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Defeito, tamanho incorreto..."
                  className="bg-input border-border text-foreground"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
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

      {/* Filtro por datas */}
      <Card className="bg-card/50 border-border">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <Label htmlFor="startDate" className="text-foreground">
                De
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-input border-border text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="endDate" className="text-foreground">
                Até
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-input border-border text-foreground"
              />
            </div>

            <div className="sm:col-span-2 flex gap-2 items-center">
              <Button
                type="button"
                variant="outline"
                className="border-sidebar-border hover:bg-sidebar-accent/20"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  toast.info("Filtro limpo");
                }}
              >
                Limpar filtro
              </Button>

              <div className="text-sm text-muted-foreground">
                Mostrando {filteredReturns.length} de {returns.length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
          <TabsTrigger value="pending" className="text-yellow-400">
            Pendentes ({pendingReturns.length})
          </TabsTrigger>
          <TabsTrigger value="processing" className="text-blue-400">
            Processando ({processingReturns.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-green-400">
            Concluídas ({completedReturns.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3">
          {pendingReturns.length === 0 ? (
            <Card className="bg-card/50 border-border">
              <CardContent className="pt-6 text-center text-muted-foreground">Nenhuma devolução pendente</CardContent>
            </Card>
          ) : (
            pendingReturns.map((returnItem) => <ReturnCard key={returnItem.id} returnItem={returnItem} />)
          )}
        </TabsContent>

        <TabsContent value="processing" className="space-y-3">
          {processingReturns.length === 0 ? (
            <Card className="bg-card/50 border-border">
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhuma devolução em processamento
              </CardContent>
            </Card>
          ) : (
            processingReturns.map((returnItem) => <ReturnCard key={returnItem.id} returnItem={returnItem} />)
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3">
          {completedReturns.length === 0 ? (
            <Card className="bg-card/50 border-border">
              <CardContent className="pt-6 text-center text-muted-foreground">Nenhuma devolução concluída</CardContent>
            </Card>
          ) : (
            completedReturns.map((returnItem) => <ReturnCard key={returnItem.id} returnItem={returnItem} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}