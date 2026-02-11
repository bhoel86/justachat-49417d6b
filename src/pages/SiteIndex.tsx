import { Link } from "react-router-dom";
import PageSEO from "@/components/seo/PageSEO";
import SiteFooter from "@/components/layout/SiteFooter";
import { Globe, MessageCircle, Users, Gamepad2, Heart, Mic, Video, HelpCircle, Download, Scale, Shield, BookOpen, Info, Star, Zap } from "lucide-react";

const sections = [
  {
    title: "Chat",
    links: [
      { to: "/", label: "Lobby", desc: "Main chat lobby with live rooms", icon: Globe },
      { to: "/free-chat", label: "Free Chat", desc: "Jump into free online chat rooms", icon: MessageCircle },
      { to: "/chat-rooms", label: "Chat Rooms", desc: "Browse all available chat rooms", icon: Users },
      { to: "/online-chat", label: "Online Chat", desc: "Connect with people online now", icon: Zap },
      { to: "/irc-style-chat", label: "IRC Style Chat", desc: "Classic IRC chat experience", icon: MessageCircle },
    ],
  },
  {
    title: "Activities",
    links: [
      { to: "/dating", label: "Dating", desc: "Meet new people and make connections", icon: Heart },
      { to: "/games", label: "Games", desc: "Play trivia and chat games", icon: Gamepad2 },
      { to: "/voice-chat", label: "Voice Chat", desc: "Talk with others using voice", icon: Mic },
      { to: "/video-chat", label: "Video Chat", desc: "Face to face video conversations", icon: Video },
    ],
  },
  {
    title: "About",
    links: [
      { to: "/about", label: "About Us", desc: "Learn about Justachat", icon: Info },
      { to: "/features", label: "Features", desc: "See what Justachat offers", icon: Star },
      { to: "/ethos", label: "Our Ethos", desc: "The philosophy behind Justachat", icon: BookOpen },
      { to: "/faq", label: "FAQ", desc: "Frequently asked questions", icon: HelpCircle },
      { to: "/help", label: "Help", desc: "Get help using the platform", icon: HelpCircle },
    ],
  },
  {
    title: "Downloads",
    links: [
      { to: "/downloads", label: "Client Downloads", desc: "Desktop and mobile apps", icon: Download },
      { to: "/mirc", label: "mIRC Connect", desc: "Connect via mIRC client", icon: Download },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/guidelines", label: "Community Guidelines", desc: "Rules for using Justachat", icon: Shield },
      { to: "/legal", label: "Terms of Service", desc: "Legal terms and conditions", icon: Scale },
      { to: "/cookies", label: "Privacy & Cookies", desc: "How we handle your data", icon: Shield },
    ],
  },
];

const SiteIndex = () => {
  return (
    <>
      <PageSEO
        title="Site Index | Justachat - All Pages"
        description="Browse all pages on Justachat. Find chat rooms, voice chat, video chat, games, dating, downloads, help, and more."
        path="/site-index"
      />
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-2">Site Index</h1>
            <p className="text-muted-foreground">All pages on Justachat in one place.</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            {sections.map((section) => (
              <div key={section.title} className="bg-card border border-border rounded-lg p-5">
                <h2 className="text-lg font-semibold text-primary mb-3 border-b border-border pb-2">
                  {section.title}
                </h2>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="flex items-start gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors group"
                      >
                        <link.icon className="w-4 h-4 mt-0.5 text-muted-foreground group-hover:text-primary shrink-0" />
                        <div>
                          <span className="text-sm font-medium text-foreground group-hover:text-primary">
                            {link.label}
                          </span>
                          <p className="text-xs text-muted-foreground">{link.desc}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/" className="text-sm text-primary hover:underline">
              ← Back to Lobby
            </Link>
          </div>
        </div>
        <SiteFooter />
      </div>
    </>
  );
};

export default SiteIndex;
