/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { Link } from "react-router-dom";
import SiteFooter from "@/components/layout/SiteFooter";
import PageSEO from "@/components/seo/PageSEO";
import { Globe, Users, Lock, Zap, MessageSquare, Shield } from "lucide-react";

const OnlineChat = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageSEO
        title="Online Chat Platform - Real Conversations Without Algorithms"
        description="JustAChat is a modern online chat platform for real conversations. No feeds, no algorithms, no social media noise. Chat with real people online, free."
        path="/online-chat"
        keywords="online chat, online chat platform, real-time chat, web chat, conversation platform"
      />

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">JustAChat™</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/free-chat" className="text-muted-foreground hover:text-primary transition-colors">Free Chat</Link>
            <Link to="/chat-rooms" className="text-muted-foreground hover:text-primary transition-colors">Rooms</Link>
            <Link to="/home" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">Join Now</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-card/30">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
            Online Chat Without the <span className="text-primary">Algorithms</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            JustAChat is a modern online chat platform designed for real conversations. No feeds deciding what you see. No algorithms pushing content. Just people talking.
          </p>
          <Link 
            to="/home"
            className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            Start Chatting Online
          </Link>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <article className="prose prose-invert max-w-none space-y-8">
          
          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">What is Online Chat?</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Online chat is real-time text communication between people over the internet. Unlike social media, where content is algorithmically filtered and feeds are designed to keep you scrolling, online chat platforms like JustAChat prioritize direct, immediate conversation.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              JustAChat is an online chat platform inspired by classic IRC (Internet Relay Chat), built for the modern web. We've created a space where real conversations happen without the noise of social media algorithms, likes, follows, or influencer culture.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">Why Online Chat is Better Than Social Media</h2>
            <div className="space-y-4 mb-6">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold mb-2">No Algorithm Feed</h3>
                <p className="text-muted-foreground text-sm">You see messages in chronological order, not what an algorithm thinks you want to see.</p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold mb-2">No Vanity Metrics</h3>
                <p className="text-muted-foreground text-sm">There are no likes, retweets, or follower counts. Just conversations.</p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold mb-2">Real-Time Interaction</h3>
                <p className="text-muted-foreground text-sm">Chat happens instantly. See messages and respond in real-time.</p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold mb-2">Privacy-First</h3>
                <p className="text-muted-foreground text-sm">Private messages are end-to-end encrypted. Your conversations stay private.</p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold mb-2">No Data Harvesting</h3>
                <p className="text-muted-foreground text-sm">We don't sell your data to advertisers or use it to manipulate you.</p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold mb-2">Community-Driven</h3>
                <p className="text-muted-foreground text-sm">Chat rooms are built around shared interests, not designed to maximize engagement.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">Key Features of JustAChat Online Chat</h2>
            <div className="grid md:grid-cols-2 gap-6 my-6">
              <div className="border border-border rounded-lg p-6 bg-card/30">
                <MessageSquare className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">Real-Time Messaging</h3>
                <p className="text-muted-foreground text-sm">Type and send messages instantly. See responses from other users in real-time.</p>
              </div>
              <div className="border border-border rounded-lg p-6 bg-card/30">
                <Users className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">Multiple Chat Rooms</h3>
                <p className="text-muted-foreground text-sm">Join different rooms based on interests, topics, or communities.</p>
              </div>
              <div className="border border-border rounded-lg p-6 bg-card/30">
                <Lock className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">Private Messages</h3>
                <p className="text-muted-foreground text-sm">Send encrypted one-on-one messages to other users.</p>
              </div>
              <div className="border border-border rounded-lg p-6 bg-card/30">
                <Shield className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">Moderated Spaces</h3>
                <p className="text-muted-foreground text-sm">Safe, welcoming chat environments maintained by community moderators.</p>
              </div>
              <div className="border border-border rounded-lg p-6 bg-card/30">
                <Globe className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">Browser-Based</h3>
                <p className="text-muted-foreground text-sm">No downloads or apps needed. Chat directly from your web browser.</p>
              </div>
              <div className="border border-border rounded-lg p-6 bg-card/30">
                <Zap className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">Instant Access</h3>
                <p className="text-muted-foreground text-sm">Sign up free and start chatting online immediately.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">The History of Online Chat</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Online chat dates back to the 1970s with systems like ARPANET and early bulletin board systems (BBS). The modern era of internet chat began with IRC (Internet Relay Chat) in 1988, which allowed real-time group conversations across the internet.
            </p>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              IRC was revolutionary because it was simple, open, and focused on conversation. For decades, it remained the standard for online communities—from tech enthusiasts to gaming groups to casual friends.
            </p>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              JustAChat brings back the simplicity and authenticity of classic online chat for the modern web. We believe online chat should be about real conversation, not engagement metrics or data collection.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4 text-foreground">Online Chat for Everyone</h2>
            <p className="text-muted-foreground mb-4">JustAChat online chat is ideal for:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>People who want to escape algorithm-driven social media</li>
              <li>Communities discussing shared interests</li>
              <li>Professionals collaborating in real-time</li>
              <li>Friends and groups staying connected</li>
              <li>Newcomers exploring online communities</li>
              <li>Adults seeking meaningful conversations</li>
            </ul>
          </section>

          <section className="bg-card/30 border border-border rounded-lg p-8 text-center">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Experience Real Online Chat</h2>
            <p className="text-muted-foreground mb-6">
              Join JustAChat and discover what online chat is meant to be. Real conversations. Real people. No algorithms. No noise.
            </p>
            <Link 
              to="/home"
              className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              Start Chatting Now
            </Link>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Explore More</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/free-chat" className="text-primary hover:underline">Discover our free chat platform →</Link></li>
              <li><Link to="/chat-rooms" className="text-primary hover:underline">Browse all chat rooms →</Link></li>
              <li><Link to="/features" className="text-primary hover:underline">Learn about features →</Link></li>
              <li><Link to="/faq" className="text-primary hover:underline">Read our FAQ →</Link></li>
            </ul>
          </section>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
};

export default OnlineChat;
