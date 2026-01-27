import { useEffect, useState } from "react";
import { useAuth, supabaseUntyped } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Baby, RefreshCw, CheckCircle, XCircle, Clock, Mail, Shield } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

interface MinorRecord {
  user_id: string;
  username: string;
  age: number;
  parent_email: string | null;
  parent_consent_verified: boolean;
  parent_consent_sent_at: string | null;
  created_at: string;
}

const AdminMinors = () => {
  const { user, loading, isOwner, isAdmin } = useAuth();
  const [minors, setMinors] = useState<MinorRecord[]>([]);
  const [minorsLoading, setMinorsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  const fetchMinors = async () => {
    try {
      const { data, error } = await supabaseUntyped
        .from("profiles")
        .select("user_id, username, age, parent_email, parent_consent_verified, parent_consent_sent_at, created_at")
        .eq("is_minor", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMinors(data || []);
    } catch (error) {
      console.error("Error fetching minors:", error);
      toast.error("Failed to load minor accounts");
    } finally {
      setMinorsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOwner || isAdmin) {
      fetchMinors();
    }
  }, [isOwner, isAdmin]);

  const handleResendConsentEmail = async (minor: MinorRecord) => {
    if (!minor.parent_email) {
      toast.error("No parent email on file");
      return;
    }

    setSendingEmail(minor.user_id);
    try {
      const { error } = await supabase.functions.invoke("send-parent-consent", {
        body: {
          userId: minor.user_id,
          parentEmail: minor.parent_email,
          minorUsername: minor.username,
          minorAge: minor.age,
        },
      });

      if (error) throw error;
      toast.success("Consent email sent to parent/guardian");
      fetchMinors();
    } catch (error: any) {
      console.error("Error sending consent email:", error);
      toast.error("Failed to send consent email");
    } finally {
      setSendingEmail(null);
    }
  };

  const handleManualApprove = async (userId: string, username: string) => {
    try {
      const { error } = await supabaseUntyped
        .from("profiles")
        .update({ parent_consent_verified: true })
        .eq("user_id", userId);

      if (error) throw error;
      toast.success(`Manually approved consent for ${username}`);
      fetchMinors();
    } catch (error) {
      console.error("Error approving consent:", error);
      toast.error("Failed to approve consent");
    }
  };

  const handleRevokeConsent = async (userId: string, username: string) => {
    try {
      const { error } = await supabaseUntyped
        .from("profiles")
        .update({ parent_consent_verified: false })
        .eq("user_id", userId);

      if (error) throw error;
      toast.success(`Revoked consent for ${username}`);
      fetchMinors();
    } catch (error) {
      console.error("Error revoking consent:", error);
      toast.error("Failed to revoke consent");
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMinors();
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

  if (!isOwner && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const pendingCount = minors.filter((m) => !m.parent_consent_verified).length;
  const verifiedCount = minors.filter((m) => m.parent_consent_verified).length;

  return (
    <AdminSidebar>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Baby className="h-6 w-6 text-primary" />
              Minor Accounts
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage parental consent for users under 18
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Baby className="h-4 w-4 text-primary" />
                Total Minors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{minors.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                Pending Consent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Verified
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{verifiedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Minor List */}
        <Card>
          <CardHeader>
            <CardTitle>All Minor Accounts ({minors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {minorsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-pulse text-muted-foreground">Loading accounts...</div>
              </div>
            ) : minors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No minor accounts registered
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {minors.map((minor) => (
                    <div
                      key={minor.user_id}
                      className={`p-4 rounded-lg border bg-card transition-colors ${
                        minor.parent_consent_verified
                          ? "border-green-500/30"
                          : "border-yellow-500/30"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${
                              minor.parent_consent_verified
                                ? "bg-green-500/20 text-green-500"
                                : "bg-yellow-500/20 text-yellow-500"
                            }`}
                          >
                            {minor.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{minor.username}</span>
                              <Badge variant="outline" className="text-xs">
                                Age: {minor.age}
                              </Badge>
                              {minor.parent_consent_verified ? (
                                <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                              <p>
                                <Mail className="h-3 w-3 inline mr-1" />
                                Parent: {minor.parent_email || "Not provided"}
                              </p>
                              <p>
                                Registered: {format(new Date(minor.created_at), "MMM d, yyyy")}
                              </p>
                              {minor.parent_consent_sent_at && (
                                <p>
                                  Last email sent:{" "}
                                  {format(new Date(minor.parent_consent_sent_at), "MMM d, yyyy h:mm a")}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {minor.parent_email && !minor.parent_consent_verified && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResendConsentEmail(minor)}
                              disabled={sendingEmail === minor.user_id}
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              {sendingEmail === minor.user_id ? "Sending..." : "Send Email"}
                            </Button>
                          )}
                          {!minor.parent_consent_verified ? (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleManualApprove(minor.user_id, minor.username)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRevokeConsent(minor.user_id, minor.username)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Revoke
                            </Button>
                          )}
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

export default AdminMinors;
