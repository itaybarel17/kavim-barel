import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Distribution from "./pages/Distribution";
import Calendar from "./pages/Calendar";
import Archive from "./pages/Archive";
import ZoneReport from "./pages/ZoneReport";
import ProductionSummary from "./pages/ProductionSummary";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NavBar } from "@/components/layout/NavBar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user } = useAuth();
  if (!user) {
    window.location.href = "/auth";
    return null;
  }
  if (adminOnly && user.agentnumber !== "4") {
    window.location.href = "/calendar";
    return null;
  }
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <NavBar />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/distribution" element={
                <ProtectedRoute adminOnly>
                  <Distribution />
                </ProtectedRoute>
              } />
              <Route path="/calendar" element={
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              } />
              <Route path="/archive" element={
                <ProtectedRoute adminOnly>
                  <Archive />
                </ProtectedRoute>
              } />
              <Route path="/zone-report/:zoneNumber" element={
                <ProtectedRoute>
                  <ZoneReport />
                </ProtectedRoute>
              } />
              <Route path="/production-summary/:scheduleId" element={
                <ProtectedRoute>
                  <ProductionSummary />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
