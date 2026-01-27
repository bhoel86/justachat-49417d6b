import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Shield,
  Users,
  Ban,
  VolumeX,
  Globe,
  Bot,
  MessageSquare,
  Mail,
  Key,
  Rocket,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type AppRole = "owner" | "admin" | "moderator" | "user";

export function VideoUserMenuAdminTools({
  currentUserRole,
}: {
  currentUserRole?: AppRole | null;
}) {
  const navigate = useNavigate();

  const isOwner = currentUserRole === "owner";
  const isAdmin = currentUserRole === "admin" || isOwner;
  const isModerator = currentUserRole === "moderator" || isAdmin;

  if (!isModerator) return null;

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-xs text-muted-foreground">
        Admin Tools
      </DropdownMenuLabel>

      <DropdownMenuItem
        onClick={() => navigate("/admin")}
        className="cursor-pointer"
      >
        <Shield className="w-4 h-4 mr-2 text-muted-foreground" />
        Admin Panel
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={() => navigate("/admin/bans")}
        className="cursor-pointer"
      >
        <Ban className="w-4 h-4 mr-2 text-muted-foreground" />
        Ban List
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={() => navigate("/admin/mutes")}
        className="cursor-pointer"
      >
        <VolumeX className="w-4 h-4 mr-2 text-muted-foreground" />
        Mutes
      </DropdownMenuItem>

      {isAdmin && (
        <>
          <DropdownMenuItem
            onClick={() => navigate("/admin/users")}
            className="cursor-pointer"
          >
            <Users className="w-4 h-4 mr-2 text-muted-foreground" />
            Users
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate("/admin/minors")}
            className="cursor-pointer"
          >
            <Users className="w-4 h-4 mr-2 text-muted-foreground" />
            Minors
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate("/admin/klines")}
            className="cursor-pointer"
          >
            <Globe className="w-4 h-4 mr-2 text-muted-foreground" />
            K-Lines
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate("/admin/messages")}
            className="cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 mr-2 text-muted-foreground" />
            Messages
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate("/admin/bots")}
            className="cursor-pointer"
          >
            <Bot className="w-4 h-4 mr-2 text-muted-foreground" />
            Bots
          </DropdownMenuItem>
        </>
      )}

      {isOwner && (
        <>
          <DropdownMenuItem
            onClick={() => navigate("/admin/emails")}
            className="cursor-pointer"
          >
            <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
            Emails
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate("/admin/api")}
            className="cursor-pointer"
          >
            <Key className="w-4 h-4 mr-2 text-muted-foreground" />
            API Keys
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate("/admin/deploy")}
            className="cursor-pointer"
          >
            <Rocket className="w-4 h-4 mr-2 text-muted-foreground" />
            VPS Deploy
          </DropdownMenuItem>
        </>
      )}
    </>
  );
}
