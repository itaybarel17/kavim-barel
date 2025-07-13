
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import Distribution from "./pages/Distribution";
import Calendar from "./pages/Calendar";
import Lines from "./pages/Lines";
import Messages from "./pages/Messages";
import Archive from "./pages/Archive";
import ProductionSummary from "./pages/ProductionSummary";
import ZoneReport from "./pages/ZoneReport";
import ScheduleMap from "./pages/ScheduleMap";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DndProvider backend={HTML5Backend}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/distribution" element={<Distribution />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/lines" element={<Lines />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/archive" element={<Archive />} />
                <Route path="/production-summary" element={<ProductionSummary />} />
                <Route path="/zone-report" element={<ZoneReport />} />
                <Route path="/schedule-map" element={<ScheduleMap />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </DndProvider>
    </QueryClientProvider>
  );
}

export default App;
