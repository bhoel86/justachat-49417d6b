import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Rocket, RefreshCw, GitBranch, Server, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface DeployStatus {
  deployDir?: string;
  appVersion?: string;
  git?: {
    hash: string;
    message: string;
    date: string;
  };
  proxyVersion?: string;
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
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null);

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

  const triggerDeploy = async () => {
    if (!confirm("Are you sure you want to deploy? This will update the VPS from Git.")) {
      return;
    }

    setDeploying(true);
    setDeployResult(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      toast.info("Deploying... This may take a few minutes.");

      const response = await supabase.functions.invoke("vps-deploy", {
        body: { action: "deploy" },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setDeployResult(response.data);

      if (response.data.success) {
        toast.success("Deploy completed successfully!");
        // Refresh status after deploy
        await fetchStatus();
      } else {
        toast.error("Deploy failed: " + (response.data.error || "Unknown error"));
      }
    } catch (error: any) {
      console.error("Deploy failed:", error);
      toast.error("Deploy failed: " + error.message);
      setDeployResult({ success: false, action: "deploy", error: error.message });
    } finally {
      setDeploying(false);
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
            <h1 className="text-3xl font-bold">VPS Deployment</h1>
            <p className="text-muted-foreground">Deploy updates to the production VPS</p>
          </div>
          <Button variant="outline" onClick={fetchStatus} disabled={loadingStatus}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingStatus ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
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
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">App Version</span>
                    <Badge variant="secondary">v{status.appVersion}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Proxy Version</span>
                    <Badge variant="outline">{status.proxyVersion}</Badge>
                  </div>
                  {status.git && (
                    <>
                      <div className="border-t pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <GitBranch className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">{status.git.hash}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{status.git.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(status.git.date).toLocaleString()}
                        </p>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-muted-foreground">No status available</div>
              )}
            </CardContent>
          </Card>

          {/* Deploy Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Deploy Update
              </CardTitle>
              <CardDescription>
                Pull latest code from Git and rebuild the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
                <p><strong>This will:</strong></p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Fetch latest code from <code>main</code> branch</li>
                  <li>Install dependencies</li>
                  <li>Build the production bundle</li>
                  <li>Deploy to /var/www/justachat</li>
                </ul>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={triggerDeploy}
                disabled={deploying}
              >
                {deploying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Deploy Now
                  </>
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
                Deploy {deployResult.success ? "Succeeded" : "Failed"}
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
