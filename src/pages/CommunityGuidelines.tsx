/**
 * ╔═ JustAChat™ ══════════════════════ Since 2026 ═══ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, AlertTriangle, Ban, MessageSquareWarning, Heart, Users, Eye, Gavel } from "lucide-react";

const CommunityGuidelines = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Community Guidelines</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Introduction */}
        <section className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            JustAChat is a place for adults who want real conversation without the noise and pressure of modern 
            social platforms. These guidelines exist to protect that space. They apply to all users across all 
            chat rooms, private messages, video/voice chat, and dating features.
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Last Updated:</strong> February 2, 2026
          </p>
        </section>

        {/* Core Values */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-400" />
            <h2 className="text-lg font-semibold">What We Protect</h2>
          </div>
          <ul className="space-y-2 text-muted-foreground ml-7">
            <li>• <strong>Privacy:</strong> Your conversations are yours. We don't watch, measure, or sell your data.</li>
            <li>• <strong>Presence:</strong> Real people, real time. No bots pretending to be users.</li>
            <li>• <strong>Boundaries:</strong> You control your space. Block, mute, and report as needed.</li>
            <li>• <strong>Adults talking like adults:</strong> No performance required. Just conversation.</li>
          </ul>
        </section>

        {/* Prohibited Content */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-semibold">Prohibited Content & Behavior</h2>
          </div>
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-destructive">Zero Tolerance Policy — Immediate permanent ban:</p>
            <ul className="space-y-2 text-sm text-muted-foreground ml-4">
              <li>• Child sexual abuse material (CSAM) or any sexual content involving minors</li>
              <li>• Solicitation or grooming of minors</li>
              <li>• Credible threats of violence or terrorism</li>
              <li>• Human trafficking or exploitation</li>
              <li>• Sharing non-consensual intimate images</li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium">Strictly Prohibited — Results in ban:</p>
            <ul className="space-y-2 text-sm text-muted-foreground ml-4">
              <li>• Harassment, bullying, or targeted abuse of any user</li>
              <li>• Hate speech based on race, ethnicity, religion, gender, sexual orientation, disability, or national origin</li>
              <li>• Doxxing or sharing others' personal information without consent</li>
              <li>• Impersonation of other users, staff, or public figures</li>
              <li>• Spam, scams, phishing, or malicious links</li>
              <li>• Solicitation of illegal activities or services</li>
              <li>• Coordinated inauthentic behavior or manipulation</li>
              <li>• Evading bans through alternate accounts</li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium">Not Allowed — May result in warning or ban:</p>
            <ul className="space-y-2 text-sm text-muted-foreground ml-4">
              <li>• Excessive profanity or vulgarity in non-adult rooms</li>
              <li>• Unsolicited sexual content or advances</li>
              <li>• Disruptive behavior (flooding, caps lock abuse, trolling)</li>
              <li>• Advertising or self-promotion without permission</li>
              <li>• Off-topic content that disrupts room conversations</li>
              <li>• False reports or abuse of reporting systems</li>
            </ul>
          </div>
        </section>

        {/* Age-Restricted Content */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-semibold">Age-Restricted Content</h2>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 space-y-3">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>Minimum Age:</strong> Users must be at least 13 years old to use Justachat™</li>
              <li>• <strong>Minors (13-17):</strong> Require parental/guardian consent for full feature access</li>
              <li>• <strong>Adult Rooms (21+):</strong> Strictly limited to users aged 21 and older</li>
              <li>• <strong>Adult Content:</strong> Only permitted in designated adult rooms</li>
              <li>• Users who misrepresent their age will be permanently banned</li>
            </ul>
          </div>
        </section>

        {/* Room-Specific Rules */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold">Room-Specific Rules</h2>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Each chat room may have additional rules set by room owners/admins:</p>
            <ul className="space-y-2 ml-4">
              <li>• Room topics are displayed in the header — stay on topic</li>
              <li>• Room admins have authority to warn, mute, kick, or ban users</li>
              <li>• Room-specific rules cannot override these Community Guidelines</li>
              <li>• Private rooms may have stricter or more relaxed rules at owner discretion</li>
            </ul>
          </div>
        </section>

        {/* Video & Voice Chat */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-semibold">Video & Voice Chat Rules</h2>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground ml-7">
            <li>• No nudity or sexual content except in designated adult video rooms</li>
            <li>• No broadcasting of illegal activities</li>
            <li>• No recording or screenshots of other users without consent</li>
            <li>• Background content must also comply with these guidelines</li>
            <li>• Mute your microphone when not speaking to reduce noise</li>
          </ul>
        </section>

        {/* Dating Features */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-400" />
            <h2 className="text-lg font-semibold">Dating Feature Guidelines</h2>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground ml-7">
            <li>• Be honest in your profile — no catfishing or misleading photos</li>
            <li>• Respect when someone declines or doesn't respond</li>
            <li>• No solicitation for money, gifts, or financial arrangements</li>
            <li>• Report suspicious profiles or behavior immediately</li>
            <li>• Meet in public places if transitioning to offline meetings</li>
          </ul>
        </section>

        {/* Reporting & Enforcement */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquareWarning className="h-5 w-5 text-orange-400" />
            <h2 className="text-lg font-semibold">Reporting Violations</h2>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>If you witness a violation of these guidelines:</p>
            <ul className="space-y-2 ml-4">
              <li>• <strong>In Chat:</strong> Right-click the user's name and select "Report"</li>
              <li>• <strong>Private Messages:</strong> Use the report button in the chat window</li>
              <li>• <strong>Emergency:</strong> Contact staff immediately via /msg command</li>
              <li>• <strong>Email:</strong> Send detailed reports to abuse@justachat.net</li>
            </ul>
            <p className="mt-4">
              All reports are reviewed by our moderation team. False or malicious reports 
              may result in action against the reporting user.
            </p>
          </div>
        </section>

        {/* Enforcement */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Gavel className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-semibold">Enforcement Actions</h2>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Depending on severity and history, violations may result in:</p>
            <ul className="space-y-2 ml-4">
              <li>• <strong>Warning:</strong> First-time minor violations</li>
              <li>• <strong>Mute:</strong> Temporary inability to send messages (room or global)</li>
              <li>• <strong>Kick:</strong> Removal from a room (can rejoin)</li>
              <li>• <strong>Room Ban:</strong> Permanent removal from a specific room</li>
              <li>• <strong>Global Ban:</strong> Complete removal from the platform</li>
              <li>• <strong>K-Line:</strong> IP-based ban for severe violations or ban evasion</li>
            </ul>
            <p className="mt-4 text-xs">
              Staff decisions are final. Repeat offenders face escalating consequences. 
              Severe violations (CSAM, threats, etc.) are reported to law enforcement.
            </p>
          </div>
        </section>

        {/* Privacy Reminder */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-400" />
            <h2 className="text-lg font-semibold">Privacy & Safety Reminders</h2>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-2 text-sm text-muted-foreground">
            <li>• Never share your password, financial info, or government IDs</li>
            <li>• Be cautious about sharing personal details with strangers</li>
            <li>• Use strong, unique passwords for your account</li>
            <li>• Report any attempts to obtain your personal information</li>
            <li>• Remember: Staff will never ask for your password</li>
          </div>
        </section>

        {/* Footer */}
        <section className="pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            These guidelines are subject to change. Continued use of Justachat™ constitutes acceptance 
            of the current guidelines. For questions, contact support@justachat.net.
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/legal')}>
              Legal Notices
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/cookies')}>
              Cookie Policy
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CommunityGuidelines;
