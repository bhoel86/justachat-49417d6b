/**
 * ╔═ JustAChat™ ══════════════════════ Since 2026 ═══ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { Link } from "react-router-dom";
import { Cookie, ArrowLeft, Shield, Settings, BarChart3, Lock, Clock, ToggleRight, Globe, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import SiteFooter from "@/components/layout/SiteFooter";

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

      </main>

      <SiteFooter />
    </div>
  );
};

export default CookiePolicy;
