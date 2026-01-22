import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MapPin, Shield, Eye } from "lucide-react";

interface LocationConsentDialogProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

const LocationConsentDialog = ({ open, onAccept, onDecline }: LocationConsentDialogProps) => {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-primary/10">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <AlertDialogTitle className="text-xl">Location Data Collection</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-left">
              <p className="text-muted-foreground">
                We'd like to collect your approximate location to show you on the global user map and provide location-based features.
              </p>
              
              <div className="space-y-3 bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  What we collect:
                </h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Approximate city and country (not exact address)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Coordinates reduced to ~1km precision for privacy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>IP address is hashed and cannot be reversed</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3 bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  Who can see it:
                </h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Only you and site administrators</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Your username appears on the map for other users</span>
                  </li>
                </ul>
              </div>

              <p className="text-xs text-muted-foreground">
                You can withdraw consent anytime by clearing your browser data. Location data older than 90 days is automatically deleted.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel onClick={onDecline}>
            No, thanks
          </AlertDialogCancel>
          <AlertDialogAction onClick={onAccept}>
            Allow Location
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LocationConsentDialog;
