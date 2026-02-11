/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { Link } from "react-router-dom";
import SiteFooter from "@/components/layout/SiteFooter";
import PageSEO from "@/components/seo/PageSEO";
import { Hash, Shield, Music, Gamepad2, Tv, Coffee, MapPin, Heart, Lightbulb } from "lucide-react";

const ChatRooms = () => {
  const rooms = [
    { name: "#general", icon: Hash, desc: "The main chat room for everyone. Introduce yourself and meet new people." },
    { name: "#lounge", icon: Coffee, desc: "Casual conversation about anything and everything. No topic is off-limits." },
    { name: "#adults-21-plus", icon: Shield, desc: "Private space for mature conversations (18+ only)." },
    { name: "#music", icon: Music, desc: "Discuss music, artists, concerts, and recommendations across all genres." },
    { name: "#movies", icon: Tv, desc: "Talk about films, TV shows, streaming, and entertainment." },
    { name: "#games", icon: Gamepad2, desc: "Chat about gaming, strategies, and join fellow gamers." },
    { name: "#sports", icon: Lightbulb, desc: "Discuss sports, leagues, teams, and big game events." },
    { name: "#technology", icon: Lightbulb, desc: "Tech talk, coding, gadgets, and digital culture." },
    { name: "#dating", icon: Heart, desc: "Connect with others in a friendly dating-focused environment." },
    { name: "#help", icon: Coffee, desc: "Get help from the community and moderators." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageSEO
        title="Chat Rooms - JustAChat Free Online Rooms"
        description="Explore all JustAChat chat rooms. Find #general, #music, #gaming, #dating, and more. Join free chat rooms and connect with people who share your interests."
        path="/chat-rooms"
        keywords="chat rooms, online chat rooms, free chat rooms, discussion rooms, community chat"
      />

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">JustAChat™</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/free-chat" className="text-muted-foreground hover:text-primary transition-colors">Free Chat</Link>
            <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">About</Link>
            <Link to="/home" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">Join Now</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-card/30">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
            Explore Our <span className="text-primary">Chat Rooms</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From #general to #gaming to #dating — find the chat rooms that match your interests.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-foreground">All JustAChat Chat Rooms</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {rooms.map((room) => {
              const IconComponent = room.icon;
              return (
                <div key={room.name} className="border border-border rounded-lg p-6 bg-card/30 hover:bg-card/50 transition-colors">
                  <div className="flex items-start gap-3 mb-3">
                    <IconComponent className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <h3 className="text-lg font-semibold">{room.name}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">{room.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Why Join Our Chat Rooms?</h2>
          <ul className="space-y-3 text-muted-foreground">
            <li>✓ <strong>Real People</strong> — Connect with genuine users, not bots or algorithms</li>
            <li>✓ <strong>No Feeds</strong> — Pure real-time conversation without social media noise</li>
            <li>✓ <strong>Safe Spaces</strong> — Moderated chat rooms with community guidelines</li>
            <li>✓ <strong>Diverse Topics</strong> — Whether you're into music, gaming, or dating, there's a room for you</li>
            <li>✓ <strong>IRC-Style</strong> — Classic chat room experience built for the modern web</li>
            <li>✓ <strong>Free Forever</strong> — Join any chat room without paying</li>
          </ul>
        </section>

        <section className="mb-12 bg-card/30 border border-border rounded-lg p-8">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Create Your Own Room</h2>
          <p className="text-muted-foreground mb-4">
            JustAChat allows room founders to create and customize chat rooms around their interests. Whether it's a hobby, community, or exclusive hangout, you can create a room tailored to your vision.
          </p>
          <p className="text-muted-foreground">
            Room founders control the atmosphere, set rules, and build community within their space.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Chat Room Etiquette</h2>
          <p className="text-muted-foreground mb-4">
            All JustAChat chat rooms follow community guidelines to keep conversations respectful and welcoming:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Be respectful to other users</li>
            <li>No harassment, hate speech, or discrimination</li>
            <li>No spam or self-promotion without permission</li>
            <li>Age-appropriate content in public rooms</li>
            <li>Follow room-specific rules set by founders</li>
          </ul>
        </section>

        <section className="text-center bg-card/30 border border-border rounded-lg p-8">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Ready to Join a Chat Room?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Pick a chat room that interests you and start conversing with real people. Sign up free and begin chatting instantly.
          </p>
          <Link 
            to="/home"
            className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            Explore Chat Rooms Now
          </Link>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Learn More</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/free-chat" className="text-primary hover:underline">Discover free chat rooms →</Link></li>
            <li><Link to="/features" className="text-primary hover:underline">See all platform features →</Link></li>
            <li><Link to="/faq" className="text-primary hover:underline">Chat room FAQs →</Link></li>
          </ul>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default ChatRooms;
