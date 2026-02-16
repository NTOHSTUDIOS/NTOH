// client/src/pages/App.tsx
import React from "react";
import { Router, Route, Switch } from "wouter";
import { Toaster } from "sonner";

import Landing from "./Landing";
import Login from "./Login";
import Dashboard from "./Dashboard";

import { isLoggedIn } from "../lib/auth";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  if (!isLoggedIn()) {
    window.location.href = "/login";
    return null;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/app">
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        </Route>
      </Switch>
    </Router>
  );
}