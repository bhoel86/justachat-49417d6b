/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { Link } from "react-router-dom";
import PageSEO from "@/components/seo/PageSEO";
import SiteFooter from "@/components/layout/SiteFooter";
import { MessageCircle, Shield, Users, Mic, Video, Gamepad2, Heart, Globe, Zap, Lock } from "lucide-react";
import heroImg from "@/assets/homepage-hero.jpg";

const features = [
  { icon: MessageCircle, title: "Live Chat Rooms", desc: "Jump into topic-based rooms and talk with real people in real time." },
  { icon: Shield, title: "Safe & Moderated", desc: "AI moderation, community guidelines, and active staff keep conversations respectful." },
  { icon: Lock, title: "Private Messaging", desc: "End-to-end encrypted private messages. Your conversations stay yours." },
  { icon: Users, title: "Community First", desc: "No followers, no likes, no algorithms. Just genuine human connection." },
  { icon: Mic, title: "Voice Chat", desc: "Talk hands-free with voice broadcasting in any room." },
  { icon: Video, title: "Video Chat", desc: "Face-to-face conversations with built-in video support." },
  { icon: Gamepad2, title: "Games & Trivia", desc: "Challenge friends to trivia, play games, and earn points." },
  { icon: Heart, title: "Dating", desc: "Meet new people with optional dating profiles and matching." },
];

const rooms = [
  { name: "General", color: "from-blue-500 to-cyan-500" },
  { name: "Music", color: "from-purple-500 to-pink-500" },
  { name: "Games", color: "from-orange-500 to-yellow-500" },
  { name: "Dating", color: "from-pink-500 to-rose-500" },
  { name: "Movies & TV", color: "from-indigo-500 to-violet-500" },
  { name: "Technology", color: "from-cyan-500 to-blue-500" },
  { name: "Sports", color: "from-lime-500 to-green-500" },
  { name: "Trivia", color: "from-teal-500 to-cyan-500" },
];

const Landing = () => {
  return (
    <>
      <PageSEO
        title="Justachat - Free Online Chat Rooms | Talk to People Now"
        description="Join Justachat for free online chat rooms with real people. Voice chat, video chat, games, dating, and more. No downloads, no fees. Start chatting instantly."
        path="/"
      />
      <div className="min-h-screen bg-background text-foreground">
        {/* Nav */}
        <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-primary">Justachat<sup className="text-[8px]">™</sup></span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <Link to="/about" className="hidden sm:inline text-sm text-muted-foreground hover:text-primary transition-colors">About</Link>
              <Link to="/features" className="hidden sm:inline text-sm text-muted-foreground hover:text-primary transition-colors">Features</Link>
              <Link to="/faq" className="hidden sm:inline text-sm text-muted-foreground hover:text-primary transition-colors">FAQ</Link>
              <Link to="/site-index" className="hidden sm:inline text-sm text-muted-foreground hover:text-primary transition-colors">Site Index</Link>
              <Link 
                to="/login" 
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm"
              >
                Join Chat
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img src={heroImg} alt="" className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
          </div>
          <div className="relative container mx-auto px-4 py-20 sm:py-32 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              Free Chat Platform
              <br />
              <span className="text-primary">Real Conversation, No Noise</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Join thousands of people in live chat rooms. Voice, video, games, and genuine human connection. No algorithms, no feeds, no nonsense.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                to="/login" 
                className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors text-lg"
              >
                Join Chat Free
              </Link>
              <Link 
                to="/about" 
                className="px-8 py-3 border border-border rounded-lg font-semibold hover:bg-accent/50 transition-colors text-lg"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 py-16 sm:py-24">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">Everything You Need to Chat</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            A complete platform built for real conversations. No premium tiers, no hidden costs.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                <f.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Rooms Preview */}
        <section className="bg-card/50 border-y border-border">
          <div className="container mx-auto px-4 py-16 sm:py-24">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">Popular Chat Rooms</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
              Browse rooms by topic and jump into conversations that interest you.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {rooms.map((r) => (
                <div key={r.name} className={`bg-gradient-to-br ${r.color} rounded-lg p-4 text-center text-white font-semibold shadow-lg`}>
                  {r.name}
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                <Globe className="w-5 h-5" />
                Browse All Rooms
              </Link>
            </div>
          </div>
        </section>

        {/* Why Justachat */}
        <section className="container mx-auto px-4 py-16 sm:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Why Justachat?</h2>
            <div className="grid sm:grid-cols-3 gap-8">
              <div>
                <Zap className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Instant Access</h3>
                <p className="text-sm text-muted-foreground">No downloads required. Sign up and start chatting in seconds from any browser.</p>
              </div>
              <div>
                <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Privacy First</h3>
                <p className="text-sm text-muted-foreground">Encrypted messages, no data selling, no tracking cookies beyond what is necessary.</p>
              </div>
              <div>
                <Users className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Adults Only (18+)</h3>
                <p className="text-sm text-muted-foreground">A mature community where real adults have real conversations.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary/10 border-y border-primary/20">
          <div className="container mx-auto px-4 py-16 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Start Chatting?</h2>
            <p className="text-muted-foreground mb-6">Join the community today. It only takes a minute.</p>
            <Link 
              to="/login" 
              className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors text-lg"
            >
              Create Free Account
            </Link>
          </div>
        </section>

        <SiteFooter />
      </div>
    </>
  );
};

export default Landing;
