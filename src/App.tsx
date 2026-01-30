import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { RadioProvider } from "@/contexts/RadioContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
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
import AdminSupport from "./pages/AdminSupport";
import AdminBots from "./pages/AdminBots";
import AdminKlines from "./pages/AdminKlines";
import AdminMinors from "./pages/AdminMinors";
import AdminDeploy from "./pages/AdminDeploy";
import VerifyConsent from "./pages/VerifyConsent";
import Help from "./pages/Help";
import DownloadProxy from "./pages/DownloadProxy";
import ClientDownload from "./pages/ClientDownload";
import Dating from "./pages/Dating";
import Ethos from "./pages/Ethos";
import Games from "./pages/Games";
import VoiceChat from "./pages/VoiceChat";
import VideoChat from "./pages/VideoChat";
import Legal from "./pages/Legal";
import CookiePolicy from "./pages/CookiePolicy";
import CommunityGuidelines from "./pages/CommunityGuidelines";
import NotFound from "./pages/NotFound";
import Health from "./pages/Health";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <RadioProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/chat" element={<Index />} />
                <Route path="/chat/:channelName" element={<Index />} />
                <Route path="/home" element={<Auth />} />
                <Route path="/map" element={<MapView />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/admin/bans" element={<AdminBans />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/api" element={<AdminAPI />} />
                <Route path="/admin/emails" element={<AdminEmails />} />
                <Route path="/admin/messages" element={<AdminMessages />} />
                <Route path="/admin/mutes" element={<AdminMutes />} />
                <Route path="/admin/support" element={<AdminSupport />} />
                <Route path="/admin/bots" element={<AdminBots />} />
                <Route path="/admin/klines" element={<AdminKlines />} />
                <Route path="/admin/minors" element={<AdminMinors />} />
                <Route path="/admin/deploy" element={<AdminDeploy />} />
                <Route path="/help" element={<Help />} />
                <Route path="/verify-consent" element={<VerifyConsent />} />
                <Route path="/download-proxy" element={<DownloadProxy />} />
                <Route path="/downloads" element={<ClientDownload />} />
                <Route path="/dating" element={<Dating />} />
                <Route path="/ethos" element={<Ethos />} />
                <Route path="/games" element={<Games />} />
                <Route path="/voice-chat" element={<VoiceChat />} />
                <Route path="/video-chat" element={<VideoChat />} />
                <Route path="/legal" element={<Legal />} />
                <Route path="/cookies" element={<CookiePolicy />} />
                <Route path="/guidelines" element={<CommunityGuidelines />} />
                <Route path="/health" element={<Health />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </RadioProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
