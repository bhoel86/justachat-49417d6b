import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, GitBranch, Server, Download, Upload, Clock, HardDrive, RotateCcw, Key, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

// VPS server URL - proxied through Nginx for HTTPS
const VPS_URL = "https://justachat.net/deploy";
const TOKEN_STORAGE_KEY = "jac_vps_deploy_token";

interface DeployStatus {
  deployDir?: string;
  appVersion?: string;
  git?: {
    hash: string;
    message: string;
    date: string;
  };
  serverVersion?: string;
  backupSchedule?: string;
  lastBackup?: string;
  error?: string;
}

interface BackupFile {
  filename: string;
  size: number;
  sizeFormatted: string;
  created: string;
}

interface DeployResult {
  success: boolean;
  action: string;
  message?: string;
  output?: string;
  error?: string;
  stderr?: string;
}

export default function AdminDeploy() {
  const { user, isOwner, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<DeployStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null);
  const [backupFrequency, setBackupFrequency] = useState("daily");
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<string>("");
  const [loadingBackups, setLoadingBackups] = useState(false);
  
  // Token management - stored locally
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || "");
  const [showToken, setShowToken] = useState(false);
  const [tokenInput, setTokenInput] = useState("");

  useEffect(() => {
    if (!authLoading && !isOwner) {
      navigate("/");
    }
  }, [authLoading, isOwner, navigate]);

  // Direct VPS API call helper
  const callVPS = async (endpoint: string, method: "GET" | "POST" = "GET", body?: any) => {
    if (!token) {
      throw new Error("Deploy token not configured. Enter your VPS token below.");
    }

    const response = await fetch(`${VPS_URL}${endpoint}`, {
      method,
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: method === "POST" ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `VPS returned ${response.status}`);
    }

    return data;
  };

  const saveToken = () => {
    if (tokenInput.trim()) {
      localStorage.setItem(TOKEN_STORAGE_KEY, tokenInput.trim());
      setToken(tokenInput.trim());
      setTokenInput("");
      toast.success("Token saved locally");
      fetchStatus();
    }
  };

  const clearToken = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken("");
    toast.info("Token cleared");
  };

  const fetchStatus = async () => {
    if (!token) {
      setLoadingStatus(false);
      return;
    }

    setLoadingStatus(true);
    try {
      const data = await callVPS("/deploy/status");
      setStatus(data);
    } catch (error: any) {
      console.error("Failed to fetch status:", error);
      setStatus({ error: error.message });
      toast.error("Failed to fetch deploy status: " + error.message);
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchBackups = async () => {
    if (!token) return;

    setLoadingBackups(true);
    try {
      const data = await callVPS("/deploy/backups");
      setBackups(data.backups || []);
    } catch (error: any) {
      console.error("Failed to fetch backups:", error);
      toast.error("Failed to fetch backup list: " + error.message);
    } finally {
      setLoadingBackups(false);
    }
  };

  const executeRestore = async () => {
    if (!selectedBackup) {
      toast.error("Please select a backup to restore");
      return;
    }

    if (!confirm(`Are you sure you want to restore from ${selectedBackup}? This will overwrite current files and create a safety backup first.`)) {
      return;
    }

    setActionLoading("restore");
    setDeployResult(null);

    try {
      toast.info("Restoring from backup... This may take several minutes.");
      const data = await callVPS("/deploy", "POST", { action: "restore", filename: selectedBackup });
      setDeployResult({ success: true, action: "restore", ...data });
      toast.success("Restore completed successfully!");
      await fetchStatus();
      await fetchBackups();
    } catch (error: any) {
      console.error("Restore failed:", error);
      toast.error("Restore failed: " + error.message);
      setDeployResult({ success: false, action: "restore", error: error.message });
    } finally {
      setActionLoading(null);
    }
  };

  const executeAction = async (action: string, confirmMessage: string) => {
    if (!confirm(confirmMessage)) {
      return;
    }

    setActionLoading(action);
    setDeployResult(null);
    
    try {
      toast.info(`Executing ${action}... This may take a few minutes.`);

      const body: any = { action };
      if (action === "schedule-backup") {
        body.frequency = backupFrequency;
      }

      const data = await callVPS("/deploy", "POST", body);
      setDeployResult({ success: true, action, ...data });
      toast.success(`${action} completed successfully!`);
      await fetchStatus();
    } catch (error: any) {
      console.error(`${action} failed:`, error);
      toast.error(`${action} failed: ` + error.message);
      setDeployResult({ success: false, action, error: error.message });
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    if (isOwner && token) {
      fetchStatus();
      fetchBackups();
    } else if (isOwner) {
      setLoadingStatus(false);
    }
  }, [isOwner, token]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isOwner) {
    return null;
  }

  return (
    <AdminSidebar>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">VPS Management</h1>
            <p className="text-muted-foreground">Manage backups and sync with GitHub (Direct VPS connection)</p>
          </div>
          <Button variant="outline" onClick={fetchStatus} disabled={loadingStatus || !token}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingStatus ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Token Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              VPS Deploy Token
            </CardTitle>
            <CardDescription>
              Token is stored in your browser only - not sent to Cloud
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {token ? (
              <div className="flex items-center gap-4">
                <div className="flex-1 font-mono text-sm bg-muted px-3 py-2 rounded">
                  {showToken ? token : "••••••••••••••••"}
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowToken(!showToken)}>
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="destructive" size="sm" onClick={clearToken}>
                  Clear
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Enter VPS deploy token..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="font-mono"
                />
                <Button onClick={saveToken} disabled={!tokenInput.trim()}>
                  Save Token
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Get your token from <code>/opt/jac-deploy/.env</code> on your VPS
            </p>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Current Status
            </CardTitle>
            <CardDescription>Live VPS deployment information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!token ? (
              <div className="text-muted-foreground">Enter your VPS token above to connect</div>
            ) : loadingStatus ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading status...
              </div>
            ) : status?.error ? (
              <div className="text-destructive">Error: {status.error}</div>
            ) : status ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">App Version</span>
                  <Badge variant="secondary">v{status.appVersion}</Badge>
                </div>
                {status.serverVersion && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Deploy Server</span>
                    <Badge variant="outline">v{status.serverVersion}</Badge>
                  </div>
                )}
                {status.git && (
                  <div className="md:col-span-2 border-t pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm">{status.git.hash}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{status.git.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(status.git.date).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground">No status available</div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Scheduled Backups Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Scheduled Backups
              </CardTitle>
              <CardDescription>
                Configure automatic backups to VPS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Backup Frequency</label>
                <Select value={backupFrequency} onValueChange={setBackupFrequency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily (2 AM)</SelectItem>
                    <SelectItem value="weekly">Weekly (Sunday 3 AM)</SelectItem>
                    <SelectItem value="disable">Disable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg text-xs space-y-1">
                <p className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Backups saved to: <code>/backups/justachat/</code>
                </p>
              </div>

              <Button 
                className="w-full" 
                onClick={() => executeAction("schedule-backup", `Set backup frequency to ${backupFrequency}?`)}
                disabled={actionLoading !== null || !token}
              >
                {actionLoading === "schedule-backup" ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Clock className="h-4 w-4 mr-2" /> Save Schedule</>
                )}
              </Button>

              <Button 
                variant="outline"
                className="w-full" 
                onClick={() => executeAction("backup-now", "Create a backup now?")}
                disabled={actionLoading !== null || !token}
              >
                {actionLoading === "backup-now" ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Backing up...</>
                ) : (
                  <><HardDrive className="h-4 w-4 mr-2" /> Backup Now</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Pull from GitHub Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Update VPS from GitHub
              </CardTitle>
              <CardDescription>
                Pull latest code and rebuild
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg text-xs space-y-1">
                <p><strong>This will:</strong></p>
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                  <li>git pull origin main</li>
                  <li>npm install</li>
                  <li>npm run build</li>
                </ul>
              </div>

              <Button 
                className="w-full" 
                onClick={() => executeAction("deploy", "Pull latest from GitHub and rebuild?")}
                disabled={actionLoading !== null || !token}
              >
                {actionLoading === "deploy" ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deploying...</>
                ) : (
                  <><Download className="h-4 w-4 mr-2" /> Pull &amp; Deploy</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Push to GitHub Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Push VPS to GitHub
              </CardTitle>
              <CardDescription>
                Commit local changes to repo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg text-xs space-y-1">
                <p><strong>This will:</strong></p>
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                  <li>git add .</li>
                  <li>git commit -m "VPS update"</li>
                  <li>git push origin main</li>
                </ul>
              </div>

              <Button 
                className="w-full" 
                variant="secondary"
                onClick={() => executeAction("push", "Push VPS changes to GitHub? This will commit and push all local changes.")}
                disabled={actionLoading !== null || !token}
              >
                {actionLoading === "push" ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Pushing...</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" /> Push to GitHub</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Restore Backup Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                Restore Backup
              </CardTitle>
              <CardDescription>
                Restore VPS from a previous backup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Select Backup</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchBackups}
                    disabled={loadingBackups || !token}
                    className="h-6 px-2"
                  >
                    <RefreshCw className={`h-3 w-3 ${loadingBackups ? "animate-spin" : ""}`} />
                  </Button>
                </div>
                <Select value={selectedBackup} onValueChange={setSelectedBackup}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingBackups ? "Loading..." : "Select backup"} />
                  </SelectTrigger>
                  <SelectContent>
                    {backups.length === 0 ? (
                      <SelectItem value="_none" disabled>No backups available</SelectItem>
                    ) : (
                      backups.map((backup) => (
                        <SelectItem key={backup.filename} value={backup.filename}>
                          <div className="flex flex-col">
                            <span className="font-mono text-xs">{backup.filename}</span>
                            <span className="text-xs text-muted-foreground">
                              {backup.sizeFormatted} • {new Date(backup.created).toLocaleString()}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-destructive/10 border border-destructive/30 p-3 rounded-lg text-xs space-y-1">
                <p className="text-destructive font-medium">⚠️ Warning</p>
                <p className="text-muted-foreground">A safety backup will be created before restoring.</p>
              </div>

              <Button 
                className="w-full" 
                variant="destructive"
                onClick={executeRestore}
                disabled={actionLoading !== null || !selectedBackup || !token}
              >
                {actionLoading === "restore" ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Restoring...</>
                ) : (
                  <><RotateCcw className="h-4 w-4 mr-2" /> Restore Backup</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Deploy Result */}
        {deployResult && (
          <Card className={deployResult.success ? "border-primary" : "border-destructive"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {deployResult.success ? (
                  <Badge variant="default" className="bg-primary">Success</Badge>
                ) : (
                  <Badge variant="destructive">Failed</Badge>
                )}
                {deployResult.action}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deployResult.message && (
                <p className="text-sm mb-2">{deployResult.message}</p>
              )}
              {deployResult.error && (
                <p className="text-sm text-destructive mb-2">{deployResult.error}</p>
              )}
              {deployResult.output && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-muted-foreground">Show output</summary>
                  <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-64">
                    {deployResult.output}
                  </pre>
                </details>
              )}
              {deployResult.stderr && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-destructive">Show errors</summary>
                  <pre className="mt-2 p-3 bg-destructive/10 rounded text-xs overflow-auto max-h-64 text-destructive">
                    {deployResult.stderr}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminSidebar>
  );
}
