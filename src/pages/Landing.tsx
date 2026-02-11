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
  { icon: MessageCircle, title: "Live Chat Rooms", desc: "Topic-based rooms with real people in real time." },
  { icon: Shield, title: "Safe & Moderated", desc: "AI moderation and active staff keep it respectful." },
  { icon: Lock, title: "Private Messaging", desc: "End-to-end encrypted. Your conversations stay yours." },
  { icon: Users, title: "Community First", desc: "No followers, no likes, no algorithms." },
  { icon: Mic, title: "Voice Chat", desc: "Talk hands-free with voice broadcasting." },
  { icon: Video, title: "Video Chat", desc: "Face-to-face conversations built in." },
  { icon: Gamepad2, title: "Games & Trivia", desc: "Challenge friends and earn points." },
  { icon: Heart, title: "Dating", desc: "Optional dating profiles and matching." },
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
          <div className="container mx-auto px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-primary">Justachat<sup className="text-[8px]">™</sup></span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/about" className="hidden sm:inline text-xs text-muted-foreground hover:text-primary transition-colors">About</Link>
              <Link to="/features" className="hidden sm:inline text-xs text-muted-foreground hover:text-primary transition-colors">Features</Link>
              <Link to="/faq" className="hidden sm:inline text-xs text-muted-foreground hover:text-primary transition-colors">FAQ</Link>
              <Link to="/site-index" className="hidden md:inline text-xs text-muted-foreground hover:text-primary transition-colors">Site Index</Link>
              <Link 
                to="/login" 
                className="px-3 py-1.5 border border-border rounded-md font-medium hover:bg-accent/50 transition-colors text-sm"
              >
                Login
              </Link>
              <Link 
                to="/login?mode=signup" 
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors text-sm"
              >
                Create Account
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img src={heroImg} alt="" className="w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
          </div>
          <div className="relative container mx-auto px-4 py-12 sm:py-20 text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 leading-tight">
              Free Chat Rooms —{" "}
              <span className="text-primary">Real Conversations</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-6">
              Voice, video, games & genuine connection. No algorithms, no feeds. Just chat.
            </p>
            <div className="flex gap-3 justify-center">
              <Link 
                to="/login?mode=signup" 
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Create Free Account
              </Link>
              <Link 
                to="/login" 
                className="px-6 py-2.5 border border-border rounded-lg font-semibold hover:bg-accent/50 transition-colors"
              >
                Login
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 py-10 sm:py-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">Everything You Need</h2>
          <p className="text-muted-foreground text-center mb-8 text-sm max-w-md mx-auto">
            A complete chat platform. No premium tiers, no hidden costs.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {features.map((f) => (
              <div key={f.title} className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                <f.icon className="w-6 h-6 text-primary mb-2" />
                <h3 className="font-semibold text-sm mb-0.5">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Rooms Preview + Why Justachat side by side on desktop */}
        <section className="bg-card/50 border-y border-border">
          <div className="container mx-auto px-4 py-10 sm:py-14">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Rooms */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Popular Rooms</h2>
                <p className="text-muted-foreground text-sm mb-5">Jump into conversations that interest you.</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {rooms.map((r) => (
                    <div key={r.name} className={`bg-gradient-to-br ${r.color} rounded-lg p-3 text-center text-white text-sm font-semibold shadow`}>
                      {r.name}
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Link 
                    to="/login?mode=signup" 
                    className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
                  >
                    <Globe className="w-4 h-4" />
                    Browse All Rooms →
                  </Link>
                </div>
              </div>

              {/* Why Justachat */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Why Justachat?</h2>
                <p className="text-muted-foreground text-sm mb-5">Built for real people who want real chat.</p>
                <div className="space-y-4">
                  <div className="flex gap-3 items-start">
                    <Zap className="w-8 h-8 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-sm">Instant Access</h3>
                      <p className="text-xs text-muted-foreground">No downloads. Sign up and chat in seconds from any browser.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <Shield className="w-8 h-8 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-sm">Privacy First</h3>
                      <p className="text-xs text-muted-foreground">Encrypted messages, no data selling, no unnecessary tracking.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <Users className="w-8 h-8 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-sm">Adults Only (18+)</h3>
                      <p className="text-xs text-muted-foreground">A mature community for real conversations.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary/10 border-y border-primary/20">
          <div className="container mx-auto px-4 py-10 text-center">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Ready to Chat?</h2>
            <p className="text-muted-foreground text-sm mb-4">Join the community. It only takes a minute.</p>
            <div className="flex gap-3 justify-center">
              <Link 
                to="/login?mode=signup" 
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Create Free Account
              </Link>
              <Link 
                to="/login" 
                className="px-6 py-2.5 border border-border rounded-lg font-semibold hover:bg-accent/50 transition-colors"
              >
                Login
              </Link>
            </div>
          </div>
        </section>

        <SiteFooter />
      </div>
    </>
  );
};

export default Landing;
