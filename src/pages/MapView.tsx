import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import UserLocationMap from "@/components/map/UserLocationMap";
import LocationAnalytics from "@/components/map/LocationAnalytics";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const MapView = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Global User Map</h1>
              <p className="text-sm text-muted-foreground">
                See where users are connecting from around the world
              </p>
            </div>
          </div>
        </div>

        {/* Map */}
        <UserLocationMap height="500px" />

        {/* Analytics */}
        <LocationAnalytics />
      </div>
    </div>
  );
};

export default MapView;