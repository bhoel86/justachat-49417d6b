import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  avatarUrl?: string | null;
  username: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showOnlineIndicator?: boolean;
  isOnline?: boolean;
}

const sizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const UserAvatar = ({
  avatarUrl,
  username,
  size = "md",
  className,
  showOnlineIndicator = false,
  isOnline = false,
}: UserAvatarProps) => {
  const [imageError, setImageError] = useState(false);

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getGradient = (name: string) => {
    // Generate consistent gradient based on username
    const colors = [
      "from-violet-500 to-purple-600",
      "from-cyan-500 to-blue-600",
      "from-emerald-500 to-teal-600",
      "from-orange-500 to-red-600",
      "from-pink-500 to-rose-600",
      "from-indigo-500 to-violet-600",
      "from-amber-500 to-orange-600",
      "from-lime-500 to-green-600",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="relative inline-block">
      <Avatar className={cn(sizeClasses[size], className)}>
        {avatarUrl && !imageError ? (
          <AvatarImage
            src={avatarUrl}
            alt={username}
            onError={() => setImageError(true)}
            className="object-cover"
          />
        ) : null}
        <AvatarFallback
          className={cn(
            "bg-gradient-to-br font-bold text-white",
            getGradient(username)
          )}
        >
          {getInitials(username)}
        </AvatarFallback>
      </Avatar>
      
      {showOnlineIndicator && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-background",
            size === "xs" ? "h-1.5 w-1.5" : size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5",
            isOnline ? "bg-green-500" : "bg-muted-foreground"
          )}
        />
      )}
    </div>
  );
};

export default UserAvatar;