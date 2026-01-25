import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Download, Monitor, Apple, Laptop, 
  Terminal, MessageSquare, Shield, Users, Zap,
  Palette, Globe, Lock, CheckCircle2, ExternalLink
} from "lucide-react";

const ClientDownload = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [detectedOS, setDetectedOS] = useState<'windows' | 'macos' | 'linux' | 'unknown'>('unknown');

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Detect user's OS
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('win')) {
      setDetectedOS('windows');
    } else if (userAgent.includes('mac')) {
      setDetectedOS('macos');
    } else if (userAgent.includes('linux')) {
      setDetectedOS('linux');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-12 w-12 rounded-xl jac-gradient-bg animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const downloads = [
    {
      os: 'windows',
      name: 'Windows',
      icon: Monitor,
      version: '2026.1.0',
      size: '45 MB',
      url: 'https://github.com/justachat/jac-chat-client/releases/latest/download/JAC-Chat-Windows-x64.exe',
      requirements: 'Windows 10 or later (64-bit)',
    },
    {
      os: 'macos',
      name: 'macOS',
      icon: Apple,
      version: '2026.1.0',
      size: '52 MB',
      url: 'https://github.com/justachat/jac-chat-client/releases/latest/download/JAC-Chat-macOS.dmg',
      requirements: 'macOS 11 Big Sur or later',
    },
    {
      os: 'linux',
      name: 'Linux',
      icon: Laptop,
      version: '2026.1.0',
      size: '48 MB',
      url: 'https://github.com/justachat/jac-chat-client/releases/latest/download/JAC-Chat-Linux-x86_64.AppImage',
      requirements: 'Any modern Linux distribution (64-bit)',
    },
  ];

  const features = [
    {
      icon: Palette,
      title: 'Role-Colored Nicklist',
      description: 'Owners, admins, mods, and bots are color-coded for easy identification',
    },
    {
      icon: Lock,
      title: 'Pre-configured Security',
      description: 'SSL/TLS encryption enabled by default with auto-connect to JAC servers',
    },
    {
      icon: Zap,
      title: 'Dark Theme',
      description: 'Beautiful dark theme matching the web interface aesthetic',
    },
    {
      icon: Globe,
      title: 'Cross-Platform',
      description: 'Native apps for Windows, macOS, and Linux with consistent experience',
    },
    {
      icon: Users,
      title: 'Rich Presence',
      description: 'See user roles, locations, and status directly in the nicklist',
    },
    {
      icon: Shield,
      title: 'Auto-Updates',
      description: 'Stay up-to-date with automatic update notifications',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl jac-gradient-bg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold brand jac-gradient-text">Justachat<sup className="text-xs">™</sup></h1>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl jac-gradient-bg mb-6">
            <Terminal className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-4">JAC Chat Client</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A custom IRC client built for Justachat™ with role-based nicklist coloring, 
            dark theme, and pre-configured server settings.
          </p>
          <Badge variant="outline" className="mt-4 text-sm">
            Based on Quassel IRC • Open Source
          </Badge>
        </div>

        {/* Download Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {downloads.map((download) => {
            const Icon = download.icon;
            const isRecommended = download.os === detectedOS;
            
            return (
              <Card 
                key={download.os} 
                className={`relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/50 ${
                  isRecommended ? 'ring-2 ring-primary border-primary' : ''
                }`}
              >
                {isRecommended && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg font-medium">
                    Recommended
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-muted mb-4 mx-auto">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{download.name}</CardTitle>
                  <CardDescription>{download.requirements}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Version {download.version}</span>
                    <span>{download.size}</span>
                  </div>
                  <Button 
                    className="w-full gap-2" 
                    size="lg"
                    onClick={() => window.open(download.url, '_blank')}
                  >
                    <Download className="w-5 h-5" />
                    Download for {download.name}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Alternative Downloads */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-primary" />
              Alternative Options
            </CardTitle>
            <CardDescription>
              Other ways to connect to JAC Chat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link 
                to="/download-proxy" 
                className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Download className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold">mIRC Theme Package</h3>
                  <p className="text-sm text-muted-foreground">Use with your existing mIRC client</p>
                </div>
              </Link>
              
              <a 
                href="https://github.com/justachat/jac-chat-client/releases" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-500/20 flex items-center justify-center">
                  <Terminal className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Source Code</h3>
                  <p className="text-sm text-muted-foreground">Build from source on GitHub</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">Features</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-start gap-4 p-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Connection Info */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Quick Setup
            </CardTitle>
            <CardDescription>
              The client comes pre-configured with these settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4 font-mono text-sm">
              <div className="p-3 rounded-lg bg-background border border-border">
                <div className="text-muted-foreground text-xs mb-1">Server</div>
                <div>157.245.174.197</div>
              </div>
              <div className="p-3 rounded-lg bg-background border border-border">
                <div className="text-muted-foreground text-xs mb-1">SSL Port</div>
                <div>6697</div>
              </div>
              <div className="p-3 rounded-lg bg-background border border-border">
                <div className="text-muted-foreground text-xs mb-1">Plain Port</div>
                <div>6667</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Use your Justachat email and password to log in. The client will auto-connect on startup.
            </p>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 Justachat™. All rights reserved.</p>
          <p className="mt-1">JAC Chat Client is based on <a href="https://quassel-irc.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Quassel IRC</a> (GPL-2.0 License)</p>
        </div>
      </footer>
    </div>
  );
};

export default ClientDownload;
