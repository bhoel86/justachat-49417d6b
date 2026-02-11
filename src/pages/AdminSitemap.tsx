/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { ExternalLink, Globe } from "lucide-react";

const sitePages = [
  { path: "/", label: "Home / Lobby", category: "Core" },
  { path: "/home", label: "Login / Sign Up", category: "Core" },
  { path: "/chat", label: "Chat", category: "Core" },
  { path: "/about", label: "About", category: "Info" },
  { path: "/features", label: "Features", category: "Info" },
  { path: "/ethos", label: "Ethos", category: "Info" },
  { path: "/faq", label: "FAQ", category: "Info" },
  { path: "/help", label: "Help", category: "Info" },
  { path: "/guidelines", label: "Community Guidelines", category: "Info" },
  { path: "/legal", label: "Legal Notices", category: "Legal" },
  { path: "/cookies", label: "Cookie Policy", category: "Legal" },
  { path: "/free-chat", label: "Free Chat (SEO)", category: "SEO" },
  { path: "/chat-rooms", label: "Chat Rooms (SEO)", category: "SEO" },
  { path: "/online-chat", label: "Online Chat (SEO)", category: "SEO" },
  { path: "/irc-style-chat", label: "IRC Style Chat (SEO)", category: "SEO" },
  { path: "/dating", label: "Dating", category: "Features" },
  { path: "/games", label: "Games", category: "Features" },
  { path: "/voice-chat", label: "Voice Chat", category: "Features" },
  { path: "/video-chat", label: "Video Chat", category: "Features" },
  { path: "/map", label: "User Map", category: "Features" },
  { path: "/downloads", label: "Downloads", category: "Tools" },
  { path: "/mirc", label: "mIRC Connect", category: "Tools" },
  { path: "/download-proxy", label: "Download Proxy", category: "Tools" },
  { path: "/health", label: "Health Check", category: "System" },
  { path: "/admin", label: "Admin Panel (Audit Logs)", category: "Admin" },
  { path: "/admin/support", label: "Admin Support", category: "Admin" },
  { path: "/admin/users", label: "Admin Users", category: "Admin" },
  { path: "/admin/bans", label: "Admin Bans", category: "Admin" },
  { path: "/admin/mutes", label: "Admin Mutes", category: "Admin" },
  { path: "/admin/klines", label: "Admin K-Lines", category: "Admin" },
  { path: "/admin/messages", label: "Admin Messages", category: "Admin" },
  { path: "/admin/bots", label: "Admin Bots", category: "Admin" },
  { path: "/admin/emails", label: "Admin Emails", category: "Admin" },
  { path: "/admin/api", label: "Admin API Keys", category: "Admin" },
  { path: "/admin/deploy", label: "Admin VPS Deploy", category: "Admin" },
  { path: "/admin/sitemap", label: "Admin Sitemap", category: "Admin" },
];

const categories = ["Core", "Info", "Legal", "SEO", "Features", "Tools", "System", "Admin"];

const categoryColors: Record<string, string> = {
  Core: "text-primary",
  Info: "text-blue-400",
  Legal: "text-amber-400",
  SEO: "text-green-400",
  Features: "text-purple-400",
  Tools: "text-cyan-400",
  System: "text-orange-400",
  Admin: "text-red-400",
};

const AdminSitemap = () => {
  const { isAdmin, isOwner, loading } = useAuth();

  if (loading) return null;
  if (!isAdmin && !isOwner) return <Navigate to="/lobby" replace />;

  return (
    <AdminSidebar>
      <div className="p-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Site Map</h1>
          <span className="text-sm text-muted-foreground ml-auto">{sitePages.length} pages</span>
        </div>

        <div className="space-y-6">
          {categories.map((cat) => {
            const pages = sitePages.filter((p) => p.category === cat);
            if (pages.length === 0) return null;
            return (
              <div key={cat}>
                <h2 className={`text-sm font-semibold mb-2 ${categoryColors[cat] || "text-foreground"}`}>
                  {cat}
                </h2>
                <div className="space-y-1">
                  {pages.map((page) => (
                    <a
                      key={page.path}
                      href={page.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-secondary/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <code className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono">
                          {page.path}
                        </code>
                        <span className="text-sm">{page.label}</span>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminSidebar>
  );
};

export default AdminSitemap;
