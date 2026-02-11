/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { Link } from "react-router-dom";
import SiteFooter from "@/components/layout/SiteFooter";
import PageSEO from "@/components/seo/PageSEO";
import { MessageSquare, Lock, Users, Zap } from "lucide-react";

const FreeChat = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageSEO
        title="Free Chat Rooms - Private Online Chat Platform"
        description="Join free chat rooms on JustAChat. No registration fees, no ads, no algorithms. Real conversations with real people. Start chatting for free today."
        path="/free-chat"
        keywords="free chat, free chat rooms, online chat, free online chat, private chat rooms, free messaging"
      />

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">JustAChat™</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">About</Link>
            <Link to="/features" className="text-muted-foreground hover:text-primary transition-colors">Features</Link>
            <Link to="/home" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">Join Now</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-card/30">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
            <span className="text-primary">Free Chat Rooms</span> — No Strings Attached
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Join free chat rooms on JustAChat. No registration fees. No ads. No algorithms. Just people having real conversations.
          </p>
          <Link 
            to="/home"
            className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            Start Chatting Free Today
          </Link>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <article className="prose prose-invert max-w-none space-y-8">
          
          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">What Makes JustAChat Free Chat Different</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Most "free chat" platforms make money by selling your data, showing ads, or pushing you toward paid features. JustAChat is different. We're genuinely free—no catches, no upgrades hidden behind paywalls, no data harvesting.
            </p>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              JustAChat is an IRC-inspired free chat platform built for real conversation. Whether you're looking for free online chat, free chat rooms, or just a place to talk without the noise of social media algorithms, you've found it.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">Why Choose Our Free Chat Rooms?</h2>
            <div className="grid md:grid-cols-2 gap-6 my-6">
              <div className="border border-border rounded-lg p-6 bg-card/30">
                <MessageSquare className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">Real Conversations</h3>
                <p className="text-muted-foreground text-sm">No feeds, no likes, no algorithms deciding what you see. Just people talking.</p>
              </div>
              <div className="border border-border rounded-lg p-6 bg-card/30">
                <Lock className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">Private & Secure</h3>
                <p className="text-muted-foreground text-sm">End-to-end encrypted private messages. Your conversations stay private.</p>
              </div>
              <div className="border border-border rounded-lg p-6 bg-card/30">
                <Users className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">Diverse Chat Rooms</h3>
                <p className="text-muted-foreground text-sm">From #general to #music to #technology—find your community in our free chat rooms.</p>
              </div>
              <div className="border border-border rounded-lg p-6 bg-card/30">
                <Zap className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">Instant & Free</h3>
                <p className="text-muted-foreground text-sm">Sign up free. Chat instantly. No ads. No premium tier hiding features.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">Free Chat Rooms by Category</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Our free online chat rooms cover every interest. Whether you want to discuss music, debate politics, play games, or just hang out, there's a free chat room waiting for you:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li><strong>#general</strong> — Main free chat room for everyone</li>
              <li><strong>#music</strong> — Free chat about music, artists, and recommendations</li>
              <li><strong>#games</strong> — Free chat for gamers</li>
              <li><strong>#technology</strong> — Free tech discussion room</li>
              <li><strong>#movies</strong> — Free chat about films and TV shows</li>
              <li><strong>#sports</strong> — Free sports discussion room</li>
              <li><strong>#lounge</strong> — Casual, free chat room for random topics</li>
              <li><strong>#trivia</strong> — Free trivia games with other users</li>
              <li><strong>#help</strong> — Get free help and support from the community</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">No Hidden Costs — Truly Free Chat</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Unlike many "free chat" services, JustAChat doesn't charge for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>Creating an account</li>
              <li>Joining chat rooms</li>
              <li>Sending messages</li>
              <li>Private encrypted messaging</li>
              <li>Voice or video chat</li>
              <li>Custom profile features</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Everything is free. No surprises. No premium tiers. That's our commitment to free, open conversation.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">How Free Chat on JustAChat Works</h2>
            <ol className="list-decimal list-inside space-y-3 text-muted-foreground mb-4">
              <li><strong>Sign up free</strong> — Takes 30 seconds. No payment required.</li>
              <li><strong>Browse free chat rooms</strong> — Pick a room that interests you.</li>
              <li><strong>Start chatting</strong> — Message other free chat participants in real-time.</li>
              <li><strong>Send private messages</strong> — All encrypted for your privacy.</li>
              <li><strong>Customize your profile</strong> — Add an avatar, bio, and personality.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">Why People Choose Free Chat on JustAChat</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              JustAChat appeals to people who are tired of algorithm-driven social media and want to have genuine, real-time conversations without surveillance. Our free chat platform is ideal for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>Adults seeking meaningful conversation</li>
              <li>IRC enthusiasts who want a modern equivalent</li>
              <li>People who value privacy and anonymity</li>
              <li>Communities around shared interests</li>
              <li>Anyone tired of corporate social media platforms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">Free Chat & Community Moderation</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              While JustAChat's chat rooms are free to join and use, we maintain community standards. Our moderation team works to keep free chat rooms safe and welcoming by:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>Enforcing community guidelines</li>
              <li>Removing spam and harassment</li>
              <li>Protecting minors in free chat spaces</li>
              <li>Allowing room founders to customize their free chat room</li>
            </ul>
          </section>

          <section className="bg-card/30 border border-border rounded-lg p-8 text-center">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Ready for Free Chat?</h2>
            <p className="text-muted-foreground mb-6">
              Join thousands of people chatting free on JustAChat. No sign-up fee. No hidden costs. Just real conversation.
            </p>
            <Link 
              to="/home"
              className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              Start Free Chat Now
            </Link>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">More About JustAChat</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/about" className="text-primary hover:underline">Learn more about JustAChat →</Link></li>
              <li><Link to="/features" className="text-primary hover:underline">Explore all features →</Link></li>
              <li><Link to="/faq" className="text-primary hover:underline">Frequently asked questions →</Link></li>
              <li><Link to="/chat-rooms" className="text-primary hover:underline">Discover all chat rooms →</Link></li>
            </ul>
          </section>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
};

export default FreeChat;
