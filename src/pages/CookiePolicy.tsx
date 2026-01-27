import { Link } from "react-router-dom";
import { Cookie, ArrowLeft, Shield, Settings, BarChart3, Lock, Clock, ToggleRight, Globe, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getVersionString } from "@/lib/version";
import mascotLeft from "@/assets/mascot-left.png";
import mascotRight from "@/assets/mascot-right.png";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <Link to="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-semibold">Back to Justachat™</span>
          </Link>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8 space-y-8 flex-1">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Cookie className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">Cookie Policy</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            How Justachat™ uses cookies and similar technologies
          </p>
        </div>

        {/* What Are Cookies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5 text-primary" />
              What Are Cookies?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">
              Cookies are small text files that are stored on your device (computer, tablet, or mobile) when 
              you visit a website. They help websites remember your preferences, keep you logged in, and 
              understand how you use the service.
            </p>
            <p className="text-foreground leading-relaxed">
              Justachat™ uses cookies and similar technologies (such as local storage) to provide, secure, 
              and improve our chat service.
            </p>
          </CardContent>
        </Card>

        {/* Types of Cookies We Use */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Types of Cookies We Use
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Essential Cookies */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-green-500" />
                <h3 className="font-semibold text-foreground">Essential Cookies (Required)</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                These cookies are necessary for the website to function and cannot be disabled.
              </p>
              <ul className="text-sm text-foreground ml-6 space-y-1">
                <li>• <strong>Authentication:</strong> Keep you logged in during your session</li>
                <li>• <strong>Security:</strong> Protect against CSRF attacks and validate sessions</li>
                <li>• <strong>Preferences:</strong> Remember your language and theme settings</li>
                <li>• <strong>Load Balancing:</strong> Distribute traffic across our servers</li>
              </ul>
            </div>

            <Separator />

            {/* Functional Cookies */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ToggleRight className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold text-foreground">Functional Cookies</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                These enhance your experience by remembering your choices.
              </p>
              <ul className="text-sm text-foreground ml-6 space-y-1">
                <li>• <strong>Chat Preferences:</strong> Notification sounds, message display settings</li>
                <li>• <strong>Room History:</strong> Recently visited chat rooms</li>
                <li>• <strong>UI State:</strong> Sidebar collapsed/expanded, window positions</li>
                <li>• <strong>Theme:</strong> Dark/light mode preference</li>
              </ul>
            </div>

            <Separator />

            {/* Analytics Cookies */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                <h3 className="font-semibold text-foreground">Analytics Cookies</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Help us understand how visitors use our service so we can improve it.
              </p>
              <ul className="text-sm text-foreground ml-6 space-y-1">
                <li>• <strong>Usage Patterns:</strong> Which features are most popular</li>
                <li>• <strong>Performance:</strong> Page load times and error rates</li>
                <li>• <strong>Traffic Sources:</strong> How users find our service</li>
                <li>• <strong>Device Info:</strong> Browser type, screen size, operating system</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Specific Cookies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Specific Cookies Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-semibold text-foreground">Cookie Name</th>
                    <th className="text-left py-2 px-2 font-semibold text-foreground">Purpose</th>
                    <th className="text-left py-2 px-2 font-semibold text-foreground">Duration</th>
                    <th className="text-left py-2 px-2 font-semibold text-foreground">Type</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-2 font-mono text-xs">sb-*-auth-token</td>
                    <td className="py-2 px-2">Authentication session</td>
                    <td className="py-2 px-2">Session / 1 year</td>
                    <td className="py-2 px-2"><span className="text-green-500">Essential</span></td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-2 font-mono text-xs">cf_clearance</td>
                    <td className="py-2 px-2">Cloudflare security verification</td>
                    <td className="py-2 px-2">30 minutes</td>
                    <td className="py-2 px-2"><span className="text-green-500">Essential</span></td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-2 font-mono text-xs">cf_turnstile_*</td>
                    <td className="py-2 px-2">CAPTCHA verification</td>
                    <td className="py-2 px-2">Session</td>
                    <td className="py-2 px-2"><span className="text-green-500">Essential</span></td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-2 font-mono text-xs">theme</td>
                    <td className="py-2 px-2">Dark/light mode preference</td>
                    <td className="py-2 px-2">1 year</td>
                    <td className="py-2 px-2"><span className="text-blue-500">Functional</span></td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-2 font-mono text-xs">sidebar_state</td>
                    <td className="py-2 px-2">UI sidebar collapsed/expanded</td>
                    <td className="py-2 px-2">Persistent</td>
                    <td className="py-2 px-2"><span className="text-blue-500">Functional</span></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 font-mono text-xs">_ga, _gid</td>
                    <td className="py-2 px-2">Google Analytics (if enabled)</td>
                    <td className="py-2 px-2">2 years / 24 hours</td>
                    <td className="py-2 px-2"><span className="text-purple-500">Analytics</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Local Storage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Local Storage & Session Storage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">
              In addition to cookies, we use browser local storage and session storage for:
            </p>
            <ul className="space-y-2 text-foreground text-sm">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <strong>Authentication Tokens:</strong> Secure session management
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <strong>Chat State:</strong> Unread message counts, draft messages
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <strong>User Preferences:</strong> Notification settings, UI customizations
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <strong>Cache:</strong> Temporary storage of user profiles and room data
              </li>
            </ul>
            <p className="text-muted-foreground text-sm">
              Local storage data persists until you clear your browser data or sign out. Session storage 
              is automatically cleared when you close your browser tab.
            </p>
          </CardContent>
        </Card>

        {/* Third-Party Cookies */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-amber-600" />
              Third-Party Cookies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">
              Some cookies are placed by third-party services we use:
            </p>
            <ul className="space-y-3 text-foreground text-sm">
              <li className="flex items-start gap-3">
                <span className="text-amber-600 font-bold">•</span>
                <div>
                  <strong>Cloudflare:</strong> Security, DDoS protection, and content delivery. 
                  <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">Privacy Policy</a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-600 font-bold">•</span>
                <div>
                  <strong>Supabase:</strong> Backend authentication and database services.
                  <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">Privacy Policy</a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-600 font-bold">•</span>
                <div>
                  <strong>Google Analytics:</strong> Usage analytics (if enabled).
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">Privacy Policy</a>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Your Choices */}
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ToggleRight className="h-5 w-5 text-green-500" />
              Your Cookie Choices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">
              You have several options for managing cookies:
            </p>
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2">Browser Settings</h4>
                <p className="text-sm text-muted-foreground">
                  Most browsers allow you to block or delete cookies through their settings. However, 
                  blocking essential cookies may prevent you from using Justachat™.
                </p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2">Opt-Out Links</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Analytics Opt-Out</a></li>
                  <li>• <a href="https://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Network Advertising Initiative Opt-Out</a></li>
                  <li>• <a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Digital Advertising Alliance Opt-Out</a></li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2">Do Not Track</h4>
                <p className="text-sm text-muted-foreground">
                  We currently do not respond to "Do Not Track" browser signals, as there is no 
                  industry-standard interpretation of this signal for chat services.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consent */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Cookie Consent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">
              By continuing to use Justachat™, you consent to our use of cookies as described in this policy.
            </p>
            <ul className="space-y-2 text-foreground text-sm">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                Essential cookies are always active and required for the service to function
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                You can withdraw consent for non-essential cookies at any time through your browser settings
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                Withdrawing consent may affect certain features of the service
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Updates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Policy Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">
              We may update this Cookie Policy from time to time to reflect changes in our practices or 
              for legal, operational, or regulatory reasons.
            </p>
            <p className="text-muted-foreground text-sm">
              Significant changes will be communicated through a notice on our website. Continued use of 
              Justachat™ after changes constitutes acceptance of the updated policy.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Questions About Cookies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-foreground">
              If you have questions about our use of cookies, please contact us:
            </p>
            <p className="text-muted-foreground">
              <strong>Email:</strong> privacy@justachat.net
            </p>
            <Separator className="my-4" />
            <p className="text-muted-foreground text-sm">
              See also our <Link to="/legal" className="text-primary hover:underline">Terms of Service & Privacy Policy</Link> for 
              more information about how we handle your data.
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-8 border-t border-border">
          <p>© {new Date().getFullYear()} Justachat™ — All rights reserved.</p>
          <p className="mt-1">Last updated: January 2026</p>
        </div>
      </main>

      {/* Footer with Mascots */}
      <footer className="py-6 border-t border-border/40">
        <div className="container flex items-center justify-center gap-4">
          {/* Left mascot */}
          <img 
            src={mascotLeft} 
            alt="Mascot" 
            className="h-12 sm:h-14 w-auto object-contain"
          />
          
          {/* Center content */}
          <div className="flex flex-col items-center gap-2">
            {/* Social Media Links */}
            <div className="flex items-center gap-2">
              <a 
                href="#" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-secondary hover:bg-primary/20 flex items-center justify-center transition-colors group"
                title="Facebook"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-primary transition-colors" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a 
                href="#" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-secondary hover:bg-primary/20 flex items-center justify-center transition-colors group"
                title="Instagram"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-primary transition-colors" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a 
                href="#" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-secondary hover:bg-primary/20 flex items-center justify-center transition-colors group"
                title="TikTok"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-primary transition-colors" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>
              <a 
                href="#" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-secondary hover:bg-primary/20 flex items-center justify-center transition-colors group"
                title="X (Twitter)"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-primary transition-colors" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
            
            {/* Copyright & Version */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} Justachat™ All rights reserved.
              </p>
              <div className="flex items-center justify-center gap-2">
                <a 
                  href="https://justachat.net" 
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  justachat.net
                </a>
                <span className="text-xs text-muted-foreground/50">•</span>
                <Link 
                  to="/legal" 
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Legal
                </Link>
                <span className="text-xs text-muted-foreground/50">•</span>
                <span className="text-xs text-muted-foreground/70 font-mono">{getVersionString()}</span>
              </div>
            </div>
          </div>
          
          {/* Right mascot */}
          <img 
            src={mascotRight} 
            alt="Mascot" 
            className="h-12 sm:h-14 w-auto object-contain"
          />
        </div>
      </footer>
    </div>
  );
};

export default CookiePolicy;
