import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Copy, Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";

export interface CostItem {
  id: string;
  name: string;
  amount: number;
  description?: string;
}

type ViewMode = "grid" | "list";

interface CostFormProps {
  onEditCost: (item: CostItem) => void;
  onDeleteCost: (id: string) => void;
  onDuplicateCost: (item: CostItem) => void;
  costs: CostItem[];
  title: string;
  viewMode: ViewMode;
}

export function CostForm({
  onEditCost,
  onDeleteCost,
  onDuplicateCost,
  costs,
  title,
  viewMode,
}: CostFormProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [editData, setEditData] = useState<Omit<CostItem, "id">>({
    name: "",
    amount: 0,
    description: "",
  });

  const totalAmount = useMemo(() => costs.reduce((sum, item) => sum + item.amount, 0), [costs]);

  const costCardClass =
    "bg-card/50 border border-purple-500/20 transition-all duration-200 hover:border-purple-400/70 hover:bg-purple-500/5 hover:shadow-[0_0_22px_rgba(168,85,247,0.25)]";

  const openEdit = (cost: CostItem) => {
    setEditingId(cost.id);
    setEditData({
      name: cost.name,
      amount: cost.amount,
      description: cost.description || "",
    });
    setEditOpen(true);
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingId) return;

    if (!editData.name.trim()) {
      toast.error("Nome do custo é obrigatório");
      return;
    }

    onEditCost({
      id: editingId,
      name: editData.name,
      amount: editData.amount,
      description: editData.description || "",
    });

    toast.success("Custo atualizado");
    setEditOpen(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho da seção (sem botão adicionar) */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div>
          <h3 className="text-lg font-semibold text-cyan-300">{title}</h3>
          <p className="text-sm text-cyan-200/80">Total</p>
          <p className="text-3xl sm:text-4xl font-bold text-cyan-300">R$ {totalAmount.toFixed(2)}</p>
        </div>
      </div>

      {/* Modal apenas de EDIÇÃO */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-cyan-300">Editar Custo</DialogTitle>
          </DialogHeader>

          <form onSubmit={submitEdit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name" className="text-foreground">
                Nome
              </Label>
              <Input
                id="edit-name"
                value={editData.name}
                onChange={(e) => setEditData((p) => ({ ...p, name: e.target.value }))}
                className="bg-input border-border text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="edit-amount" className="text-foreground">
                Valor (R$)
              </Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={editData.amount}
                onChange={(e) => setEditData((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
                className="bg-input border-border text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="edit-description" className="text-foreground">
                Descrição
              </Label>
              <Input
                id="edit-description"
                value={editData.description}
                onChange={(e) => setEditData((p) => ({ ...p, description: e.target.value }))}
                className="bg-input border-border text-foreground"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setEditOpen(false);
                  setEditingId(null);
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lista/Grid */}
      {costs.length === 0 ? (
        <Card className="bg-card/50 border-border">
          <CardContent className="pt-6 text-center text-muted-foreground">Nenhum custo adicionado</CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {costs.map((cost) => (
            <Card key={cost.id} className={costCardClass}>
              <CardContent className="pt-4 space-y-2">
                <div>
                  <p className="font-medium">{cost.name}</p>
                  {cost.description && <p className="text-xs text-muted-foreground">{cost.description}</p>}
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                  <p className="text-sm font-semibold text-cyan-300">R$ {cost.amount.toFixed(2)}</p>

                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(cost)}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDuplicateCost(cost)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400"
                      onClick={() => {
                        onDeleteCost(cost.id);
                        toast.success("Custo removido");
                      }}
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
          {costs.map((cost) => (
            <Card key={cost.id} className={costCardClass}>
              <CardContent className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">{cost.name}</p>
                  {cost.description && <p className="text-sm text-muted-foreground">{cost.description}</p>}
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-cyan-300">R$ {cost.amount.toFixed(2)}</p>

                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(cost)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDuplicateCost(cost)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400"
                      onClick={() => {
                        onDeleteCost(cost.id);
                        toast.success("Custo removido");
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}