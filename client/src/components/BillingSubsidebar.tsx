import { Button } from "@/components/ui/button";

interface BillingSubsidebarProps {
  activeTab: "fixed" | "variable";
  onTabChange: (tab: "fixed" | "variable") => void;
}

export function BillingSubsidebar({ activeTab, onTabChange }: BillingSubsidebarProps) {
  return (
    <div className="flex gap-2 mb-4">
      <Button
        variant={activeTab === "fixed" ? "default" : "outline"}
        onClick={() => onTabChange("fixed")}
        className={activeTab === "fixed" ? "bg-purple-600" : ""}
      >
        Custos Fixos
      </Button>
      <Button
        variant={activeTab === "variable" ? "default" : "outline"}
        onClick={() => onTabChange("variable")}
        className={activeTab === "variable" ? "bg-purple-600" : ""}
      >
        Custos Variáveis
      </Button>
    </div>
  );
}
