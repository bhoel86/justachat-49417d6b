import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Globe, Users, MapPin, Clock, Wifi } from "lucide-react";

interface LocationAnalytics {
  totalUsers: number;
  countryCounts: { country: string; count: number; countryCode: string }[];
  cityCounts: { city: string; country: string; count: number }[];
  recentActivity: {
    username: string;
    city: string;
    country: string;
    lastSeen: string;
  }[];
}

const LocationAnalytics = () => {
  const [analytics, setAnalytics] = useState<LocationAnalytics>({
    totalUsers: 0,
    countryCounts: [],
    cityCounts: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      // Fetch all locations
      const { data: locations, error } = await supabase
        .from('user_locations')
        .select('*')
        .order('last_seen', { ascending: false });

      if (error) throw error;

      // Fetch profiles for usernames
      const userIds = locations?.map(l => l.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.username]));

      // Calculate country counts
      const countryMap = new Map<string, { count: number; countryCode: string }>();
      locations?.forEach(loc => {
        if (loc.country) {
          const existing = countryMap.get(loc.country);
          countryMap.set(loc.country, {
            count: (existing?.count || 0) + 1,
            countryCode: loc.country_code || '',
          });
        }
      });

      // Calculate city counts
      const cityMap = new Map<string, { count: number; country: string }>();
      locations?.forEach(loc => {
        if (loc.city) {
          const key = `${loc.city}-${loc.country}`;
          const existing = cityMap.get(key);
          cityMap.set(key, {
            count: (existing?.count || 0) + 1,
            country: loc.country || '',
          });
        }
      });

      setAnalytics({
        totalUsers: locations?.length || 0,
        countryCounts: Array.from(countryMap.entries())
          .map(([country, data]) => ({ country, ...data }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        cityCounts: Array.from(cityMap.entries())
          .map(([key, data]) => ({ 
            city: key.split('-')[0], 
            country: data.country,
            count: data.count 
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        recentActivity: (locations || []).slice(0, 10).map(loc => ({
          username: profileMap.get(loc.user_id) || 'Unknown',
          city: loc.city || 'Unknown',
          country: loc.country || 'Unknown',
          lastSeen: loc.last_seen,
        })),
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();

    const channel = supabase
      .channel('location_analytics')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_locations' },
        () => fetchAnalytics()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAnalytics]);

  const getFlagEmoji = (countryCode: string) => {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const timeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Card key={i} className="bg-card border-border animate-pulse">
            <CardHeader>
              <div className="h-6 bg-secondary rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3].map(j => (
                  <div key={j} className="h-4 bg-secondary rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Total Users Card */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Total Tracked Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">
            {analytics.totalUsers}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Users with location data
          </p>
        </CardContent>
      </Card>

      {/* Top Countries Card */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-primary" />
            Top Countries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[150px]">
            <div className="space-y-2">
              {analytics.countryCounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet</p>
              ) : (
                analytics.countryCounts.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <span>{getFlagEmoji(item.countryCode)}</span>
                      {item.country}
                    </span>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Top Cities Card */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            Top Cities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[150px]">
            <div className="space-y-2">
              {analytics.cityCounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet</p>
              ) : (
                analytics.cityCounts.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm truncate max-w-[150px]">
                      {item.city}, {item.country}
                    </span>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Recent Activity Card - Full Width */}
      <Card className="bg-card border-border md:col-span-2 lg:col-span-3">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wifi className="h-5 w-5 text-green-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-3">
              {analytics.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              ) : (
                analytics.recentActivity.map((activity, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-xs font-bold">
                        {activity.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{activity.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.city}, {activity.country}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {timeAgo(activity.lastSeen)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationAnalytics;