// client/src/pages/Landing.tsx
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { 
  TrendingUp, 
  BarChart3, 
  Shield, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Play
} from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [plan, setPlan] = useState<"monthly" | "semiannual" | "annual">("monthly");

  const handleLogin = () => setLocation("/login");

  const plans = {
    monthly: { price: "R$ 99", period: "/mês" },
    semiannual: { price: "R$ 549", period: "/6 meses (10% off)" },
    annual: { price: "R$ 999", period: "/ano (25% off)" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary/20 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">NTOH</span>
          </div>
          <Button onClick={handleLogin} variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
            Entrar
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/30">
          🚀 Automação de Processos
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
          Automatize seus processos de vendas
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Integre Shopee, controle estoque, custos e vendas em uma plataforma unificada. 
          Aumente sua eficiência e tome decisões baseadas em dados reais.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={handleLogin} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8">
            Começar Agora <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button variant="outline" size="lg" className="border-primary/30 text-primary hover:bg-primary/10">
            <Play className="mr-2 h-5 w-5" /> Ver Demo
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Funcionalidades Principais</h2>
          <p className="text-gray-400">Tudo que você precisa para automatizar e controlar seus processos</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-slate-800/50 border-slate-700/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-6">
              <BarChart3 className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Faturamento</h3>
              <p className="text-gray-400">Integração completa com Shopee para análise de vendas e métricas em tempo real.</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-6">
              <Shield className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Controle de Custos</h3>
              <p className="text-gray-400">Gerencie custos fixos, variáveis, impostos e fornecedores de forma organizada.</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-6">
              <Users className="h-12 w-12 text-green-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Devoluções</h3>
              <p className="text-gray-400">Rastreie e gerencie devoluções de clientes com status e histórico completo.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Planos</h2>
          <p className="text-gray-400">Escolha o plano ideal para seu negócio</p>
        </div>
        <div className="max-w-md mx-auto">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Plano Profissional</h3>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value as "monthly" | "semiannual" | "annual")}
                    className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-sm"
                  >
                    <option value="monthly">Mensal</option>
                    <option value="semiannual">Semestral</option>
                    <option value="annual">Anual</option>
                  </select>
                </div>
                <div className="text-4xl font-bold text-primary mb-1">
                  {plans[plan].price}
                </div>
                <div className="text-sm text-gray-400">{plans[plan].period}</div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span>Integração Shopee</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span>Controle de Estoque</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span>Análise de Custos</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span>Gestão de Devoluções</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span>Relatórios em Tempo Real</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span>Suporte Prioritário</span>
                </li>
              </ul>
              <Button onClick={handleLogin} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Começar Gratuitamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 NTOH - Automação de Processos. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}