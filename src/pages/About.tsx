/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { Link } from "react-router-dom";
import SiteFooter from "@/components/layout/SiteFooter";
import PageSEO from "@/components/seo/PageSEO";

const About = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageSEO
        title="About Us - Private Chat for Adults"
        description="JustAChat is a private chat platform for adults who want real conversation without the noise of social media. No feeds, no likes, no algorithms — just people talking."
        path="/about"
        keywords="about justachat, private chat platform, adult chat, no social media, real conversation"
      />
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">JustAChat™</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/features" className="text-muted-foreground hover:text-primary transition-colors">Features</Link>
            <Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">FAQ</Link>
            <Link to="/login" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">Join Now</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-card/30">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
            About <span className="text-primary">JustAChat™</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A place for adults who want real conversation without the noise and pressure of modern social platforms.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <article className="prose prose-invert max-w-none">
          
          {/* Our Story */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-primary mb-6">Our Story</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              JustAChat was founded on January 22, 2026, at 1:03 PM—a moment that marked the beginning of something different in the world of online communication. In an era dominated by algorithms, endless notifications, and the constant pressure to perform for likes and followers, we asked ourselves a simple question: <strong className="text-foreground">What if we could just talk?</strong>
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              The answer became JustAChat—a private chat platform designed for adults who value genuine conversation over viral content. We believe that the best conversations happen when people feel safe, respected, and free from the anxiety of social media metrics. That's why we built a space where your words matter more than your follower count, and where real connections can flourish without the noise.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Our founder, known simply as Unix, envisioned a return to the golden age of internet chat rooms—the days of IRC, AIM, and MSN Messenger—when online communication felt personal, exciting, and authentic. JustAChat combines that nostalgic simplicity with modern security and features that today's users expect.
            </p>
          </section>

          {/* Our Mission */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-primary mb-6">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              At JustAChat, our mission is straightforward: <strong className="text-foreground">bring real conversation back to the internet</strong>. We're not trying to become the next big social network. We're not interested in harvesting your data for advertisers. We don't want to manipulate your emotions with algorithmic feeds designed to maximize engagement.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              Instead, we focus on what matters most—creating a secure, private environment where adults can connect through meaningful dialogue. Whether you're looking for casual conversation, intellectual debate, romantic connections, or simply a place to unwind with like-minded people, JustAChat provides the space to make it happen.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We believe that privacy is a fundamental right, not a premium feature. That's why all private messages on JustAChat are encrypted end-to-end. Your conversations belong to you, and we will never sell or share your personal information with third parties.
            </p>
          </section>

          {/* What Makes Us Different */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-primary mb-6">What Makes Us Different</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="p-6 bg-card rounded-lg border border-border">
                <h3 className="text-xl font-semibold text-foreground mb-3">🔒 Privacy First</h3>
                <p className="text-muted-foreground">End-to-end encrypted private messages. No data mining. No targeted ads. Your conversations stay private—always.</p>
              </div>
              <div className="p-6 bg-card rounded-lg border border-border">
                <h3 className="text-xl font-semibold text-foreground mb-3">🚫 No Algorithms</h3>
                <p className="text-muted-foreground">No feeds designed to keep you scrolling. No engagement metrics. Just real-time conversations with real people.</p>
              </div>
              <div className="p-6 bg-card rounded-lg border border-border">
                <h3 className="text-xl font-semibold text-foreground mb-3">👥 Adults Only</h3>
                <p className="text-muted-foreground">JustAChat is designed exclusively for adults who want mature, respectful conversation without the drama of mainstream platforms.</p>
              </div>
              <div className="p-6 bg-card rounded-lg border border-border">
                <h3 className="text-xl font-semibold text-foreground mb-3">🎨 Customizable Experience</h3>
                <p className="text-muted-foreground">Multiple themes, custom avatars, and personalization options let you make JustAChat your own unique space.</p>
              </div>
            </div>
          </section>

          {/* Our Values */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-primary mb-6">Our Values</h2>
            <ul className="space-y-4 text-lg text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">Authenticity:</span>
                <span>We encourage genuine expression over performative content. Say what you mean, mean what you say.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">Respect:</span>
                <span>Every member deserves to be treated with dignity. Harassment, hate speech, and toxic behavior have no place here.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">Privacy:</span>
                <span>Your personal information is yours. We collect only what's necessary and never sell your data.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">Community:</span>
                <span>JustAChat is built by its members. Your feedback shapes our features and direction.</span>
              </li>
            </ul>
          </section>

          {/* Join Us */}
          <section className="text-center py-8 px-6 bg-card rounded-lg border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-4">Ready to Join the Conversation?</h2>
            <p className="text-muted-foreground mb-6">
              Experience what online chat should feel like. No pressure, no algorithms—just real people having real conversations.
            </p>
            <Link 
              to="/login" 
              className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Create Your Free Account
            </Link>
          </section>

        </article>
      </main>

      <SiteFooter />
    </div>
  );
};

export default About;
