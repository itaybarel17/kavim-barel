
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Index from "./pages/Index";
import Distribution from "./pages/Distribution";
import Calendar from "./pages/Calendar";
import Lines from "./pages/Lines";
import Archive from "./pages/Archive";
import Messages from "./pages/Messages";
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
      refetchOnWindowFocus: false
    }
  }
});

function ProtectedRoute({
  children,
  adminOnly = false
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const {
    user,
    isLoading
  } = useAuth();

  // Show loading while checking auth state
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">טוען...</p>
        </div>
      </div>;
  }

  // Redirect to auth if no user
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect non-admin users away from admin pages
  if (adminOnly && user.agentnumber !== "4") {
    return <Navigate to="/calendar" replace />;
  }
  return <>{children}</>;
}

function App() {
  return <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <DndProvider backend={HTML5Backend}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="min-h-screen bg-gray-50">
                <NavBar />
                <div className="px-4 lg:px-6 pb-6 bg-[#7c8788]/[0.02]">
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/" element={<ProtectedRoute>
                        <Index />
                      </ProtectedRoute>} />
                    <Route path="/distribution" element={<ProtectedRoute adminOnly>
                        <Distribution />
                      </ProtectedRoute>} />
                    <Route path="/calendar" element={<ProtectedRoute>
                        <Calendar />
                      </ProtectedRoute>} />
                    <Route path="/lines" element={<ProtectedRoute>
                        <Lines />
                      </ProtectedRoute>} />
                    <Route path="/archive" element={<ProtectedRoute adminOnly>
                        <Archive />
                      </ProtectedRoute>} />
                    <Route path="/messages" element={<ProtectedRoute>
                        <Messages />
                      </ProtectedRoute>} />
                    <Route path="/zone-report/:zoneNumber" element={<ProtectedRoute>
                        <ZoneReport />
                      </ProtectedRoute>} />
                    <Route path="/production-summary/:scheduleId" element={<ProtectedRoute>
                        <ProductionSummary />
                      </ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </DndProvider>
      </QueryClientProvider>
    </AuthProvider>;
}

export default App;
