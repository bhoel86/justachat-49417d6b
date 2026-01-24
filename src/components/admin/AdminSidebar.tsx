import { Link, useLocation } from "react-router-dom";
import {
  Shield,
  Users,
  Ban,
  VolumeX,
  MessageSquare,
  Mail,
  Key,
  Server,
  ChevronLeft,
  ChevronRight,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  ownerOnly?: boolean;
  adminOnly?: boolean;
  moderatorAllowed?: boolean;
}

const navItems: NavItem[] = [
  { label: "Audit Logs", href: "/admin", icon: Shield, ownerOnly: true },
  { label: "Users", href: "/admin/users", icon: Users, adminOnly: true },
  { label: "Bans", href: "/admin/bans", icon: Ban, moderatorAllowed: true },
  { label: "Mutes", href: "/admin/mutes", icon: VolumeX, moderatorAllowed: true },
  { label: "Messages", href: "/admin/messages", icon: MessageSquare, adminOnly: true },
  { label: "Bots", href: "/admin/bots", icon: Bot, adminOnly: true },
  { label: "Emails", href: "/admin/emails", icon: Mail, ownerOnly: true },
  { label: "API Keys", href: "/admin/api", icon: Key, ownerOnly: true },
  { label: "IRC Gateway", href: "/admin/irc", icon: Server, adminOnly: true },
];

interface AdminSidebarProps {
  children: React.ReactNode;
}

export const AdminSidebar = ({ children }: AdminSidebarProps) => {
  const location = useLocation();
  const { isOwner, isAdmin, isModerator } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const filteredItems = navItems.filter(item => {
    // Owner sees everything
    if (isOwner) return true;
    // Owner-only items hidden from non-owners
    if (item.ownerOnly) return false;
    // Admin sees admin-only and moderator-allowed items
    if (isAdmin) return true;
    // Moderator sees only moderator-allowed items
    if (isModerator) return item.moderatorAllowed;
    return false;
  });

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300",
          collapsed ? "w-16" : "w-56"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border">
            {!collapsed && (
              <Link to="/" className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">Admin</span>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className={cn("shrink-0", collapsed && "mx-auto")}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {filteredItems.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <Link
              to="/"
              className={cn(
                "flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors",
                collapsed && "justify-center"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              {!collapsed && <span>Back to Chat</span>}
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          collapsed ? "ml-16" : "ml-56"
        )}
      >
        {children}
      </main>
    </div>
  );
};

export default AdminSidebar;
