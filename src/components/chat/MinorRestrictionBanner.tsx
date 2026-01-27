import { AlertTriangle, ShieldAlert, Mail } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface MinorRestrictionBannerProps {
  parentEmail?: string | null;
}

const MinorRestrictionBanner = ({ parentEmail }: MinorRestrictionBannerProps) => {
  return (
    <Alert className="border-amber-500/50 bg-amber-500/10 mx-2 my-2">
      <ShieldAlert className="h-4 w-4 text-amber-500" />
      <AlertTitle className="text-amber-500 text-sm font-medium">
        Account Pending Parental Consent
      </AlertTitle>
      <AlertDescription className="text-xs text-muted-foreground mt-1 space-y-2">
        <p>
          Some features like private messaging are restricted until your parent/guardian verifies their email.
        </p>
        {parentEmail && (
          <p className="flex items-center gap-1.5">
            <Mail className="h-3 w-3" />
            <span>Consent email sent to: <strong className="text-foreground">{parentEmail}</strong></span>
          </p>
        )}
        <p className="text-[10px] opacity-75">
          Ask your parent to check their email and click the verification link.
        </p>
      </AlertDescription>
    </Alert>
  );
};

export default MinorRestrictionBanner;
