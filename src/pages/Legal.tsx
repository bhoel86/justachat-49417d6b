/**
 * ╔═ JustAChat™ ══════════════════════ Since 2026 ═══ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { Link } from "react-router-dom";
import { Scale, Shield, FileText, AlertTriangle, ArrowLeft, DollarSign, Globe, Database, UserCheck, Eye, Ban, Gavel, Server, Copyright, Link2, Users, Mail, CloudOff, ScrollText, MapPin, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import SiteFooter from "@/components/layout/SiteFooter";

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

        {/* Agreement Notice */}
        <Card className="border-primary/40 bg-primary/10">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-3">
              <Shield className="h-6 w-6 text-primary flex-shrink-0" />
              <p className="text-foreground font-medium text-center">
                By registering an account on Justachat™, you acknowledge that you have read, understood, and agree 
                to be bound by all policies outlined on this page in <strong className="text-primary">good faith</strong>.
              </p>
            </div>
          </CardContent>
        </Card>

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

        {/* Section 230 - Communications Decency Act */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-primary" />
              Communications Decency Act (Section 230)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">
              Justachat™ operates as an interactive computer service provider under Section 230 of the 
              Communications Decency Act (47 U.S.C. § 230).
            </p>
            <ul className="space-y-2 text-foreground text-sm">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                We are a <strong>platform</strong>, not a publisher of user-generated content
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                We are not liable for content created, posted, or shared by users
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                Good faith content moderation does not create publisher liability
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                Users are solely responsible for their own communications
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* DMCA Policy */}
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Copyright className="h-5 w-5 text-orange-500" />
              DMCA Copyright Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">
              Justachat™ respects intellectual property rights and complies with the Digital Millennium 
              Copyright Act (DMCA). We will respond to valid takedown notices for infringing content.
            </p>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">To file a DMCA takedown request, provide:</p>
              <ul className="text-sm text-foreground space-y-1">
                <li>1. Your contact information (name, address, email, phone)</li>
                <li>2. Description of the copyrighted work being infringed</li>
                <li>3. Location of the infringing material on our service</li>
                <li>4. Statement of good faith belief of infringement</li>
                <li>5. Statement of accuracy under penalty of perjury</li>
                <li>6. Your physical or electronic signature</li>
              </ul>
            </div>
            <p className="text-muted-foreground text-sm">
              <strong>DMCA Agent:</strong> Submit copyright complaints to <strong>legal@justachat.net</strong>
            </p>
            <Separator className="my-2" />
            <p className="text-muted-foreground text-xs">
              Repeat infringers will have their accounts terminated. Counter-notices may be filed if you 
              believe content was removed in error.
            </p>
          </CardContent>
        </Card>

        {/* Third-Party Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              Third-Party Links & Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">
              Users may share links to external websites, services, or content. Justachat™ is not responsible for:
            </p>
            <ul className="space-y-2 text-foreground text-sm">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                The content, accuracy, or availability of third-party websites
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                Privacy practices or terms of service of external sites
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                Any damages resulting from accessing third-party links
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                Products, services, or transactions conducted on external sites
              </li>
            </ul>
            <p className="text-muted-foreground text-sm">
              Accessing external links is at your own risk. We recommend reviewing the terms and privacy 
              policies of any third-party sites you visit.
            </p>
          </CardContent>
        </Card>

        {/* Indemnification */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-amber-600" />
              Indemnification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">
              You agree to <strong>indemnify, defend, and hold harmless</strong> Justachat™, its owners, 
              operators, employees, and affiliates from any and all claims, damages, losses, liabilities, 
              costs, and expenses (including attorney's fees) arising from:
            </p>
            <ul className="space-y-2 text-foreground text-sm">
              <li className="flex items-start gap-3">
                <span className="text-amber-600 font-bold">•</span>
                Your use or misuse of the service
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-600 font-bold">•</span>
                Content you post, transmit, or share
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-600 font-bold">•</span>
                Violation of these Terms of Service
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-600 font-bold">•</span>
                Infringement of any third-party rights
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-600 font-bold">•</span>
                Any illegal or unauthorized activity conducted through your account
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Governing Law & Jurisdiction */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Governing Law & Jurisdiction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">
              These Terms of Service and any disputes arising from your use of Justachat™ shall be governed by 
              and construed in accordance with the laws of the <strong>State of Texas, United States</strong>, 
              without regard to conflict of law principles.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-foreground">
                <strong>Exclusive Jurisdiction:</strong> You agree to submit to the exclusive jurisdiction of 
                the state and federal courts located in <strong>Bexar County, Texas</strong> for resolution 
                of any disputes.
              </p>
              <p className="text-sm text-foreground">
                <strong>Waiver of Jury Trial:</strong> To the fullest extent permitted by law, you waive any 
                right to a jury trial in any proceeding arising from these Terms.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dispute Resolution */}
        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Dispute Resolution & Arbitration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-purple-500/20 border-2 border-purple-500/40 rounded-lg p-4">
              <p className="text-foreground font-semibold text-sm">
                PLEASE READ THIS SECTION CAREFULLY — IT AFFECTS YOUR LEGAL RIGHTS
              </p>
            </div>
            <p className="text-foreground leading-relaxed">
              Any dispute, claim, or controversy arising from your use of Justachat™ shall be resolved through 
              <strong> binding arbitration</strong> rather than in court, except for claims that qualify for 
              small claims court.
            </p>
            <ul className="space-y-2 text-foreground text-sm">
              <li className="flex items-start gap-3">
                <span className="text-purple-500 font-bold">•</span>
                <strong>No Class Actions:</strong> You agree to resolve disputes only on an individual basis 
                and waive any right to participate in class action lawsuits or class-wide arbitration
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-500 font-bold">•</span>
                <strong>Arbitration Rules:</strong> Arbitration will be conducted by the American Arbitration 
                Association (AAA) under its Consumer Arbitration Rules
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-500 font-bold">•</span>
                <strong>Location:</strong> Arbitration shall take place in Bexar County, Texas, or via 
                telephone/video conference at our discretion
              </li>
            </ul>
            <p className="text-muted-foreground text-xs">
              You may opt out of this arbitration agreement by sending written notice within 30 days of 
              account creation to legal@justachat.net.
            </p>
          </CardContent>
        </Card>

        {/* Service Modifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-primary" />
              Service Modifications & Termination
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">
              Justachat™ reserves the right to modify, suspend, or discontinue any part of the service at any 
              time, with or without notice:
            </p>
            <ul className="space-y-2 text-foreground text-sm">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                We may add, remove, or modify features without prior notice
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                We may terminate or suspend your account at our sole discretion
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                We may impose limits on certain features or restrict access
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                We are not liable for any modification, suspension, or discontinuation
              </li>
            </ul>
            <Separator className="my-2" />
            <p className="text-muted-foreground text-sm">
              <strong>Account Data:</strong> Upon termination, we may delete your account data. You are 
              responsible for backing up any content you wish to retain before termination.
            </p>
          </CardContent>
        </Card>

        {/* Electronic Communications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Electronic Communications Consent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">
              By creating an account, you consent to receive electronic communications from Justachat™, including:
            </p>
            <ul className="space-y-2 text-foreground text-sm">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                Service announcements and updates
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                Security alerts and password reset emails
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                Account notifications and moderation notices
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                Legal notices and terms updates
              </li>
            </ul>
            <p className="text-muted-foreground text-sm">
              These communications satisfy any legal requirement that notices be provided in writing.
            </p>
          </CardContent>
        </Card>

        {/* International Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              International Users & GDPR
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">
              Justachat™ is operated from the United States. If you access this service from outside the U.S., 
              you do so at your own risk and are responsible for compliance with local laws.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">For users in the European Union (GDPR):</p>
              <ul className="text-sm text-foreground space-y-1">
                <li>• <strong>Data Controller:</strong> Justachat™ operates as the data controller</li>
                <li>• <strong>Legal Basis:</strong> Consent and legitimate interests for service operation</li>
                <li>• <strong>Data Rights:</strong> You may request access, correction, or deletion of personal data</li>
                <li>• <strong>Data Transfers:</strong> Your data is transferred to and processed in the United States</li>
              </ul>
            </div>
            <p className="text-muted-foreground text-sm">
              To exercise your GDPR rights, contact <strong>privacy@justachat.net</strong>. We will respond 
              within 30 days.
            </p>
          </CardContent>
        </Card>

        {/* Force Majeure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudOff className="h-5 w-5 text-primary" />
              Force Majeure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">
              Justachat™ shall not be liable for any failure or delay in performance due to circumstances 
              beyond our reasonable control, including but not limited to:
            </p>
            <ul className="space-y-2 text-foreground text-sm">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                Natural disasters, acts of God, or severe weather events
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                War, terrorism, civil unrest, or government actions
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                Internet or telecommunications outages beyond our control
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                Cyberattacks, DDoS attacks, or security incidents
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                Power failures, hardware failures, or third-party service outages
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                Pandemics, epidemics, or public health emergencies
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Legal Inquiries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-foreground">
              For legal inquiries, please contact us through the appropriate channel:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><strong>General Legal:</strong> legal@justachat.net</li>
              <li><strong>DMCA/Copyright:</strong> legal@justachat.net</li>
              <li><strong>Privacy/GDPR:</strong> privacy@justachat.net</li>
              <li><strong>Law Enforcement:</strong> legal@justachat.net (include valid legal process)</li>
              <li><strong>Trademark Licensing:</strong> legal@justachat.net</li>
            </ul>
            <p className="text-muted-foreground text-xs mt-4">
              Official domain: <strong>justachat.net</strong>
            </p>
          </CardContent>
        </Card>

      </main>
      <SiteFooter />
    </div>
  );
};

export default Legal;
