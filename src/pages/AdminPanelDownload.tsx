/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Monitor, Terminal, FileText } from "lucide-react";
import JSZip from "jszip";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const panelFiles = [
  { name: "main.py", path: "/vps-deploy/jac-admin-panel/main.py" },
  { name: "Run.bat", path: "/vps-deploy/jac-admin-panel/Run.bat" },
  { name: "Run.ps1", path: "/vps-deploy/jac-admin-panel/Run.ps1" },
  { name: "README.md", path: "/vps-deploy/jac-admin-panel/README.md" },
];

const AdminPanelDownload = () => {
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const zip = new JSZip();
      for (const file of panelFiles) {
        const res = await fetch(file.path);
        if (!res.ok) throw new Error(`Failed to fetch ${file.name}`);
        zip.file(file.name, await res.text());
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "jac-admin-panel-v8.zip";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Download started", description: "jac-admin-panel-v8.zip" });
    } catch (err: any) {
      toast({ title: "Download failed", description: err.message, variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AdminSidebar>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Desktop Admin Panel</h1>
        <p className="text-muted-foreground">
          Download the standalone Python/Tkinter admin console for IRC server management.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              JAC Admin Panel v8
            </CardTitle>
            <CardDescription>
              Standalone desktop tool with moderation, NickServ controls, GeoIP lookup, port scanner, and more.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleDownload} disabled={downloading} size="lg" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              {downloading ? "Packaging..." : "Download ZIP"}
            </Button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Terminal className="h-4 w-4 mt-0.5 shrink-0" />
                <span><strong>Windows:</strong> Double-click <code>Run.bat</code></span>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Terminal className="h-4 w-4 mt-0.5 shrink-0" />
                <span><strong>Mac/Linux:</strong> <code>python3 main.py</code></span>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Requires Python 3.8+ with Tkinter</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Monitor className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Server: 157.245.174.197:6667</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminSidebar>
  );
};

export default AdminPanelDownload;
