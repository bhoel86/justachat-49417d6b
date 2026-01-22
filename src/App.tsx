import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Home from "./pages/Home";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import MapView from "./pages/MapView";
import AdminPanel from "./pages/AdminPanel";
import AdminBans from "./pages/AdminBans";
import AdminUsers from "./pages/AdminUsers";
import AdminAPI from "./pages/AdminAPI";
import AdminEmails from "./pages/AdminEmails";
import AdminMessages from "./pages/AdminMessages";
import AdminMutes from "./pages/AdminMutes";
import AdminIRC from "./pages/AdminIRC";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chat/:channelId" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin/bans" element={<AdminBans />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/api" element={<AdminAPI />} />
            <Route path="/admin/emails" element={<AdminEmails />} />
            <Route path="/admin/messages" element={<AdminMessages />} />
            <Route path="/admin/mutes" element={<AdminMutes />} />
            <Route path="/admin/irc" element={<AdminIRC />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
