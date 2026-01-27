import { Link } from "react-router-dom";
import { Scale, Shield, FileText, AlertTriangle, ArrowLeft, DollarSign, Globe } from "lucide-react";
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
          <h1 className="text-3xl md:text-4xl font-bold">Legal Notice</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Trademark and intellectual property information for Justachat™
          </p>
        </div>

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
              Enforcement Policy
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

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Legal Inquiries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              For trademark licensing, legal inquiries, or to report infringement, please contact us through 
              our official channels at <strong>justachat.net</strong>.
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
