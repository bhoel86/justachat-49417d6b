import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, GitBranch, Server, CheckCircle, XCircle, Download, Upload, Clock, HardDrive } from "lucide-react";
import { toast } from "sonner";

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

  useEffect(() => {
    if (!authLoading && !isOwner) {
      navigate("/");
    }
  }, [authLoading, isOwner, navigate]);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const response = await supabase.functions.invoke("vps-deploy", {
        body: null,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setStatus(response.data);
    } catch (error: any) {
      console.error("Failed to fetch status:", error);
      toast.error("Failed to fetch deploy status");
    } finally {
      setLoadingStatus(false);
    }
  };

  const executeAction = async (action: string, confirmMessage: string) => {
    if (!confirm(confirmMessage)) {
      return;
    }

    setActionLoading(action);
    setDeployResult(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      toast.info(`Executing ${action}... This may take a few minutes.`);

      const body: any = { action };
      if (action === "schedule-backup") {
        body.frequency = backupFrequency;
      }

      const response = await supabase.functions.invoke("vps-deploy", {
        body,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setDeployResult(response.data);

      if (response.data.success) {
        toast.success(`${action} completed successfully!`);
        await fetchStatus();
      } else {
        toast.error(`${action} failed: ` + (response.data.error || "Unknown error"));
      }
    } catch (error: any) {
      console.error(`${action} failed:`, error);
      toast.error(`${action} failed: ` + error.message);
      setDeployResult({ success: false, action, error: error.message });
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    if (isOwner) {
      fetchStatus();
    }
  }, [isOwner]);

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
            <p className="text-muted-foreground">Manage backups and sync with GitHub</p>
          </div>
          <Button variant="outline" onClick={fetchStatus} disabled={loadingStatus}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingStatus ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

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
            {loadingStatus ? (
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

        <div className="grid gap-6 md:grid-cols-3">
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
                disabled={actionLoading !== null}
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
                disabled={actionLoading !== null}
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
                disabled={actionLoading !== null}
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
                disabled={actionLoading !== null}
              >
                {actionLoading === "push" ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Pushing...</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" /> Push to GitHub</>
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
                  <CheckCircle className="h-5 w-5 text-primary" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                {deployResult.action} {deployResult.success ? "Succeeded" : "Failed"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deployResult.message && (
                <p className="mb-4">{deployResult.message}</p>
              )}
              {deployResult.error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-4">
                  <strong>Error:</strong> {deployResult.error}
                </div>
              )}
              {deployResult.output && (
                <details className="cursor-pointer">
                  <summary className="text-sm text-muted-foreground mb-2">View Output</summary>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-64 font-mono">
                    {deployResult.output}
                  </pre>
                </details>
              )}
              {deployResult.stderr && (
                <details className="cursor-pointer mt-2">
                  <summary className="text-sm text-destructive mb-2">View Errors</summary>
                  <pre className="bg-destructive/10 p-4 rounded-lg text-xs overflow-auto max-h-64 font-mono text-destructive">
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
