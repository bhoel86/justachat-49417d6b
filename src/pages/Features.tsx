/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { Link } from "react-router-dom";
import SiteFooter from "@/components/layout/SiteFooter";
import PageSEO from "@/components/seo/PageSEO";
import { MessageCircle, Lock, Video, Heart, Bot, Users, Globe, Shield, Mic, Gamepad2 } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: MessageCircle,
      title: "Public Chat Rooms",
      description: "Join themed chat rooms covering everything from General and Lounge to Sports, Politics, Technology, Music, Movies, and more. Each room has its own personality and community. Whether you're looking for casual banter or deep discussions, there's a room for you.",
      keywords: "chat rooms, online chat, public chat, group chat"
    },
    {
      icon: Lock,
      title: "Encrypted Private Messages",
      description: "Your private conversations are protected with end-to-end encryption. Only you and the person you're chatting with can read your messages—not even JustAChat staff can access them. True privacy in an age of surveillance.",
      keywords: "encrypted messaging, private chat, secure messaging, end-to-end encryption"
    },
    {
      icon: Video,
      title: "Voice & Video Chat",
      description: "Take your conversations beyond text with our integrated voice and video chat features. Host group voice rooms or have private one-on-one video calls. Crystal-clear audio and smooth video make it feel like you're in the same room.",
      keywords: "video chat, voice chat, video call, audio chat"
    },
    {
      icon: Heart,
      title: "Dating & Matchmaking",
      description: "Looking for romance? Our dating feature helps you find compatible matches within the JustAChat community. Create a dating profile, set your preferences, and swipe through potential matches. When both parties show interest, it's a match!",
      keywords: "online dating, chat dating, find matches, romantic chat"
    },
    {
      icon: Bot,
      title: "AI Bot Companions",
      description: "Need someone to talk to at 3 AM? Our AI-powered chat bots are always available for conversation. From friendly chat to voice calls with our bot companions, you'll never feel alone. They're smart, engaging, and surprisingly fun to talk to.",
      keywords: "AI chat bot, virtual companion, chat bot, AI conversation"
    },
    {
      icon: Users,
      title: "Friends System",
      description: "Build your network by adding friends. See when they're online, send them quick messages, and never lose touch with the people you connect with. Your friends list is private and only visible to you.",
      keywords: "friends list, add friends, online friends, social chat"
    },
    {
      icon: Globe,
      title: "Real-Time Translation",
      description: "Language barriers? Not here. Our built-in translation feature lets you communicate with users from around the world in real-time. Send messages in your language and they'll be translated for others automatically.",
      keywords: "chat translation, multilingual chat, international chat, language translation"
    },
    {
      icon: Shield,
      title: "Advanced Moderation",
      description: "We take safety seriously. Our moderation tools include profanity filters, URL protection, AI-powered content moderation, and active human moderators. Room owners can customize settings to create the perfect environment for their community.",
      keywords: "chat moderation, safe chat, content moderation, chat safety"
    },
    {
      icon: Mic,
      title: "Voice Broadcasts",
      description: "Have something to say to everyone? Our voice broadcast feature lets you speak to entire chat rooms. Perfect for announcements, storytelling, or just sharing your thoughts with an audience.",
      keywords: "voice broadcast, audio streaming, live voice, chat radio"
    },
    {
      icon: Gamepad2,
      title: "Games & Trivia",
      description: "Make chatting even more fun with built-in games. Challenge others to trivia, compete for points, and climb the leaderboards. Our games page keeps growing with new ways to engage with the community.",
      keywords: "chat games, trivia, online games, social games"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageSEO
        title="Features - Chat Rooms, Voice, Video & More"
        description="Explore JustAChat features: public chat rooms, encrypted private messaging, voice and video chat, dating, AI bots, and games. All free, all private."
        path="/features"
        keywords="chat features, encrypted messaging, voice chat, video chat, chat rooms, private chat, dating chat, AI chatbots"
      />
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">JustAChat™</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">About</Link>
            <Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">FAQ</Link>
            <Link to="/login" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">Join Now</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-card/30">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
            Powerful <span className="text-primary">Features</span> for Real Conversations
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need for secure, private, and engaging online communication—without the noise of modern social media.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <article 
              key={index}
              className="p-6 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h2>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Additional Features List */}
        <section className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-8">And Much More...</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              "Custom Themes & Skins",
              "Avatar Uploads",
              "Nickname Registration",
              "Room Creation",
              "Admin & Moderator Tools",
              "Kick, Ban & Mute Controls",
              "K-Line IP Banning",
              "User Reporting System",
              "Ghost Mode (Invisible)",
              "Bio & Profile Customization",
              "Emoji & GIF Support",
              "ASCII Art Picker",
              "Link Previews",
              "Image Sharing",
              "Mention Notifications",
              "Room Invites",
              "Password-Protected Rooms",
              "mIRC Client Support",
              "Desktop App (Electron)",
              "Mobile Responsive Design"
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-card/50 rounded-lg border border-border">
                <span className="text-primary">✓</span>
                <span className="text-muted-foreground text-sm">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-16 text-center py-12 px-6 bg-card rounded-lg border border-border max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-4">Experience All These Features Today</h2>
          <p className="text-muted-foreground mb-6">
            Join thousands of users who've discovered the joy of real conversation. Creating an account takes less than a minute.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/login" 
              className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Sign Up Free
            </Link>
            <Link 
              to="/ethos" 
              className="inline-block px-8 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/90 transition-colors"
            >
              Read Our Ethos
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Features;
