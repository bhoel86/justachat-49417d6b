import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, RefreshCw, Download, Search, 
  AlertTriangle, Shield, Users, Settings, AlertCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface LogEntry {
  timestamp: string;
  level: string;
  category: string;
  message: string;
  data?: Record<string, unknown>;
}

interface IRCLogViewerProps {
  proxyUrl: string;
  adminToken: string;
  isConnected: boolean;
}

type LogType = 'connections' | 'audit' | 'security' | 'error' | 'admin';

const LOG_TYPES: { type: LogType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'connections', label: 'Connections', icon: <Users className="h-4 w-4" />, color: 'text-primary' },
  { type: 'audit', label: 'Audit', icon: <FileText className="h-4 w-4" />, color: 'text-muted-foreground' },
  { type: 'security', label: 'Security', icon: <Shield className="h-4 w-4" />, color: 'text-destructive' },
  { type: 'error', label: 'Errors', icon: <AlertTriangle className="h-4 w-4" />, color: 'text-destructive' },
  { type: 'admin', label: 'Admin', icon: <Settings className="h-4 w-4" />, color: 'text-primary' },
];

export const IRCLogViewer = ({ proxyUrl, adminToken, isConnected }: IRCLogViewerProps) => {
  const [activeTab, setActiveTab] = useState<LogType>('connections');
  const [logs, setLogs] = useState<Record<LogType, LogEntry[]>>({
    connections: [],
    audit: [],
    security: [],
    error: [],
    admin: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [lineCount, setLineCount] = useState(100);

  const fetchLogs = useCallback(async (type: LogType) => {
    if (!adminToken || !isConnected) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(`${proxyUrl}/logs?type=${type}&lines=${lineCount}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(prev => ({ ...prev, [type]: data.logs || [] }));
      }
    } catch (e) {
      console.error(`Failed to fetch ${type} logs:`, e);
    } finally {
      setIsLoading(false);
    }
  }, [proxyUrl, adminToken, isConnected, lineCount]);

  useEffect(() => {
    if (isConnected && adminToken) {
      fetchLogs(activeTab);
    }
  }, [activeTab, isConnected, adminToken, fetchLogs]);

  const downloadLogs = (type: LogType) => {
    const logData = logs[type];
    if (!logData.length) {
      toast.error("No logs to download");
      return;
    }
    
    const content = logData.map(entry => 
      `[${entry.timestamp}] [${entry.level}] [${entry.category}] ${entry.message}${entry.data ? ' ' + JSON.stringify(entry.data) : ''}`
    ).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `irc-${type}-logs-${new Date().toISOString().split('T')[0]}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${type} logs`);
  };

  const filteredLogs = (type: LogType) => {
    const typeLogs = logs[type] || [];
    if (!searchQuery.trim()) return typeLogs;
    
    const query = searchQuery.toLowerCase();
    return typeLogs.filter(entry => 
      entry.message.toLowerCase().includes(query) ||
      entry.category.toLowerCase().includes(query) ||
      entry.level.toLowerCase().includes(query) ||
      (entry.data && JSON.stringify(entry.data).toLowerCase().includes(query))
    );
  };

  const getLevelBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return <Badge variant="destructive" className="text-xs">ERROR</Badge>;
      case 'warn':
      case 'warning':
        return <Badge variant="secondary" className="text-xs bg-accent text-accent-foreground">WARN</Badge>;
      case 'info':
        return <Badge variant="secondary" className="text-xs">INFO</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{level.toUpperCase()}</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  if (!isConnected || !adminToken) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Log Viewer
          </CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 h-8"
            />
            <select
              value={lineCount}
              onChange={(e) => setLineCount(Number(e.target.value))}
              className="h-8 px-2 rounded-md border bg-background text-sm"
            >
              <option value={50}>50 lines</option>
              <option value={100}>100 lines</option>
              <option value={250}>250 lines</option>
              <option value={500}>500 lines</option>
            </select>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => fetchLogs(activeTab)}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => downloadLogs(activeTab)}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LogType)}>
          <TabsList className="grid w-full grid-cols-5">
            {LOG_TYPES.map(({ type, label, icon }) => (
              <TabsTrigger key={type} value={type} className="flex items-center gap-1.5">
                {icon}
                <span className="hidden sm:inline">{label}</span>
                {logs[type].length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">
                    {logs[type].length}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {LOG_TYPES.map(({ type }) => (
            <TabsContent key={type} value={type} className="mt-4">
              <ScrollArea className="h-96 rounded-md border">
                {filteredLogs(type).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <p>No {type} logs found</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => fetchLogs(type)}
                    >
                      Refresh
                    </Button>
                  </div>
                ) : (
                  <div className="p-2 space-y-1 font-mono text-xs">
                    {filteredLogs(type).map((entry, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-start gap-2 p-2 rounded hover:bg-muted/50 border-b border-border/50 last:border-0"
                      >
                        <span className="text-muted-foreground whitespace-nowrap min-w-36">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                        {getLevelBadge(entry.level)}
                        <Badge variant="outline" className="text-xs">
                          {entry.category}
                        </Badge>
                        <span className="flex-1 break-all">
                          {entry.message}
                          {entry.data && (
                            <span className="text-muted-foreground ml-2">
                              {JSON.stringify(entry.data)}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default IRCLogViewer;
