import React, { useState, useEffect } from "react";
import { Router, Route, Switch, useLocation } from "wouter";
import { Toaster } from "sonner";
import { supabase } from "../lib/supabase";

import Landing from "./Landing";
import Login from "./Login";
import Dashboard from "./Dashboard";

import { isLoggedIn, logout } from "../lib/auth";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      // 1. Verificar se existe uma sessão real no Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setAuthenticated(true);
      } else {
        // 2. Se não houver sessão real, limpa o localStorage e manda pro login
        logout();
        setLocation("/login");
      }
      setLoading(false);
    }
    checkAuth();
  }, [setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0c0e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground text-sm font-medium">Confirmando acesso seguro...</p>
        </div>
      </div>
    );
  }

  return authenticated ? <>{children}</> : null;
}

export default function App() {
  return (
    <Router>
      <Toaster position="top-right" richColors />
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/app">
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        </Route>
        {/* Rota 404 - Redireciona para home */}
        <Route>
          {() => {
            useEffect(() => {
              window.location.href = "/";
            }, []);
            return null;
          }}
        </Route>
      </Switch>
    </Router>
  );
}