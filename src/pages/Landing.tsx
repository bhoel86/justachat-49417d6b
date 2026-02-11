/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import PageSEO from "@/components/seo/PageSEO";
import SiteFooter from "@/components/layout/SiteFooter";
import { MessageCircle, Shield, Users, Mic, Video, Gamepad2, Heart, Globe, Zap, Lock } from "lucide-react";

const features = [
  { icon: MessageCircle, title: "Live Chat Rooms", desc: "Topic-based rooms, real people, real time." },
  { icon: Shield, title: "Safe & Moderated", desc: "AI moderation and active staff." },
  { icon: Lock, title: "Private Messaging", desc: "End-to-end encrypted messages." },
  { icon: Users, title: "Community First", desc: "No followers, no likes, no algorithms." },
  { icon: Mic, title: "Voice Chat", desc: "Hands-free voice broadcasting." },
  { icon: Video, title: "Video Chat", desc: "Face-to-face conversations." },
  { icon: Gamepad2, title: "Games & Trivia", desc: "Challenge friends, earn points." },
  { icon: Heart, title: "Dating", desc: "Optional profiles and matching." },
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

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is Justachat free to use?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, Justachat is completely free. There are no premium tiers, no hidden costs, and no subscriptions required. All features including voice chat, video chat, games, and private messaging are available to every user."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need to download anything to use Justachat?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No downloads are required. Justachat runs entirely in your web browser. Simply create a free account and start chatting instantly from any device."
      }
    },
    {
      "@type": "Question",
      "name": "Is Justachat safe and moderated?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Justachat uses AI-powered moderation combined with active human staff to keep the platform safe. All private messages are end-to-end encrypted, and we never sell user data."
      }
    },
    {
      "@type": "Question",
      "name": "What chat rooms are available on Justachat?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Justachat offers topic-based rooms including General, Music, Games, Dating, Movies & TV, Technology, Sports, Trivia, and more. Users can also create their own custom rooms."
      }
    },
    {
      "@type": "Question",
      "name": "Does Justachat have voice and video chat?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Justachat includes free voice broadcasting and video chat features, allowing you to have hands-free conversations or face-to-face interactions with other users."
      }
    }
  ]
};

