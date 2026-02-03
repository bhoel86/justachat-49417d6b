/**
 * ╔═ JustAChat™ ══════════════════════ Since 2026 ═══ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, ArrowLeft, Heart, Users, Zap, Shield, Lock, Eye, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import SiteFooter from "@/components/layout/SiteFooter";

// Background images
import chatSilhouettes1 from "@/assets/ethos/chat-silhouettes-1.jpg";
import chatSilhouettes2 from "@/assets/ethos/chat-silhouettes-2.jpg";
import chatMonitors from "@/assets/ethos/chat-monitors.jpg";
import aimBuddylist from "@/assets/ethos/aim-buddylist.jpg";
import msnMessenger from "@/assets/ethos/msn-messenger.jpg";
import ircText from "@/assets/ethos/irc-text.jpg";

const Ethos = () => {
  useEffect(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="h-10 w-10 rounded-xl jac-gradient-bg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold brand jac-gradient-text">Justachat<sup className="text-xs">™</sup></h1>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Lobby
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero Section - with monitor glow background */}
      <section className="relative py-4 sm:py-6 overflow-hidden">
        {/* Background image - faded */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-[0.35]"
          style={{ backgroundImage: `url(${chatMonitors})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            {/* Justachat wordmark with chat bubble icon - matches header style */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 mb-20">
              <div className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 rounded-xl jac-gradient-bg flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-primary-foreground" />
              </div>
              <span className="brand jac-gradient-text font-bold leading-none select-none text-5xl sm:text-7xl lg:text-8xl">
                Justachat<sup className="text-xs sm:text-sm lg:text-base align-super">™</sup>
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Why This <span className="jac-gradient-text">Exists</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              A place for adults who want real conversation without the noise.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="relative">
        {/* Background silhouettes - people at computers */}
        <div 
          className="fixed top-20 left-0 w-1/2 h-80 bg-contain bg-no-repeat bg-left opacity-[0.30] pointer-events-none"
          style={{ backgroundImage: `url(${chatSilhouettes1})` }}
        />
        
        {/* AIM buddy list - faded top right */}
        <div 
          className="fixed top-32 right-0 w-96 h-80 bg-contain bg-no-repeat bg-right opacity-[0.25] pointer-events-none"
          style={{ backgroundImage: `url(${aimBuddylist})` }}
        />
        
        {/* IRC text - middle left */}
        <div 
          className="fixed top-[40%] left-0 w-1/2 h-96 bg-cover bg-no-repeat bg-left opacity-[0.20] pointer-events-none"
          style={{ backgroundImage: `url(${ircText})` }}
        />
        
        {/* MSN Messenger - middle right */}
        <div 
          className="fixed top-[50%] right-0 w-96 h-80 bg-contain bg-no-repeat bg-right opacity-[0.25] pointer-events-none"
          style={{ backgroundImage: `url(${msnMessenger})` }}
        />
        
        {/* Background silhouettes - friends talking */}
        <div 
          className="fixed top-[70%] left-0 w-1/2 h-80 bg-contain bg-no-repeat bg-left opacity-[0.25] pointer-events-none"
          style={{ backgroundImage: `url(${chatSilhouettes2})` }}
        />
        
        <div className="container mx-auto px-4 pb-16">
        <article className="max-w-3xl mx-auto relative z-10">
          
          {/* The Story */}
          <div className="prose prose-lg prose-invert max-w-none">
            
            <section className="mb-12 p-6 sm:p-8 rounded-2xl bg-card/50 border border-border">
              <p className="text-xl sm:text-2xl font-medium text-foreground leading-relaxed mb-6">
                JustAChat is a place for adults who want real conversation without the noise and pressure of modern social platforms.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                No feeds. No followers. No performance metrics. Just people talking.
              </p>
            </section>

            <section className="mb-12 space-y-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Zap className="w-6 h-6 text-primary" />
                Where We Came From
              </h2>
              
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  We grew up in chat rooms when the internet felt smaller and more human.
                </p>
                
                <p>
                  Before everything became a profile, a metric, or a brand.
                </p>
                
                <p>
                  When you could log on, talk to strangers, and leave without a trace. 
                  When conversations happened because people wanted to talk — not because they wanted to be seen.
                </p>
              </div>
            </section>

            <section className="mb-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
              <p className="text-lg text-foreground leading-relaxed italic">
                "The internet used to be a place. Now it's a performance."
              </p>
            </section>

            <section className="mb-12 space-y-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Clock className="w-6 h-6 text-primary" />
                Where We Are Now
              </h2>
              
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Today, most platforms are built around performance, promotion, and attention.
                </p>
                
                <p>
                  It's loud, crowded, and exhausting.
                </p>
                
                <p>
                  Every interaction is designed to keep you scrolling. Every feature is built to make you perform. 
                  You're not a person — you're engagement.
                </p>
              </div>
            </section>

            <section className="mb-12 space-y-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Heart className="w-6 h-6 text-pink-500" />
                Why We Built This
              </h2>
              
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  We wanted a place to talk without being watched, measured, or sold to.
                </p>
                
                <p>
                  A place that feels present, not performative.
                </p>
                
                <p className="text-foreground font-medium text-lg">
                  Somewhere you can show up, have a conversation, and leave without wondering who saw it or what it did to your numbers.
                </p>
              </div>
            </section>

            {/* What We Protect */}
            <section className="mb-12 space-y-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Shield className="w-6 h-6 text-primary" />
                What We Protect
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 space-y-2">
                  <Lock className="w-6 h-6 text-primary" />
                  <p className="font-medium text-foreground">Privacy</p>
                  <p className="text-sm text-muted-foreground">Your conversations stay yours</p>
                </div>
                <div className="p-5 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 space-y-2">
                  <Eye className="w-6 h-6 text-green-500" />
                  <p className="font-medium text-foreground">Presence</p>
                  <p className="text-sm text-muted-foreground">Real people, real time</p>
                </div>
                <div className="p-5 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 space-y-2">
                  <Shield className="w-6 h-6 text-amber-500" />
                  <p className="font-medium text-foreground">Boundaries</p>
                  <p className="text-sm text-muted-foreground">You control your space</p>
                </div>
                <div className="p-5 rounded-xl bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/20 space-y-2">
                  <Users className="w-6 h-6 text-pink-500" />
                  <p className="font-medium text-foreground">Adults talking like adults</p>
                  <p className="text-sm text-muted-foreground">No performance required</p>
                </div>
              </div>
            </section>

            <section className="mb-12 space-y-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Users className="w-6 h-6 text-destructive" />
                What We Are Not
              </h2>
              
              <div className="p-6 rounded-xl bg-destructive/10 border border-destructive/20 space-y-4">
                <p className="text-foreground leading-relaxed font-medium">
                  We are not:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>→ A social media platform</li>
                  <li>→ A content network</li>
                  <li>→ A place to build an audience</li>
                  <li>→ A marketing channel</li>
                </ul>
                
                <div className="pt-4 border-t border-destructive/20">
                  <p className="text-foreground leading-relaxed font-medium">
                    We will not:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>→ Turn people into numbers</li>
                    <li>→ Push people to promote themselves</li>
                    <li>→ Design for addiction or attention loops</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-12 p-6 sm:p-8 rounded-2xl bg-card border border-border">
              <div className="text-center space-y-4">
                <p className="text-xl font-bold text-foreground">
                  No feeds. No likes. No clout farming.
                </p>
                <p className="text-2xl font-bold jac-gradient-text">
                  Just people showing up and talking.
                </p>
              </div>
            </section>

            <section className="text-center space-y-6">
              <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 border border-primary/30">
                <p className="text-lg text-muted-foreground mb-6">
                  If you're tired of the noise, you'll feel at home here.
                </p>
                <p className="text-2xl font-bold text-foreground mb-8">
                  The door's open.
                </p>
                
                <Button size="lg" className="jac-gradient-bg text-primary-foreground font-semibold" asChild>
                  <Link to="/">
                    Enter the Lobby
                    <MessageSquare className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>
            </section>

          </div>
        </article>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Ethos;
