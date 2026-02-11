/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { Link } from "react-router-dom";
import SiteFooter from "@/components/layout/SiteFooter";
import PageSEO from "@/components/seo/PageSEO";
import { Terminal, Code, Users, Zap, Clock, Unlock } from "lucide-react";

const IrcStyleChat = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageSEO
        title="IRC Style Chat - Modern Internet Relay Chat Platform"
        description="Experience IRC-style chat with JustAChat. Classic IRC simplicity for modern web. Real-time chat rooms, no algorithms, no social media noise."
        path="/irc-style-chat"
        keywords="IRC chat, IRC style, internet relay chat, classic chat, retro chat, IRC platform"
      />

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">JustAChat™</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/free-chat" className="text-muted-foreground hover:text-primary transition-colors">Free Chat</Link>
            <Link to="/online-chat" className="text-muted-foreground hover:text-primary transition-colors">Online Chat</Link>
            <Link to="/home" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">Join Now</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-card/30">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
            <span className="text-primary">IRC-Style Chat</span> for the Modern Web
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            JustAChat brings back the simplicity and authenticity of classic Internet Relay Chat. Real conversations, channels, and community without modern social media noise.
          </p>
          <Link 
            to="/home"
            className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            Try IRC-Style Chat Free
          </Link>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <article className="prose prose-invert max-w-none space-y-8">
          
          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">What is IRC-Style Chat?</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              IRC (Internet Relay Chat) is a protocol created in 1988 that enabled real-time group conversations across the internet. For decades, IRC was the standard for online communities—from tech professionals to gaming groups to casual friend networks.
            </p>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              JustAChat captures the essence of IRC: simple, open, focused on conversation. You join channels (rooms), chat with people in real-time, and build community around shared interests. No algorithms, no feeds, no likes—just pure conversation.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              If you ever used IRC in the '90s and 2000s, JustAChat will feel familiar. If you're new to IRC-style chat, you're about to discover why millions of people prefer it to modern social media.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">Why IRC-Style Chat Still Matters</h2>
            <p className="text-muted-foreground mb-4">IRC-style chat endured for over 30 years because it got the fundamentals right:</p>
            <div className="space-y-4 mb-6">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold mb-2">Simple & Lightweight</h3>
                <p className="text-muted-foreground text-sm">No bloat. No unnecessary features. Just channels and messages.</p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold mb-2">Real-Time Communication</h3>
                <p className="text-muted-foreground text-sm">Messages arrive instantly. Conversations flow naturally.</p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold mb-2">Community-First Design</h3>
                <p className="text-muted-foreground text-sm">Channels are built around interests and communities, not algorithms.</p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold mb-2">Transparent Communication</h3>
                <p className="text-muted-foreground text-sm">Everyone sees the same messages in chronological order.</p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold mb-2">Open & Decentralized</h3>
                <p className="text-muted-foreground text-sm">IRC networks were always open. Anyone could run a server.</p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold mb-2">Longevity</h3>
                <p className="text-muted-foreground text-sm">IRC servers and communities lasted decades because they weren't chasing trends.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">IRC-Style Chat vs. Modern Social Media</h2>
            <div className="space-y-4 mb-6">
              <div className="border border-border rounded-lg p-4 bg-card/30">
                <h3 className="font-semibold mb-2">Channel-Based (IRC)</h3>
                <p className="text-muted-foreground text-sm">Everyone in a channel sees the same conversation. Join #music to talk about music. It's that simple.</p>
              </div>
              <div className="border border-border rounded-lg p-4 bg-card/30">
                <h3 className="font-semibold mb-2">Feed-Based (Social Media)</h3>
                <p className="text-muted-foreground text-sm">Every user gets a different feed based on algorithms. What you see depends on what the platform thinks you want.</p>
              </div>
              <div className="border border-border rounded-lg p-4 bg-card/30">
                <h3 className="font-semibold mb-2">IRC: Chronological Order</h3>
                <p className="text-muted-foreground text-sm">You see messages as they arrive. Fairness built in.</p>
              </div>
              <div className="border border-border rounded-lg p-4 bg-card/30">
                <h3 className="font-semibold mb-2">Social Media: Ranked by Engagement</h3>
                <p className="text-muted-foreground text-sm">Posts that generate the most likes/shares get amplified, regardless of quality or truth.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">JustAChat IRC-Style Features</h2>
            <div className="grid md:grid-cols-2 gap-6 my-6">
              <div className="border border-border rounded-lg p-6 bg-card/30">
                <Terminal className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">Channel Commands</h3>
                <p className="text-muted-foreground text-sm">Use classic IRC commands to interact with channels and other users.</p>
              </div>
              <div className="border border-border rounded-lg p-6 bg-card/30">
                <Users className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">Real Channels</h3>
                <p className="text-muted-foreground text-sm">Browse and join channels around any topic or interest.</p>
              </div>
              <div className="border border-border rounded-lg p-6 bg-card/30">
                <Zap className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">Instant Messaging</h3>
                <p className="text-muted-foreground text-sm">Send private encrypted messages to other users in real-time.</p>
              </div>
              <div className="border border-border rounded-lg p-6 bg-card/30">
                <Clock className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">Chronological Feeds</h3>
                <p className="text-muted-foreground text-sm">Messages appear in order received, no algorithms reshuffling them.</p>
              </div>
              <div className="border border-border rounded-lg p-6 bg-card/30">
                <Code className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">Native IRC Support</h3>
                <p className="text-muted-foreground text-sm">Connect using traditional IRC clients or our modern web interface.</p>
              </div>
              <div className="border border-border rounded-lg p-6 bg-card/30">
                <Unlock className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">Open & Free</h3>
                <p className="text-muted-foreground text-sm">Join any channel, talk to anyone. No premium features hiding behind paywalls.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">The Evolution from IRC to JustAChat</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              While classic IRC required terminal knowledge and standalone clients, JustAChat brings IRC-style chat to the modern web. You get the same channel-based simplicity, real-time conversation, and community focus—but with a beautiful web interface and mobile support.
            </p>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              JustAChat also modernizes IRC by adding:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>End-to-end encrypted private messages</li>
              <li>Beautiful, intuitive web interface</li>
              <li>Mobile app support</li>
              <li>Voice and video chat</li>
              <li>User profiles and avatars</li>
              <li>Modern moderation tools</li>
              <li>Cross-platform compatibility</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">Who Uses IRC-Style Chat?</h2>
            <p className="text-muted-foreground mb-4">IRC-style chat remains popular with:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li><strong>Tech Communities</strong> — Developers, system admins, open-source projects</li>
              <li><strong>Gaming Communities</strong> — Clans, guilds, casual players</li>
              <li><strong>Hobby Groups</strong> — Music, movies, books, games, tech enthusiasts</li>
              <li><strong>Professional Teams</strong> — Remote collaboration, open communication</li>
              <li><strong>Close-Knit Communities</strong> — Friend groups, local communities</li>
              <li><strong>Privacy-Conscious Users</strong> — People who value decentralization and real conversation</li>
            </ul>
          </section>

          <section className="bg-card/30 border border-border rounded-lg p-8 text-center">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Experience IRC-Style Chat</h2>
            <p className="text-muted-foreground mb-6">
              Whether you're an IRC veteran or new to channel-based chat, JustAChat offers the simplicity you're looking for. Real conversations. Real community. No algorithms.
            </p>
            <Link 
              to="/home"
              className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              Start Chatting IRC-Style
            </Link>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Learn More</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/online-chat" className="text-primary hover:underline">Explore online chat platform →</Link></li>
              <li><Link to="/chat-rooms" className="text-primary hover:underline">Browse all channels →</Link></li>
              <li><Link to="/mirc" className="text-primary hover:underline">Connect with IRC clients →</Link></li>
              <li><Link to="/about" className="text-primary hover:underline">Learn about JustAChat →</Link></li>
            </ul>
          </section>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
};

export default IrcStyleChat;