const Landing = () => {
  return (
    <>
      <PageSEO
        title="Justachat - Free Online Chat Rooms | Talk to People Now"
        description="Join Justachat for free online chat rooms with real people. Voice chat, video chat, games, dating, and more. No downloads, no fees. Start chatting instantly."
        path="/"
        keywords="free chat, free chat rooms, online chat, chat with strangers, private chat, voice chat, video chat, dating chat, trivia games, IRC chat, secure chat, encrypted messaging, justachat"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>
      <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
        {/* Background chat flair */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
          {/* Subtle gradient orbs */}
          <div className="absolute top-20 -left-32 w-96 h-96 rounded-full bg-primary/[0.04] blur-3xl" />
          <div className="absolute top-[60%] -right-40 w-[500px] h-[500px] rounded-full bg-primary/[0.03] blur-3xl" />
          <div className="absolute bottom-20 left-1/4 w-72 h-72 rounded-full bg-accent/[0.04] blur-3xl" />
          
          {/* Floating chat bubble shapes */}
          <svg className="absolute top-32 right-[12%] w-14 h-14 text-primary/[0.07] animate-[float_8s_ease-in-out_infinite]" viewBox="0 0 56 56" fill="currentColor">
            <path d="M8 4h40a4 4 0 014 4v28a4 4 0 01-4 4H20l-12 8V40H8a4 4 0 01-4-4V8a4 4 0 014-4z"/>
          </svg>
          <svg className="absolute top-[45%] left-[8%] w-10 h-10 text-primary/[0.05] animate-[float_10s_ease-in-out_2s_infinite]" viewBox="0 0 56 56" fill="currentColor">
            <path d="M8 4h40a4 4 0 014 4v28a4 4 0 01-4 4H20l-12 8V40H8a4 4 0 01-4-4V8a4 4 0 014-4z"/>
          </svg>
          <svg className="absolute bottom-[30%] right-[6%] w-8 h-8 text-primary/[0.06] animate-[float_12s_ease-in-out_4s_infinite]" viewBox="0 0 56 56" fill="currentColor">
            <path d="M8 4h40a4 4 0 014 4v28a4 4 0 01-4 4H20l-12 8V40H8a4 4 0 01-4-4V8a4 4 0 014-4z"/>
          </svg>
          <svg className="absolute top-[70%] left-[45%] w-12 h-12 text-accent/[0.05] animate-[float_9s_ease-in-out_1s_infinite]" viewBox="0 0 56 56" fill="currentColor">
            <path d="M48 4H8a4 4 0 00-4 4v28a4 4 0 004 4h28l12 8V40h0a4 4 0 004-4V8a4 4 0 00-4-4z"/>
          </svg>
          <svg className="absolute top-[15%] left-[30%] w-6 h-6 text-primary/[0.04] animate-[float_11s_ease-in-out_3s_infinite]" viewBox="0 0 56 56" fill="currentColor">
            <path d="M48 4H8a4 4 0 00-4 4v28a4 4 0 004 4h28l12 8V40h0a4 4 0 004-4V8a4 4 0 00-4-4z"/>
          </svg>

          {/* Dot grid pattern */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }} />
        </div>

        {/* Nav */}
        <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50 relative">
          <div className="container mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-primary">Justachat<sup className="text-[8px]">™</sup></span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/login" className="px-3 py-1.5 border border-border rounded-md font-medium hover:bg-accent/50 transition-colors text-sm">Login</Link>
              <Link to="/login?mode=signup" className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors text-sm">Create Account</Link>
            </div>
          </div>
        </nav>

        {/* Hero - compact */}
        <section className="container mx-auto px-4 pt-8 pb-6 text-center relative z-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 leading-tight">
            Free Chat Platform. <span className="text-primary">Real Conversation, No Noise.</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto mb-4">
            Voice, video, games and genuine connection. No algorithms, no feeds. Just chat.
          </p>
          <div className="flex gap-2 justify-center">
            <Link to="/login?mode=signup" className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors text-sm">Create Free Account</Link>
            <Link to="/login" className="px-5 py-2 border border-border rounded-lg font-semibold hover:bg-accent/50 transition-colors text-sm">Login</Link>
          </div>
        </section>

        {/* Why Justachat - FIRST */}
        <section className="border-y border-border bg-card/50 relative z-10">
          <div className="container mx-auto px-4 py-8">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-5">Why Justachat?</h2>
            <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="flex gap-3 items-start">
                <Zap className="w-7 h-7 text-primary shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm">Instant Access</h3>
                  <p className="text-xs text-muted-foreground">No downloads. Sign up and chat in seconds.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <Shield className="w-7 h-7 text-primary shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm">Privacy First</h3>
                  <p className="text-xs text-muted-foreground">Encrypted messages. No data selling.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <Users className="w-7 h-7 text-primary shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm">Adults Only (18+)</h3>
                  <p className="text-xs text-muted-foreground">A mature community for real conversations.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Everything You Need - SECOND */}
        <section className="container mx-auto px-4 py-8 relative z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-1">Everything You Need</h2>
          <p className="text-muted-foreground text-center mb-5 text-xs">No premium tiers. No hidden costs.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {features.map((f) => (
              <div key={f.title} className="bg-card/80 backdrop-blur-sm border border-border rounded-lg p-3 hover:border-primary/50 transition-colors">
                <f.icon className="w-5 h-5 text-primary mb-1.5" />
                <h3 className="font-semibold text-xs mb-0.5">{f.title}</h3>
                <p className="text-[11px] text-muted-foreground leading-snug">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Popular Rooms - THIRD */}
        <section className="border-y border-border bg-card/50 relative z-10">
          <div className="container mx-auto px-4 py-8">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-1">Popular Rooms</h2>
            <p className="text-muted-foreground text-center mb-5 text-xs">Jump into conversations that interest you.</p>
            <div className="grid grid-cols-4 gap-2 max-w-lg mx-auto">
              {rooms.map((r) => (
                <div key={r.name} className={`bg-gradient-to-br ${r.color} rounded-lg py-2.5 text-center text-white text-xs font-semibold shadow`}>
                  {r.name}
                </div>
              ))}
            </div>
            <div className="text-center mt-3">
              <Link to="/login?mode=signup" className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                <Globe className="w-3.5 h-3.5" />
                Browse All Rooms →
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary/10 border-y border-primary/20 relative z-10">
          <div className="container mx-auto px-4 py-8 text-center">
            <h2 className="text-lg sm:text-xl font-bold mb-1.5">Ready to Chat?</h2>
            <p className="text-muted-foreground text-xs mb-3">Join the community. It only takes a minute.</p>
            <div className="flex gap-2 justify-center">
              <Link to="/login?mode=signup" className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors text-sm">Create Free Account</Link>
              <Link to="/login" className="px-5 py-2 border border-border rounded-lg font-semibold hover:bg-accent/50 transition-colors text-sm">Login</Link>
            </div>
          </div>
        </section>

        <div className="relative z-10">
          <SiteFooter />
        </div>
      </div>
    </>
  );
};

export default Landing;
