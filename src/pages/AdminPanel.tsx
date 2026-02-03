/**
 * ╔═ JustAChat™ ══════════════════════ Since 2026 ═══ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Eye, Clock, User, FileText, RefreshCw, Filter, Download, FileJson, FileSpreadsheet } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { format } from "date-fns";
import type { Json } from "@/integrations/supabase/types";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Json | null;
  created_at: string;
  profiles?: { username: string };
}

const ACTION_CATEGORIES = {
  all: "All Actions",
  location: "Location Access",
  moderation: "Moderation",
  other: "Other",
};

const ACTION_TYPE_MAP: Record<string, keyof typeof ACTION_CATEGORIES> = {
  view_locations: "location",
  view_location_analytics: "location",
  export_locations: "location",
  view_user_location: "location",
  ban_user: "moderation",
  unban_user: "moderation",
  mute_user: "moderation",
  unmute_user: "moderation",
  kick_user: "moderation",
  role_change: "moderation",
  promote_moderator: "moderation",
  demote_moderator: "moderation",
  promote_admin: "moderation",
  demote_admin: "moderation",
};

const AdminPanel = () => {
  const { user, loading, isOwner, isAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<string>("all");

  // Get unique actions from logs
  const uniqueActions = useMemo(() => {
    const actions = [...new Set(logs.map(l => l.action))];
    return actions.sort();
  }, [logs]);

  // Filter logs based on selected filters
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Filter by category
      if (selectedCategory !== "all") {
        const logCategory = ACTION_TYPE_MAP[log.action] || "other";
        if (logCategory !== selectedCategory) return false;
      }
      
      // Filter by specific action
      if (selectedAction !== "all" && log.action !== selectedAction) {
        return false;
      }
      
      return true;
    });
  }, [logs, selectedCategory, selectedAction]);

  const fetchLogs = async () => {
    try {
      // Fetch audit logs
      const { data: auditLogs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Fetch usernames for the logs
      const userIds = [...new Set(auditLogs?.map(l => l.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const logsWithProfiles = auditLogs?.map(log => ({
        ...log,
        profiles: profiles?.find(p => p.user_id === log.user_id)
      })) || [];

      setLogs(logsWithProfiles);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLogsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOwner) {
      fetchLogs();
    }
  }, [isOwner]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const getActionBadgeColor = (action: string) => {
    const category = ACTION_TYPE_MAP[action] || "other";
    switch (category) {
      case "location":
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case "moderation":
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedAction("all");
  };

  const exportToJSON = () => {
    const dataToExport = filteredLogs.map(log => ({
      id: log.id,
      user: log.profiles?.username || 'Unknown',
      user_id: log.user_id,
      action: log.action,
      resource_type: log.resource_type,
      resource_id: log.resource_id,
      details: log.details,
      created_at: log.created_at
    }));

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = ['ID', 'User', 'User ID', 'Action', 'Resource Type', 'Resource ID', 'Details', 'Created At'];
    
    const rows = filteredLogs.map(log => [
      log.id,
      log.profiles?.username || 'Unknown',
      log.user_id,
      log.action,
      log.resource_type,
      log.resource_id || '',
      log.details ? JSON.stringify(log.details) : '',
      log.created_at
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/home" replace />;
  }

  // Redirect admins to users page (they can't see audit logs but can access other admin pages)
  if (!isOwner && isAdmin) {
    return <Navigate to="/admin/users" replace />;
  }

  if (!isOwner) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminSidebar>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Audit Logs
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor sensitive data access and moderation actions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={filteredLogs.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border z-50">
                <DropdownMenuItem onClick={exportToJSON} className="cursor-pointer">
                  <FileJson className="h-4 w-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToCSV} className="cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Audit Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{logs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Location Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">
                {logs.filter(l => ACTION_TYPE_MAP[l.action] === "location").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Moderation Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">
                {logs.filter(l => ACTION_TYPE_MAP[l.action] === "moderation").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unique Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent-foreground">
                {new Set(logs.map(l => l.user_id)).size}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Audit Logs
                {(selectedCategory !== "all" || selectedAction !== "all") && (
                  <Badge variant="secondary" className="ml-2">
                    {filteredLogs.length} of {logs.length}
                  </Badge>
                )}
              </CardTitle>
              
              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground" />
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[160px] bg-background">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    {Object.entries(ACTION_CATEGORIES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder="Specific Action" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    <SelectItem value="all">All Actions</SelectItem>
                    {uniqueActions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {formatAction(action)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(selectedCategory !== "all" || selectedAction !== "all") && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
          {logsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-pulse text-muted-foreground">Loading logs...</div>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                {logs.length === 0 ? (
                  <>
                    <p>No audit logs yet</p>
                    <p className="text-sm">Logs will appear when admins access sensitive data</p>
                  </>
                ) : (
                  <>
                    <p>No logs match your filters</p>
                    <Button variant="link" onClick={clearFilters} className="mt-2">
                      Clear filters
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors border border-border"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                            {log.profiles?.username?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {log.profiles?.username || 'Unknown User'}
                              </span>
                              <Badge 
                                variant="outline" 
                                className={getActionBadgeColor(log.action)}
                              >
                                {formatAction(log.action)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {log.resource_type}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                              </span>
                            </div>
                            {log.details && (
                              <div className="mt-2 text-xs text-muted-foreground bg-background/50 p-2 rounded font-mono">
                                {JSON.stringify(log.details, null, 2)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminSidebar>
  );
};

export default AdminPanel;