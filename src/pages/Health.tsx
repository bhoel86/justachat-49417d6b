/**
 * ╔═ JustAChat™ ══════════════════════ Since 2026 ═══ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { APP_VERSION, APP_BUILD_DATE, APP_CODENAME } from "@/lib/version";

const Health = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg p-6 font-mono text-sm max-w-md w-full">
        <h1 className="text-lg font-bold text-foreground mb-4">🩺 Health Check</h1>
        <div className="space-y-2 text-muted-foreground">
          <p><span className="text-foreground">Version:</span> v{APP_VERSION}</p>
          <p><span className="text-foreground">Codename:</span> {APP_CODENAME}</p>
          <p><span className="text-foreground">Build Date:</span> {APP_BUILD_DATE}</p>
          <p><span className="text-foreground">Status:</span> <span className="text-green-500">OK</span></p>
        </div>
      </div>
    </div>
  );
};

export default Health;
