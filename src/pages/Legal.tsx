import { Link } from "react-router-dom";
import { Scale, Shield, FileText, AlertTriangle, ArrowLeft, DollarSign, Globe, Database, UserCheck, Eye, Ban, Gavel, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const Legal = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <Link to="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-semibold">Back to Justachat™</span>
          </Link>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Scale className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">Legal Notice & Terms of Use</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Trademark, privacy, and terms of service information for Justachat™
          </p>
        </div>

        {/* Age Requirements */}
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-destructive" />
              Age Requirements & Eligibility
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-destructive/20 border-2 border-destructive/40 rounded-lg p-4">
              <p className="text-foreground font-semibold">
                You must be at least <strong className="text-destructive text-lg">13 years of age</strong> to use Justachat™.
              </p>
            </div>
            <ul className="space-y-2 text-foreground text-sm">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                Users under 18 are prohibited from accessing adult-designated channels (21+)
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                False representation of age is a violation of these terms and may result in immediate account termination
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                Parents/guardians are responsible for monitoring minors' use of this service
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                We comply with COPPA (Children's Online Privacy Protection Act) requirements
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Data Collection & Logging */}
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              Data Collection & Chat Logging
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-500/20 border-2 border-blue-500/40 rounded-lg p-4">
              <p className="text-foreground font-semibold">
                All chat messages, network activity, and connection data are logged and stored for legal purposes.
              </p>
            </div>
            <p className="text-foreground text-sm leading-relaxed">
              By using Justachat™, you acknowledge and consent to the collection and storage of the following information:
            </p>
            <ul className="space-y-2 text-foreground text-sm">
              <li className="flex items-start gap-3">
                <Server className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span><strong>IP Addresses</strong> — Hashed and stored for security and abuse prevention</span>
              </li>
              <li className="flex items-start gap-3">
                <Server className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span><strong>ISP Information</strong> — Internet Service Provider details for network identification</span>
              </li>
              <li className="flex items-start gap-3">
                <Server className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span><strong>Geolocation Data</strong> — Approximate location (city, region, country) for service optimization</span>
              </li>
              <li className="flex items-start gap-3">
                <Server className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span><strong>Chat Logs</strong> — All public and private messages are encrypted and stored</span>
              </li>
              <li className="flex items-start gap-3">
                <Server className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span><strong>Connection Timestamps</strong> — Login/logout times and session duration</span>
              </li>
              <li className="flex items-start gap-3">
                <Server className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span><strong>Device Information</strong> — Browser type, operating system, and device identifiers</span>
              </li>
            </ul>
            <Separator className="my-4" />
            <p className="text-muted-foreground text-xs">
              This data may be retained for up to 90 days and may be disclosed to law enforcement agencies 
              upon valid legal request (subpoena, court order, or warrant). Location data older than 90 days 
              is automatically purged.
            </p>
          </CardContent>
        </Card>

        {/* Privacy & Monitoring */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Privacy & Monitoring Disclosure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">
              Justachat™ employs both automated and manual monitoring systems to ensure user safety and 
              compliance with our terms of service:
            </p>
            <ul className="space-y-2 text-foreground text-sm">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <strong>AI Content Moderation</strong> — Automated systems scan messages for prohibited content
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <strong>Human Moderators</strong> — Staff may review flagged content and user reports
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <strong>Private Messages</strong> — While encrypted, PMs may be decrypted and reviewed by administrators 
                for safety investigations or legal compliance
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <strong>No Expectation of Privacy</strong> — Users should have no expectation of privacy in any 
                communications made through this platform
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Prohibited Conduct */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-destructive" />
              Prohibited Conduct
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">
              The following activities are strictly prohibited and may result in immediate termination 
              and reporting to law enforcement:
            </p>
            <ul className="space-y-2 text-foreground text-sm">
              <li className="flex items-start gap-3">
                <span className="text-destructive font-bold">✗</span>
                Distribution or solicitation of child sexual abuse material (CSAM)
              </li>
              <li className="flex items-start gap-3">
                <span className="text-destructive font-bold">✗</span>
                Harassment, threats, stalking, or doxxing of other users
              </li>
              <li className="flex items-start gap-3">
                <span className="text-destructive font-bold">✗</span>
                Spam, flooding, or denial-of-service attacks
              </li>
              <li className="flex items-start gap-3">
                <span className="text-destructive font-bold">✗</span>
                Distribution of malware, phishing links, or fraudulent content
              </li>
              <li className="flex items-start gap-3">
                <span className="text-destructive font-bold">✗</span>
                Impersonation of staff, law enforcement, or other users
              </li>
              <li className="flex items-start gap-3">
                <span className="text-destructive font-bold">✗</span>
                Solicitation of illegal activities or services
              </li>
              <li className="flex items-start gap-3">
                <span className="text-destructive font-bold">✗</span>
                Circumventing bans, mutes, or other moderation actions
              </li>
              <li className="flex items-start gap-3">
                <span className="text-destructive font-bold">✗</span>
                Attempting to exploit, hack, or compromise platform security
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Main Legal Notice */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Trademark Protection Notice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">
              <strong>Justachat™</strong> and <strong>JAC™</strong> are actively registered trademarks 
              with pending federal filings with the United States Patent and Trademark Office (USPTO).
            </p>
            <p className="text-foreground leading-relaxed">
              Any unauthorized use, replication, or creation of competing chat services using these 
              marks constitutes <strong>trademark infringement</strong> and <strong>domain squatting</strong>.
            </p>
            <p className="text-foreground leading-relaxed">
              Violations will be pursued through <strong>UDRP (Uniform Domain-Name Dispute-Resolution Policy) 
              proceedings</strong> and <strong>state/federal legal action</strong>.
            </p>
          </CardContent>
        </Card>

        {/* Protected Marks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Protected Marks & Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <div>
                  <strong>Justachat™</strong> — Primary brand name and trademark
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <div>
                  <strong>JAC™</strong> — Official acronym and shorthand trademark
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <div>
                  <strong>justachat.net</strong> — Official domain property
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <div>
                  <strong>JACNet™</strong> — IRC network name
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Enforcement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Trademark Enforcement Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">
              We actively monitor for trademark infringement and will take legal action against:
            </p>
            <ul className="space-y-2 text-foreground">
              <li className="flex items-start gap-3">
                <span className="text-destructive font-bold">✗</span>
                Unauthorized use of "Justachat", "JAC", or similar confusing marks
              </li>
              <li className="flex items-start gap-3">
                <span className="text-destructive font-bold">✗</span>
                Domain squatting on related domain names
              </li>
              <li className="flex items-start gap-3">
                <span className="text-destructive font-bold">✗</span>
                Creating competing chat services using our protected marks
              </li>
              <li className="flex items-start gap-3">
                <span className="text-destructive font-bold">✗</span>
                Misrepresentation or passing off as Justachat™
              </li>
            </ul>
            
            <Separator className="my-4" />
            
            {/* Imminent Domain Seizure Warning */}
            <div className="bg-destructive/20 border-2 border-destructive/40 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-destructive" />
                <strong className="text-destructive">Imminent Domain Seizure</strong>
              </div>
              <p className="text-sm text-foreground">
                Infringing domains are subject to <strong>immediate seizure</strong> through UDRP proceedings. 
                Domain registrars are required to comply with transfer orders, resulting in complete loss of 
                the domain without compensation.
              </p>
            </div>

            {/* Damages Warning */}
            <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-amber-500" />
                <strong className="text-amber-500">Statutory Damages</strong>
              </div>
              <p className="text-sm text-foreground">
                Under the Lanham Act, willful trademark infringement may result in statutory damages of 
                up to <strong className="text-amber-500">$2,000,000 per counterfeit mark</strong>, plus 
                attorney's fees, court costs, and disgorgement of profits.
              </p>
            </div>

            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-foreground">
                <strong>Legal Remedies:</strong> Violations may result in UDRP domain transfer proceedings, 
                cease and desist orders, and civil litigation seeking damages and injunctive relief under 
                the Lanham Act (15 U.S.C. § 1051 et seq.) and applicable state trademark laws.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer & Liability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5 text-primary" />
              Disclaimer & Limitation of Liability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground text-sm leading-relaxed">
              Justachat™ is provided "AS IS" without warranty of any kind, express or implied. We do not guarantee 
              uninterrupted service, security of user data, or accuracy of user-generated content.
            </p>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                We are not responsible for content posted by users
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                We are not liable for any damages arising from use of this service
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                We reserve the right to terminate accounts without notice
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                These terms may be modified at any time without prior notice
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                Continued use constitutes acceptance of modified terms
              </li>
            </ul>
            <Separator className="my-4" />
            <p className="text-muted-foreground text-xs">
              This service is governed by the laws of the State of Texas, United States. Any disputes 
              shall be resolved in the courts of Bexar County, Texas.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Legal Inquiries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              For trademark licensing, legal inquiries, law enforcement requests, or to report infringement, 
              please contact us through our official channels at <strong>justachat.net</strong>.
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-8 border-t border-border">
          <p>© {new Date().getFullYear()} Justachat™ — All rights reserved.</p>
          <p className="mt-1">Last updated: January 2026</p>
        </div>
      </main>
    </div>
  );
};

export default Legal;
