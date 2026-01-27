import { useAuth } from "@/hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Key, Shield, Copy, Eye, EyeOff, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

const AdminAPI = () => {
  const { user, loading, isOwner } = useAuth();
  const [showAnon, setShowAnon] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'Not configured';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'Not configured';
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'Not configured';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
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

  if (!isOwner) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminSidebar>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Key className="h-6 w-6 text-amber-500" />
            API & Secrets
          </h1>
          <p className="text-sm text-muted-foreground">
            View API configuration and keys
          </p>
        </div>

        {/* Warning */}
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-500">Security Notice</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  The anon key shown here is a publishable key safe for client-side use. 
                  Never share your service role key or other sensitive credentials.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Info Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project ID</CardTitle>
              <CardDescription>Your Lovable Cloud project identifier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-secondary p-3 rounded-lg text-sm font-mono overflow-x-auto">
                  {projectId}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(projectId, 'Project ID')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">API URL</CardTitle>
              <CardDescription>Base URL for API requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-secondary p-3 rounded-lg text-sm font-mono overflow-x-auto">
                  {supabaseUrl}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(supabaseUrl, 'API URL')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Anon Key (Publishable)</CardTitle>
            <CardDescription>
              This key is safe to use in client-side code. It respects Row Level Security policies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-secondary p-3 rounded-lg text-sm font-mono overflow-x-auto">
                {showAnon ? supabaseAnonKey : '••••••••••••••••••••••••••••••••'}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAnon(!showAnon)}
              >
                {showAnon ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(supabaseAnonKey, 'Anon Key')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Edge Functions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Edge Functions</CardTitle>
            <CardDescription>Backend functions available in this project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['geolocate', 'ai-moderator', 'pm-monitor'].map((fn) => (
                <div key={fn} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-medium">{fn}</p>
                    <p className="text-xs text-muted-foreground">
                      {supabaseUrl}/functions/v1/{fn}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`${supabaseUrl}/functions/v1/${fn}`, `${fn} URL`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Link to="/admin">
                <Button variant="outline" size="sm">
                  Audit Logs
                  <ExternalLink className="h-3 w-3 ml-2" />
                </Button>
              </Link>
              <Link to="/admin/bans">
                <Button variant="outline" size="sm">
                  Ban List
                  <ExternalLink className="h-3 w-3 ml-2" />
                </Button>
              </Link>
              <Link to="/admin/users">
                <Button variant="outline" size="sm">
                  User Management
                  <ExternalLink className="h-3 w-3 ml-2" />
                </Button>
              </Link>
              <Link to="/map">
                <Button variant="outline" size="sm">
                  User Map
                  <ExternalLink className="h-3 w-3 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminSidebar>
  );
};

export default AdminAPI;