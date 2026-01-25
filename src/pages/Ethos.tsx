import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, ArrowLeft, Heart, Users, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

// Background images
import chatSilhouettes1 from "@/assets/ethos/chat-silhouettes-1.jpg";
import chatSilhouettes2 from "@/assets/ethos/chat-silhouettes-2.jpg";
import chatMonitors from "@/assets/ethos/chat-monitors.jpg";

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
      <section className="relative py-16 sm:py-24 overflow-hidden">
        {/* Background image - faded */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-[0.08]"
          style={{ backgroundImage: `url(${chatMonitors})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              Why This <span className="jac-gradient-text">Exists</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              A letter from someone who remembers what the internet used to feel like.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="relative">
        {/* Background silhouettes - people at computers */}
        <div 
          className="fixed top-1/4 left-0 w-1/2 h-96 bg-contain bg-no-repeat bg-left opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: `url(${chatSilhouettes1})` }}
        />
        {/* Background silhouettes - friends talking */}
        <div 
          className="fixed top-1/2 right-0 w-1/2 h-96 bg-contain bg-no-repeat bg-right opacity-[0.05] pointer-events-none"
          style={{ backgroundImage: `url(${chatSilhouettes2})` }}
        />
        
        <div className="container mx-auto px-4 pb-16">
        <article className="max-w-3xl mx-auto relative z-10">
          
          {/* The Story */}
          <div className="prose prose-lg prose-invert max-w-none">
            
            <section className="mb-12 p-6 sm:p-8 rounded-2xl bg-card/50 border border-border">
              <p className="text-xl sm:text-2xl font-medium text-foreground leading-relaxed mb-6">
                I came up on an internet that doesn't exist anymore.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Before feeds. Before influencers. Before you logged in just to lurk and log out. 
                Back when the internet was loud, messy, dangerous, and <em>human</em>.
              </p>
            </section>

            <section className="mb-12 space-y-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Zap className="w-6 h-6 text-primary" />
                The Era That Shaped Me
              </h2>
              
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  <strong className="text-foreground">AIM profiles</strong> stacked with ASCII art and away messages 
                  that told you more about a person than their real name ever did.
                </p>
                
                <p>
                  <strong className="text-foreground">Yahoo chat rooms</strong> full of chaos, trolls, regulars, 
                  and people who somehow showed up every single night.
                </p>
                
                <p>
                  <strong className="text-foreground">MSN nudges</strong> meant something.
                </p>
                
                <p>
                  <strong className="text-foreground">mIRC channels</strong> weren't "servers" — they were territories. 
                  You earned your name or you got run out.
                </p>
                
                <p>
                  <strong className="text-foreground">JavaChat boxes</strong> embedded in sketchy sites that felt 
                  more real than anything today.
                </p>
              </div>
            </section>

            <section className="mb-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
              <p className="text-lg text-foreground leading-relaxed italic">
                "I didn't just watch it — I lived in it."
              </p>
            </section>

            <section className="mb-12 space-y-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Shield className="w-6 h-6 text-primary" />
                The Underground Years
              </h2>
              
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  I saw the underground too. Booters, tunnels, packet flooding, social engineering — 
                  the Xbox Underground era where knowledge was currency and curiosity got you in trouble fast. 
                  The Lizard Squad chaos years later felt like an echo of something that started way earlier.
                </p>
                
                <p>
                  I hard-modded Xbox 360s when that meant solder smoke, burned fingers, and bricked consoles at 3am. 
                  No tutorials. No Discord hand-holding. You learned or you failed.
                </p>
                
                <p>
                  I've been in the background of damn near every major shift in computers and internet culture 
                  over the last 20+ years. Not famous. Not a legend. Just <em>present</em> while it all evolved — 
                  and slowly got sanitized, monetized, hollowed out.
                </p>
              </div>
            </section>

            <section className="mb-12 space-y-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Users className="w-6 h-6 text-destructive" />
                What We Lost
              </h2>
              
              <div className="p-6 rounded-xl bg-destructive/10 border border-destructive/20 space-y-4">
                <p className="text-foreground leading-relaxed">
                  Now the internet is quiet in the worst way.
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>→ Rooms full of usernames doing nothing.</li>
                  <li>→ Communities replaced by engagement metrics.</li>
                  <li>→ Everyone connected, nobody talking.</li>
                </ul>
                <p className="text-foreground font-medium">
                  I miss when logging on felt like entering a <em>place</em> — not being fed content.
                </p>
              </div>
            </section>

            {/* The Original Justachat Legacy */}
            <section className="mb-12 space-y-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-primary" />
                The Original Justachat
              </h2>
              
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Back in 2001, there was a site called <strong className="text-foreground">justachat.com</strong>. 
                  It wasn't fancy. It wasn't trying to be the next big thing. It was exactly what the name said — 
                  just a chat. A place where people showed up, talked, and kept coming back.
                </p>
                
                <p>
                  Run by a guy named <strong className="text-foreground">Brent</strong> and moderated by people 
                  like <strong className="text-foreground">Bethany</strong> who actually gave a damn about the community, 
                  it represented everything good about that era. Real moderators who knew the regulars by name. 
                  Room drama that felt important because you were invested. Late nights that turned into friendships.
                </p>
                
                <p>
                  That site eventually went dark, like so many others. But the spirit of what it was? 
                  That's what I'm trying to bring back.
                </p>
              </div>
            </section>

            <section className="mb-12 space-y-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Heart className="w-6 h-6 text-pink-500" />
                Why I Built This
              </h2>
              
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  So I'm trying to bring a piece of that back.
                </p>
                
                <p>
                  Not the illegal shit. Not the ego.
                </p>
                
                <p className="text-foreground font-medium text-lg">
                  The conversation. The late nights. The strangers who turned into long-term friends 
                  because you talked for hours about nothing and everything.
                </p>
                
                <p>
                  That's why I built <strong className="jac-gradient-text">justachat.net</strong>.
                </p>
              </div>
            </section>

            <section className="mb-12 p-6 sm:p-8 rounded-2xl bg-card border border-border">
              <div className="text-center space-y-4">
                <p className="text-xl font-bold text-foreground">
                  No feeds. No likes. No clout farming.
                </p>
                <p className="text-2xl font-bold jac-gradient-text">
                  Just people showing up and speaking again.
                </p>
              </div>
            </section>

            <section className="text-center space-y-6">
              <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 border border-primary/30">
                <p className="text-lg text-muted-foreground mb-4">
                  If you were there, you'll feel this.
                </p>
                <p className="text-lg text-muted-foreground mb-6">
                  If you weren't, maybe you'll finally see what's missing.
                </p>
                <p className="text-2xl font-bold text-foreground mb-8">
                  Either way — the door's open.
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

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Justachat™ — Bringing back the conversation.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Ethos;
