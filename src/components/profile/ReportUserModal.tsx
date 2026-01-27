import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserOption {
  user_id: string;
  username: string;
}

interface ReportUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reporterId: string;
  preselectedUserId?: string;
  preselectedUsername?: string;
}

const REPORT_REASONS = [
  { value: "harassment", label: "Harassment or Bullying" },
  { value: "hate_speech", label: "Hate Speech or Discrimination" },
  { value: "spam", label: "Spam or Scam" },
  { value: "inappropriate_content", label: "Inappropriate Content" },
  { value: "impersonation", label: "Impersonation" },
  { value: "threats", label: "Threats or Violence" },
  { value: "underage", label: "Underage User in Adult Area" },
  { value: "doxxing", label: "Sharing Personal Information (Doxxing)" },
  { value: "illegal_activity", label: "Illegal Activity" },
  { value: "other", label: "Other" },
];

const ReportUserModal = ({
  open,
  onOpenChange,
  reporterId,
  preselectedUserId,
  preselectedUsername,
}: ReportUserModalProps) => {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>(preselectedUserId || "");
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);

  // Fetch users for the dropdown
  useEffect(() => {
    if (!open) return;

    const fetchUsers = async () => {
      setFetchingUsers(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username")
        .neq("user_id", reporterId)
        .order("username");

      if (!error && data) {
        setUsers(data);
      }
      setFetchingUsers(false);
    };

    fetchUsers();
  }, [open, reporterId]);

  // Set preselected user when modal opens
  useEffect(() => {
    if (open && preselectedUserId) {
      setSelectedUserId(preselectedUserId);
    }
  }, [open, preselectedUserId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedReason("");
      setDescription("");
      if (!preselectedUserId) {
        setSelectedUserId("");
      }
    }
  }, [open, preselectedUserId]);

  const handleSubmit = async () => {
    if (!selectedUserId || !selectedReason) {
      toast.error("Please select a user and reason");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("user_reports").insert({
        reporter_id: reporterId,
        reported_user_id: selectedUserId,
        reason: selectedReason,
        description: description.trim() || null,
      });

      if (error) throw error;

      toast.success("Report submitted", {
        description: "Our moderation team will review your report.",
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedUsername = preselectedUsername || users.find(u => u.user_id === selectedUserId)?.username;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Report User
          </DialogTitle>
          <DialogDescription>
            Submit a report about a user who is violating our community guidelines.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User Selection */}
          <div className="space-y-2">
            <Label htmlFor="user-select">User to Report</Label>
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={!!preselectedUserId || fetchingUsers}
            >
              <SelectTrigger id="user-select" className="bg-background">
                <SelectValue placeholder={fetchingUsers ? "Loading users..." : "Select a user"} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border max-h-60">
                {preselectedUserId && preselectedUsername ? (
                  <SelectItem value={preselectedUserId}>{preselectedUsername}</SelectItem>
                ) : (
                  users.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.username}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="reason-select">Reason for Report</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger id="reason-select" className="bg-background">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {REPORT_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Details */}
          <div className="space-y-2">
            <Label htmlFor="description">Additional Details (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide any additional context or details about this report..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-background min-h-[100px] resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/1000
            </p>
          </div>

          {/* Selected Summary */}
          {selectedUserId && selectedReason && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm">
              <p className="text-foreground">
                Reporting <strong className="text-destructive">{selectedUsername}</strong> for{" "}
                <strong>{REPORT_REASONS.find(r => r.value === selectedReason)?.label}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedUserId || !selectedReason}
            className="bg-destructive hover:bg-destructive/90"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Submit Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportUserModal;
