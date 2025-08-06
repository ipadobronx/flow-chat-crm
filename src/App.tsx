import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SecurityProvider } from "@/components/SecurityProvider";
import Index from "./pages/Index";
import LiveChat from "./pages/LiveChat";
import Pipeline from "./pages/Pipeline";
import SitPlan from "./pages/SitPlan";
import TACategories from "./pages/TACategories";
import TAPresentation from "./pages/TAPresentation";
import NovaRec from "./pages/NovaRec";
import ImportLeads from "./pages/ImportLeads";
import Schedule from "./pages/Schedule";
import BulkSend from "./pages/BulkSend";
import FollowUp from "./pages/FollowUp";
import Reports from "./pages/Reports";
import Atrasos from "./pages/Atrasos";
import Settings from "./pages/Settings";
import SecurityDashboard from "./pages/SecurityDashboard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <SecurityProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/dashboard/nova-rec" element={<ProtectedRoute><NovaRec /></ProtectedRoute>} />
              <Route path="/dashboard/import" element={<ProtectedRoute><ImportLeads /></ProtectedRoute>} />
              <Route path="/dashboard/chat" element={<ProtectedRoute><LiveChat /></ProtectedRoute>} />
              <Route path="/dashboard/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
              <Route path="/dashboard/bulk" element={<ProtectedRoute><BulkSend /></ProtectedRoute>} />
              <Route path="/dashboard/follow-up" element={<ProtectedRoute><FollowUp /></ProtectedRoute>} />
              <Route path="/dashboard/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/dashboard/atrasos" element={<ProtectedRoute><Atrasos /></ProtectedRoute>} />
              <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/dashboard/security" element={<ProtectedRoute><SecurityDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/pipeline" element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
              <Route path="/dashboard/sitplan" element={<ProtectedRoute><SitPlan /></ProtectedRoute>} />
              <Route path="/dashboard/ta" element={<ProtectedRoute><TACategories /></ProtectedRoute>} />
              <Route path="/dashboard/ta-presentation" element={<ProtectedRoute><TAPresentation /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </SecurityProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
